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

failure_root="$test_root/failure"
mkdir -p "$failure_root"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

if MULTIFORUM_FAKE_FAIL_FRONTEND=true \
  "$backup_script" --env-file "$env_file" --output-dir "$failure_root"; then
  echo "Expected a failed archive command to fail the backup." >&2
  exit 1
fi

if find "$failure_root" -mindepth 1 -print -quit | grep --quiet .; then
  echo "A failed backup must not leave a partial bundle." >&2
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
