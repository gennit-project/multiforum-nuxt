#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
upgrade_script="$repository_root/scripts/upgrade-self-hosting.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"
export MULTIFORUM_FAKE_RUNNING_SERVICES=$'database\nbackend\nfrontend\ncaddy'

current_env_file="$test_root/current.env"
target_env_file="$test_root/target.env"
: >"$current_env_file"
: >"$target_env_file"

"$upgrade_script" --help | grep --fixed-strings -- "--confirm-upgrade" >/dev/null

if "$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$test_root/unconfirmed" >/dev/null 2>&1; then
  echo "Expected upgrade without explicit confirmation to fail." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_TARGET_FRONTEND_IMAGE=ghcr.io/example/frontend:edge \
  "$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$test_root/floating" \
  --confirm-upgrade >/dev/null 2>&1; then
  echo "Expected upgrade to reject a floating target image." >&2
  exit 1
fi
if grep --fixed-strings " pull " "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "A floating image must be rejected before target images are pulled." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_TARGET_DATABASE_IMAGE=neo4j:6.0.0 \
  "$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$test_root/database-change" \
  --confirm-upgrade >/dev/null 2>&1; then
  echo "Expected upgrade to reject an unapproved database image change." >&2
  exit 1
fi
if grep --fixed-strings " pull " "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "A database image change must be approved before pulling images." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_RUNNING_SERVICES=$'database\nbackend\nfrontend' \
  "$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$test_root/missing-caddy" \
  --confirm-upgrade >/dev/null 2>&1; then
  echo "Expected upgrade to reject a partially running stack." >&2
  exit 1
fi
if grep --fixed-strings " pull " "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "A service preflight failure must occur before pulling images." >&2
  exit 1
fi

success_backup_root="$test_root/success"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"
"$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$success_backup_root" \
  --confirm-upgrade

pull_line="$(grep --line-number --fixed-strings "target.env" "$MULTIFORUM_FAKE_DOCKER_LOG" | grep --fixed-strings " pull " | cut -d: -f1)"
stop_line="$(grep --line-number --fixed-strings "current.env" "$MULTIFORUM_FAKE_DOCKER_LOG" | grep --fixed-strings " stop frontend backend" | cut -d: -f1)"
upgrade_line="$(grep --line-number --fixed-strings "target.env" "$MULTIFORUM_FAKE_DOCKER_LOG" | grep --fixed-strings "up -d --force-recreate --wait" | cut -d: -f1)"

if [[ -z "$pull_line" || -z "$stop_line" || -z "$upgrade_line" ||
  "$pull_line" -ge "$stop_line" || "$stop_line" -ge "$upgrade_line" ]]; then
  echo "Expected pull, safety backup, and recreation to occur in that order." >&2
  exit 1
fi

if ! find "$success_backup_root" -mindepth 1 -maxdepth 1 -type d \
  -name 'multiforum-backup-*' -print -quit | grep --quiet .; then
  echo "Expected the successful upgrade to create a safety backup." >&2
  exit 1
fi
test -f "$target_env_file"

pull_failure_root="$test_root/pull-failure"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_FAIL_PULL=true \
  "$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$pull_failure_root" \
  --confirm-upgrade >/dev/null 2>&1; then
  echo "Expected a target image pull failure to fail the upgrade." >&2
  exit 1
fi
if grep --fixed-strings " stop frontend backend" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "A pull failure must occur before the safety backup stops services." >&2
  exit 1
fi

upgrade_failure_root="$test_root/upgrade-failure"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_FAIL_UPGRADE=true \
  "$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$upgrade_failure_root" \
  --confirm-upgrade >/dev/null 2>&1; then
  echo "Expected a failed force-recreation to fail the upgrade." >&2
  exit 1
fi
if ! find "$upgrade_failure_root" -mindepth 1 -maxdepth 1 -type d \
  -name 'multiforum-backup-*' -print -quit | grep --quiet .; then
  echo "A failed recreation must retain its completed safety backup." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
MULTIFORUM_FAKE_TARGET_DATABASE_IMAGE=neo4j:6.0.0 \
  "$upgrade_script" \
  --current-env-file "$current_env_file" \
  --target-env-file "$target_env_file" \
  --backup-output-dir "$test_root/approved-database-change" \
  --confirm-upgrade \
  --allow-database-image-change
grep --fixed-strings "up -d --force-recreate --wait" "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null

echo "Safe-upgrade command tests passed."
