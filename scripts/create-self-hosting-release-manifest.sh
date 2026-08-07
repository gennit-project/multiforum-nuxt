#!/usr/bin/env bash

set -euo pipefail

release_version=""
frontend_image=""
components_file=""
output_file=""
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/create-self-hosting-release-manifest.sh --release VERSION
       --frontend-image IMAGE --output PATH [--components PATH]

Creates and validates a self-hosting release manifest by combining the curated
backend and infrastructure image pins with one published frontend image. VERSION
must be SemVer without a leading v. The output is replaced atomically.
EOF
}

require_value() {
  local option="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    echo "$option requires a value." >&2
    usage >&2
    exit 2
  fi
}

while (($# > 0)); do
  case "$1" in
    --release)
      require_value "$1" "${2:-}"
      release_version="$2"
      shift 2
      ;;
    --frontend-image)
      require_value "$1" "${2:-}"
      frontend_image="$2"
      shift 2
      ;;
    --components)
      require_value "$1" "${2:-}"
      components_file="$2"
      shift 2
      ;;
    --output)
      require_value "$1" "${2:-}"
      output_file="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$release_version" || -z "$frontend_image" || -z "$output_file" ]]; then
  echo "--release, --frontend-image, and --output are required." >&2
  exit 2
fi

components_file="${components_file:-$script_root/deploy/releases/release-components.json}"
if [[ ! -f "$components_file" ]]; then
  echo "Release components file not found: $components_file" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Required command not found: jq" >&2
  exit 1
fi

if [[ ! "$release_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
  echo "Release version must be SemVer without a leading v." >&2
  exit 1
fi

if ! jq --exit-status '
  type == "object" and
  .schemaVersion == 1 and
  (.images | type == "object") and
  (.images | keys | sort) == ["backend", "caddy", "database"] and
  ([.images[] | type == "string" and length > 0] | all)
' "$components_file" >/dev/null; then
  echo "Release components do not satisfy schema version 1." >&2
  exit 1
fi

output_dir="$(dirname -- "$output_file")"
mkdir -p "$output_dir"
output_dir="$(cd -- "$output_dir" && pwd)"
output_file="$output_dir/$(basename -- "$output_file")"
temporary_output="$(mktemp "$output_dir/.multiforum-release.XXXXXX")"
trap 'rm -f "$temporary_output"' EXIT

jq --sort-keys \
  --arg release "$release_version" \
  --arg frontend "$frontend_image" '
    {
      schemaVersion: .schemaVersion,
      release: $release,
      images: {
        database: .images.database,
        backend: .images.backend,
        frontend: $frontend,
        caddy: .images.caddy
      }
    }
  ' "$components_file" >"$temporary_output"

"$script_root/scripts/validate-self-hosting-release.sh" \
  --manifest "$temporary_output" >/dev/null

mv "$temporary_output" "$output_file"
trap - EXIT

echo "Self-hosting release manifest created: $output_file"
