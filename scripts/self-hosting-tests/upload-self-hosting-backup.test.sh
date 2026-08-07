#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
upload_script="$repository_root/scripts/upload-self-hosting-backup.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_RESTIC_LOG="$test_root/restic.log"
export RESTIC_REPOSITORY="s3:https://storage.example.com/multiforum"
export RESTIC_PASSWORD_FILE="$test_root/restic-password"

: >"$RESTIC_PASSWORD_FILE"
: >"$MULTIFORUM_FAKE_RESTIC_LOG"

create_bundle() {
  local timestamp="$1"
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
    --arg createdAt "2026-01-01T00:00:00Z" \
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

mkdir -p "$test_root/backups"

"$upload_script" --help | grep --fixed-strings -- "--keep-daily COUNT" >/dev/null

if "$upload_script" --unknown >/dev/null 2>&1; then
  echo "Expected upload to reject an unknown argument." >&2
  exit 1
fi

if "$upload_script" --backup-root "$test_root/backups" \
  --keep-daily 0 >/dev/null 2>&1; then
  echo "Expected upload to reject zero remote retention." >&2
  exit 1
fi

if "$upload_script" --backup-root "$test_root/backups" \
  --tag 'invalid tag' >/dev/null 2>&1; then
  echo "Expected upload to reject an unsafe snapshot tag." >&2
  exit 1
fi

if env -u RESTIC_REPOSITORY -u RESTIC_REPOSITORY_FILE \
  "$upload_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected upload to require a Restic repository." >&2
  exit 1
fi

if env -u RESTIC_PASSWORD -u RESTIC_PASSWORD_FILE -u RESTIC_PASSWORD_COMMAND \
  "$upload_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected upload to require a Restic password source." >&2
  exit 1
fi

if "$upload_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected upload to require a complete local bundle." >&2
  exit 1
fi

create_bundle 20260101T000000Z
create_bundle 20260201T000000Z
create_bundle zzzzzzzzTzzzzzzZ
incomplete_bundle="$test_root/backups/multiforum-backup-20260301T000000Z"
mkdir -p "$incomplete_bundle"
: >"$incomplete_bundle/manifest.json"

invalid_bundle="$test_root/backups/multiforum-backup-20260401T000000Z"
mkdir -p "$invalid_bundle"
: >"$invalid_bundle/neo4j-data.tar.gz"
: >"$invalid_bundle/frontend-data.tar.gz"
printf '%s\n' '{}' >"$invalid_bundle/manifest.json"

if "$upload_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected upload to reject an invalid newest manifest." >&2
  exit 1
fi
if [[ -s "$MULTIFORUM_FAKE_RESTIC_LOG" ]]; then
  echo "Manifest verification must happen before remote access." >&2
  exit 1
fi
rm -rf -- "$invalid_bundle"

: >"$MULTIFORUM_FAKE_RESTIC_LOG"
"$upload_script" --backup-root "$test_root/backups" \
  --keep-daily 14 --tag multiforum-forum-example

first_command="$(sed -n '1p' "$MULTIFORUM_FAKE_RESTIC_LOG")"
second_command="$(sed -n '2p' "$MULTIFORUM_FAKE_RESTIC_LOG")"
if [[ "$first_command" != *"backup --tag multiforum-forum-example"* ||
  "$first_command" != *"multiforum-backup-20260201T000000Z"* ]]; then
  echo "Expected Restic to upload the newest complete bundle." >&2
  exit 1
fi
if [[ "$second_command" != \
  "forget --tag multiforum-forum-example --group-by tags --keep-daily 14 --prune" ]]; then
  echo "Expected Restic retention only after the upload." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_RESTIC_LOG"
printf 'tampered\n' >>"$test_root/backups/multiforum-backup-20260201T000000Z/neo4j-data.tar.gz"
if "$upload_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected upload to reject a checksum mismatch." >&2
  exit 1
fi
if [[ -s "$MULTIFORUM_FAKE_RESTIC_LOG" ]]; then
  echo "Checksum verification must happen before remote access." >&2
  exit 1
fi

rm -rf -- "$test_root/backups/multiforum-backup-20260201T000000Z"
: >"$MULTIFORUM_FAKE_RESTIC_LOG"
if MULTIFORUM_FAKE_RESTIC_FAIL_BACKUP=true \
  "$upload_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected a Restic backup failure to fail the upload command." >&2
  exit 1
fi
if grep --fixed-strings 'forget ' "$MULTIFORUM_FAKE_RESTIC_LOG" >/dev/null; then
  echo "Remote retention must not run after a failed upload." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_RESTIC_LOG"
if MULTIFORUM_FAKE_RESTIC_FAIL_FORGET=true \
  "$upload_script" --backup-root "$test_root/backups" >/dev/null 2>&1; then
  echo "Expected a Restic retention failure to fail the upload command." >&2
  exit 1
fi
grep --fixed-strings 'backup ' "$MULTIFORUM_FAKE_RESTIC_LOG" >/dev/null
grep --fixed-strings 'forget ' "$MULTIFORUM_FAKE_RESTIC_LOG" >/dev/null

echo "Off-site backup upload tests passed."
