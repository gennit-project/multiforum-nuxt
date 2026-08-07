#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
promote_script="$repository_root/scripts/promote-self-hosting-upgrade.sh"
fixture_bin="$repository_root/scripts/self-hosting-tests/fixtures"

trap 'rm -rf "$test_root"' EXIT

export PATH="$fixture_bin:$PATH"
export MULTIFORUM_FAKE_DOCKER_LOG="$test_root/docker.log"
export MULTIFORUM_FAKE_CURL_LOG="$test_root/curl.log"
: >"$MULTIFORUM_FAKE_DOCKER_LOG"
: >"$MULTIFORUM_FAKE_CURL_LOG"

make_upgrade_files() {
  printf 'RELEASE_MARKER=known-good\nSECRET=old-secret\n' >"$test_root/current.env"
  printf 'RELEASE_MARKER=candidate\nSECRET=new-secret\n' >"$test_root/candidate.env"
  chmod 640 "$test_root/current.env" "$test_root/candidate.env"
  rm -f "$test_root/previous.env"
}

file_mode() {
  stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"
}

"$promote_script" --help | grep --fixed-strings -- '--confirm-promotion' >/dev/null

make_upgrade_files
if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" >/dev/null 2>&1; then
  echo "Expected promotion to require explicit confirmation." >&2
  exit 1
fi
test ! -s "$MULTIFORUM_FAKE_CURL_LOG"
grep --fixed-strings 'RELEASE_MARKER=known-good' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=candidate' "$test_root/candidate.env" >/dev/null

if "$promote_script" \
  --current-env-file "$test_root/missing.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to reject a missing active environment." >&2
  exit 1
fi

if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/missing.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to reject a missing candidate environment." >&2
  exit 1
fi

if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/current.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to require distinct active and candidate files." >&2
  exit 1
fi

current_alias="$test_root/current-alias.env"
ln -s "$test_root/current.env" "$current_alias"
if "$promote_script" \
  --current-env-file "$current_alias" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to reject symbolic-link environment files." >&2
  exit 1
fi

previous_alias="$test_root/previous-alias.env"
ln -s "$test_root/current.env" "$previous_alias"
if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$previous_alias" \
  --confirm-promotion \
  --replace-previous >/dev/null 2>&1; then
  echo "Expected promotion to reject a symbolic-link rollback path." >&2
  exit 1
fi

previous_hardlink="$test_root/previous-hardlink.env"
ln "$test_root/current.env" "$previous_hardlink"
if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$previous_hardlink" \
  --confirm-promotion \
  --replace-previous >/dev/null 2>&1; then
  echo "Expected promotion to reject a rollback alias of the active file." >&2
  exit 1
fi

mkdir "$test_root/other"
cp "$test_root/candidate.env" "$test_root/other/candidate.env"
if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/other/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to require atomic same-directory replacement." >&2
  exit 1
fi

mkdir "$test_root/rollback-directory"
if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/rollback-directory" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to reject a rollback directory path." >&2
  exit 1
fi

if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/missing-directory/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to require an existing rollback directory." >&2
  exit 1
fi

printf 'RELEASE_MARKER=older-rollback\n' >"$test_root/previous.env"
if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to preserve an existing rollback file." >&2
  exit 1
fi
grep --fixed-strings 'RELEASE_MARKER=older-rollback' "$test_root/previous.env" >/dev/null

make_upgrade_files
: >"$MULTIFORUM_FAKE_CURL_LOG"
if MULTIFORUM_FAKE_GRAPHQL_FAIL=true \
  "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to stop when production verification fails." >&2
  exit 1
fi
grep --fixed-strings '/api/graphql' "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=known-good' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=candidate' "$test_root/candidate.env" >/dev/null
test ! -e "$test_root/previous.env"

if "$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --base-url http://forum.example.com \
  --confirm-promotion >/dev/null 2>&1; then
  echo "Expected promotion to propagate an invalid verification base URL." >&2
  exit 1
fi
test ! -e "$test_root/previous.env"

make_upgrade_files
: >"$MULTIFORUM_FAKE_CURL_LOG"
"$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --base-url https://override.example.com/ \
  --confirm-promotion >/dev/null

grep --fixed-strings 'https://override.example.com/api/graphql' "$MULTIFORUM_FAKE_CURL_LOG" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=candidate' "$test_root/current.env" >/dev/null
grep --fixed-strings 'SECRET=new-secret' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=known-good' "$test_root/previous.env" >/dev/null
grep --fixed-strings 'SECRET=old-secret' "$test_root/previous.env" >/dev/null
test ! -e "$test_root/candidate.env"
test "$(file_mode "$test_root/current.env")" = 600
test "$(file_mode "$test_root/previous.env")" = 600

printf 'RELEASE_MARKER=next-candidate\n' >"$test_root/candidate.env"
"$promote_script" \
  --current-env-file "$test_root/current.env" \
  --target-env-file "$test_root/candidate.env" \
  --previous-env-file "$test_root/previous.env" \
  --confirm-promotion \
  --replace-previous >/dev/null
grep --fixed-strings 'RELEASE_MARKER=next-candidate' "$test_root/current.env" >/dev/null
grep --fixed-strings 'RELEASE_MARKER=candidate' "$test_root/previous.env" >/dev/null

echo "Self-hosting upgrade promotion tests passed."
