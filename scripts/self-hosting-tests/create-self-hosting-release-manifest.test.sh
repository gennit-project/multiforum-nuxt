#!/usr/bin/env bash

set -euo pipefail

test_root="$(mktemp -d)"
repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
creator="$repository_root/scripts/create-self-hosting-release-manifest.sh"
validator="$repository_root/scripts/validate-self-hosting-release.sh"

trap 'rm -rf "$test_root"' EXIT

components_file="$test_root/components.json"
cat >"$components_file" <<'EOF'
{
  "schemaVersion": 1,
  "images": {
    "database": "neo4j:5.1.0",
    "backend": "ghcr.io/gennit-project/multiforum-backend:sha-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "caddy": "caddy:2.11.4-alpine"
  }
}
EOF

output_file="$test_root/release.json"
frontend_digest="ghcr.io/gennit-project/multiforum-nuxt@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

"$creator" --help | grep --fixed-strings -- "--frontend-image IMAGE" >/dev/null
"$creator" \
  --release 1.2.3 \
  --frontend-image "$frontend_digest" \
  --components "$components_file" \
  --output "$output_file" >/dev/null

jq --exit-status \
  --arg frontend "$frontend_digest" '
    .schemaVersion == 1 and
    .release == "1.2.3" and
    .images.database == "neo4j:5.1.0" and
    .images.backend == "ghcr.io/gennit-project/multiforum-backend:sha-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" and
    .images.frontend == $frontend and
    .images.caddy == "caddy:2.11.4-alpine"
  ' "$output_file" >/dev/null
"$validator" --manifest "$output_file" >/dev/null

if "$creator" \
  --release v1.2.3 \
  --frontend-image "$frontend_digest" \
  --components "$components_file" \
  --output "$test_root/invalid-version.json" >/dev/null 2>&1; then
  echo "Expected creation to reject a leading-v release version." >&2
  exit 1
fi

if "$creator" \
  --release 1.2.3 \
  --frontend-image ghcr.io/gennit-project/multiforum-nuxt:edge \
  --components "$components_file" \
  --output "$test_root/floating.json" >/dev/null 2>&1; then
  echo "Expected creation to reject a floating frontend image." >&2
  exit 1
fi

invalid_components="$test_root/invalid-components.json"
jq '.images.frontend = "unexpected"' "$components_file" >"$invalid_components"
if "$creator" \
  --release 1.2.3 \
  --frontend-image "$frontend_digest" \
  --components "$invalid_components" \
  --output "$test_root/invalid-components-release.json" >/dev/null 2>&1; then
  echo "Expected creation to reject an unknown curated component." >&2
  exit 1
fi

floating_backend="$test_root/floating-backend.json"
jq '.images.backend = "ghcr.io/gennit-project/multiforum-backend:edge"' \
  "$components_file" >"$floating_backend"
if "$creator" \
  --release 1.2.3 \
  --frontend-image "$frontend_digest" \
  --components "$floating_backend" \
  --output "$test_root/floating-backend-release.json" >/dev/null 2>&1; then
  echo "Expected creation to reject a floating curated backend image." >&2
  exit 1
fi

if [[ -e "$test_root/floating-backend-release.json" ]]; then
  echo "Failed creation must not leave a release manifest behind." >&2
  exit 1
fi

echo "Self-hosting release-manifest creation tests passed."
