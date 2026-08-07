#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
restore_script="$repository_root/scripts/restore-self-hosting.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

create_bundle() {
  local bundle_dir="$1"
  local database_image="$2"
  local source_dir="$test_root/archive-source"

  rm -rf -- "$source_dir"
  mkdir -p "$source_dir/neo4j" "$source_dir/frontend" "$bundle_dir"
  printf 'neo4j-data\n' >"$source_dir/neo4j/store"
  printf 'frontend-session\n' >"$source_dir/frontend/session"
  tar -czf "$bundle_dir/neo4j-data.tar.gz" -C "$source_dir/neo4j" .
  tar -czf "$bundle_dir/frontend-data.tar.gz" -C "$source_dir/frontend" .

  jq --null-input \
    --arg databaseImage "$database_image" \
    --arg neo4jSha256 "$(sha256_file "$bundle_dir/neo4j-data.tar.gz")" \
    --arg frontendSha256 "$(sha256_file "$bundle_dir/frontend-data.tar.gz")" \
    '{
      formatVersion: 1,
      createdAt: "2026-08-07T00:00:00Z",
      images: {
        database: $databaseImage,
        backend: "ghcr.io/example/backend:test",
        frontend: "ghcr.io/example/frontend:test"
      },
      archives: {
        "neo4j-data.tar.gz": {sha256: $neo4jSha256},
        "frontend-data.tar.gz": {sha256: $frontendSha256}
      }
    }' >"$bundle_dir/manifest.json"
}

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"

env_file="$test_root/.env.production"
: >"$env_file"
bundle_dir="$test_root/bundle"
create_bundle "$bundle_dir" "neo4j:test"

"$restore_script" --help | grep --fixed-strings -- "--confirm-replace-existing-data" >/dev/null

if "$restore_script" --backup-dir "$bundle_dir" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected restore without destructive confirmation to fail." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
MULTIFORUM_FAKE_RUNNING_SERVICES=caddy \
  "$restore_script" \
  --backup-dir "$bundle_dir" \
  --env-file "$env_file" \
  --confirm-replace-existing-data

grep --fixed-strings "neo4j-volume:/target" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
grep --fixed-strings "frontend-volume:/target" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
if grep --fixed-strings "up -d" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "A restore must not restart services automatically." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if "$restore_script" \
  --backup-dir "$bundle_dir" \
  --env-file "$env_file" \
  --confirm-replace-existing-data >/dev/null 2>&1; then
  echo "Expected restore to reject a running application stack." >&2
  exit 1
fi
if grep --fixed-strings ":/target" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "A running-service preflight failure must not touch volumes." >&2
  exit 1
fi

checksum_failure_dir="$test_root/checksum-failure"
create_bundle "$checksum_failure_dir" "neo4j:test"
printf 'tampered\n' >>"$checksum_failure_dir/neo4j-data.tar.gz"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

if MULTIFORUM_FAKE_RUNNING_SERVICES=caddy \
  "$restore_script" \
  --backup-dir "$checksum_failure_dir" \
  --env-file "$env_file" \
  --confirm-replace-existing-data >/dev/null 2>&1; then
  echo "Expected restore to reject a checksum mismatch." >&2
  exit 1
fi
if [[ -s "$MULTIFORUM_FAKE_DOCKER_LOG" ]]; then
  echo "A checksum failure must occur before Docker is invoked." >&2
  exit 1
fi

image_mismatch_dir="$test_root/image-mismatch"
create_bundle "$image_mismatch_dir" "neo4j:other"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

if MULTIFORUM_FAKE_RUNNING_SERVICES=caddy \
  "$restore_script" \
  --backup-dir "$image_mismatch_dir" \
  --env-file "$env_file" \
  --confirm-replace-existing-data >/dev/null 2>&1; then
  echo "Expected restore to reject a Neo4j image mismatch." >&2
  exit 1
fi
if grep --fixed-strings ":/target" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "An image mismatch must not touch volumes." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
MULTIFORUM_FAKE_RUNNING_SERVICES=caddy \
  "$restore_script" \
  --backup-dir "$image_mismatch_dir" \
  --env-file "$env_file" \
  --confirm-replace-existing-data \
  --allow-database-image-mismatch
grep --fixed-strings "neo4j-volume:/target" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_RUNNING_SERVICES=caddy MULTIFORUM_FAKE_FAIL_RESTORE_FRONTEND=true \
  "$restore_script" \
  --backup-dir "$bundle_dir" \
  --env-file "$env_file" \
  --confirm-replace-existing-data >/dev/null 2>&1; then
  echo "Expected an archive extraction failure to fail the restore." >&2
  exit 1
fi
grep --fixed-strings "neo4j-volume:/target" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
grep --fixed-strings "frontend-volume:/target" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
if grep --fixed-strings "up -d" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "A failed restore must leave services stopped." >&2
  exit 1
fi

echo "Guarded-restore command tests passed."
