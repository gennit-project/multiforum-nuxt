#!/usr/bin/env bash

set -euo pipefail

backup_root=""
max_age_hours="36"
offsite_max_age_hours=""
restic_tag=""
json_output=false
now_epoch="${MULTIFORUM_BACKUP_HEALTH_NOW_EPOCH:-$(date -u +%s)}"

usage() {
  cat <<'EOF'
Usage: scripts/check-self-hosting-backups.sh --backup-root PATH
       [--max-age-hours HOURS] [--restic-tag TAG]
       [--offsite-max-age-hours HOURS] [--json]

Checks the newest complete local backup's age and SHA-256 integrity. When a
Restic tag is supplied, also requires a recent encrypted off-site snapshot.
Exits nonzero for missing, stale, corrupt, or unreachable backup protection.
EOF
}

emit_failure() {
  local component="$1"
  local message="$2"

  if [[ "$json_output" == true ]]; then
    jq --null-input --compact-output \
      --arg checkedAt "$checked_at" \
      --arg component "$component" \
      --arg message "$message" \
      '{status: "critical", checkedAt: $checkedAt, component: $component, message: $message}'
  else
    echo "CRITICAL [$component] $message" >&2
  fi
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    emit_failure "configuration" "Required command not found: $1"
  fi
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    emit_failure "configuration" "Required command not found: sha256sum or shasum"
  fi
}

timestamp_to_epoch() {
  local timestamp="$1"

  if [[ "$timestamp" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2})\.[0-9]+Z$ ]]; then
    timestamp="${BASH_REMATCH[1]}Z"
  fi

  if date -u -d "$timestamp" +%s >/dev/null 2>&1; then
    date -u -d "$timestamp" +%s
  elif date -j -u -f '%Y-%m-%dT%H:%M:%SZ' "$timestamp" +%s >/dev/null 2>&1; then
    date -j -u -f '%Y-%m-%dT%H:%M:%SZ' "$timestamp" +%s
  else
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
    --max-age-hours)
      if [[ -z "${2:-}" ]]; then
        echo "--max-age-hours requires a positive integer." >&2
        usage >&2
        exit 2
      fi
      max_age_hours="$2"
      shift 2
      ;;
    --restic-tag)
      if [[ -z "${2:-}" ]]; then
        echo "--restic-tag requires a value." >&2
        usage >&2
        exit 2
      fi
      restic_tag="$2"
      shift 2
      ;;
    --offsite-max-age-hours)
      if [[ -z "${2:-}" ]]; then
        echo "--offsite-max-age-hours requires a positive integer." >&2
        usage >&2
        exit 2
      fi
      offsite_max_age_hours="$2"
      shift 2
      ;;
    --json)
      json_output=true
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

if [[ ! "$now_epoch" =~ ^[0-9]+$ ]]; then
  echo "MULTIFORUM_BACKUP_HEALTH_NOW_EPOCH must be a Unix timestamp." >&2
  exit 2
fi
checked_at="$(date -u -r "$now_epoch" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null ||
  date -u -d "@$now_epoch" +%Y-%m-%dT%H:%M:%SZ)"

if ! command -v jq >/dev/null 2>&1; then
  echo "Required command not found: jq" >&2
  exit 1
fi
require_command awk

if [[ -z "$backup_root" || ! -d "$backup_root" ]]; then
  emit_failure "local" "Backup root not found: ${backup_root:-<not provided>}"
fi
if [[ ! "$max_age_hours" =~ ^[1-9][0-9]*$ ]]; then
  echo "--max-age-hours must be a positive integer." >&2
  exit 2
fi
if [[ -z "$offsite_max_age_hours" ]]; then
  offsite_max_age_hours="$max_age_hours"
elif [[ ! "$offsite_max_age_hours" =~ ^[1-9][0-9]*$ ]]; then
  echo "--offsite-max-age-hours must be a positive integer." >&2
  exit 2
fi
if [[ -n "$restic_tag" &&
  ! "$restic_tag" =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$ ]]; then
  echo "--restic-tag must contain 1-64 letters, numbers, dots, underscores, or hyphens." >&2
  exit 2
fi

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
  emit_failure "local" "No complete Multiforum backup bundle found in: $backup_root"
fi

manifest_path="$latest_backup/manifest.json"
if ! jq --exit-status '
  .formatVersion == 1 and
  (.createdAt | type == "string") and
  (.archives["neo4j-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$")) and
  (.archives["frontend-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$"))
