#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
verify_script="$repository_root/scripts/verify-self-hosting.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"
export MULTIFORUM_FAKE_CURL_LOG="$test_root/curl.log"

env_file="$test_root/verify.env"
: >"$env_file"

"$verify_script" --help | grep --fixed-strings -- "--base-url URL" >/dev/null

if "$verify_script" --env-file "$env_file" --base-url http://forum.example.com >/dev/null 2>&1; then
  echo "Expected production verification to reject an HTTP base URL." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_DOCKER_LOG"
: >"$MULTIFORUM_FAKE_CURL_LOG"
"$verify_script" --env-file "$env_file"
grep --fixed-strings "https://forum.example.com/" "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings "https://forum.example.com/api/graphql" "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null

: >"$MULTIFORUM_FAKE_CURL_LOG"
if MULTIFORUM_FAKE_UNHEALTHY_SERVICE=backend \
  "$verify_script" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected verification to reject an unhealthy backend." >&2
  exit 1
fi
if [[ -s "$MULTIFORUM_FAKE_CURL_LOG" ]]; then
  echo "Container health failures must occur before public requests." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_CURL_LOG"
if MULTIFORUM_FAKE_IMAGE_MISMATCH_SERVICE=frontend \
  "$verify_script" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected verification to reject a running image mismatch." >&2
  exit 1
fi
if [[ -s "$MULTIFORUM_FAKE_CURL_LOG" ]]; then
  echo "Image mismatches must occur before public requests." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_CURL_LOG"
if MULTIFORUM_FAKE_RUNNING_RELEASE_VERSION=1.2.4 \
  "$verify_script" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected verification to reject a running release-label mismatch." >&2
  exit 1
fi
if [[ -s "$MULTIFORUM_FAKE_CURL_LOG" ]]; then
  echo "Release mismatches must occur before public requests." >&2
  exit 1
fi

if MULTIFORUM_FAKE_MISSING_SERVICE=database \
  "$verify_script" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected verification to reject a missing database container." >&2
  exit 1
fi

if MULTIFORUM_FAKE_CURL_FAIL=true \
  "$verify_script" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected verification to propagate a public HTTPS failure." >&2
  exit 1
fi

if MULTIFORUM_FAKE_MISSING_HEADER=hsts \
  "$verify_script" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected verification to reject a missing HSTS header." >&2
  exit 1
fi

if MULTIFORUM_FAKE_GRAPHQL_FAIL=true \
  "$verify_script" --env-file "$env_file" >/dev/null 2>&1; then
  echo "Expected verification to reject a failed GraphQL proxy response." >&2
  exit 1
fi

: >"$MULTIFORUM_FAKE_CURL_LOG"
"$verify_script" \
  --env-file "$env_file" \
  --base-url https://override.example.com/
grep --fixed-strings "https://override.example.com/api/graphql" "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null

echo "Production-verification command tests passed."
