#!/usr/bin/env bash
set -euo pipefail

if [[ $- == *x* ]]; then
  echo "Refusing to run with shell xtrace enabled; backup commands must not echo secrets." >&2
  exit 1
fi

usage() {
  cat <<'USAGE'
Create an encrypted Po Finder recovery set.

Required environment:
  SOURCE_DB_URL                  Read-capable Supabase Postgres connection URL.
  AGE_RECIPIENTS                 Comma-separated age public recipients.
  BACKUP_DESTINATION_RCLONE      rclone destination prefix, for example remote:po-finder/prod.
  SUPABASE_STORAGE_RCLONE_SOURCE Optional rclone source for Supabase Storage objects.

Optional environment:
  BACKUP_WORK_DIR                Ephemeral work directory. Defaults to a mktemp dir.
  BACKUP_RUN_ID                  Operator/run id. Defaults to UTC timestamp.
  BACKUP_RETENTION_DAYS          Retention window for complete encrypted sets. Defaults to 35.
  BACKUP_SKIP_STORAGE            Set to 1 only when the zero-object path is intentional.
  BACKUP_SKIP_UPLOAD             Set to 1 for local validation only; no success marker is emitted.
USAGE
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

rclone_remote_name() {
  local spec="$1"
  if [[ ! "$spec" =~ ^([A-Za-z0-9][A-Za-z0-9._-]*): ]]; then
    echo "Invalid rclone remote specification." >&2
    exit 3
  fi
  printf '%s' "${BASH_REMATCH[1]}"
}

validate_rclone_remote_access() {
  local spec="$1"
  local remote
  remote="$(rclone_remote_name "$spec")"
  if ! rclone listremotes | grep -Fx "${remote}:" >/dev/null; then
    echo "Required rclone remote is not configured." >&2
    exit 3
  fi
  if ! rclone lsf "${remote}:" --max-depth 1 >/dev/null; then
    echo "Required rclone remote is not accessible." >&2
    exit 3
  fi
}

quote_ident() {
  printf '"%s"' "${1//\"/\"\"}"
}

psql_source() {
  psql "$SOURCE_DB_URL" -X -v ON_ERROR_STOP=1 "$@"
}

table_list() {
  psql_source -A -t <<'SQL'
select table_schema || '.' || table_name
from information_schema.tables
where table_type = 'BASE TABLE'
  and (
    table_schema = 'public'
    or (table_schema = 'auth' and table_name in ('users', 'identities'))
    or (table_schema = 'storage' and table_name in ('buckets', 'objects'))
  )
order by table_schema, table_name;
SQL
}

schema_hash() {
  psql_source -A -t <<'SQL' | sha256sum | awk '{print $1}'
select n.nspname, c.relname, c.relkind, a.attnum, a.attname, a.atttypid::regtype::text,
       a.attnotnull, coalesce(pg_get_expr(d.adbin, d.adrelid), '') as default_expr
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where n.nspname in ('public', 'auth', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
order by n.nspname, c.relname, a.attnum nulls first;
SQL
}

write_manifest() {
  local label="$1"
  local dir="$2"
  local out="$3"
  local tables_file="$dir/tables.txt"
  local table_dir="$dir/table-checksums"

  mkdir -p "$table_dir"
  table_list > "$tables_file"

  {
    printf 'label=%s\n' "$label"
    printf 'created_at_utc=%s\n' "$(date -u +%FT%TZ)"
    printf 'source_region=%s\n' "${SUPABASE_SOURCE_REGION:-ap-northeast-1}"
    printf 'supabase_cli_version=%s\n' "$(supabase --version 2>/dev/null || printf 'unknown')"
    printf 'postgres_client_version=%s\n' "$(psql --version | awk '{print $3}')"
    printf 'git_commit=%s\n' "$(git rev-parse HEAD 2>/dev/null || printf 'unknown')"
    printf 'schema_sha256=%s\n' "$(schema_hash)"
    printf '\n[tables]\n'
  } > "$out"

  while IFS=. read -r schema table; do
    [[ -n "$schema" && -n "$table" ]] || continue
    local qschema qtable count checksum jsonl
    qschema="$(quote_ident "$schema")"
    qtable="$(quote_ident "$table")"
    jsonl="$table_dir/${schema}.${table}.jsonl"
    count="$(psql_source -A -t -c "select count(*) from $qschema.$qtable;")"
    psql_source -A -t -c "copy (select row_to_json(t) from (select * from $qschema.$qtable) t) to stdout;" \
      | jq -cS . \
      | LC_ALL=C sort > "$jsonl"
    checksum="$(sha256sum "$jsonl" | awk '{print $1}')"
    printf '%s.%s count=%s sha256=%s\n' "$schema" "$table" "$count" "$checksum" >> "$out"
  done < "$tables_file"

  {
    printf '\nmanifest_sha256=%s\n' "$(sha256sum "$out" | awk '{print $1}')"
  } >> "$out"
}

stable_manifest_lines() {
  grep -E '^(schema_sha256=|[^.[:space:]]+\.[^[:space:]]+ count=)' "$1" | LC_ALL=C sort
}

write_storage_manifest() {
  local storage_dir="$1"
  local out="$2"

  (
    cd "$storage_dir"
    while IFS= read -r -d '' object; do
      sha256sum "$object"
    done < <(find . -type f -print0 | LC_ALL=C sort -z)
  ) > "$out"
  {
    printf 'object_count=%s\n' "$(find "$storage_dir" -type f -printf . | wc -c | tr -d ' ')"
    printf 'total_bytes=%s\n' "$(find "$storage_dir" -type f -printf '%s\n' | awk '{s+=$1} END {print s+0}')"
  } >> "$out"
}

main() {
  if [[ "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  require_cmd supabase
  require_cmd psql
  require_cmd jq
  require_cmd age
  require_cmd tar
  require_cmd sha256sum
  require_env SOURCE_DB_URL
  require_env AGE_RECIPIENTS

  if [[ "${BACKUP_SKIP_UPLOAD:-0}" != "1" ]]; then
    require_cmd rclone
    require_env BACKUP_DESTINATION_RCLONE
  fi

  if [[ "${BACKUP_SKIP_STORAGE:-0}" != "1" ]]; then
    require_cmd rclone
    require_env SUPABASE_STORAGE_RCLONE_SOURCE
  fi

  if [[ "${BACKUP_SKIP_UPLOAD:-0}" != "1" ]]; then
    validate_rclone_remote_access "$BACKUP_DESTINATION_RCLONE"
  fi
  if [[ "${BACKUP_SKIP_STORAGE:-0}" != "1" ]]; then
    validate_rclone_remote_access "$SUPABASE_STORAGE_RCLONE_SOURCE"
  fi

  local run_id work_root set_dir archive encrypted marker recipients_args retention_days
  run_id="${BACKUP_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
  work_root="${BACKUP_WORK_DIR:-$(mktemp -d)}"
  set_dir="$work_root/po-finder-recovery-$run_id"
  retention_days="${BACKUP_RETENTION_DAYS:-35}"
  mkdir -p "$set_dir/database" "$set_dir/storage"

  write_manifest "before" "$set_dir" "$set_dir/manifest-before.txt"

  supabase db dump --db-url "$SOURCE_DB_URL" -f "$set_dir/database/roles.sql" --role-only
  supabase db dump --db-url "$SOURCE_DB_URL" -f "$set_dir/database/schema.sql"
  supabase db dump --db-url "$SOURCE_DB_URL" -f "$set_dir/database/data.sql" --use-copy --data-only \
    -x "storage.buckets_vectors" -x "storage.vector_indexes"

  if [[ "${BACKUP_SKIP_STORAGE:-0}" == "1" ]]; then
    printf 'storage_export=skipped\nobject_count=0\ntotal_bytes=0\n' > "$set_dir/storage-manifest.txt"
  else
    rclone copy "$SUPABASE_STORAGE_RCLONE_SOURCE" "$set_dir/storage" --immutable --metadata
    write_storage_manifest "$set_dir/storage" "$set_dir/storage-manifest.txt"
  fi

  write_manifest "after" "$set_dir" "$set_dir/manifest-after.txt"
  stable_manifest_lines "$set_dir/manifest-before.txt" > "$set_dir/manifest-before.stable.txt"
  stable_manifest_lines "$set_dir/manifest-after.txt" > "$set_dir/manifest-after.stable.txt"
  if ! diff -u "$set_dir/manifest-before.stable.txt" "$set_dir/manifest-after.stable.txt" > "$set_dir/manifest-diff.txt"; then
    echo "Source changed during backup; refusing to publish this recovery set." >&2
    exit 2
  fi

  archive="$work_root/po-finder-recovery-$run_id.tar.gz"
  encrypted="$archive.age"
  tar -C "$work_root" -czf "$archive" "po-finder-recovery-$run_id"
  tar -tzf "$archive" >/dev/null

  IFS=',' read -r -a recipients <<< "$AGE_RECIPIENTS"
  recipients_args=()
  for recipient in "${recipients[@]}"; do
    recipient="${recipient#"${recipient%%[![:space:]]*}"}"
    recipient="${recipient%"${recipient##*[![:space:]]}"}"
    [[ -n "$recipient" ]] && recipients_args+=("-r" "$recipient")
  done
  if [[ "${#recipients_args[@]}" -lt 4 ]]; then
    echo "At least two age recipients are required." >&2
    exit 1
  fi

  age "${recipients_args[@]}" -o "$encrypted" "$archive"
  local manifest_hash ciphertext_hash ciphertext_size completed_at
  manifest_hash="$(sha256sum "$set_dir/manifest-after.txt" | awk '{print $1}')"
  ciphertext_hash="$(sha256sum "$encrypted" | awk '{print $1}')"
  ciphertext_size="$(wc -c < "$encrypted" | tr -d ' ')"
  completed_at="$(date -u +%FT%TZ)"
  marker="$work_root/latest-success.json"
  cat > "$marker" <<JSON
{
  "service": "po-finder",
  "kind": "supabase-logical-storage-recovery-set",
  "runId": "$run_id",
  "completedAtUtc": "$completed_at",
  "rpoHours": 24,
  "retentionDays": $retention_days,
  "sourceRegion": "${SUPABASE_SOURCE_REGION:-ap-northeast-1}",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || printf 'unknown')",
  "manifestSha256": "$manifest_hash",
  "ciphertextSha256": "$ciphertext_hash",
  "ciphertextBytes": $ciphertext_size
}
JSON

  if [[ "${BACKUP_SKIP_UPLOAD:-0}" == "1" ]]; then
    echo "Local validation complete; BACKUP_SKIP_UPLOAD=1 so no remote marker was emitted."
    echo "$marker"
    return 0
  fi

  rclone copyto "$encrypted" "$BACKUP_DESTINATION_RCLONE/$run_id/po-finder-recovery.tar.gz.age" --immutable
  rclone copyto "$marker" "$BACKUP_DESTINATION_RCLONE/$run_id/latest-success.json" --immutable
  rclone lsl "$BACKUP_DESTINATION_RCLONE/$run_id/po-finder-recovery.tar.gz.age" | grep -F "$ciphertext_size" >/dev/null
  rclone delete "$BACKUP_DESTINATION_RCLONE" --min-age "${retention_days}d" --include "**/po-finder-recovery.tar.gz.age"
  rm -rf "$set_dir" "$archive"
  echo "Publishing verified encrypted recovery set $run_id."
  rclone copyto "$marker" "$BACKUP_DESTINATION_RCLONE/latest-success.json"
}

main "$@"
