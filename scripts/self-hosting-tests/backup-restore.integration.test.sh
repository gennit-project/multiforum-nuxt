#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"
real_docker="$(command -v docker)"
helper_image="${MULTIFORUM_BACKUP_HELPER_IMAGE:-busybox:1.36.1}"
volume_suffix="${RANDOM}-$$"
neo4j_volume="multiforum-restore-drill-neo4j-$volume_suffix"
frontend_volume="multiforum-restore-drill-frontend-$volume_suffix"

cleanup() {
  "$real_docker" volume rm --force "$neo4j_volume" "$frontend_volume" \
    >/dev/null 2>&1 || true
  rm -rf -- "$test_root"
}
trap cleanup EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"
export MULTIFORUM_FAKE_DOCKER_REAL_VOLUME_IO=true
export MULTIFORUM_REAL_DOCKER="$real_docker"
export MULTIFORUM_FAKE_NEO4J_VOLUME="$neo4j_volume"
export MULTIFORUM_FAKE_FRONTEND_VOLUME="$frontend_volume"
export MULTIFORUM_BACKUP_HELPER_IMAGE="$helper_image"

env_file="$test_root/.env.production"
backup_root="$test_root/backups"
: >"$env_file"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"

"$real_docker" volume create "$neo4j_volume" >/dev/null
"$real_docker" volume create "$frontend_volume" >/dev/null

"$real_docker" run --rm \
  --volume "$neo4j_volume:/target" \
  "$helper_image" \
  sh -ec 'mkdir -p /target/databases/neo4j && printf "forum-node-data\n" > /target/databases/neo4j/neostore'
"$real_docker" run --rm \
  --volume "$frontend_volume:/target" \
  "$helper_image" \
  sh -ec 'mkdir -p /target/sessions && printf "admin-session-data\n" > /target/sessions/admin.json'

"$repository_root/scripts/backup-self-hosting.sh" \
  --env-file "$env_file" \
  --output-dir "$backup_root" >/dev/null

backup_dir="$(find "$backup_root" -mindepth 1 -maxdepth 1 -type d \
  -name 'multiforum-backup-????????T??????Z' -print -quit)"
if [[ -z "$backup_dir" ]]; then
  echo "The integration drill did not create a complete backup bundle." >&2
  exit 1
fi

jq --exit-status \
  '.formatVersion == 1 and .images.database == "neo4j:test"' \
  "$backup_dir/manifest.json" >/dev/null

"$real_docker" volume rm "$neo4j_volume" "$frontend_volume" >/dev/null
"$real_docker" volume create "$neo4j_volume" >/dev/null
"$real_docker" volume create "$frontend_volume" >/dev/null

"$real_docker" run --rm \
  --volume "$neo4j_volume:/target" \
  "$helper_image" \
  sh -ec 'printf "replacement-only\n" > /target/replacement-marker'
"$real_docker" run --rm \
  --volume "$frontend_volume:/target" \
  "$helper_image" \
  sh -ec 'printf "replacement-only\n" > /target/replacement-marker'

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
MULTIFORUM_FAKE_RUNNING_SERVICES=caddy \
  "$repository_root/scripts/restore-self-hosting.sh" \
  --backup-dir "$backup_dir" \
  --env-file "$env_file" \
  --confirm-replace-existing-data >/dev/null

neo4j_data="$("$real_docker" run --rm \
  --volume "$neo4j_volume:/source:ro" \
  "$helper_image" \
  cat /source/databases/neo4j/neostore)"
frontend_data="$("$real_docker" run --rm \
  --volume "$frontend_volume:/source:ro" \
  "$helper_image" \
  cat /source/sessions/admin.json)"

test "$neo4j_data" = "forum-node-data"
test "$frontend_data" = "admin-session-data"
"$real_docker" run --rm \
  --volume "$neo4j_volume:/source:ro" \
  "$helper_image" \
  test ! -e /source/replacement-marker
"$real_docker" run --rm \
  --volume "$frontend_volume:/source:ro" \
  "$helper_image" \
  test ! -e /source/replacement-marker

if grep --fixed-strings ' up -d ' "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null; then
  echo "The restore drill unexpectedly restarted application services." >&2
  exit 1
fi

echo "Real-volume backup and restore integration drill passed."
