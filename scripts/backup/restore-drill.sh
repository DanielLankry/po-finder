#!/usr/bin/env bash
set -euo pipefail

if [[ $- == *x* ]]; then
  echo "Refusing to run with shell xtrace enabled; restore commands must not echo secrets." >&2
  exit 1
fi

umask 077

readonly PO_FINDER_PRODUCTION_PROJECT_REF="ymqlqdhelsocibhnanjy"

restore_work_root=""
restore_staging_dir=""

cleanup_restore_artifacts() {
  if [[ -n "$restore_staging_dir" && -n "$restore_work_root" &&
    "$restore_staging_dir" == "$restore_work_root"/.po-finder-restore.* ]]; then
    rm -rf -- "$restore_staging_dir"
  fi
}

usage() {
  cat <<'USAGE'
Run a disposable Po Finder restore drill from an encrypted recovery set.

Required environment:
  TARGET_DB_URL                       Disposable Supabase Postgres connection URL.
  APPROVED_DISPOSABLE_TARGET_REF      Target project ref approved for destructive restore.
  CONFIGURED_DISPOSABLE_TARGET_REF    Protected target ref bound to database and Storage credentials.
  AGE_IDENTITY_FILE                   age private identity file available only to restore operators.
  RESTORE_SOURCE_RCLONE               rclone prefix containing latest-success.json and recovery sets.
  CONFIRM_DISPOSABLE_RESTORE          Must equal RESTORE:<approved target ref>.

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

validate_run_id() {
  local run_id="$1"
  if [[ ! "$run_id" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
    echo "Restore run id contains unsupported characters." >&2
    exit 11
  fi
}

refuse_production_target() {
  local target="$1"
  if [[ "$target" == *"ymqlqdhelsocibhnanjy"* || "$target" == *"pokarov.co.il"* ]]; then
    echo "Refusing to restore into the known production project/domain." >&2
    exit 10
  fi
}

validate_project_ref() {
  local ref="$1"
  if [[ ! "$ref" =~ ^[a-z0-9]{20}$ ]]; then
    echo "Disposable target ref must be exactly 20 lowercase alphanumeric characters." >&2
    exit 11
  fi
  refuse_production_target "$ref"
}

validate_database_target_binding() {
  local target_url="$1"
  local approved_ref="$2"
  local without_scheme authority userinfo hostport username database_and_query database query
  local parameter name value
  local -a parameters

  if [[ ! "$target_url" =~ ^postgres(ql)?:// ]]; then
    echo "TARGET_DB_URL must be a PostgreSQL URL for the approved Supabase project." >&2
    exit 11
  fi
  without_scheme="${target_url#*://}"
  if [[ "$without_scheme" == *'#'* || "$without_scheme" != */* ]]; then
    echo "TARGET_DB_URL must identify the postgres database without a URI fragment." >&2
    exit 11
  fi
  authority="${without_scheme%%/*}"
  if [[ "$authority" != *@* ]]; then
    echo "TARGET_DB_URL does not identify the approved Supabase project." >&2
    exit 11
  fi
  userinfo="${authority%@*}"
  hostport="${authority##*@}"
  username="${userinfo%%:*}"
  database_and_query="${without_scheme#*/}"
  database="${database_and_query%%\?*}"

  if [[ "$database" != "postgres" ]]; then
    echo "TARGET_DB_URL must identify the postgres database." >&2
    exit 11
  fi

  if [[ "$database_and_query" == *'?'* ]]; then
    query="${database_and_query#*\?}"
    if [[ -z "$query" ]]; then
      echo "TARGET_DB_URL contains an empty connection parameter." >&2
      exit 11
    fi
    IFS='&' read -r -a parameters <<< "$query"
    for parameter in "${parameters[@]}"; do
      if [[ "$parameter" != *=* ]]; then
        echo "TARGET_DB_URL contains an unsupported connection parameter." >&2
        exit 11
      fi
      name="${parameter%%=*}"
      value="${parameter#*=}"
      case "$name" in
        sslmode)
          [[ "$value" =~ ^(require|verify-ca|verify-full)$ ]] || {
            echo "TARGET_DB_URL contains an unsafe sslmode." >&2
            exit 11
          }
          ;;
        connect_timeout)
          [[ "$value" =~ ^[1-9][0-9]*$ ]] || {
            echo "TARGET_DB_URL contains an invalid connect_timeout." >&2
            exit 11
          }
          ;;
        channel_binding)
          [[ "$value" =~ ^(prefer|require)$ ]] || {
            echo "TARGET_DB_URL contains an unsafe channel_binding value." >&2
            exit 11
          }
          ;;
        *)
          echo "TARGET_DB_URL contains an unsupported connection parameter." >&2
          exit 11
          ;;
      esac
    done
  fi

  if [[ "$hostport" =~ ^db\.${approved_ref}\.supabase\.co(:5432)?$ && "$username" == "postgres" ]]; then
    return 0
  fi
  if [[ "$hostport" =~ ^[a-z0-9.-]+\.pooler\.supabase\.com:(5432|6543)$ && "$username" == "postgres.${approved_ref}" ]]; then
    return 0
  fi

  echo "TARGET_DB_URL does not identify the approved Supabase project." >&2
  exit 11
}

reject_libpq_target_overrides() {
  local name
  local -a target_overrides=(
    PGHOST
    PGHOSTADDR
    PGPORT
    PGDATABASE
    PGUSER
    PGSERVICE
    PGSERVICEFILE
  )

  for name in "${target_overrides[@]}"; do
    if [[ -n "${!name:-}" ]]; then
      echo "Refusing inherited libpq target override: $name." >&2
      exit 11
    fi
  done
}

reject_rclone_storage_target_overrides() {
  local spec="$1"
  local remote normalized name
  remote="$(rclone_remote_name "$spec")"
  normalized="${remote^^}"
  normalized="${normalized//[^A-Z0-9]/_}"

  if [[ -n "${RCLONE_S3_ENDPOINT:-}" ]]; then
    echo "Refusing inherited rclone Storage target override: RCLONE_S3_ENDPOINT." >&2
    exit 11
  fi

  for name in "RCLONE_CONFIG_${normalized}_ENDPOINT" "RCLONE_CONFIG_${normalized}_TYPE"; do
    if [[ -n "${!name:-}" ]]; then
      echo "Refusing inherited rclone Storage target override: $name." >&2
      exit 11
    fi
  done
}

rclone_remote_name() {
  local spec="$1"
  if [[ ! "$spec" =~ ^([A-Za-z0-9][A-Za-z0-9._-]*): ]]; then
    echo "Invalid rclone remote specification." >&2
    exit 11
  fi
  printf '%s' "${BASH_REMATCH[1]}"
}

validate_rclone_remote_access() {
  local spec="$1"
  local remote
  remote="$(rclone_remote_name "$spec")"
  if ! rclone listremotes | grep -Fx "${remote}:" >/dev/null; then
    echo "Required rclone remote is not configured." >&2
    exit 11
  fi
  if ! rclone lsf "${remote}:" --max-depth 1 >/dev/null; then
    echo "Required rclone remote is not accessible." >&2
    exit 11
  fi
}

validate_storage_target_binding() {
  local spec="$1"
  local approved_ref="$2"
  local remote redacted backend_type endpoint
  remote="$(rclone_remote_name "$spec")"
  if ! redacted="$(rclone config redacted "$remote" 2>/dev/null)"; then
    echo "Unable to inspect the redacted target Storage configuration." >&2
    exit 11
  fi
  backend_type="$(printf '%s\n' "$redacted" | sed -n 's/^[[:space:]]*type[[:space:]]*=[[:space:]]*//p' | head -n 1)"
  endpoint="$(printf '%s\n' "$redacted" | sed -n 's/^[[:space:]]*endpoint[[:space:]]*=[[:space:]]*//p' | head -n 1)"
  if [[ "$backend_type" != "s3" ]]; then
    echo "Target Storage remote must use the rclone s3 backend." >&2
    exit 11
  fi
  case "$endpoint" in
    "https://${approved_ref}.storage.supabase.co/storage/v1/s3"|\
    "https://${approved_ref}.storage.supabase.co/storage/v1/s3/"|\
    "https://${approved_ref}.supabase.co/storage/v1/s3"|\
    "https://${approved_ref}.supabase.co/storage/v1/s3/")
      return 0
      ;;
  esac
  echo "Target Storage remote does not identify the approved Supabase project." >&2
  exit 11
}

validate_empty_storage_target() {
  local spec="$1"
  local target_size target_count
  if ! target_size="$(rclone size "$spec" --json 2>/dev/null)"; then
    echo "Unable to inspect the disposable target Storage destination." >&2
    exit 11
  fi
  target_count="$(printf '%s' "$target_size" | jq -r '.count')"
  if [[ ! "$target_count" =~ ^[0-9]+$ || "$target_count" != "0" ]]; then
    echo "Disposable target Storage must be empty before a restore drill." >&2
    exit 11
  fi
}

quote_ident() {
  printf '"%s"' "${1//\"/\"\"}"
}

psql_target() {
  psql "$TARGET_DB_URL" -X -v ON_ERROR_STOP=1 "$@"
}

write_security_state() {
  local psql_function="$1"
  local out="$2"

  "$psql_function" -A -t <<'SQL' | LC_ALL=C sort > "$out"
with security_state as (
  select 10 as kind_order,
         n.nspname || '.' || c.relname as object_key,
         jsonb_build_object(
           'kind', 'relation_security',
           'schema', n.nspname,
           'relation', c.relname,
           'relkind', c.relkind,
           'owner', pg_get_userbyid(c.relowner),
           'rls_enabled', c.relrowsecurity,
           'rls_forced', c.relforcerowsecurity
         ) as state
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')
    and c.relkind in ('r', 'p', 'v', 'm', 'f')

  union all

  select 20,
         n.nspname || '.' || c.relname || '.' || p.polname,
         jsonb_build_object(
           'kind', 'policy',
           'schema', n.nspname,
           'relation', c.relname,
           'name', p.polname,
           'permissive', p.polpermissive,
           'command', p.polcmd,
           'roles', (
             select jsonb_agg(
               case when role_oid = 0 then 'PUBLIC' else pg_get_userbyid(role_oid) end
               order by case when role_oid = 0 then 'PUBLIC' else pg_get_userbyid(role_oid) end
             )
             from unnest(p.polroles) as role_oid
           ),
           'using', pg_get_expr(p.polqual, p.polrelid),
           'with_check', pg_get_expr(p.polwithcheck, p.polrelid)
         )
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')

  union all

  select 30,
         n.nspname || '.' || c.relname || '.' ||
           case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end || '.' ||
           acl.privilege_type,
         jsonb_build_object(
           'kind', 'relation_acl',
           'schema', n.nspname,
           'relation', c.relname,
           'grantee', case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end,
           'privilege', acl.privilege_type,
           'grantable', acl.is_grantable
         )
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join lateral aclexplode(coalesce(c.relacl, '{}'::aclitem[])) as acl
  where n.nspname in ('public', 'auth', 'storage')
    and c.relkind in ('r', 'p', 'v', 'm', 'f')

  union all

  select 40,
         n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         jsonb_build_object(
           'kind', 'routine_security',
           'schema', n.nspname,
           'identity', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
           'owner', pg_get_userbyid(p.proowner),
           'security_definer', p.prosecdef,
           'volatility', p.provolatile,
           'configuration', p.proconfig,
           'definition', pg_get_functiondef(p.oid)
         )
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind in ('f', 'p')
)
select state::text
from security_state
order by kind_order, object_key, state::text;
SQL
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
    if [[ "$schema" == "storage" && "$table" == "objects" ]]; then
      psql_target -A -t -c \
        "copy (select json_build_object('bucket_id', bucket_id, 'name', name) from $qschema.$qtable) to stdout;" \
        | jq -cS . \
        | LC_ALL=C sort > "$jsonl"
    else
      psql_target -A -t -c "copy (select row_to_json(t) from (select * from $qschema.$qtable) t) to stdout;" \
        | jq -cS . \
        | LC_ALL=C sort > "$jsonl"
    fi
    checksum="$(sha256sum "$jsonl" | awk '{print $1}')"
    printf '%s.%s count=%s sha256=%s\n' "$schema" "$table" "$count" "$checksum" >> "$out"
  done < <(table_list)
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

verify_storage_manifest() {
  local recovery_dir="$1"
  local expected="$recovery_dir/storage-manifest.txt"
  local actual="$2"

  if [[ ! -f "$expected" ]]; then
    echo "Recovery set is missing storage-manifest.txt; refusing restore drill." >&2
    exit 16
  fi
  if grep -Fx 'storage_export=skipped' "$expected" >/dev/null; then
    printf 'storage_export=skipped\n' > "$actual"
    write_storage_manifest "$recovery_dir/storage" "$actual.content"
    cat "$actual.content" >> "$actual"
    rm -f "$actual.content"
  else
    write_storage_manifest "$recovery_dir/storage" "$actual"
  fi
  if ! diff -u "$expected" "$actual" >/dev/null; then
    echo "Recovery-set Storage objects do not match storage-manifest.txt." >&2
    exit 16
  fi
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
  require_env CONFIGURED_DISPOSABLE_TARGET_REF
  require_env AGE_IDENTITY_FILE
  require_env RESTORE_SOURCE_RCLONE
  require_env CONFIRM_DISPOSABLE_RESTORE

  refuse_production_target "$TARGET_DB_URL"
  validate_project_ref "$APPROVED_DISPOSABLE_TARGET_REF"
  validate_project_ref "$CONFIGURED_DISPOSABLE_TARGET_REF"
  if [[ "$APPROVED_DISPOSABLE_TARGET_REF" != "$CONFIGURED_DISPOSABLE_TARGET_REF" ]]; then
    echo "Approved target ref does not match the protected configured target ref." >&2
    exit 11
  fi
  if [[ "$CONFIRM_DISPOSABLE_RESTORE" != "RESTORE:${APPROVED_DISPOSABLE_TARGET_REF}" ]]; then
    echo "CONFIRM_DISPOSABLE_RESTORE must exactly equal RESTORE:<approved target ref>." >&2
    exit 11
  fi
  validate_database_target_binding "$TARGET_DB_URL" "$APPROVED_DISPOSABLE_TARGET_REF"
  reject_libpq_target_overrides

  if [[ "${RESTORE_SKIP_STORAGE:-0}" != "1" ]]; then
    require_env TARGET_STORAGE_RCLONE_DESTINATION
    reject_rclone_storage_target_overrides "$TARGET_STORAGE_RCLONE_DESTINATION"
  fi

  validate_rclone_remote_access "$RESTORE_SOURCE_RCLONE"

  if [[ "${RESTORE_SKIP_STORAGE:-0}" != "1" ]]; then
    validate_rclone_remote_access "$TARGET_STORAGE_RCLONE_DESTINATION"
    validate_storage_target_binding "$TARGET_STORAGE_RCLONE_DESTINATION" "$APPROVED_DISPOSABLE_TARGET_REF"
    validate_empty_storage_target "$TARGET_STORAGE_RCLONE_DESTINATION"
  fi

  local run_id work_root staging_dir report marker encrypted archive recovery_dir source_manifest target_manifest
  local source_security_state target_security_state expected_security_hash
  local storage_manifest storage_object_count storage_check_log
  local required_restore_file
  run_id="${RESTORE_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
  validate_run_id "$run_id"
  work_root="${RESTORE_WORK_DIR:-$(mktemp -d)}"
  mkdir -p "$work_root"
  work_root="$(cd "$work_root" && pwd -P)"
  staging_dir="$(mktemp -d "$work_root/.po-finder-restore.XXXXXX")"
  restore_work_root="$work_root"
  restore_staging_dir="$staging_dir"
  trap cleanup_restore_artifacts EXIT
  report="$work_root/drill-report-redacted-$run_id.json"
  if [[ -e "$report" ]]; then
    echo "Restore drill report already exists for this run id." >&2
    exit 11
  fi
  marker="$staging_dir/latest-success.json"
  encrypted="$staging_dir/po-finder-recovery.tar.gz.age"
  archive="$staging_dir/po-finder-recovery.tar.gz"

  rclone copyto "$RESTORE_SOURCE_RCLONE/latest-success.json" "$marker"
  local source_run source_project_ref ciphertext_hash marker_manifest_hash
  source_run="$(jq -r '.runId' "$marker")"
  source_project_ref="$(jq -r '.sourceProjectRef' "$marker")"
  ciphertext_hash="$(jq -r '.ciphertextSha256' "$marker")"
  marker_manifest_hash="$(jq -r '.manifestSha256' "$marker")"
  if [[ -z "$source_run" || "$source_run" == "null" ]]; then
    echo "Latest success marker is missing runId." >&2
    exit 12
  fi
  if [[ "$source_project_ref" != "$PO_FINDER_PRODUCTION_PROJECT_REF" ]]; then
    echo "Latest success marker is not bound to the known production source project." >&2
    exit 12
  fi
  validate_run_id "$source_run"

  rclone copyto "$RESTORE_SOURCE_RCLONE/$source_run/po-finder-recovery.tar.gz.age" "$encrypted"
  if [[ "$(sha256sum "$encrypted" | awk '{print $1}')" != "$ciphertext_hash" ]]; then
    echo "Ciphertext hash mismatch; refusing restore drill." >&2
    exit 13
  fi

  age -d -i "$AGE_IDENTITY_FILE" -o "$archive" "$encrypted"
  tar -tzf "$archive" >/dev/null
  tar --no-same-owner --no-same-permissions -C "$staging_dir" -xzf "$archive"
  recovery_dir="$staging_dir/po-finder-recovery-$source_run"
  if [[ ! -d "$recovery_dir" ]]; then
    echo "Recovery archive is missing its expected top-level directory." >&2
    exit 14
  fi
  chmod -R go-rwx "$recovery_dir"
  source_manifest="$recovery_dir/manifest-after.txt"
  if [[ "$(sha256sum "$source_manifest" | awk '{print $1}')" != "$marker_manifest_hash" ]]; then
    echo "Manifest hash mismatch; refusing restore drill." >&2
    exit 14
  fi

  source_security_state="$recovery_dir/security-state-after.jsonl"
  expected_security_hash="$(sed -n 's/^security_state_sha256=//p' "$source_manifest")"
  if [[ ! "$expected_security_hash" =~ ^[0-9a-f]{64}$ || ! -f "$source_security_state" ||
    "$(sha256sum "$source_security_state" | awk '{print $1}')" != "$expected_security_hash" ]]; then
    echo "Security-state hash mismatch; refusing restore drill." >&2
    exit 14
  fi
  for required_restore_file in roles.sql schema.sql data.sql managed-schema.sql; do
    if [[ ! -f "$recovery_dir/database/$required_restore_file" ]]; then
      echo "Recovery set is missing required database restore files." >&2
      exit 14
    fi
  done

  storage_manifest="$staging_dir/verified-storage-manifest.txt"
  verify_storage_manifest "$recovery_dir" "$storage_manifest"
  storage_object_count="$(sed -n 's/^object_count=//p' "$storage_manifest")"
  if [[ ! "$storage_object_count" =~ ^[0-9]+$ ]]; then
    echo "Storage manifest has an invalid object count; refusing restore drill." >&2
    exit 16
  fi
  if [[ "${RESTORE_SKIP_STORAGE:-0}" == "1" && "$storage_object_count" != "0" ]]; then
    echo "RESTORE_SKIP_STORAGE is allowed only for a zero-object recovery set." >&2
    exit 16
  fi

  psql_target \
    --single-transaction \
    --variable ON_ERROR_STOP=1 \
    --command 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated' \
    --file "$recovery_dir/database/roles.sql" \
    --file "$recovery_dir/database/schema.sql" \
    --command 'SET session_replication_role = replica' \
    --file "$recovery_dir/database/data.sql" \
    --file "$recovery_dir/database/managed-schema.sql"

  if [[ "${RESTORE_SKIP_STORAGE:-0}" != "1" ]]; then
    # storage.objects is intentionally absent from data.sql. Uploading the blobs
    # through Supabase's S3 endpoint creates fresh, internally consistent object
    # metadata for the disposable project.
    rclone copy "$recovery_dir/storage" "$TARGET_STORAGE_RCLONE_DESTINATION" --metadata
    storage_check_log="$staging_dir/storage-check.log"
    if ! rclone check "$recovery_dir/storage" "$TARGET_STORAGE_RCLONE_DESTINATION" \
      --download > "$storage_check_log" 2>&1; then
      rm -f "$storage_check_log"
      echo "Disposable target Storage objects do not match the recovery set." >&2
      exit 16
    fi
    rm -f "$storage_check_log"
  fi

  target_manifest="$staging_dir/target-manifest.txt"
  write_target_manifest "$target_manifest" "$staging_dir/target-table-checksums"

  grep -E '^[^.[:space:]]+\.[^[:space:]]+ count=' "$source_manifest" | LC_ALL=C sort > "$staging_dir/source-tables.txt"
  grep -E '^[^.[:space:]]+\.[^[:space:]]+ count=' "$target_manifest" | LC_ALL=C sort > "$staging_dir/target-tables.txt"
  if ! diff -u "$staging_dir/source-tables.txt" "$staging_dir/target-tables.txt" > "$staging_dir/table-manifest-diff.txt"; then
    echo "Restored table counts/checksums do not match source manifest." >&2
    exit 15
  fi

  target_security_state="$staging_dir/target-security-state.jsonl"
  write_security_state psql_target "$target_security_state"
  if ! diff -u "$source_security_state" "$target_security_state" > "$staging_dir/security-state-diff.txt"; then
    echo "Restored policies, RLS, ACLs, or critical routine state do not match the source." >&2
    exit 17
  fi

  cat > "$report" <<JSON
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
  "securityStateMatches": true,
  "storageObjectCount": $storage_object_count,
  "storageObjectsMatch": true,
  "storageRestoreMode": "${RESTORE_SKIP_STORAGE:-0}"
}
JSON
  echo "$report"
}

main "$@"
