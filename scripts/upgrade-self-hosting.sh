#!/usr/bin/env bash

set -euo pipefail

current_env_file=".env.production"
target_env_file=""
backup_root=""
upgrade_confirmed=false
allow_database_image_change=false
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/upgrade-self-hosting.sh --target-env-file PATH
       --backup-output-dir PATH [--current-env-file PATH]
       --confirm-upgrade [--allow-database-image-change]

Pre-pulls a pinned production image set, creates a cold safety backup using the
current environment, and force-recreates the stack with the target environment.
The target file remains separate until the operator verifies and promotes it.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

absolute_file_path() {
  local file_path="$1"
  printf '%s/%s\n' "$(cd -- "$(dirname -- "$file_path")" && pwd)" "$(basename -- "$file_path")"
}

is_pinned_image() {
  local image="$1"
  local image_name
  local tag

  if [[ "$image" =~ @sha256:[a-fA-F0-9]{64}$ ]]; then
    return 0
  fi

  image_name="${image##*/}"
  if [[ "$image_name" != *:* ]]; then
    return 1
  fi

  tag="$(tr '[:upper:]' '[:lower:]' <<<"${image_name##*:}")"
  case "$tag" in
    ""|edge|latest|main|master|nightly|dev|development)
      return 1
      ;;
  esac

  return 0
}

while (($# > 0)); do
  case "$1" in
    --current-env-file)
      if [[ -z "${2:-}" ]]; then
        echo "--current-env-file requires a path." >&2
        usage >&2
        exit 2
      fi
      current_env_file="$2"
      shift 2
      ;;
    --target-env-file)
      if [[ -z "${2:-}" ]]; then
        echo "--target-env-file requires a path." >&2
        usage >&2
        exit 2
      fi
      target_env_file="$2"
      shift 2
      ;;
    --backup-output-dir)
      if [[ -z "${2:-}" ]]; then
        echo "--backup-output-dir requires a path." >&2
        usage >&2
        exit 2
      fi
      backup_root="$2"
      shift 2
      ;;
    --confirm-upgrade)
      upgrade_confirmed=true
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

if [[ "$upgrade_confirmed" != true ]]; then
  echo "Refusing to upgrade without --confirm-upgrade." >&2
  exit 2
fi

if [[ -z "$target_env_file" ]]; then
  echo "--target-env-file is required." >&2
  exit 2
fi

if [[ -z "$backup_root" ]]; then
  echo "--backup-output-dir is required." >&2
  exit 2
fi

for required_file in "$current_env_file" "$target_env_file"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Production environment file not found: $required_file" >&2
    exit 1
  fi
done

require_command docker
require_command jq
require_command grep
require_command tr
require_command env

current_env_file="$(absolute_file_path "$current_env_file")"
target_env_file="$(absolute_file_path "$target_env_file")"

if [[ "$current_env_file" == "$target_env_file" ]]; then
  echo "Current and target environment files must be different." >&2
  echo "A separate current file is required for backup metadata and rollback." >&2
  exit 1
fi

mkdir -p "$backup_root"
backup_root="$(cd -- "$backup_root" && pwd)"

current_compose=(
  docker compose
  --env-file "$current_env_file"
  --file "$script_root/docker-compose.yml"
  --file "$script_root/docker-compose.production.yml"
)
target_compose=(
  docker compose
  --env-file "$target_env_file"
  --file "$script_root/docker-compose.yml"
  --file "$script_root/docker-compose.production.yml"
)

current_config="$("${current_compose[@]}" config --format json)"
target_config="$("${target_compose[@]}" config --format json)"

for service in database backend frontend caddy; do
  target_image="$(jq --raw-output --arg service "$service" '.services[$service].image // empty' <<<"$target_config")"
  if [[ -z "$target_image" ]]; then
    echo "Target Compose did not resolve an image for service: $service" >&2
    exit 1
  fi
  if ! is_pinned_image "$target_image"; then
    echo "Target image must use an explicit non-floating tag or SHA-256 digest: $service ($target_image)" >&2
    exit 1
  fi
done

current_database_image="$(jq --raw-output '.services.database.image' <<<"$current_config")"
target_database_image="$(jq --raw-output '.services.database.image' <<<"$target_config")"

if [[ "$current_database_image" != "$target_database_image" && "$allow_database_image_change" != true ]]; then
  echo "Target configuration changes the Neo4j image." >&2
  echo "Current: $current_database_image" >&2
  echo "Target:  $target_database_image" >&2
  echo "Pass --allow-database-image-change only after reviewing Neo4j's supported upgrade path." >&2
  exit 1
fi

running_services="$("${current_compose[@]}" ps --status running --services)"
for required_service in database backend frontend caddy; do
  if ! grep --fixed-strings --line-regexp "$required_service" <<<"$running_services" >/dev/null; then
    echo "Current production service is not running: $required_service" >&2
    exit 1
  fi
done

echo "Pre-pulling the pinned target images..."
"${target_compose[@]}" pull database backend frontend caddy

echo "Creating a cold safety backup of the current stack..."
"$script_root/scripts/backup-self-hosting.sh" \
  --env-file "$current_env_file" \
  --output-dir "$backup_root"

upgrade_started=false
upgrade_complete=false

report_incomplete_upgrade() {
  local status=$?
  trap - EXIT

  if [[ "$upgrade_started" == true && "$upgrade_complete" != true ]]; then
    echo "Upgrade did not complete. Do not promote the target environment file." >&2
    echo "Use the current environment and the new safety backup to recover." >&2
  fi

  exit "$status"
}

trap report_incomplete_upgrade EXIT

echo "Recreating the production stack with the target image set..."
upgrade_started=true
env \
  MULTIFORUM_BACKEND_PULL_POLICY=never \
  MULTIFORUM_FRONTEND_PULL_POLICY=never \
  "${target_compose[@]}" up -d --force-recreate --wait
upgrade_complete=true

echo "Upgrade completed with target environment: $target_env_file"
echo "Verify the forum before promoting that file as .env.production."
