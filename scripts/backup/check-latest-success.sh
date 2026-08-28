#!/usr/bin/env bash
set -euo pipefail

if [[ $- == *x* ]]; then
  echo "Refusing to run with shell xtrace enabled; backup checks must not echo secrets." >&2
  exit 1
fi

umask 077

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

validate_rclone_remote_access() {
  local spec="$1"
  if [[ ! "$spec" =~ ^([A-Za-z0-9][A-Za-z0-9._-]*): ]]; then
    echo "Invalid rclone remote specification." >&2
    exit 3
  fi
  local remote="${BASH_REMATCH[1]}"
  if ! rclone listremotes 2>/dev/null | grep -Fx "${remote}:" >/dev/null; then
    echo "Required rclone remote is not configured." >&2
    exit 3
  fi
  if ! rclone lsf "${remote}:" --max-depth 1 >/dev/null 2>&1; then
    echo "Required rclone remote is not accessible." >&2
    exit 3
  fi
}

main() {
  require_cmd date
  require_cmd jq
  require_cmd rclone
  require_env BACKUP_DESTINATION_RCLONE
  validate_rclone_remote_access "$BACKUP_DESTINATION_RCLONE"

  local max_age_hours work_dir marker completed_at completed_epoch now_epoch age_seconds max_age_seconds
  max_age_hours="${BACKUP_MAX_SUCCESS_AGE_HOURS:-36}"
  work_dir="${BACKUP_WORK_DIR:-$(mktemp -d)}"
  mkdir -p "$work_dir"
  marker="$work_dir/latest-success.json"

  run_quietly "Latest recovery-set marker download failed; command output withheld." \
    rclone copyto "$BACKUP_DESTINATION_RCLONE/latest-success.json" "$marker"
  completed_at="$(jq -r '.completedAtUtc' "$marker")"
  if [[ -z "$completed_at" || "$completed_at" == "null" ]]; then
    echo "Latest success marker is missing completedAtUtc." >&2
    exit 20
  fi

  completed_epoch="$(date -u -d "$completed_at" +%s)"
  now_epoch="$(date -u +%s)"
  age_seconds=$((now_epoch - completed_epoch))
  max_age_seconds=$((max_age_hours * 60 * 60))

  if (( age_seconds < 0 )); then
    echo "Latest recovery-set success marker is dated in the future." >&2
    exit 22
  fi

  if (( age_seconds > max_age_seconds )); then
    echo "Latest recovery-set success marker is older than ${max_age_hours} hours." >&2
    exit 21
  fi

  echo "Latest recovery-set success marker age is within ${max_age_hours} hours."
}

main "$@"
