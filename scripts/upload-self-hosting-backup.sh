#!/usr/bin/env bash

set -euo pipefail

backup_root=""
keep_daily="30"
snapshot_tag="multiforum-production"

usage() {
  cat <<'EOF'
Usage: scripts/upload-self-hosting-backup.sh --backup-root PATH
       [--keep-daily COUNT] [--tag TAG]

Verifies and uploads the newest complete Multiforum backup bundle to an
initialized Restic repository, then applies encrypted remote snapshot
retention. Configure Restic with its standard RESTIC_* environment variables.
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
    --backup-root)
      if [[ -z "${2:-}" ]]; then
        echo "--backup-root requires a path." >&2
        usage >&2
        exit 2
      fi
      backup_root="$2"
      shift 2
      ;;
    --keep-daily)
      if [[ -z "${2:-}" ]]; then
        echo "--keep-daily requires a positive integer." >&2
        usage >&2
        exit 2
      fi
      keep_daily="$2"
      shift 2
      ;;
    --tag)
      if [[ -z "${2:-}" ]]; then
        echo "--tag requires a value." >&2
        usage >&2
        exit 2
      fi
      snapshot_tag="$2"
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

if [[ -z "$backup_root" || ! -d "$backup_root" ]]; then
  echo "Backup root not found: ${backup_root:-<not provided>}" >&2
  exit 1
fi
if [[ ! "$keep_daily" =~ ^[1-9][0-9]*$ ]]; then
  echo "--keep-daily must be a positive integer." >&2
  exit 2
fi
if [[ ! "$snapshot_tag" =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$ ]]; then
  echo "--tag must contain 1-64 letters, numbers, dots, underscores, or hyphens." >&2
  exit 2
fi
if [[ -z "${RESTIC_REPOSITORY:-}" && -z "${RESTIC_REPOSITORY_FILE:-}" ]]; then
  echo "Set RESTIC_REPOSITORY or RESTIC_REPOSITORY_FILE." >&2
  exit 1
fi
if [[ -z "${RESTIC_PASSWORD:-}" && -z "${RESTIC_PASSWORD_FILE:-}" &&
  -z "${RESTIC_PASSWORD_COMMAND:-}" ]]; then
  echo "Set RESTIC_PASSWORD, RESTIC_PASSWORD_FILE, or RESTIC_PASSWORD_COMMAND." >&2
  exit 1
fi

require_command restic
require_command jq
require_command awk

backup_root="$(cd -- "$backup_root" && pwd)"
latest_backup=""
while IFS= read -r candidate; do
  candidate_name="${candidate##*/}"
  if [[ "$candidate_name" =~ ^multiforum-backup-[0-9]{8}T[0-9]{6}Z$ &&
    -f "$candidate/manifest.json" &&
    -f "$candidate/neo4j-data.tar.gz" &&
    -f "$candidate/frontend-data.tar.gz" ]]; then
    latest_backup="$candidate"
    break
  fi
done < <(find "$backup_root" -mindepth 1 -maxdepth 1 -type d \
  -name 'multiforum-backup-????????T??????Z' -print | LC_ALL=C sort -r)

if [[ -z "$latest_backup" ]]; then
  echo "No complete Multiforum backup bundle found in: $backup_root" >&2
  exit 1
fi

manifest_path="$latest_backup/manifest.json"
if ! jq --exit-status '
  .formatVersion == 1 and
  (.createdAt | type == "string") and
  (.archives["neo4j-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$")) and
  (.archives["frontend-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$"))
' "$manifest_path" >/dev/null; then
  echo "Backup manifest is invalid: $manifest_path" >&2
  exit 1
fi

for archive_name in neo4j-data.tar.gz frontend-data.tar.gz; do
  expected_sha256="$(jq --raw-output --arg archive "$archive_name" \
    '.archives[$archive].sha256' "$manifest_path")"
  actual_sha256="$(sha256_file "$latest_backup/$archive_name")"
  if [[ "$actual_sha256" != "$expected_sha256" ]]; then
    echo "Backup checksum mismatch: $archive_name" >&2
    exit 1
  fi
done

echo "Uploading verified backup bundle: $latest_backup"
restic backup --tag "$snapshot_tag" -- "$latest_backup"

echo "Applying encrypted remote retention: keep $keep_daily daily snapshots"
restic forget \
  --tag "$snapshot_tag" \
  --group-by tags \
  --keep-daily "$keep_daily" \
  --prune

echo "Off-site backup completed: $snapshot_tag"
