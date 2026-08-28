#!/usr/bin/env bash
set -euo pipefail

if [[ $- == *x* ]]; then
  echo "Refusing to run with shell xtrace enabled; backup commands must not echo secrets." >&2
  exit 1
fi

umask 077

readonly PO_FINDER_PRODUCTION_PROJECT_REF="ymqlqdhelsocibhnanjy"

export_work_root=""
export_staging_dir=""

cleanup_export_artifacts() {
  if [[ -n "$export_staging_dir" && -n "$export_work_root" &&
    "$export_staging_dir" == "$export_work_root"/.po-finder-export.* ]]; then
    rm -rf -- "$export_staging_dir"
  fi
}

usage() {
  cat <<'USAGE'
Create an encrypted Po Finder recovery set.

Required environment:
  SOURCE_DB_URL                  Read-capable URL for production project ymqlqdhelsocibhnanjy.
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

run_quietly() {
  local failure_message="$1"
  shift
  local status

  if "$@" >/dev/null 2>&1; then
    return 0
  else
    status=$?
    echo "$failure_message" >&2
    return "$status"
  fi
}

validate_run_id() {
  local run_id="$1"
  if [[ ! "$run_id" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
    echo "Backup run id contains unsupported characters." >&2
    exit 1
  fi
}

validate_database_source_binding() {
  local source_url="$1"
  local expected_ref="$2"
  local without_scheme authority userinfo hostport username database_and_query database query
  local parameter name value
  local -a parameters

  if [[ ! "$source_url" =~ ^postgres(ql)?:// ]]; then
    echo "SOURCE_DB_URL must be a PostgreSQL URL for the known production project." >&2
    exit 3
  fi
  without_scheme="${source_url#*://}"
  if [[ "$without_scheme" == *'#'* || "$without_scheme" != */* ]]; then
    echo "SOURCE_DB_URL must identify the postgres database without a URI fragment." >&2
    exit 3
  fi
  authority="${without_scheme%%/*}"
  if [[ "$authority" != *@* ]]; then
    echo "SOURCE_DB_URL does not identify the known production project." >&2
    exit 3
  fi
  userinfo="${authority%@*}"
  hostport="${authority##*@}"
  username="${userinfo%%:*}"
  database_and_query="${without_scheme#*/}"
  database="${database_and_query%%\?*}"

  if [[ "$database" != "postgres" ]]; then
    echo "SOURCE_DB_URL must identify the postgres database." >&2
    exit 3
  fi

  if [[ "$database_and_query" == *'?'* ]]; then
    query="${database_and_query#*\?}"
    if [[ -z "$query" ]]; then
      echo "SOURCE_DB_URL contains an empty connection parameter." >&2
      exit 3
    fi
    IFS='&' read -r -a parameters <<< "$query"
    for parameter in "${parameters[@]}"; do
      if [[ "$parameter" != *=* ]]; then
        echo "SOURCE_DB_URL contains an unsupported connection parameter." >&2
        exit 3
      fi
      name="${parameter%%=*}"
      value="${parameter#*=}"
      case "$name" in
        sslmode)
          [[ "$value" =~ ^(require|verify-ca|verify-full)$ ]] || {
            echo "SOURCE_DB_URL contains an unsafe sslmode." >&2
            exit 3
          }
          ;;
        connect_timeout)
          [[ "$value" =~ ^[1-9][0-9]*$ ]] || {
            echo "SOURCE_DB_URL contains an invalid connect_timeout." >&2
            exit 3
          }
          ;;
        channel_binding)
          [[ "$value" =~ ^(prefer|require)$ ]] || {
            echo "SOURCE_DB_URL contains an unsafe channel_binding value." >&2
            exit 3
          }
          ;;
        *)
          echo "SOURCE_DB_URL contains an unsupported connection parameter." >&2
          exit 3
          ;;
      esac
    done
  fi

  if [[ "$hostport" =~ ^db\.${expected_ref}\.supabase\.co(:5432)?$ && "$username" == "postgres" ]]; then
    return 0
  fi
  if [[ "$hostport" =~ ^[a-z0-9.-]+\.pooler\.supabase\.com:(5432|6543)$ && "$username" == "postgres.${expected_ref}" ]]; then
    return 0
  fi

  echo "SOURCE_DB_URL does not identify the known production project." >&2
  exit 3
}

reject_libpq_source_overrides() {
  local name
  local -a source_overrides=(
    PGHOST
    PGHOSTADDR
    PGPORT
    PGDATABASE
    PGUSER
    PGSERVICE
    PGSERVICEFILE
  )

  for name in "${source_overrides[@]}"; do
    if [[ -n "${!name:-}" ]]; then
      echo "Refusing inherited libpq source override: $name." >&2
      exit 3
    fi
  done
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
  if ! rclone listremotes 2>/dev/null | grep -Fx "${remote}:" >/dev/null; then
    echo "Required rclone remote is not configured." >&2
    exit 3
  fi
  if ! rclone lsf "${remote}:" --max-depth 1 >/dev/null 2>&1; then
    echo "Required rclone remote is not accessible." >&2
    exit 3
  fi
}

reject_rclone_storage_source_overrides() {
  local spec="$1"
  local remote normalized name
  remote="$(rclone_remote_name "$spec")"
  normalized="${remote^^}"
  normalized="${normalized//[^A-Z0-9]/_}"

  if [[ -n "${RCLONE_S3_ENDPOINT:-}" ]]; then
    echo "Refusing inherited rclone Storage source override: RCLONE_S3_ENDPOINT." >&2
    exit 3
  fi

  for name in "RCLONE_CONFIG_${normalized}_ENDPOINT" "RCLONE_CONFIG_${normalized}_TYPE"; do
    if [[ -n "${!name:-}" ]]; then
      echo "Refusing inherited rclone Storage source override: $name." >&2
      exit 3
    fi
  done
}

validate_storage_source_binding() {
  local spec="$1"
  local expected_ref="$2"
  local remote redacted backend_type endpoint
  remote="$(rclone_remote_name "$spec")"
  if ! redacted="$(rclone config redacted "$remote" 2>/dev/null)"; then
    echo "Unable to inspect the redacted source Storage configuration." >&2
    exit 3
  fi
  backend_type="$(printf '%s\n' "$redacted" | sed -n 's/^[[:space:]]*type[[:space:]]*=[[:space:]]*//p' | head -n 1)"
  endpoint="$(printf '%s\n' "$redacted" | sed -n 's/^[[:space:]]*endpoint[[:space:]]*=[[:space:]]*//p' | head -n 1)"
  if [[ "$backend_type" != "s3" ]]; then
    echo "Source Storage remote must use the rclone s3 backend." >&2
    exit 3
  fi
  case "$endpoint" in
    "https://${expected_ref}.storage.supabase.co/storage/v1/s3"|\
    "https://${expected_ref}.storage.supabase.co/storage/v1/s3/"|\
    "https://${expected_ref}.supabase.co/storage/v1/s3"|\
    "https://${expected_ref}.supabase.co/storage/v1/s3/")
      return 0
      ;;
  esac
  echo "Source Storage remote does not identify the known production project." >&2
  exit 3
}

reject_rclone_destination_overrides() {
  local spec="$1"
  local remote normalized name
  local -a endpoint_overrides=(
    RCLONE_S3_ENDPOINT
    RCLONE_B2_ENDPOINT
    RCLONE_AZUREBLOB_ENDPOINT
    RCLONE_GCS_ENDPOINT
  )
  remote="$(rclone_remote_name "$spec")"
  normalized="${remote^^}"
  normalized="${normalized//[^A-Z0-9]/_}"

  for name in "${endpoint_overrides[@]}" \
    "RCLONE_CONFIG_${normalized}_ENDPOINT" "RCLONE_CONFIG_${normalized}_TYPE"; do
    if [[ -n "${!name:-}" ]]; then
      echo "Refusing inherited rclone backup destination override: $name." >&2
      exit 3
    fi
  done
}

validate_backup_destination_binding() {
  local spec="$1"
  local production_ref="$2"
  local source_spec="${3:-}"
  local remote source_remote redacted backend_type normalized_config
  remote="$(rclone_remote_name "$spec")"

  if [[ -n "$source_spec" ]]; then
    source_remote="$(rclone_remote_name "$source_spec")"
    if [[ "$remote" == "$source_remote" ]]; then
      echo "Backup destination must not reuse the production Storage source remote." >&2
      exit 3
    fi
  fi

  if ! redacted="$(rclone config redacted "$remote" 2>/dev/null)"; then
    echo "Unable to inspect the redacted backup destination configuration." >&2
    exit 3
  fi
  backend_type="$(printf '%s\n' "$redacted" | sed -n 's/^[[:space:]]*type[[:space:]]*=[[:space:]]*//p' | head -n 1)"
  case "$backend_type" in
    s3|b2|azureblob|"google cloud storage")
      ;;
    *)
      echo "Backup destination must use an approved off-site object-storage backend." >&2
      exit 3
      ;;
  esac

  normalized_config="${redacted,,}"
  if [[ "$normalized_config" == *"$production_ref"* ||
    "$normalized_config" == *"supabase.co/storage/v1/s3"* ]]; then
    echo "Backup destination must not use a Supabase Storage endpoint." >&2
    exit 3
  fi
}

