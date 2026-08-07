#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
rollback_script="$repository_root/scripts/rollback-self-hosting-upgrade.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"
export MULTIFORUM_FAKE_CURL_LOG="$test_root/curl.log"
export MULTIFORUM_FAKE_RUNNING_SERVICES=$'database\nbackend\nfrontend\ncaddy'
: >"$MULTIFORUM_FAKE_DOCKER_LOG"
: >"$MULTIFORUM_FAKE_CURL_LOG"

make_rollback_files() {
  printf 'RELEASE_MARKER=failed-release\nSECRET=new-secret\n' >"$test_root/current.env"
  printf 'RELEASE_MARKER=known-good\nSECRET=old-secret\n' >"$test_root/rollback.env"
  chmod 600 "$test_root/current.env" "$test_root/rollback.env"
  rm -f "$test_root/failed.env"
}

file_mode() {
  stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"
}

"$rollback_script" --help | grep --fixed-strings -- '--confirm-rollback' >/dev/null

make_rollback_files
if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/unconfirmed" >/dev/null 2>&1; then
  echo "Expected rollback to require explicit confirmation." >&2
  exit 1
fi
test ! -s "$MULTIFORUM_FAKE_DOCKER_LOG"

if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to require a safety-backup destination." >&2
  exit 1
fi

if "$rollback_script" \
  --current-env-file "$test_root/missing.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/missing" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to reject a missing active environment." >&2
  exit 1
fi

if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/missing.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/missing-rollback" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to reject a missing preserved environment." >&2
  exit 1
fi

rollback_alias="$test_root/rollback-alias.env"
ln -s "$test_root/rollback.env" "$rollback_alias"
if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$rollback_alias" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/alias" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to reject symbolic-link environments." >&2
  exit 1
fi

failed_alias="$test_root/failed-alias.env"
ln -s "$test_root/current.env" "$failed_alias"
if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$failed_alias" \
  --backup-output-dir "$test_root/failed-alias" \
  --confirm-rollback \
  --replace-failed >/dev/null 2>&1; then
  echo "Expected rollback to reject a symbolic-link failed environment." >&2
  exit 1
fi

if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/missing-directory/failed.env" \
  --backup-output-dir "$test_root/missing-failed-directory" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to require an existing failed-environment directory." >&2
  exit 1
fi

if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/current.env" \
  --backup-output-dir "$test_root/failed-current" \
  --confirm-rollback \
  --replace-failed >/dev/null 2>&1; then
  echo "Expected rollback to keep active and failed environments distinct." >&2
  exit 1
fi

mkdir "$test_root/other"
cp "$test_root/rollback.env" "$test_root/other/rollback.env"
if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/other/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/cross-directory" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to reject non-atomic environment rotation." >&2
  exit 1
fi

printf 'RELEASE_MARKER=older-failure\n' >"$test_root/failed.env"
if "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/existing-failed" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to preserve an existing failed-release file." >&2
  exit 1
fi
grep --fixed-strings 'RELEASE_MARKER=older-failure' "$test_root/failed.env" >/dev/null

make_rollback_files
: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_FAIL_PULL=true \
  "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/pull-failure" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to stop when target images cannot be pulled." >&2
  exit 1
fi
grep --fixed-strings 'RELEASE_MARKER=failed-release' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=known-good' "$test_root/rollback.env" >/dev/null
test ! -e "$test_root/failed.env"

make_rollback_files
: >"$MULTIFORUM_FAKE_CURL_LOG"
verification_failure_root="$test_root/verification-failure"
if MULTIFORUM_FAKE_GRAPHQL_FAIL=true \
  "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$verification_failure_root" \
  --confirm-rollback >/dev/null 2>&1; then
  echo "Expected rollback to stop when the redeployed stack fails verification." >&2
  exit 1
fi
grep --fixed-strings '/api/graphql' "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=failed-release' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=known-good' "$test_root/rollback.env" >/dev/null
test ! -e "$test_root/failed.env"
find "$verification_failure_root" -mindepth 1 -maxdepth 1 -type d \
  -name 'multiforum-backup-*' -print -quit | grep --quiet .

make_rollback_files
: >"$MULTIFORUM_FAKE_CURL_LOG"
success_backup_root="$test_root/success"
"$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$success_backup_root" \
  --base-url https://override.example.com/ \
  --confirm-rollback >/dev/null

grep --fixed-strings 'https://override.example.com/api/graphql' "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=known-good' "$test_root/current.env" >/dev/null
grep --fixed-strings 'SECRET=old-secret' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=failed-release' "$test_root/failed.env" >/dev/null
grep --fixed-strings 'SECRET=new-secret' "$test_root/failed.env" >/dev/null
test ! -e "$test_root/rollback.env"
test "$(file_mode "$test_root/current.env")" = 600
test "$(file_mode "$test_root/failed.env")" = 600
find "$success_backup_root" -mindepth 1 -maxdepth 1 -type d \
  -name 'multiforum-backup-*' -print -quit | grep --quiet .

printf 'RELEASE_MARKER=next-failed-release\n' >"$test_root/current.env"
printf 'RELEASE_MARKER=next-known-good\n' >"$test_root/rollback.env"
"$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/rollback.env" \
  --failed-env-file "$test_root/failed.env" \
  --backup-output-dir "$test_root/replace-failed" \
  --confirm-rollback \
  --replace-failed >/dev/null
grep --fixed-strings 'RELEASE_MARKER=next-known-good' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=next-failed-release' "$test_root/failed.env" >/dev/null

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
printf 'RELEASE_MARKER=database-current\n' >"$test_root/current.env"
printf 'RELEASE_MARKER=database-rollback\n' >"$test_root/target.env"
if MULTIFORUM_FAKE_TARGET_DATABASE_IMAGE=neo4j:6.0.0 \
  MULTIFORUM_FAKE_FAIL_PULL=true \
  "$rollback_script" \
  --current-env-file "$test_root/current.env" \
  --rollback-env-file "$test_root/target.env" \
  --failed-env-file "$test_root/database-failed.env" \
  --backup-output-dir "$test_root/database-change" \
  --confirm-rollback \
  --allow-database-image-change >/dev/null 2>&1; then
  echo "Expected injected pull failure after approved database-image preflight." >&2
  exit 1
fi
grep --fixed-strings ' pull database backend frontend caddy' "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null

echo "Self-hosting upgrade rollback tests passed."
