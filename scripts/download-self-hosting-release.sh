#!/usr/bin/env bash

set -euo pipefail

release_version=""
output_file=""
replace_existing=false
verify_attestation=false
official_repository="gennit-project/multiforum-nuxt"
official_signer_workflow="${official_repository}/.github/workflows/container-image.yml"
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/download-self-hosting-release.sh --release VERSION
       [--output PATH] [--replace-existing] [--verify-attestation]

Downloads one version-pinned self-hosting manifest from Multiforum's official
GitHub Release, validates its schema and image references, confirms that its
declared version matches VERSION, and writes it atomically. VERSION must be
SemVer without a leading v. --verify-attestation additionally requires the
GitHub CLI and verifies signed provenance from the official release workflow.
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
    --output)
      require_value "$1" "${2:-}"
      output_file="$2"
      shift 2
      ;;
    --replace-existing)
      replace_existing=true
      shift
      ;;
    --verify-attestation)
      verify_attestation=true
      shift
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

if [[ -z "$release_version" ]]; then
  echo "--release is required." >&2
  exit 2
fi
if [[ ! "$release_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
  echo "Release version must be SemVer without a leading v." >&2
  exit 1
fi

asset_name="multiforum-self-hosting-${release_version}.json"
output_file="${output_file:-$asset_name}"
if [[ -d "$output_file" ]]; then
  echo "Release manifest output path is a directory: $output_file" >&2
  exit 1
fi
if [[ (-e "$output_file" || -L "$output_file") && "$replace_existing" != true ]]; then
  echo "Release manifest already exists: $output_file" >&2
  echo "Pass --replace-existing only after reviewing or preserving it." >&2
  exit 1
fi
if [[ -L "$output_file" ]]; then
  echo "Release manifest output path must not be a symbolic link: $output_file" >&2
  exit 1
fi

for required_command in curl jq; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Required command not found: $required_command" >&2
    exit 1
  fi
done
if [[ "$verify_attestation" == true ]] && ! command -v gh >/dev/null 2>&1; then
  echo "Required command not found for attestation verification: gh" >&2
  exit 1
fi

output_dir="$(dirname -- "$output_file")"
mkdir -p "$output_dir"
output_dir="$(cd -- "$output_dir" && pwd)"
output_file="$output_dir/$(basename -- "$output_file")"
temporary_output="$(mktemp "$output_dir/.multiforum-release-download.XXXXXX")"
trap 'rm -f "$temporary_output"' EXIT

release_url="https://github.com/${official_repository}/releases/download/v${release_version}/${asset_name}"
echo "Downloading official Multiforum self-hosting release: $release_version"
curl \
  --fail \
  --location \
  --silent \
  --show-error \
  --connect-timeout 15 \
  --max-time 120 \
  --proto '=https' \
  --proto-redir '=https' \
  --output "$temporary_output" \
  "$release_url"

"$script_root/scripts/validate-self-hosting-release.sh" \
  --manifest "$temporary_output" >/dev/null

downloaded_version="$(jq --raw-output '.release' "$temporary_output")"
if [[ "$downloaded_version" != "$release_version" ]]; then
  echo "Downloaded manifest version does not match the requested release." >&2
  echo "Requested:  $release_version" >&2
  echo "Downloaded: $downloaded_version" >&2
  exit 1
fi

if [[ "$verify_attestation" == true ]]; then
  echo "Verifying signed provenance for the release manifest"
  gh attestation verify "$temporary_output" \
    --repo "$official_repository" \
    --signer-workflow "$official_signer_workflow" \
    --source-ref "refs/tags/v${release_version}" >/dev/null
fi

chmod 644 "$temporary_output"
mv -f "$temporary_output" "$output_file"
trap - EXIT

echo "Downloaded and validated release manifest: $output_file"
