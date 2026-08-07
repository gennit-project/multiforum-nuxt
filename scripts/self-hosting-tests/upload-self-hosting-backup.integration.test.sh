#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
upload_script="$repository_root/scripts/upload-self-hosting-backup.sh"
health_script="$repository_root/scripts/check-self-hosting-backups.sh"

trap 'rm -rf "$test_root"' EXIT

export RESTIC_REPOSITORY="$test_root/restic-repository"
export RESTIC_PASSWORD_FILE="$test_root/restic-password"
export RESTIC_CACHE_DIR="$test_root/restic-cache"

printf 'contract-only-restic-password\n' >"$RESTIC_PASSWORD_FILE"
mkdir -p "$test_root/backups"

create_bundle() {
  local timestamp="$1"
  local bundle="$test_root/backups/multiforum-backup-$timestamp"
  local neo4j_sha256
  local frontend_sha256

  mkdir -p "$bundle"
  printf 'neo4j:%s\n' "$timestamp" >"$bundle/neo4j-data.tar.gz"
  printf 'frontend:%s\n' "$timestamp" >"$bundle/frontend-data.tar.gz"
  neo4j_sha256="$(sha256sum "$bundle/neo4j-data.tar.gz" | awk '{print $1}')"
  frontend_sha256="$(sha256sum "$bundle/frontend-data.tar.gz" | awk '{print $1}')"
  jq --null-input \
    --arg createdAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg neo4jSha256 "$neo4j_sha256" \
    --arg frontendSha256 "$frontend_sha256" \
    '{
      formatVersion: 1,
      createdAt: $createdAt,
      archives: {
        "neo4j-data.tar.gz": {sha256: $neo4jSha256},
        "frontend-data.tar.gz": {sha256: $frontendSha256}
      }
    }' >"$bundle/manifest.json"
}

restic init >/dev/null

create_bundle 20260101T000000Z
"$upload_script" --backup-root "$test_root/backups" \
  --keep-daily 1 --tag multiforum-contract >/dev/null

create_bundle 20260201T000000Z
"$upload_script" --backup-root "$test_root/backups" \
  --keep-daily 1 --tag multiforum-contract >/dev/null

snapshot_json="$(restic snapshots --json --tag multiforum-contract)"
if ! jq --exit-status '
  length == 1 and
  (.[0].paths[0] | endswith("multiforum-backup-20260201T000000Z"))
' <<<"$snapshot_json" >/dev/null; then
  echo "Expected Restic to retain only the newest daily snapshot." >&2
  exit 1
fi

health_json="$("$health_script" --backup-root "$test_root/backups" \
  --max-age-hours 1 --restic-tag multiforum-contract \
  --offsite-max-age-hours 1 --json)"
if ! jq --exit-status '
  .status == "ok" and .local.integrity == "verified" and
  .offsite.status == "ok" and .offsite.tag == "multiforum-contract"
' <<<"$health_json" >/dev/null; then
  echo "Expected real local and Restic backup health checks to pass." >&2
  exit 1
fi

restic check >/dev/null
restore_root="$test_root/restore"
restic restore latest --tag multiforum-contract --target "$restore_root" >/dev/null
restored_manifest="$(find "$restore_root" -name manifest.json -print -quit)"
if [[ -z "$restored_manifest" ||
  "$restored_manifest" != *"multiforum-backup-20260201T000000Z/manifest.json" ]]; then
  echo "Expected the newest encrypted snapshot to restore successfully." >&2
  exit 1
fi

echo "Real Restic upload and restore integration test passed."
