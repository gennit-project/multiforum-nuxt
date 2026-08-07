#!/usr/bin/env bash

set -euo pipefail

backup_dir=""
env_file=".env.production"
restore_confirmed=false
allow_database_image_mismatch=false
restore_helper_image="${MULTIFORUM_BACKUP_HELPER_IMAGE:-busybox:1.36.1}"
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/restore-self-hosting.sh --backup-dir PATH [--env-file PATH]
       --confirm-replace-existing-data [--allow-database-image-mismatch]

Replaces the production Neo4j and frontend-session volumes with a verified
cold-backup bundle. The frontend, backend, and database must already be stopped.
Successful restores leave them stopped for operator verification.
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

verify_archive() {
  local archive_name="$1"
  local archive_path="$backup_dir/$archive_name"
  local expected_sha256
  local actual_sha256
  local archive_listing

  if [[ ! -f "$archive_path" ]]; then
    echo "Backup archive not found: $archive_path" >&2
    return 1
  fi

  expected_sha256="$(jq --raw-output --arg archive "$archive_name" \
    '.archives[$archive].sha256' "$manifest_path")"
  actual_sha256="$(sha256_file "$archive_path")"

  if [[ "$actual_sha256" != "$expected_sha256" ]]; then
    echo "Backup checksum mismatch: $archive_name" >&2
    return 1
  fi

  archive_listing="$(tar -tzf "$archive_path")"
  if grep --extended-regexp '(^/|(^|/)\.\.(/|$))' <<<"$archive_listing" >/dev/null; then
    echo "Backup archive contains an unsafe path: $archive_name" >&2
    return 1
  fi
}

while (($# > 0)); do
  case "$1" in
    --backup-dir)
      if [[ -z "${2:-}" ]]; then
        echo "--backup-dir requires a path." >&2
        usage >&2
        exit 2
      fi
      backup_dir="$2"
      shift 2
      ;;
    --env-file)
      if [[ -z "${2:-}" ]]; then
        echo "--env-file requires a path." >&2
        usage >&2
        exit 2
      fi
      env_file="$2"
      shift 2
      ;;
    --confirm-replace-existing-data)
      restore_confirmed=true
      shift
      ;;
    --allow-database-image-mismatch)
      allow_database_image_mismatch=true
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

if [[ "$restore_confirmed" != true ]]; then
  echo "Refusing to replace data without --confirm-replace-existing-data." >&2
  exit 2
fi

if [[ -z "$backup_dir" || ! -d "$backup_dir" ]]; then
  echo "Backup directory not found: ${backup_dir:-<not provided>}" >&2
  exit 1
fi

if [[ ! -f "$env_file" ]]; then
  echo "Production environment file not found: $env_file" >&2
  exit 1
fi

require_command docker
require_command jq
require_command awk
require_command grep
require_command tar

backup_dir="$(cd -- "$backup_dir" && pwd)"
env_file="$(cd -- "$(dirname -- "$env_file")" && pwd)/$(basename -- "$env_file")"
manifest_path="$backup_dir/manifest.json"

if [[ ! -f "$manifest_path" ]]; then
  echo "Backup manifest not found: $manifest_path" >&2
  exit 1
fi

if ! jq --exit-status '
  .formatVersion == 1 and
  (.images.database | type == "string" and length > 0) and
  (.archives["neo4j-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$")) and
  (.archives["frontend-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$"))
' "$manifest_path" >/dev/null; then
  echo "Backup manifest is invalid or uses an unsupported format." >&2
  exit 1
fi

echo "Verifying backup archives..."
verify_archive "neo4j-data.tar.gz"
verify_archive "frontend-data.tar.gz"

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

active_services="$("${compose[@]}" ps --services)"
for required_service in database backend frontend; do
  if grep --fixed-strings --line-regexp "$required_service" <<<"$active_services" >/dev/null; then
    echo "Refusing to restore while the production service is active: $required_service" >&2
    exit 1
  fi
done

backup_database_image="$(jq --raw-output '.images.database' "$manifest_path")"
current_database_image="$(jq --raw-output '.services.database.image' <<<"$compose_config")"

if [[ "$backup_database_image" != "$current_database_image" && "$allow_database_image_mismatch" != true ]]; then
  echo "Backup database image does not match the configured database image." >&2
  echo "Backup:  $backup_database_image" >&2
  echo "Current: $current_database_image" >&2
  echo "Select the backup image or pass --allow-database-image-mismatch after reviewing Neo4j compatibility." >&2
  exit 1
fi

restore_started=false
restore_complete=false

report_incomplete_restore() {
  local status=$?
  trap - EXIT

  if [[ "$restore_started" == true && "$restore_complete" != true ]]; then
    echo "Restore did not complete. Keep services stopped and rerun the verified restore." >&2
  fi

  exit "$status"
}

trap report_incomplete_restore EXIT

restore_volume() {
  local volume_name="$1"
  local archive_path="$2"

  docker run --rm --interactive \
    --network none \
    --volume "$volume_name:/target" \
    "$restore_helper_image" \
    sh -ec 'find /target -mindepth 1 -maxdepth 1 -exec rm -rf -- {} \; && tar -xzf - -C /target' \
    <"$archive_path"
}

restore_started=true
echo "Replacing Neo4j data in volume: $neo4j_volume"
restore_volume "$neo4j_volume" "$backup_dir/neo4j-data.tar.gz"

echo "Replacing frontend sessions in volume: $frontend_volume"
restore_volume "$frontend_volume" "$backup_dir/frontend-data.tar.gz"
restore_complete=true

echo "Restore completed successfully. The application services remain stopped."
echo "Validate the production configuration, then start database, backend, and frontend."
