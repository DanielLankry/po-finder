#!/usr/bin/env bash
set -euo pipefail

if [[ $- == *x* ]]; then
  echo "Refusing to run with shell xtrace enabled; restore commands must not echo secrets." >&2
  exit 1
fi

usage() {
  cat <<'USAGE'
Run a disposable Po Finder restore drill from an encrypted recovery set.

Required environment:
  TARGET_DB_URL                       Disposable Supabase Postgres connection URL.
  APPROVED_DISPOSABLE_TARGET_REF      Target project ref approved for destructive restore.
  AGE_IDENTITY_FILE                   age private identity file available only to restore operators.
  RESTORE_SOURCE_RCLONE               rclone prefix containing latest-success.json and recovery sets.
  CONFIRM_DISPOSABLE_RESTORE          Must equal the approved target ref.

Optional environment:
  RESTORE_WORK_DIR                    Ephemeral work directory. Defaults to a mktemp dir.
  RESTORE_RUN_ID                      Drill run id. Defaults to UTC timestamp.
  TARGET_STORAGE_RCLONE_DESTINATION   rclone destination for target Storage object restore.
  RESTORE_SKIP_STORAGE                Set to 1 only for approved zero-object drills.
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

refuse_production_target() {
  local target="$1"
  if [[ "$target" == *"ymqlqdhelsocibhnanjy"* || "$target" == *"pokarov.co.il"* ]]; then
    echo "Refusing to restore into the known production project/domain." >&2
    exit 10
  fi
}

quote_ident() {
  printf '"%s"' "${1//\"/\"\"}"
}

psql_target() {
  psql "$TARGET_DB_URL" -X -v ON_ERROR_STOP=1 "$@"
}

table_list() {
  psql_target -A -t <<'SQL'
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

write_target_manifest() {
  local out="$1"
  local table_dir="$2"
  mkdir -p "$table_dir"
  {
    printf 'label=target\n'
    printf 'created_at_utc=%s\n' "$(date -u +%FT%TZ)"
    printf 'approved_target_ref=%s\n' "$APPROVED_DISPOSABLE_TARGET_REF"
    printf '\n[tables]\n'
  } > "$out"

  while IFS=. read -r schema table; do
    [[ -n "$schema" && -n "$table" ]] || continue
    local qschema qtable count checksum jsonl
    qschema="$(quote_ident "$schema")"
    qtable="$(quote_ident "$table")"
    jsonl="$table_dir/${schema}.${table}.jsonl"
    count="$(psql_target -A -t -c "select count(*) from $qschema.$qtable;")"
    psql_target -A -t -c "copy (select row_to_json(t) from (select * from $qschema.$qtable) t) to stdout;" \
      | jq -cS . \
      | LC_ALL=C sort > "$jsonl"
    checksum="$(sha256sum "$jsonl" | awk '{print $1}')"
    printf '%s.%s count=%s sha256=%s\n' "$schema" "$table" "$count" "$checksum" >> "$out"
  done < <(table_list)
}

main() {
  if [[ "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  require_cmd age
  require_cmd jq
  require_cmd psql
  require_cmd rclone
  require_cmd sha256sum
  require_cmd tar
  require_env TARGET_DB_URL
  require_env APPROVED_DISPOSABLE_TARGET_REF
  require_env AGE_IDENTITY_FILE
  require_env RESTORE_SOURCE_RCLONE
  require_env CONFIRM_DISPOSABLE_RESTORE

  refuse_production_target "$TARGET_DB_URL"
  if [[ "$CONFIRM_DISPOSABLE_RESTORE" != "$APPROVED_DISPOSABLE_TARGET_REF" ]]; then
    echo "CONFIRM_DISPOSABLE_RESTORE must exactly match APPROVED_DISPOSABLE_TARGET_REF." >&2
    exit 11
  fi

  if [[ "${RESTORE_SKIP_STORAGE:-0}" != "1" ]]; then
    require_env TARGET_STORAGE_RCLONE_DESTINATION
  fi

  local run_id work_root marker encrypted archive recovery_dir source_manifest target_manifest
  run_id="${RESTORE_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
  work_root="${RESTORE_WORK_DIR:-$(mktemp -d)}"
  mkdir -p "$work_root"
  marker="$work_root/latest-success.json"
  encrypted="$work_root/po-finder-recovery.tar.gz.age"
  archive="$work_root/po-finder-recovery.tar.gz"

  rclone copyto "$RESTORE_SOURCE_RCLONE/latest-success.json" "$marker"
  local source_run ciphertext_hash marker_manifest_hash
  source_run="$(jq -r '.runId' "$marker")"
  ciphertext_hash="$(jq -r '.ciphertextSha256' "$marker")"
  marker_manifest_hash="$(jq -r '.manifestSha256' "$marker")"
  if [[ -z "$source_run" || "$source_run" == "null" ]]; then
    echo "Latest success marker is missing runId." >&2
    exit 12
  fi

  rclone copyto "$RESTORE_SOURCE_RCLONE/$source_run/po-finder-recovery.tar.gz.age" "$encrypted"
  if [[ "$(sha256sum "$encrypted" | awk '{print $1}')" != "$ciphertext_hash" ]]; then
    echo "Ciphertext hash mismatch; refusing restore drill." >&2
    exit 13
  fi

  age -d -i "$AGE_IDENTITY_FILE" -o "$archive" "$encrypted"
  tar -tzf "$archive" >/dev/null
  tar -C "$work_root" -xzf "$archive"
  recovery_dir="$work_root/po-finder-recovery-$source_run"
  source_manifest="$recovery_dir/manifest-after.txt"
  if [[ "$(sha256sum "$source_manifest" | awk '{print $1}')" != "$marker_manifest_hash" ]]; then
    echo "Manifest hash mismatch; refusing restore drill." >&2
    exit 14
  fi

  psql_target \
    --single-transaction \
    --variable ON_ERROR_STOP=1 \
    --file "$recovery_dir/database/roles.sql" \
    --file "$recovery_dir/database/schema.sql" \
    --command 'SET session_replication_role = replica' \
    --file "$recovery_dir/database/data.sql"

  if [[ "${RESTORE_SKIP_STORAGE:-0}" != "1" ]]; then
    rclone copy "$recovery_dir/storage" "$TARGET_STORAGE_RCLONE_DESTINATION" --immutable --metadata
  fi

  target_manifest="$work_root/target-manifest.txt"
  write_target_manifest "$target_manifest" "$work_root/target-table-checksums"

  grep -E '^[^.[:space:]]+\.[^[:space:]]+ count=' "$source_manifest" | LC_ALL=C sort > "$work_root/source-tables.txt"
  grep -E '^[^.[:space:]]+\.[^[:space:]]+ count=' "$target_manifest" | LC_ALL=C sort > "$work_root/target-tables.txt"
  if ! diff -u "$work_root/source-tables.txt" "$work_root/target-tables.txt" > "$work_root/table-manifest-diff.txt"; then
    echo "Restored table counts/checksums do not match source manifest." >&2
    exit 15
  fi

  cat > "$work_root/drill-report-redacted.json" <<JSON
{
  "service": "po-finder",
  "kind": "restore-drill-report",
  "drillRunId": "$run_id",
  "sourceRunId": "$source_run",
  "completedAtUtc": "$(date -u +%FT%TZ)",
  "approvedDisposableTargetRef": "$APPROVED_DISPOSABLE_TARGET_REF",
  "ciphertextSha256": "$ciphertext_hash",
  "manifestSha256": "$marker_manifest_hash",
  "tableChecksumsMatch": true,
  "storageRestoreMode": "${RESTORE_SKIP_STORAGE:-0}"
}
JSON
  rm -f "$archive"
  echo "$work_root/drill-report-redacted.json"
}

main "$@"