quote_ident() {
  printf '"%s"' "${1//\"/\"\"}"
}

psql_source() {
  local status

  if psql "$SOURCE_DB_URL" -X -v ON_ERROR_STOP=1 "$@" 2>/dev/null; then
    return 0
  else
    status=$?
    echo "Source database command failed; command output withheld." >&2
    return "$status"
  fi
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
with schema_state as (
  select 10 as kind_order,
         n.nspname || '.' || c.relname as object_key,
         jsonb_build_object(
           'kind', 'relation',
           'schema', n.nspname,
           'name', c.relname,
           'relation_kind', c.relkind,
           'persistence', c.relpersistence,
           'replica_identity', c.relreplident,
           'options', c.reloptions,
           'partition_key', pg_get_partkeydef(c.oid),
           'partition_bound', pg_get_expr(c.relpartbound, c.oid)
         ) as state
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')
    and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')

  union all

  select 20,
         n.nspname || '.' || c.relname || '.' || a.attnum,
         jsonb_build_object(
           'kind', 'column',
           'schema', n.nspname,
           'relation', c.relname,
           'position', a.attnum,
           'name', a.attname,
           'type', format_type(a.atttypid, a.atttypmod),
           'not_null', a.attnotnull,
           'default', pg_get_expr(d.adbin, d.adrelid),
           'identity', a.attidentity,
           'generated', a.attgenerated,
           'collation', case when a.attcollation = 0 then null else a.attcollation::regcollation::text end
         )
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where n.nspname in ('public', 'auth', 'storage')
    and c.relkind in ('r', 'p', 'v', 'm', 'f')

  union all

  select 30,
         n.nspname || '.' || c.relname || '.' || con.conname,
         jsonb_build_object(
           'kind', 'constraint',
           'schema', n.nspname,
           'relation', c.relname,
           'name', con.conname,
           'constraint_kind', con.contype,
           'deferrable', con.condeferrable,
           'initially_deferred', con.condeferred,
           'validated', con.convalidated,
           'definition', pg_get_constraintdef(con.oid, true)
         )
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')

  union all

  select 40,
         n.nspname || '.' || c.relname || '.' || ci.relname,
         jsonb_build_object(
           'kind', 'index',
           'schema', n.nspname,
           'relation', c.relname,
           'name', ci.relname,
           'unique', i.indisunique,
           'primary', i.indisprimary,
           'valid', i.indisvalid,
           'definition', pg_get_indexdef(i.indexrelid)
         )
  from pg_index i
  join pg_class c on c.oid = i.indrelid
  join pg_class ci on ci.oid = i.indexrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')

  union all

  select 50,
         n.nspname || '.' || c.relname || '.' || t.tgname,
         jsonb_build_object(
           'kind', 'trigger',
           'schema', n.nspname,
           'relation', c.relname,
           'name', t.tgname,
           'enabled', t.tgenabled,
           'definition', pg_get_triggerdef(t.oid, true)
         )
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')
    and not t.tgisinternal

  union all

  select 60,
         n.nspname || '.' || c.relname,
         jsonb_build_object(
           'kind', 'view',
           'schema', n.nspname,
           'name', c.relname,
           'materialized', c.relkind = 'm',
           'definition', pg_get_viewdef(c.oid, true)
         )
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')
    and c.relkind in ('v', 'm')

  union all

  select 70,
         n.nspname || '.' || c.relname,
         jsonb_build_object(
           'kind', 'sequence',
           'schema', n.nspname,
           'name', c.relname,
           'data_type', format_type(s.seqtypid, null),
           'start', s.seqstart,
           'increment', s.seqincrement,
           'minimum', s.seqmin,
           'maximum', s.seqmax,
           'cache', s.seqcache,
           'cycle', s.seqcycle
         )
  from pg_sequence s
  join pg_class c on c.oid = s.seqrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'auth', 'storage')

  union all

  select 80,
         n.nspname || '.' || t.typname,
         jsonb_build_object(
           'kind', 'type',
           'schema', n.nspname,
           'name', t.typname,
           'type_kind', t.typtype,
           'base_type', case when t.typbasetype = 0 then null else format_type(t.typbasetype, t.typtypmod) end,
           'not_null', t.typnotnull,
           'default', t.typdefault,
           'enum_labels', (
             select jsonb_agg(e.enumlabel order by e.enumsortorder)
             from pg_enum e
             where e.enumtypid = t.oid
           ),
           'constraints', (
             select jsonb_agg(pg_get_constraintdef(con.oid, true) order by con.conname)
             from pg_constraint con
             where con.contypid = t.oid
           )
         )
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname in ('public', 'auth', 'storage')
    and t.typtype in ('d', 'e')

  union all

  select 90,
         n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         jsonb_build_object(
           'kind', 'routine',
           'schema', n.nspname,
           'identity', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
           'definition', pg_get_functiondef(p.oid)
         )
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind in ('f', 'p')
)
select state::text
from schema_state
order by kind_order, object_key, state::text;
SQL
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

  union all

  select 50,
         n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ').' ||
           case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end || '.' ||
           acl.privilege_type,
         jsonb_build_object(
           'kind', 'routine_acl',
           'schema', n.nspname,
           'identity', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
           'grantee', case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end,
           'privilege', acl.privilege_type,
           'grantable', acl.is_grantable
         )
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
  where n.nspname = 'public'
    and p.prokind in ('f', 'p')
)
select state::text
from security_state
order by kind_order, object_key, state::text;
SQL
}

