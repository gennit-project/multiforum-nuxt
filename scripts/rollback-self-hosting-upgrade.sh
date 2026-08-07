#!/usr/bin/env bash

set -euo pipefail

current_env_file=".env.production"
rollback_env_file=".env.production.previous"
failed_env_file=".env.production.failed"
backup_root=""
base_url=""
rollback_confirmed=false
replace_failed=false
allow_database_image_change=false
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/rollback-self-hosting-upgrade.sh --backup-output-dir PATH
       [--current-env-file PATH] [--rollback-env-file PATH]
       [--failed-env-file PATH] [--base-url URL]
       --confirm-rollback [--replace-failed]
       [--allow-database-image-change]

Safely redeploys a preserved production environment, creates a fresh cold
backup first, verifies the rollback stack, makes it authoritative, and retains
the failed release environment for diagnosis. Review migration compatibility
before rolling application or database images backward.
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
    --rollback-env-file)
      require_value "$1" "${2:-}"
      rollback_env_file="$2"
      shift 2
      ;;
    --failed-env-file)
      require_value "$1" "${2:-}"
      failed_env_file="$2"
      shift 2
      ;;
    --backup-output-dir)
      require_value "$1" "${2:-}"
      backup_root="$2"
      shift 2
      ;;
    --base-url)
      require_value "$1" "${2:-}"
      base_url="$2"
      shift 2
      ;;
    --confirm-rollback)
      rollback_confirmed=true
      shift
      ;;
    --replace-failed)
      replace_failed=true
      shift
      ;;
    --allow-database-image-change)
      allow_database_image_change=true
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

if [[ "$rollback_confirmed" != true ]]; then
  echo "Refusing to roll back without --confirm-rollback." >&2
  exit 2
fi
if [[ -z "$backup_root" ]]; then
  echo "--backup-output-dir is required." >&2
  exit 2
fi

for env_file in "$current_env_file" "$rollback_env_file"; do
  if [[ ! -f "$env_file" ]]; then
    echo "Production environment file not found: $env_file" >&2
    exit 1
  fi
  if [[ -L "$env_file" ]]; then
    echo "Production environment files must not be symbolic links: $env_file" >&2
    exit 1
  fi
done

if [[ -d "$failed_env_file" ]]; then
  echo "Failed environment path is a directory: $failed_env_file" >&2
  exit 1
fi
if [[ -L "$failed_env_file" ]]; then
  echo "Failed environment path must not be a symbolic link: $failed_env_file" >&2
  exit 1
fi

current_env_file="$(absolute_file_path "$current_env_file")"
rollback_env_file="$(absolute_file_path "$rollback_env_file")"
failed_dir="$(dirname -- "$failed_env_file")"
if [[ ! -d "$failed_dir" ]]; then
  echo "Failed environment directory not found: $failed_dir" >&2
  exit 1
fi
failed_dir="$(cd -- "$failed_dir" && pwd)"
failed_env_file="$failed_dir/$(basename -- "$failed_env_file")"

if [[ "$(dirname -- "$current_env_file")" != "$(dirname -- "$rollback_env_file")" ]]; then
  echo "Active and rollback environment files must share a directory for atomic promotion." >&2
  exit 1
fi
if [[ "$current_env_file" == "$rollback_env_file" || "$current_env_file" -ef "$rollback_env_file" ]]; then
  echo "Active and rollback environment files must be different." >&2
  exit 1
fi
if [[ "$failed_env_file" == "$current_env_file" || "$failed_env_file" == "$rollback_env_file" ]]; then
  echo "Failed environment file must be distinct from active and rollback files." >&2
  exit 1
fi
if [[ -e "$failed_env_file" &&
  ("$failed_env_file" -ef "$current_env_file" || "$failed_env_file" -ef "$rollback_env_file") ]]; then
  echo "Failed environment file must not alias active or rollback files." >&2
  exit 1
fi
if [[ -e "$failed_env_file" && "$replace_failed" != true ]]; then
  echo "Failed environment file already exists: $failed_env_file" >&2
  echo "Pass --replace-failed only after preserving or retiring it." >&2
  exit 1
fi

upgrade_command=(
  "$script_root/scripts/upgrade-self-hosting.sh"
  --current-env-file "$current_env_file"
  --target-env-file "$rollback_env_file"
  --backup-output-dir "$backup_root"
  --confirm-upgrade
)
if [[ "$allow_database_image_change" == true ]]; then
  upgrade_command+=(--allow-database-image-change)
fi

echo "Redeploying the preserved rollback environment..."
"${upgrade_command[@]}"

promotion_command=(
  "$script_root/scripts/promote-self-hosting-upgrade.sh"
  --current-env-file "$current_env_file"
  --target-env-file "$rollback_env_file"
  --previous-env-file "$failed_env_file"
  --confirm-promotion
)
if [[ -n "$base_url" ]]; then
  promotion_command+=(--base-url "$base_url")
fi
if [[ "$replace_failed" == true ]]; then
  promotion_command+=(--replace-previous)
fi

if ! "${promotion_command[@]}"; then
  echo "Rollback services were recreated, but verification or promotion failed." >&2
  echo "The environment files were not rotated. Resolve the failure, then run" >&2
  echo "scripts/promote-self-hosting-upgrade.sh with the rollback file as the target." >&2
  exit 1
fi

echo "Rollback completed and the failed release environment was preserved: $failed_env_file"
