#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
backup_script="$repository_root/scripts/backup-self-hosting.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"

env_file="$test_root/.env.production"
: >"$env_file"

"$backup_script" --help | grep --fixed-strings -- "--output-dir PATH" >/dev/null

if "$backup_script" --env-file >/dev/null 2>&1; then
  echo "Expected a missing --env-file value to fail." >&2
  exit 1
fi

if "$backup_script" --unknown >/dev/null 2>&1; then
  echo "Expected an unknown argument to fail." >&2
  exit 1
fi

if "$backup_script" --output-dir "$test_root/invalid-retention" \
  --env-file "$env_file" --retention-count 0 >/dev/null 2>&1; then
  echo "Expected a zero retention count to fail." >&2
  exit 1
fi

if "$backup_script" --output-dir "$test_root/invalid-retention" \
  --env-file "$env_file" --retention-count >/dev/null 2>&1; then
  echo "Expected a missing retention count to fail." >&2
  exit 1
fi

if "$backup_script" --output-dir "$test_root/missing-env" \
  --env-file "$test_root/does-not-exist" >/dev/null 2>&1; then
  echo "Expected a missing production environment file to fail." >&2
  exit 1
fi

success_root="$test_root/success"
mkdir -p "$success_root"

"$backup_script" --env-file "$env_file" --output-dir "$success_root"

backup_dir="$(find "$success_root" -mindepth 1 -maxdepth 1 -type d -name 'multiforum-backup-*' -print)"
if [[ -z "$backup_dir" || "$(printf '%s\n' "$backup_dir" | wc -l | tr -d ' ')" != 1 ]]; then
  echo "Expected exactly one completed backup bundle." >&2
  exit 1
fi

test -s "$backup_dir/neo4j-data.tar.gz"
test -s "$backup_dir/frontend-data.tar.gz"
jq --exit-status '
  .formatVersion == 1 and
  .images.database == "neo4j:test" and
  .images.backend == "ghcr.io/example/backend:test" and
  .images.frontend == "ghcr.io/example/frontend:test" and
  (.archives["neo4j-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$")) and
  (.archives["frontend-data.tar.gz"].sha256 | test("^[a-f0-9]{64}$"))
' "$backup_dir/manifest.json" >/dev/null
grep --fixed-strings "stop frontend backend" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
grep --fixed-strings "stop database" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
grep --fixed-strings "up -d database backend frontend" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null

retention_root="$test_root/retention"
mkdir -p "$retention_root"
for timestamp in 20260101T000000Z 20260201T000000Z 20260301T000000Z; do
  bundle="$retention_root/multiforum-backup-$timestamp"
  mkdir -p "$bundle"
  : >"$bundle/manifest.json"
  : >"$bundle/neo4j-data.tar.gz"
  : >"$bundle/frontend-data.tar.gz"
done
incomplete_bundle="$retention_root/multiforum-backup-20250101T000000Z"
mkdir -p "$incomplete_bundle"
: >"$incomplete_bundle/manifest.json"

retention_output="$("$backup_script" --env-file "$env_file" \
  --output-dir "$retention_root" --retention-count 2)"
printf '%s\n' "$retention_output"

restart_line="$(grep --line-number --fixed-strings \
  'Restarting the production services...' <<<"$retention_output" | cut -d: -f1)"
removal_line="$(grep --line-number --fixed-strings \
  --max-count=1 'Removing expired backup:' <<<"$retention_output" | cut -d: -f1)"
if [[ -z "$restart_line" || -z "$removal_line" || "$restart_line" -ge "$removal_line" ]]; then
  echo "Expected production services to restart before local retention work." >&2
  exit 1
fi

complete_bundle_count=0
for bundle in "$retention_root"/multiforum-backup-*; do
  if [[ -f "$bundle/manifest.json" &&
    -f "$bundle/neo4j-data.tar.gz" &&
    -f "$bundle/frontend-data.tar.gz" ]]; then
    ((complete_bundle_count += 1))
  fi
done
if ((complete_bundle_count != 2)); then
  echo "Expected retention to preserve exactly two complete backups." >&2
  exit 1
fi
test -d "$retention_root/multiforum-backup-20260301T000000Z"
test -d "$incomplete_bundle"
test ! -e "$retention_root/multiforum-backup-20260101T000000Z"
test ! -e "$retention_root/multiforum-backup-20260201T000000Z"

failure_root="$test_root/failure"
mkdir -p "$failure_root"
preserved_bundle="$failure_root/multiforum-backup-20260101T000000Z"
mkdir -p "$preserved_bundle"
: >"$preserved_bundle/manifest.json"
: >"$preserved_bundle/neo4j-data.tar.gz"
: >"$preserved_bundle/frontend-data.tar.gz"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

if MULTIFORUM_FAKE_FAIL_FRONTEND=true \
  "$backup_script" --env-file "$env_file" --output-dir "$failure_root" \
  --retention-count 1; then
  echo "Expected a failed archive command to fail the backup." >&2
  exit 1
fi

if [[ ! -d "$preserved_bundle" ]]; then
  echo "A failed backup must not prune an existing complete bundle." >&2
  exit 1
fi
if find "$failure_root" -mindepth 1 -maxdepth 1 \
  ! -path "$preserved_bundle" -print -quit | grep --quiet .; then
  echo "A failed backup must not leave a new partial bundle." >&2
  exit 1
fi
grep --fixed-strings "up -d database backend frontend" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null

restart_failure_root="$test_root/restart-failure"
mkdir -p "$restart_failure_root"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

if MULTIFORUM_FAKE_FAIL_RESTART=true \
  "$backup_script" --env-file "$env_file" --output-dir "$restart_failure_root"; then
  echo "Expected a failed service restart to fail the backup command." >&2
  exit 1
fi

if ! find "$restart_failure_root" -mindepth 1 -maxdepth 1 -type d \
  -name 'multiforum-backup-*' -print -quit | grep --quiet .; then
  echo "A completed backup must survive a subsequent restart failure." >&2
  exit 1
fi

stop_failure_root="$test_root/stop-failure"
mkdir -p "$stop_failure_root"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

if MULTIFORUM_FAKE_FAIL_STOP=true \
  "$backup_script" --env-file "$env_file" --output-dir "$stop_failure_root"; then
  echo "Expected a failed stop command to fail the backup." >&2
  exit 1
fi

if find "$stop_failure_root" -mindepth 1 -print -quit | grep --quiet .; then
  echo "A failed stop command must not leave a partial bundle." >&2
  exit 1
fi
grep --fixed-strings "up -d database backend frontend" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null

missing_service_root="$test_root/missing-service"
mkdir -p "$missing_service_root"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

if MULTIFORUM_FAKE_RUNNING_SERVICES=$'database\nbackend' \
  "$backup_script" --env-file "$env_file" --output-dir "$missing_service_root"; then
  echo "Expected the backup to reject a stopped frontend." >&2
  exit 1
fi

if grep --fixed-strings "stop frontend backend" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "The backup must not stop services after a failed preflight." >&2
  exit 1
fi

echo "Cold-backup command tests passed."