write_managed_schema_ddl() {
  local out="$1"

  cat > "$out" <<'SQL'
-- Project-specific Auth/Storage security state excluded by the default Supabase schema dump.
-- This file is generated from the source catalogs and restored only to an approved disposable target.
do $po_finder$
declare
  policy_record record;
begin
  for policy_record in
    select n.nspname as schema_name, c.relname as relation_name, p.polname as policy_name
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('auth', 'storage')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policy_name,
      policy_record.schema_name,
      policy_record.relation_name
    );
  end loop;
end
$po_finder$;
SQL

  psql_source -A -t <<'SQL' >> "$out"
select format(
  'alter table %I.%I %s row level security;%salter table %I.%I %s force row level security;',
  n.nspname,
  c.relname,
  case when c.relrowsecurity then 'enable' else 'disable' end,
  E'\n',
  n.nspname,
  c.relname,
  case when c.relforcerowsecurity then '' else 'no' end
)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('auth', 'storage')
  and c.relkind in ('r', 'p')
order by n.nspname, c.relname;

select format(
  'create policy %I on %I.%I as %s for %s to %s%s%s;',
  p.polname,
  n.nspname,
  c.relname,
  case when p.polpermissive then 'permissive' else 'restrictive' end,
  case p.polcmd
    when 'r' then 'select'
    when 'a' then 'insert'
    when 'w' then 'update'
    when 'd' then 'delete'
    else 'all'
  end,
  (
    select string_agg(
      case when role_oid = 0 then 'PUBLIC' else quote_ident(pg_get_userbyid(role_oid)) end,
      ', '
      order by case when role_oid = 0 then 'PUBLIC' else pg_get_userbyid(role_oid) end
    )
    from unnest(p.polroles) as role_oid
  ),
  case when p.polqual is null then '' else format(' using (%s)', pg_get_expr(p.polqual, p.polrelid)) end,
  case when p.polwithcheck is null then '' else format(' with check (%s)', pg_get_expr(p.polwithcheck, p.polrelid)) end
)
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('auth', 'storage')
order by n.nspname, c.relname, p.polname;

