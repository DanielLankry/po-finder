#!/usr/bin/env bash

set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 64
fi

runtime_root="${PLAYWRIGHT_RUNTIME_DIR:-${PAPERCLIP_RUN_SCRATCH_DIR:-${PAPERCLIP_SCRATCH_DIR:-}}}"

if [[ -z "$runtime_root" ]]; then
  echo "Set PLAYWRIGHT_RUNTIME_DIR or run inside a Paperclip scratch environment." >&2
  exit 64
fi

for command_name in apt-get dpkg-architecture dpkg-deb; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is unavailable: $command_name" >&2
    exit 69
  fi
done

runtime_dir="$runtime_root/playwright-runtime"
download_dir="$runtime_dir/downloads"
extract_dir="$runtime_dir/root"
ready_file="$runtime_dir/.ready"
browser_dir="$runtime_root/playwright-browsers"
cache_dir="$runtime_root/playwright-cache"
multiarch="$(dpkg-architecture -qDEB_HOST_MULTIARCH)"
library_dir="$extract_dir/usr/lib/$multiarch"

if [[ ! -f "$ready_file" ]]; then
  mkdir -p "$download_dir" "$extract_dir"

  (
    cd "$download_dir"
    apt-get download libnspr4 libnss3
  )

  shopt -s nullglob
  packages=("$download_dir"/*.deb)
  if [[ ${#packages[@]} -eq 0 ]]; then
    echo "No browser runtime packages were downloaded." >&2
    exit 70
  fi

  for package_file in "${packages[@]}"; do
    # Paperclip injects an embedded-Postgres LD_LIBRARY_PATH whose liblzma is
    # incompatible with the host dpkg-deb. Use host libraries for extraction.
    env -u LD_LIBRARY_PATH dpkg-deb -x "$package_file" "$extract_dir"
  done

  if [[ ! -f "$library_dir/libnspr4.so" || ! -f "$library_dir/libnss3.so" ]]; then
    echo "Required Chromium libraries were not present after extraction." >&2
    exit 70
  fi

  touch "$ready_file"
fi

if [[ ! -f "$library_dir/libnspr4.so" || ! -f "$library_dir/libnss3.so" ]]; then
  echo "Browser runtime libraries are incomplete in $library_dir" >&2
  exit 70
fi

# Keep the embedded-Postgres libraries out of Chromium and its helper tools.
mkdir -p "$browser_dir" "$cache_dir"

exec env \
  LD_LIBRARY_PATH="$library_dir" \
  PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$browser_dir}" \
  XDG_CACHE_HOME="${XDG_CACHE_HOME:-$cache_dir}" \
  "$@"
