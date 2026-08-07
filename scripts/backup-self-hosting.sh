#!/usr/bin/env bash

set -euo pipefail

backup_root=""
env_file=".env.production"
backup_helper_image="${MULTIFORUM_BACKUP_HELPER_IMAGE:-busybox:1.36.1}"
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/backup-self-hosting.sh --output-dir PATH [--env-file PATH]

Creates a consistent cold backup of the production Neo4j and frontend-session
volumes. The frontend, backend, and database must already be running.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    echo "Required command not found: sha256sum or shasum" >&2
    return 1
  fi
}

while (($# > 0)); do
  case "$1" in
    --env-file)
      if [[ -z "${2:-}" ]]; then
        echo "--env-file requires a path." >&2
        usage >&2
        exit 2
      fi
      env_file="$2"
      shift 2
      ;;
    --output-dir)
      if [[ -z "${2:-}" ]]; then
        echo "--output-dir requires a path." >&2
        usage >&2
        exit 2
      fi
      backup_root="$2"
      shift 2
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

if [[ -z "$backup_root" ]]; then
  echo "--output-dir is required." >&2
  usage >&2
  exit 2
fi

if [[ ! -f "$env_file" ]]; then
  echo "Production environment file not found: $env_file" >&2
  exit 1
fi

require_command docker
require_command jq
require_command awk

mkdir -p "$backup_root"
backup_root="$(cd -- "$backup_root" && pwd)"
env_file="$(cd -- "$(dirname -- "$env_file")" && pwd)/$(basename -- "$env_file")"

compose=(
  docker compose
  --env-file "$env_file"
  --file "$script_root/docker-compose.yml"
  --file "$script_root/docker-compose.production.yml"
)

compose_config="$("${compose[@]}" config --format json)"
neo4j_volume="$(jq --raw-output '.volumes["neo4j-data"].name // empty' <<<"$compose_config")"
frontend_volume="$(jq --raw-output '.volumes["frontend-data"].name // empty' <<<"$compose_config")"

if [[ -z "$neo4j_volume" || -z "$frontend_volume" ]]; then
  echo "Production Compose did not resolve the expected persistent volumes." >&2
  exit 1
fi

running_services="$("${compose[@]}" ps --status running --services)"
for required_service in database backend frontend; do
  if ! grep --fixed-strings --line-regexp "$required_service" <<<"$running_services" >/dev/null; then
    echo "Production service is not running: $required_service" >&2
    exit 1
  fi
done

backup_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
final_dir="$backup_root/multiforum-backup-$backup_timestamp"

if [[ -e "$final_dir" ]]; then
  echo "Backup destination already exists: $final_dir" >&2
  exit 1
fi

working_dir="$(mktemp -d "$backup_root/.multiforum-backup.XXXXXX")"
services_stopped=false
backup_complete=false

cleanup() {
  local status=$?
  trap - EXIT

  if [[ "$services_stopped" == true ]]; then
    echo "Restarting the production services..."
    if ! "${compose[@]}" up -d database backend frontend; then
      echo "Failed to restart one or more production services." >&2
      if ((status == 0)); then
        status=1
      fi
    fi
  fi

  if [[ "$backup_complete" != true && -d "$working_dir" ]]; then
    rm -rf -- "$working_dir"
  fi

  exit "$status"
}

trap cleanup EXIT
trap 'exit 130' INT TERM

archive_volume() {
  local volume_name="$1"
  local destination="$2"

  docker run --rm \
    --volume "$volume_name:/source:ro" \
    "$backup_helper_image" \
    tar -czf - -C /source . >"$destination"
}

echo "Stopping application writes for a consistent cold backup..."
services_stopped=true
"${compose[@]}" stop frontend backend
"${compose[@]}" stop database

echo "Archiving Neo4j data..."
archive_volume "$neo4j_volume" "$working_dir/neo4j-data.tar.gz"

echo "Archiving frontend sessions..."
archive_volume "$frontend_volume" "$working_dir/frontend-data.tar.gz"

neo4j_sha256="$(sha256_file "$working_dir/neo4j-data.tar.gz")"
frontend_sha256="$(sha256_file "$working_dir/frontend-data.tar.gz")"

jq --null-input \
  --arg createdAt "$created_at" \
  --arg databaseImage "$(jq --raw-output '.services.database.image' <<<"$compose_config")" \
  --arg backendImage "$(jq --raw-output '.services.backend.image' <<<"$compose_config")" \
  --arg frontendImage "$(jq --raw-output '.services.frontend.image' <<<"$compose_config")" \
  --arg neo4jSha256 "$neo4j_sha256" \
  --arg frontendSha256 "$frontend_sha256" \
  '{
    formatVersion: 1,
    createdAt: $createdAt,
    images: {
      database: $databaseImage,
      backend: $backendImage,
      frontend: $frontendImage
    },
    archives: {
      "neo4j-data.tar.gz": {sha256: $neo4jSha256},
      "frontend-data.tar.gz": {sha256: $frontendSha256}
    }
  }' >"$working_dir/manifest.json"

mv -- "$working_dir" "$final_dir"
backup_complete=true

echo "Backup created: $final_dir"
echo "Encrypt and copy this bundle off the host before relying on it."
