#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
prepare_script="$repository_root/scripts/prepare-self-hosting-upgrade.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"

manifest_file="$test_root/release.json"
cat >"$manifest_file" <<'EOF'
{
  "schemaVersion": 1,
  "release": "2.3.4",
  "images": {
    "database": "neo4j:5.26.0",
    "backend": "ghcr.io/gennit-project/multiforum-backend:2.3.4",
    "frontend": "ghcr.io/gennit-project/multiforum-nuxt@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "caddy": "caddy:2.11.4-alpine"
  }
}
EOF

current_env_file="$test_root/current.env"
cat >"$current_env_file" <<'EOF'
# Operator-owned production configuration.
MULTIFORUM_DOMAIN=forum.example.com
MULTIFORUM_RELEASE_VERSION=1.2.3
MULTIFORUM_NEO4J_IMAGE=neo4j:5.1.0
MULTIFORUM_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:1.2.3
MULTIFORUM_FRONTEND_IMAGE=ghcr.io/gennit-project/multiforum-nuxt:1.2.3
MULTIFORUM_CADDY_IMAGE=caddy:2.10.2-alpine
NEO4J_PASSWORD=preserve-this-secret
AUTH0_CLIENT_ID=preserve-this-identity
EOF
chmod 640 "$current_env_file"

"$prepare_script" --help | grep --fixed-strings -- '--replace-existing' >/dev/null

if "$prepare_script" --current-env-file "$current_env_file" >/dev/null 2>&1; then
  echo "Expected preparation to require a release manifest." >&2
  exit 1
fi

if "$prepare_script" \
  --manifest "$test_root/missing.json" \
  --current-env-file "$current_env_file" >/dev/null 2>&1; then
  echo "Expected preparation to reject a missing release manifest." >&2
  exit 1
fi

if "$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$test_root/missing.env" >/dev/null 2>&1; then
  echo "Expected preparation to reject a missing current environment." >&2
  exit 1
fi

if "$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$current_env_file" \
  --output-env-file "$current_env_file" >/dev/null 2>&1; then
  echo "Expected preparation to refuse the active environment as output." >&2
  exit 1
fi

active_env_alias="$test_root/active-alias.env"
ln -s "$current_env_file" "$active_env_alias"
if "$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$current_env_file" \
  --output-env-file "$active_env_alias" \
  --replace-existing >/dev/null 2>&1; then
  echo "Expected preparation to refuse an alias of the active environment." >&2
  exit 1
fi
grep --fixed-strings 'NEO4J_PASSWORD=preserve-this-secret' "$current_env_file" >/dev/null

invalid_manifest="$test_root/invalid.json"
jq '.images.frontend = "ghcr.io/gennit-project/multiforum-nuxt:edge"' \
  "$manifest_file" >"$invalid_manifest"
if "$prepare_script" \
  --manifest "$invalid_manifest" \
  --current-env-file "$current_env_file" \
  --output-env-file "$test_root/invalid-target.env" >/dev/null 2>&1; then
  echo "Expected preparation to reject an invalid release manifest." >&2
  exit 1
fi
test ! -e "$test_root/invalid-target.env"

duplicate_env_file="$test_root/duplicate.env"
cp "$current_env_file" "$duplicate_env_file"
printf 'MULTIFORUM_RELEASE_VERSION=duplicate\n' >>"$duplicate_env_file"
if "$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$duplicate_env_file" \
  --output-env-file "$test_root/duplicate-target.env" >/dev/null 2>&1; then
  echo "Expected preparation to reject duplicate release settings." >&2
  exit 1
fi
test ! -e "$test_root/duplicate-target.env"

target_env_file="$test_root/target.env"
"$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$current_env_file" \
  --output-env-file "$target_env_file" >/dev/null

grep --fixed-strings 'MULTIFORUM_RELEASE_VERSION=2.3.4' "$target_env_file" >/dev/null
grep --fixed-strings 'MULTIFORUM_NEO4J_IMAGE=neo4j:5.26.0' "$target_env_file" >/dev/null
grep --fixed-strings 'MULTIFORUM_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:2.3.4' "$target_env_file" >/dev/null
grep --fixed-strings 'MULTIFORUM_FRONTEND_IMAGE=ghcr.io/gennit-project/multiforum-nuxt@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' "$target_env_file" >/dev/null
grep --fixed-strings 'MULTIFORUM_CADDY_IMAGE=caddy:2.11.4-alpine' "$target_env_file" >/dev/null
grep --fixed-strings 'NEO4J_PASSWORD=preserve-this-secret' "$target_env_file" >/dev/null
grep --fixed-strings 'AUTH0_CLIENT_ID=preserve-this-identity' "$target_env_file" >/dev/null
grep --fixed-strings '# Operator-owned production configuration.' "$target_env_file" >/dev/null
test "$(grep --count '^MULTIFORUM_RELEASE_VERSION=' "$target_env_file")" -eq 1
test "$(stat -c '%a' "$target_env_file" 2>/dev/null || stat -f '%Lp' "$target_env_file")" = 600

if "$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$current_env_file" \
  --output-env-file "$target_env_file" >/dev/null 2>&1; then
  echo "Expected preparation to refuse replacing an existing candidate." >&2
  exit 1
fi

dangling_target="$test_root/dangling-target.env"
ln -s "$test_root/no-longer-present.env" "$dangling_target"
if "$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$current_env_file" \
  --output-env-file "$dangling_target" >/dev/null 2>&1; then
  echo "Expected preparation to refuse replacing a dangling output alias." >&2
  exit 1
fi

printf 'stale candidate\n' >"$target_env_file"
"$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$current_env_file" \
  --output-env-file "$target_env_file" \
  --replace-existing >/dev/null
grep --fixed-strings 'NEO4J_PASSWORD=preserve-this-secret' "$target_env_file" >/dev/null

missing_keys_env="$test_root/missing-keys.env"
printf 'NEO4J_PASSWORD=still-preserved\n' >"$missing_keys_env"
appended_env="$test_root/appended.env"
"$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$missing_keys_env" \
  --output-env-file "$appended_env" >/dev/null
test "$(grep --count '^MULTIFORUM_.*_IMAGE=' "$appended_env")" -eq 4
grep --fixed-strings 'MULTIFORUM_RELEASE_VERSION=2.3.4' "$appended_env" >/dev/null
grep --fixed-strings 'NEO4J_PASSWORD=still-preserved' "$appended_env" >/dev/null

if MULTIFORUM_FAKE_RELEASE_VERSION=9.9.9 \
  "$prepare_script" \
  --manifest "$manifest_file" \
  --current-env-file "$current_env_file" \
  --output-env-file "$test_root/mismatch.env" >/dev/null 2>&1; then
  echo "Expected preparation to reject a candidate that fails Compose validation." >&2
  exit 1
fi
test ! -e "$test_root/mismatch.env"

echo "Self-hosting upgrade preparation tests passed."