select format(
  'revoke all privileges on table %I.%I from PUBLIC;%srevoke all privileges on table %I.%I from anon, authenticated, service_role;',
  n.nspname,
  c.relname,
  E'\n',
  n.nspname,
  c.relname
)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('auth', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
order by n.nspname, c.relname;

select format(
  'grant %s on table %I.%I to %s%s;',
  acl.privilege_type,
  n.nspname,
  c.relname,
  case when acl.grantee = 0 then 'PUBLIC' else quote_ident(pg_get_userbyid(acl.grantee)) end,
  case when acl.is_grantable then ' with grant option' else '' end
)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(coalesce(c.relacl, '{}'::aclitem[])) as acl
where n.nspname in ('auth', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
order by n.nspname, c.relname, acl.grantee, acl.privilege_type;
SQL
}

write_manifest() {
  local label="$1"
  local dir="$2"
  local out="$3"
  local security_state_file="$4"
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
    printf 'security_state_sha256=%s\n' "$(sha256sum "$security_state_file" | awk '{print $1}')"
    printf '\n[tables]\n'
  } > "$out"

  while IFS=. read -r schema table; do
    [[ -n "$schema" && -n "$table" ]] || continue
    local qschema qtable count checksum jsonl
    qschema="$(quote_ident "$schema")"
    qtable="$(quote_ident "$table")"
    jsonl="$table_dir/${schema}.${table}.jsonl"
    count="$(psql_source -A -t -c "select count(*) from $qschema.$qtable;")"
    if [[ "$schema" == "storage" && "$table" == "objects" ]]; then
      psql_source -A -t -c \
        "copy (select json_build_object('bucket_id', bucket_id, 'name', name) from $qschema.$qtable) to stdout;" \
        | jq -cS . \
        | LC_ALL=C sort > "$jsonl"
    else
      psql_source -A -t -c "copy (select row_to_json(t) from (select * from $qschema.$qtable) t) to stdout;" \
        | jq -cS . \
        | LC_ALL=C sort > "$jsonl"
    fi
    checksum="$(sha256sum "$jsonl" | awk '{print $1}')"
    printf '%s.%s count=%s sha256=%s\n' "$schema" "$table" "$count" "$checksum" >> "$out"
  done < "$tables_file"

  {
    printf '\nmanifest_sha256=%s\n' "$(sha256sum "$out" | awk '{print $1}')"
  } >> "$out"
}

