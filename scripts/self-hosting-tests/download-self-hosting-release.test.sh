#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
download_script="$repository_root/scripts/download-self-hosting-release.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_CURL_LOG="$test_root/curl.log"
: >"$MULTIFORUM_FAKE_CURL_LOG"

file_mode() {
  stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"
}

"$download_script" --help | grep --fixed-strings -- '--release VERSION' >/dev/null

if "$download_script" >/dev/null 2>&1; then
  echo "Expected release download to require a version." >&2
  exit 1
fi

for invalid_version in v1.2.3 latest 1.2; do
  if "$download_script" --release "$invalid_version" >/dev/null 2>&1; then
    echo "Expected release download to reject version: $invalid_version" >&2
    exit 1
  fi
done
test ! -s "$MULTIFORUM_FAKE_CURL_LOG"

output_file="$test_root/releases/multiforum-self-hosting-1.2.3.json"
"$download_script" \
  --release 1.2.3 \
  --output "$output_file" >/dev/null

test -f "$output_file"
jq --exit-status '.schemaVersion == 1 and .release == "1.2.3"' "$output_file" >/dev/null
test "$(file_mode "$output_file")" = 644
grep --fixed-strings \
  'https://github.com/gennit-project/multiforum-nuxt/releases/download/v1.2.3/multiforum-self-hosting-1.2.3.json' \
  "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings -- "--proto =https" "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings -- "--proto-redir =https" "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null

: >"$MULTIFORUM_FAKE_CURL_LOG"
if "$download_script" \
  --release 1.2.3 \
  --output "$output_file" >/dev/null 2>&1; then
  echo "Expected release download to preserve an existing manifest." >&2
  exit 1
fi
test ! -s "$MULTIFORUM_FAKE_CURL_LOG"

printf 'stale manifest\n' >"$output_file"
"$download_script" \
  --release 1.2.3 \
  --output "$output_file" \
  --replace-existing >/dev/null
jq --exit-status '.release == "1.2.3"' "$output_file" >/dev/null

symlink_output="$test_root/release-link.json"
ln -s "$output_file" "$symlink_output"
if "$download_script" \
  --release 1.2.3 \
  --output "$symlink_output" \
  --replace-existing >/dev/null 2>&1; then
  echo "Expected release download to reject a symbolic-link output." >&2
  exit 1
fi

if "$download_script" \
  --release 1.2.3 \
  --output "$test_root" \
  --replace-existing >/dev/null 2>&1; then
  echo "Expected release download to reject a directory output." >&2
  exit 1
fi

mismatch_output="$test_root/mismatch.json"
if MULTIFORUM_FAKE_RELEASE_VERSION=1.2.4 \
  "$download_script" \
  --release 1.2.3 \
  --output "$mismatch_output" >/dev/null 2>&1; then
  echo "Expected release download to reject a mismatched manifest version." >&2
  exit 1
fi
test ! -e "$mismatch_output"

invalid_manifest="$test_root/invalid-source.json"
cat >"$invalid_manifest" <<'EOF'
{
  "schemaVersion": 1,
  "release": "1.2.3",
  "images": {
    "database": "neo4j:5.1.0",
    "backend": "ghcr.io/gennit-project/multiforum-backend:1.2.3",
    "frontend": "ghcr.io/gennit-project/multiforum-nuxt:edge",
    "caddy": "caddy:2.11.4-alpine"
  }
}
EOF
invalid_output="$test_root/invalid-output.json"
if MULTIFORUM_FAKE_RELEASE_MANIFEST="$invalid_manifest" \
  "$download_script" \
  --release 1.2.3 \
  --output "$invalid_output" >/dev/null 2>&1; then
  echo "Expected release download to reject an invalid manifest." >&2
  exit 1
fi
test ! -e "$invalid_output"

failed_output="$test_root/download-failure.json"
if MULTIFORUM_FAKE_CURL_FAIL=true \
  "$download_script" \
  --release 1.2.3 \
  --output "$failed_output" >/dev/null 2>&1; then
  echo "Expected release download to propagate an HTTPS failure." >&2
  exit 1
fi
test ! -e "$failed_output"

(
  cd "$test_root"
  MULTIFORUM_FAKE_RELEASE_VERSION=2.0.0-rc.1+build.7 \
    "$download_script" --release 2.0.0-rc.1+build.7 >/dev/null
  test -f 'multiforum-self-hosting-2.0.0-rc.1+build.7.json'
)

echo "Self-hosting release download tests passed."
