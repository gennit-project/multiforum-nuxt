#!/usr/bin/env bash

set -euo pipefail

current_env_file=".env.production"
target_env_file=".env.production.next"
previous_env_file=".env.production.previous"
base_url=""
promotion_confirmed=false
replace_previous=false
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/promote-self-hosting-upgrade.sh [--current-env-file PATH]
       [--target-env-file PATH] [--previous-env-file PATH]
       [--base-url URL] --confirm-promotion [--replace-previous]

Verifies the running production stack against the candidate environment,
preserves the active environment as a protected rollback file, and atomically
promotes the candidate. The active and candidate files must share a directory.
EOF
}

require_value() {
  local option="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    echo "$option requires a value." >&2
    usage >&2
    exit 2
  fi
}

absolute_file_path() {
  local file_path="$1"
  printf '%s/%s\n' "$(cd -- "$(dirname -- "$file_path")" && pwd)" "$(basename -- "$file_path")"
}

while (($# > 0)); do
  case "$1" in
    --current-env-file)
      require_value "$1" "${2:-}"
      current_env_file="$2"
      shift 2
      ;;
    --target-env-file)
      require_value "$1" "${2:-}"
      target_env_file="$2"
      shift 2
      ;;
    --previous-env-file)
      require_value "$1" "${2:-}"
      previous_env_file="$2"
      shift 2
      ;;
    --base-url)
      require_value "$1" "${2:-}"
      base_url="$2"
      shift 2
      ;;
    --confirm-promotion)
      promotion_confirmed=true
      shift
      ;;
    --replace-previous)
      replace_previous=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$promotion_confirmed" != true ]]; then
  echo "Refusing to promote without --confirm-promotion." >&2
  exit 2
fi

for env_file in "$current_env_file" "$target_env_file"; do
  if [[ ! -f "$env_file" ]]; then
    echo "Production environment file not found: $env_file" >&2
    exit 1
  fi
  if [[ -L "$env_file" ]]; then
    echo "Production environment files must not be symbolic links: $env_file" >&2
    exit 1
  fi
done

if [[ -d "$previous_env_file" ]]; then
  echo "Rollback environment path is a directory: $previous_env_file" >&2
  exit 1
fi
if [[ -L "$previous_env_file" ]]; then
  echo "Rollback environment path must not be a symbolic link: $previous_env_file" >&2
  exit 1
fi

current_env_file="$(absolute_file_path "$current_env_file")"
target_env_file="$(absolute_file_path "$target_env_file")"
previous_dir="$(dirname -- "$previous_env_file")"
if [[ ! -d "$previous_dir" ]]; then
  echo "Rollback environment directory not found: $previous_dir" >&2
  exit 1
fi
previous_dir="$(cd -- "$previous_dir" && pwd)"
previous_env_file="$previous_dir/$(basename -- "$previous_env_file")"

if [[ "$(dirname -- "$current_env_file")" != "$(dirname -- "$target_env_file")" ]]; then
  echo "Active and candidate environment files must share a directory for atomic promotion." >&2
  exit 1
fi

if [[ "$current_env_file" == "$target_env_file" || "$current_env_file" -ef "$target_env_file" ]]; then
  echo "Active and candidate environment files must be different." >&2
  exit 1
fi
if [[ "$previous_env_file" == "$current_env_file" || "$previous_env_file" == "$target_env_file" ]]; then
  echo "Rollback environment file must be distinct from active and candidate files." >&2
  exit 1
fi
if [[ -e "$previous_env_file" &&
  ("$previous_env_file" -ef "$current_env_file" || "$previous_env_file" -ef "$target_env_file") ]]; then
  echo "Rollback environment file must not alias active or candidate files." >&2
  exit 1
fi
if [[ -e "$previous_env_file" && "$replace_previous" != true ]]; then
  echo "Rollback environment file already exists: $previous_env_file" >&2
  echo "Pass --replace-previous only after preserving or retiring it." >&2
  exit 1
fi

verify_command=(
  "$script_root/scripts/verify-self-hosting.sh"
  --env-file "$target_env_file"
)
if [[ -n "$base_url" ]]; then
  verify_command+=(--base-url "$base_url")
fi

echo "Verifying the candidate against the running production stack..."
"${verify_command[@]}"

temporary_previous="$(mktemp "$previous_dir/.multiforum-previous-env.XXXXXX")"
trap 'rm -f "$temporary_previous"' EXIT
cp -p "$current_env_file" "$temporary_previous"
chmod 600 "$temporary_previous" "$target_env_file"

mv -f "$temporary_previous" "$previous_env_file"
mv -f "$target_env_file" "$current_env_file"
trap - EXIT

echo "Promoted verified production environment: $current_env_file"
echo "Protected rollback environment: $previous_env_file"
