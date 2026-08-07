#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
check_script="$repository_root/scripts/check-self-hosting-backups.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_BACKUP_HEALTH_NOW_EPOCH=1767229200
export MULTIFORUM_FAKE_RESTIC_LOG="$test_root/restic.log"

: >"$MULTIFORUM_FAKE_RESTIC_LOG"
mkdir -p "$test_root/backups"

create_bundle() {
  local timestamp="$1"
  local created_at="$2"
  local bundle="$test_root/backups/multiforum-backup-$timestamp"
  local neo4j_sha256
  local frontend_sha256

  mkdir -p "$bundle"
  printf 'neo4j:%s\n' "$timestamp" >"$bundle/neo4j-data.tar.gz"
  printf 'frontend:%s\n' "$timestamp" >"$bundle/frontend-data.tar.gz"
  if command -v sha256sum >/dev/null 2>&1; then
    neo4j_sha256="$(sha256sum "$bundle/neo4j-data.tar.gz" | awk '{print $1}')"
    frontend_sha256="$(sha256sum "$bundle/frontend-data.tar.gz" | awk '{print $1}')"
  else
    neo4j_sha256="$(shasum -a 256 "$bundle/neo4j-data.tar.gz" | awk '{print $1}')"
    frontend_sha256="$(shasum -a 256 "$bundle/frontend-data.tar.gz" | awk '{print $1}')"
  fi
  jq --null-input \
    --arg createdAt "$created_at" \
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

"$check_script" --help | grep --fixed-strings -- "--offsite-max-age-hours HOURS" >/dev/null

if "$check_script" --unknown >/dev/null 2>&1; then
  echo "Expected backup health to reject an unknown argument." >&2
  exit 1
fi

if "$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 0 >/dev/null 2>&1; then
  echo "Expected backup health to reject a zero freshness window." >&2
  exit 1
fi

missing_json="$test_root/missing.json"
if "$check_script" --backup-root "$test_root/missing" --json >"$missing_json"; then
  echo "Expected a missing backup root to fail health checks." >&2
  exit 1
fi
jq --exit-status '
  .status == "critical" and .component == "local" and
  (.message | contains("Backup root not found"))
' "$missing_json" >/dev/null

if "$check_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected an empty backup root to fail health checks." >&2
  exit 1
fi

create_bundle 20260101T000000Z 2026-01-01T00:00:00Z
create_bundle zzzzzzzzTzzzzzzZ 2026-01-01T01:00:00Z

if "$check_script" --backup-root "$test_root/backups" \
  --restic-tag 'invalid tag' >/dev/null 2>&1; then
  echo "Expected backup health to reject an unsafe Restic tag." >&2
  exit 1
fi
if "$check_script" --backup-root "$test_root/backups" \
  --restic-tag multiforum-test --offsite-max-age-hours 0 >/dev/null 2>&1; then
  echo "Expected backup health to reject a zero off-site freshness window." >&2
  exit 1
fi

valid_manifest="$test_root/backups/multiforum-backup-20260101T000000Z/manifest.json"
cp "$valid_manifest" "$test_root/valid-manifest.json"
printf '%s\n' '{}' >"$valid_manifest"
if "$check_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected an invalid manifest to fail health checks." >&2
  exit 1
fi
cp "$test_root/valid-manifest.json" "$valid_manifest"

create_bundle 20260101T000000Z not-a-timestamp
if "$check_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected an invalid local timestamp to fail health checks." >&2
  exit 1
fi
create_bundle 20260101T000000Z 2026-01-01T02:00:00Z
if "$check_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected a future local timestamp to fail health checks." >&2
  exit 1
fi
create_bundle 20260101T000000Z 2026-01-01T00:00:00Z

human_output="$("$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 2)"
grep --fixed-strings 'OK [local] verified backup:' <<<"$human_output" >/dev/null
grep --fixed-strings 'multiforum-backup-20260101T000000Z' <<<"$human_output" >/dev/null

local_json="$("$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 2 --json)"
jq --exit-status '
  .status == "ok" and .local.status == "ok" and
  .local.integrity == "verified" and .local.ageSeconds == 3600 and
  .local.maxAgeSeconds == 7200 and .offsite == null