' "$manifest_path" >/dev/null; then
  emit_failure "local" "Backup manifest is invalid: $manifest_path"
fi

local_created_at="$(jq --raw-output '.createdAt' "$manifest_path")"
if ! local_created_epoch="$(timestamp_to_epoch "$local_created_at")"; then
  emit_failure "local" "Backup manifest has an invalid createdAt timestamp."
fi
local_age_seconds=$((now_epoch - local_created_epoch))
local_max_age_seconds=$((max_age_hours * 3600))
if ((local_age_seconds < -300)); then
  emit_failure "local" "Newest backup timestamp is more than five minutes in the future."
fi
if ((local_age_seconds > local_max_age_seconds)); then
  emit_failure "local" "Newest backup is older than $max_age_hours hours."
fi

for archive_name in neo4j-data.tar.gz frontend-data.tar.gz; do
  expected_sha256="$(jq --raw-output --arg archive "$archive_name" \
    '.archives[$archive].sha256' "$manifest_path")"
  actual_sha256="$(sha256_file "$latest_backup/$archive_name")"
  if [[ "$actual_sha256" != "$expected_sha256" ]]; then
    emit_failure "local" "Backup checksum mismatch: $archive_name"
  fi
done

offsite_json="null"
if [[ -n "$restic_tag" ]]; then
  require_command restic
  if ! snapshots_json="$(restic snapshots --json --tag "$restic_tag" 2>/dev/null)"; then
    emit_failure "offsite" "Restic repository is unreachable or unavailable."
  fi
  if ! latest_snapshot="$(jq --compact-output --exit-status '
    if type == "array" then
      map(select((.id | type) == "string" and (.time | type) == "string")) |
      if length > 0 then max_by(.time) else empty end
    else empty end
  ' \
    <<<"$snapshots_json")"; then
    emit_failure "offsite" "No Restic snapshot found for tag: $restic_tag"
  fi
  offsite_created_at="$(jq --raw-output '.time' <<<"$latest_snapshot")"
  offsite_snapshot_id="$(jq --raw-output '.id' <<<"$latest_snapshot")"
  if ! offsite_created_epoch="$(timestamp_to_epoch "$offsite_created_at")"; then
    emit_failure "offsite" "Restic snapshot has an invalid timestamp."
  fi
  offsite_age_seconds=$((now_epoch - offsite_created_epoch))
  offsite_max_age_seconds=$((offsite_max_age_hours * 3600))
  if ((offsite_age_seconds < -300)); then
    emit_failure "offsite" "Newest Restic snapshot is more than five minutes in the future."
  fi
  if ((offsite_age_seconds > offsite_max_age_seconds)); then
    emit_failure "offsite" "Newest Restic snapshot is older than $offsite_max_age_hours hours."
  fi
  offsite_json="$(jq --null-input --compact-output \
    --arg status "ok" \
    --arg tag "$restic_tag" \
    --arg snapshotId "$offsite_snapshot_id" \
    --arg createdAt "$offsite_created_at" \
    --argjson ageSeconds "$offsite_age_seconds" \
    --argjson maxAgeSeconds "$offsite_max_age_seconds" \
    '{status: $status, tag: $tag, snapshotId: $snapshotId, createdAt: $createdAt,
      ageSeconds: $ageSeconds, maxAgeSeconds: $maxAgeSeconds}')"
fi

if [[ "$json_output" == true ]]; then
  jq --null-input --compact-output \
    --arg status "ok" \
    --arg checkedAt "$checked_at" \
    --arg path "$latest_backup" \
    --arg createdAt "$local_created_at" \
    --argjson ageSeconds "$local_age_seconds" \
    --argjson maxAgeSeconds "$local_max_age_seconds" \
    --argjson offsite "$offsite_json" \
    '{status: $status, checkedAt: $checkedAt,
      local: {status: "ok", integrity: "verified", path: $path,
        createdAt: $createdAt, ageSeconds: $ageSeconds,
        maxAgeSeconds: $maxAgeSeconds}, offsite: $offsite}'
else
  echo "OK [local] verified backup: $latest_backup ($local_age_seconds seconds old)"
  if [[ -n "$restic_tag" ]]; then
    echo "OK [offsite] Restic snapshot $offsite_snapshot_id for $restic_tag ($offsite_age_seconds seconds old)"
  fi
fi