stable_manifest_lines() {
  grep -E '^(schema_sha256=|security_state_sha256=|[^.[:space:]]+\.[^[:space:]]+ count=)' "$1" | LC_ALL=C sort
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
  local run_id work_root staging_dir set_dir archive encrypted marker retention_days
  local recipient source_storage_object_count
  local -a recipients recipients_args
  local -A seen_recipients=()

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

  IFS=',' read -r -a recipients <<< "$AGE_RECIPIENTS"
  recipients_args=()
  for recipient in "${recipients[@]}"; do
    recipient="${recipient#"${recipient%%[![:space:]]*}"}"
    recipient="${recipient%"${recipient##*[![:space:]]}"}"
    if [[ -n "$recipient" && -z "${seen_recipients[$recipient]+present}" ]]; then
      seen_recipients["$recipient"]=1
      recipients_args+=("-r" "$recipient")
    fi
  done
  if [[ "${#recipients_args[@]}" -lt 4 ]]; then
    echo "At least two distinct age recipients are required." >&2
    exit 1
  fi
  if ! printf '' | age "${recipients_args[@]}" >/dev/null 2>&1; then
    echo "AGE_RECIPIENTS contains an invalid age recipient." >&2
    exit 1
  fi

  validate_database_source_binding "$SOURCE_DB_URL" "$PO_FINDER_PRODUCTION_PROJECT_REF"
  reject_libpq_source_overrides

  if [[ "${BACKUP_SKIP_UPLOAD:-0}" != "1" ]]; then
    require_cmd rclone
    require_env BACKUP_DESTINATION_RCLONE
    reject_rclone_destination_overrides "$BACKUP_DESTINATION_RCLONE"
  fi

  if [[ "${BACKUP_SKIP_STORAGE:-0}" != "1" ]]; then
    require_cmd rclone
    require_env SUPABASE_STORAGE_RCLONE_SOURCE
    reject_rclone_storage_source_overrides "$SUPABASE_STORAGE_RCLONE_SOURCE"
    validate_storage_source_binding "$SUPABASE_STORAGE_RCLONE_SOURCE" "$PO_FINDER_PRODUCTION_PROJECT_REF"
  fi

  if [[ "${BACKUP_SKIP_UPLOAD:-0}" != "1" ]]; then
    validate_backup_destination_binding "$BACKUP_DESTINATION_RCLONE" \
      "$PO_FINDER_PRODUCTION_PROJECT_REF" "${SUPABASE_STORAGE_RCLONE_SOURCE:-}"
    validate_rclone_remote_access "$BACKUP_DESTINATION_RCLONE"
  fi
  if [[ "${BACKUP_SKIP_STORAGE:-0}" != "1" ]]; then
    validate_rclone_remote_access "$SUPABASE_STORAGE_RCLONE_SOURCE"
  fi

  run_id="${BACKUP_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
  validate_run_id "$run_id"
  work_root="${BACKUP_WORK_DIR:-$(mktemp -d)}"
  mkdir -p "$work_root"
  work_root="$(cd "$work_root" && pwd -P)"
  staging_dir="$(mktemp -d "$work_root/.po-finder-export.XXXXXX")"
  export_work_root="$work_root"
  export_staging_dir="$staging_dir"
  trap cleanup_export_artifacts EXIT
  set_dir="$staging_dir/po-finder-recovery-$run_id"
  archive="$staging_dir/po-finder-recovery-$run_id.tar.gz"
  encrypted="$work_root/po-finder-recovery-$run_id.tar.gz.age"
  retention_days="${BACKUP_RETENTION_DAYS:-35}"
  mkdir -p "$set_dir/database" "$set_dir/storage"

  write_security_state psql_source "$set_dir/security-state-before.jsonl"
  write_manifest "before" "$set_dir" "$set_dir/manifest-before.txt" "$set_dir/security-state-before.jsonl"

  if [[ "${BACKUP_SKIP_STORAGE:-0}" == "1" ]]; then
    source_storage_object_count="$(psql_source -A -t -c 'select count(*) from storage.objects;')"
    source_storage_object_count="${source_storage_object_count//[[:space:]]/}"
    if [[ ! "$source_storage_object_count" =~ ^[0-9]+$ ]]; then
      echo "Unable to verify that source Storage is empty; refusing skip mode." >&2
      exit 2
    fi
    if [[ "$source_storage_object_count" != "0" ]]; then
      echo "BACKUP_SKIP_STORAGE is allowed only when source Storage has zero objects." >&2
      exit 2
    fi
  fi

  run_quietly "Source database role dump failed; command output withheld." \
    supabase db dump --db-url "$SOURCE_DB_URL" -f "$set_dir/database/roles.sql" --role-only
  run_quietly "Source database schema dump failed; command output withheld." \
    supabase db dump --db-url "$SOURCE_DB_URL" -f "$set_dir/database/schema.sql"
  run_quietly "Source database data dump failed; command output withheld." \
    supabase db dump --db-url "$SOURCE_DB_URL" -f "$set_dir/database/data.sql" --use-copy --data-only \
      -x "storage.objects" -x "storage.buckets_vectors" -x "storage.vector_indexes"
  write_managed_schema_ddl "$set_dir/database/managed-schema.sql"
  chmod 600 "$set_dir/database/roles.sql" "$set_dir/database/schema.sql" \
    "$set_dir/database/data.sql" "$set_dir/database/managed-schema.sql"

  if [[ "${BACKUP_SKIP_STORAGE:-0}" == "1" ]]; then
    printf 'storage_export=skipped\nobject_count=0\ntotal_bytes=0\n' > "$set_dir/storage-manifest.txt"
  else
    run_quietly "Source Storage export failed; command output withheld." \
      rclone copy "$SUPABASE_STORAGE_RCLONE_SOURCE" "$set_dir/storage" --immutable --metadata
    chmod -R go-rwx "$set_dir/storage"
    write_storage_manifest "$set_dir/storage" "$set_dir/storage-manifest.txt"
  fi

  write_security_state psql_source "$set_dir/security-state-after.jsonl"
  write_manifest "after" "$set_dir" "$set_dir/manifest-after.txt" "$set_dir/security-state-after.jsonl"
  stable_manifest_lines "$set_dir/manifest-before.txt" > "$set_dir/manifest-before.stable.txt"
  stable_manifest_lines "$set_dir/manifest-after.txt" > "$set_dir/manifest-after.stable.txt"
  if ! diff -u "$set_dir/manifest-before.stable.txt" "$set_dir/manifest-after.stable.txt" > "$set_dir/manifest-diff.txt"; then
    echo "Source changed during backup; refusing to publish this recovery set." >&2
    exit 2
  fi

  tar -C "$staging_dir" -czf "$archive" "po-finder-recovery-$run_id"
  tar -tzf "$archive" >/dev/null

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
  "sourceProjectRef": "$PO_FINDER_PRODUCTION_PROJECT_REF",
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

  run_quietly "Encrypted recovery-set upload failed; command output withheld." \
    rclone copyto "$encrypted" \
      "$BACKUP_DESTINATION_RCLONE/$run_id/po-finder-recovery.tar.gz.age" --immutable
  local remote_ciphertext_hash
  if ! remote_ciphertext_hash="$(
    rclone cat "$BACKUP_DESTINATION_RCLONE/$run_id/po-finder-recovery.tar.gz.age" 2>/dev/null \
      | sha256sum \
      | awk '{print $1}'
  )"; then
    echo "Unable to hash the uploaded ciphertext; refusing to publish success markers." >&2
    exit 4
  fi
  if [[ "$remote_ciphertext_hash" != "$ciphertext_hash" ]]; then
    echo "Uploaded ciphertext hash mismatch; refusing to publish success markers." >&2
    exit 4
  fi
  run_quietly "Immutable recovery-set marker upload failed; command output withheld." \
    rclone copyto "$marker" "$BACKUP_DESTINATION_RCLONE/$run_id/latest-success.json" --immutable
  run_quietly "Encrypted recovery-set retention failed; command output withheld." \
    rclone delete "$BACKUP_DESTINATION_RCLONE" --min-age "${retention_days}d" \
      --include "**/po-finder-recovery.tar.gz.age"
  rm -rf "$set_dir" "$archive"
  echo "Publishing verified encrypted recovery set $run_id."
  run_quietly "Global recovery-set marker upload failed; command output withheld." \
    rclone copyto "$marker" "$BACKUP_DESTINATION_RCLONE/latest-success.json"
}

main "$@"
