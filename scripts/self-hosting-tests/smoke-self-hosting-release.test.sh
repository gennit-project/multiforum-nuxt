#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
smoke_script="$repository_root/scripts/smoke-self-hosting-release.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"
export MULTIFORUM_FAKE_CURL_LOG="$test_root/curl.log"

manifest_file="$test_root/release.json"
cat >"$manifest_file" <<'EOF'
{
  "schemaVersion": 1,
  "release": "1.2.3",
  "images": {
    "database": "neo4j:5.1.0",
    "backend": "ghcr.io/gennit-project/multiforum-backend:1.2.3",
    "frontend": "ghcr.io/gennit-project/multiforum-nuxt:1.2.3",
    "caddy": "caddy:2.11.4-alpine"
  }
}
EOF

"$smoke_script" --help | grep --fixed-strings -- "--project-name NAME" >/dev/null

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
: >"$MULTIFORUM_FAKE_CURL_LOG"
"$smoke_script" --manifest "$manifest_file" --project-name release-smoke-test >/dev/null
grep --fixed-strings 'caddy validate --config /etc/caddy/Caddyfile' \
  "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
grep --fixed-strings 'up -d --wait --wait-timeout 300 database backend frontend' \
  "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
grep --fixed-strings 'down --volumes --remove-orphans' \
  "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
grep --fixed-strings '/api/graphql' "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings '/api/auth/local-dev/login' "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings '/api/session/profile' "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
: >"$MULTIFORUM_FAKE_CURL_LOG"
if MULTIFORUM_FAKE_FAIL_RELEASE_SMOKE_START=true \
  "$smoke_script" --manifest "$manifest_file" --project-name release-smoke-start-failure >/dev/null 2>&1; then
  echo "Expected release smoke to propagate a stack startup failure." >&2
  exit 1
fi
grep --fixed-strings 'down --volumes --remove-orphans' \
  "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null
if [[ -s "$MULTIFORUM_FAKE_CURL_LOG" ]]; then
  echo "A startup failure must occur before application requests." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if MULTIFORUM_FAKE_GRAPHQL_FAIL=true \
  "$smoke_script" --manifest "$manifest_file" --project-name release-smoke-graphql-failure >/dev/null 2>&1; then
  echo "Expected release smoke to reject a failed GraphQL proxy." >&2
  exit 1
fi
grep --fixed-strings 'down --volumes --remove-orphans' \
  "$MULTIFORUM_FAKE_DOCKER_LOG" >/dev/null

if MULTIFORUM_FAKE_LOGIN_FAIL=true \
  "$smoke_script" --manifest "$manifest_file" --project-name release-smoke-login-failure >/dev/null 2>&1; then
  echo "Expected release smoke to reject a failed sign-in." >&2
  exit 1
fi

if MULTIFORUM_FAKE_PROFILE_FAIL=true \
  "$smoke_script" --manifest "$manifest_file" --project-name release-smoke-profile-failure >/dev/null 2>&1; then
  echo "Expected release smoke to reject an unresolved administrator profile." >&2
  exit 1
fi

if MULTIFORUM_FAKE_FAIL_CADDY_VALIDATION=true \
  "$smoke_script" --manifest "$manifest_file" --project-name release-smoke-caddy-failure >/dev/null 2>&1; then
  echo "Expected release smoke to reject an incompatible Caddy image." >&2
  exit 1
fi

if "$smoke_script" --manifest "$manifest_file" --project-name INVALID >/dev/null 2>&1; then
  echo "Expected release smoke to reject an invalid Compose project name." >&2
  exit 1
fi

invalid_manifest="$test_root/invalid.json"
jq '.images.frontend = "ghcr.io/gennit-project/multiforum-nuxt:edge"' \
  "$manifest_file" >"$invalid_manifest"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"
if "$smoke_script" --manifest "$invalid_manifest" --project-name release-smoke-invalid >/dev/null 2>&1; then
  echo "Expected release smoke to reject an invalid manifest." >&2
  exit 1
fi
if [[ -s "$MULTIFORUM_FAKE_DOCKER_LOG" ]]; then
  echo "Manifest validation must happen before Docker is called." >&2
  exit 1
fi

echo "Self-hosting release-bundle smoke tests passed."
