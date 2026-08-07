#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
validator="$repository_root/scripts/validate-self-hosting-release.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"

valid_manifest="$test_root/valid.json"
cat >"$valid_manifest" <<'EOF'
{
  "schemaVersion": 1,
  "release": "1.2.3",
  "images": {
    "database": "neo4j:test",
    "backend": "ghcr.io/gennit-project/multiforum-backend:1.2.3",
    "frontend": "ghcr.io/gennit-project/multiforum-nuxt:1.2.3",
    "caddy": "caddy:2.11.4-alpine"
  }
}
EOF

"$validator" --help | grep --fixed-strings -- "--manifest PATH" >/dev/null
"$validator" --manifest "$valid_manifest" >/dev/null

digest_manifest="$test_root/digest.json"
jq '
  .release = "1.2.3-rc.1+build.7" |
  .images.backend = "ghcr.io/gennit-project/multiforum-backend@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" |
  .images.frontend = "ghcr.io/gennit-project/multiforum-nuxt@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
' "$valid_manifest" >"$digest_manifest"
"$validator" --manifest "$digest_manifest" >/dev/null

if "$validator" >/dev/null 2>&1; then
  echo "Expected validation to require a release manifest." >&2
  exit 1
fi

invalid_json="$test_root/invalid.json"
printf '{not-json}\n' >"$invalid_json"
if "$validator" --manifest "$invalid_json" >/dev/null 2>&1; then
  echo "Expected validation to reject malformed JSON." >&2
  exit 1
fi

invalid_release="$test_root/invalid-release.json"
jq '.release = "edge"' "$valid_manifest" >"$invalid_release"
if "$validator" --manifest "$invalid_release" >/dev/null 2>&1; then
  echo "Expected validation to reject a non-SemVer release." >&2
  exit 1
fi

floating_frontend="$test_root/floating-frontend.json"
jq '.images.frontend = "ghcr.io/gennit-project/multiforum-nuxt:edge"' \
  "$valid_manifest" >"$floating_frontend"
if "$validator" --manifest "$floating_frontend" >/dev/null 2>&1; then
  echo "Expected validation to reject a floating frontend image." >&2
  exit 1
fi

wrong_backend="$test_root/wrong-backend.json"
jq '.images.backend = "ghcr.io/example/multiforum-backend:1.2.3"' \
  "$valid_manifest" >"$wrong_backend"
if "$validator" --manifest "$wrong_backend" >/dev/null 2>&1; then
  echo "Expected validation to reject a nonofficial backend repository." >&2
  exit 1
fi

floating_caddy="$test_root/floating-caddy.json"
jq '.images.caddy = "caddy:latest"' "$valid_manifest" >"$floating_caddy"
if "$validator" --manifest "$floating_caddy" >/dev/null 2>&1; then
  echo "Expected validation to reject a floating infrastructure image." >&2
  exit 1
fi

extra_component="$test_root/extra-component.json"
jq '.images.worker = "example:1.0.0"' "$valid_manifest" >"$extra_component"
if "$validator" --manifest "$extra_component" >/dev/null 2>&1; then
  echo "Expected validation to reject an unknown release component." >&2
  exit 1
fi

target_env_file="$test_root/target.env"
: >"$target_env_file"
MULTIFORUM_FAKE_TARGET_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:1.2.3 \
MULTIFORUM_FAKE_TARGET_FRONTEND_IMAGE=ghcr.io/gennit-project/multiforum-nuxt:1.2.3 \
  "$validator" --manifest "$valid_manifest" --env-file "$target_env_file" >/dev/null

if MULTIFORUM_FAKE_RELEASE_VERSION=1.2.4 \
  MULTIFORUM_FAKE_TARGET_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:1.2.3 \
  MULTIFORUM_FAKE_TARGET_FRONTEND_IMAGE=ghcr.io/gennit-project/multiforum-nuxt:1.2.3 \
  "$validator" --manifest "$valid_manifest" --env-file "$target_env_file" >/dev/null 2>&1; then
  echo "Expected validation to reject a Compose release-label mismatch." >&2
  exit 1
fi

if MULTIFORUM_FAKE_TARGET_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:1.2.4 \
  MULTIFORUM_FAKE_TARGET_FRONTEND_IMAGE=ghcr.io/gennit-project/multiforum-nuxt:1.2.3 \
  "$validator" --manifest "$valid_manifest" --env-file "$target_env_file" >/dev/null 2>&1; then
  echo "Expected validation to reject a Compose image mismatch." >&2
  exit 1
fi

echo "Self-hosting release-contract tests passed."