' <<<"$local_json" >/dev/null

if MULTIFORUM_BACKUP_HEALTH_NOW_EPOCH=1767240001 \
  "$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 4 --json >"$test_root/stale-local.json"; then
  echo "Expected a stale local backup to fail health checks." >&2
  exit 1
fi
jq --exit-status '
  .status == "critical" and .component == "local" and
  (.message | contains("older than 4 hours"))
' "$test_root/stale-local.json" >/dev/null

printf 'tampered\n' >>"$test_root/backups/multiforum-backup-20260101T000000Z/neo4j-data.tar.gz"
if "$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 2 >/dev/null 2>&1; then
  echo "Expected a corrupt local backup to fail health checks." >&2
  exit 1
fi
rm -rf -- "$test_root/backups/multiforum-backup-20260101T000000Z"
create_bundle 20260101T000000Z 2026-01-01T00:00:00Z

: >"$MULTIFORUM_FAKE_RESTIC_LOG"
offsite_json="$("$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 2 --restic-tag multiforum-test \
  --offsite-max-age-hours 1 --json)"
jq --exit-status '
  .status == "ok" and .offsite.status == "ok" and
  .offsite.tag == "multiforum-test" and
  .offsite.snapshotId == "snapshot-test" and
  .offsite.ageSeconds == 1800 and .offsite.maxAgeSeconds == 3600
' <<<"$offsite_json" >/dev/null
grep --fixed-strings 'snapshots --json --tag multiforum-test' \
  "$MULTIFORUM_FAKE_RESTIC_LOG" >/dev/null

offsite_human="$("$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 2 --restic-tag multiforum-test \
  --offsite-max-age-hours 1)"
grep --fixed-strings 'OK [offsite] Restic snapshot snapshot-test' \
  <<<"$offsite_human" >/dev/null

if MULTIFORUM_FAKE_RESTIC_SNAPSHOTS_JSON='[]' \
  "$check_script" --backup-root "$test_root/backups" \
  --restic-tag multiforum-test --json >"$test_root/no-snapshot.json"; then
  echo "Expected a missing Restic snapshot to fail health checks." >&2
  exit 1
fi
jq --exit-status '
  .status == "critical" and .component == "offsite" and
  (.message | contains("No Restic snapshot"))
' "$test_root/no-snapshot.json" >/dev/null

if MULTIFORUM_FAKE_RESTIC_SNAPSHOTS_JSON='[{"id":"old","time":"2025-12-31T00:00:00Z"}]' \
  "$check_script" --backup-root "$test_root/backups" \
  --max-age-hours 2 --restic-tag multiforum-test \
  --offsite-max-age-hours 24 --json >"$test_root/stale-offsite.json"; then
  echo "Expected a stale Restic snapshot to fail health checks." >&2
  exit 1
fi
jq --exit-status '
  .status == "critical" and .component == "offsite" and
  (.message | contains("older than 24 hours"))
' "$test_root/stale-offsite.json" >/dev/null

if MULTIFORUM_FAKE_RESTIC_SNAPSHOTS_JSON='[{"id":"future","time":"2026-01-01T02:00:00Z"}]' \
  "$check_script" --backup-root "$test_root/backups" \
  --restic-tag multiforum-test --json >"$test_root/future-offsite.json"; then
  echo "Expected a future Restic snapshot to fail health checks." >&2
  exit 1
fi
jq --exit-status '
  .status == "critical" and .component == "offsite" and
  (.message | contains("future"))
' "$test_root/future-offsite.json" >/dev/null

if MULTIFORUM_FAKE_RESTIC_FAIL_SNAPSHOTS=true \
  "$check_script" --backup-root "$test_root/backups" \
  --restic-tag multiforum-test --json >"$test_root/unreachable.json"; then
  echo "Expected an unreachable Restic repository to fail health checks." >&2
  exit 1
fi
jq --exit-status '
  .status == "critical" and .component == "offsite" and
  (.message | contains("unreachable"))
' "$test_root/unreachable.json" >/dev/null

echo "Backup-health monitoring tests passed."
