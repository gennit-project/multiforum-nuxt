#!/usr/bin/env bash

set -euo pipefail

current_env_file=".env.production"
manifest_file=""
output_env_file=".env.production.next"
replace_existing=false
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/prepare-self-hosting-upgrade.sh --manifest PATH
       [--current-env-file PATH] [--output-env-file PATH]
       [--replace-existing]

Creates a protected candidate production environment by preserving the current
configuration and secrets while replacing only the release version and four
image references from a validated self-hosting release manifest. The output is
written atomically and is never the active environment file.
EOF
}

require_value() {
  local option="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    echo "$option requires a path." >&2
    usage >&2
    exit 2
  fi
}

absolute_file_path() {
  local file_path="$1"
  printf '%s/%s\n' "$(cd -- "$(dirname -- "$file_path")" && pwd)" "$(basename -- "$file_path")"
}

while (($# > 0)); do
  case "$1" in
    --manifest)
      require_value "$1" "${2:-}"
      manifest_file="$2"
      shift 2
      ;;
    --current-env-file)
      require_value "$1" "${2:-}"
      current_env_file="$2"
      shift 2
      ;;
    --output-env-file)
      require_value "$1" "${2:-}"
      output_env_file="$2"
      shift 2
      ;;
    --replace-existing)
      replace_existing=true
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

if [[ -z "$manifest_file" ]]; then
  echo "--manifest is required." >&2
  exit 2
fi
if [[ ! -f "$manifest_file" ]]; then
  echo "Release manifest not found: $manifest_file" >&2
  exit 1
fi
if [[ ! -f "$current_env_file" ]]; then
  echo "Current production environment file not found: $current_env_file" >&2
  exit 1
fi
if [[ -d "$output_env_file" ]]; then
  echo "Output environment path is a directory: $output_env_file" >&2
  exit 1
fi

current_env_file="$(absolute_file_path "$current_env_file")"
manifest_file="$(absolute_file_path "$manifest_file")"
output_dir="$(dirname -- "$output_env_file")"
mkdir -p "$output_dir"
output_dir="$(cd -- "$output_dir" && pwd)"
output_env_file="$output_dir/$(basename -- "$output_env_file")"

if [[ "$current_env_file" == "$output_env_file" ]]; then
  echo "Refusing to replace the active production environment file." >&2
  exit 1
fi
if [[ -e "$output_env_file" && "$current_env_file" -ef "$output_env_file" ]]; then
  echo "Refusing to replace an alias of the active production environment file." >&2
  exit 1
fi
if [[ (-e "$output_env_file" || -L "$output_env_file") && "$replace_existing" != true ]]; then
  echo "Output environment file already exists: $output_env_file" >&2
  echo "Pass --replace-existing only after reviewing or preserving it." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Required command not found: jq" >&2
  exit 1
fi
if ! command -v awk >/dev/null 2>&1; then
  echo "Required command not found: awk" >&2
  exit 1
fi

"$script_root/scripts/validate-self-hosting-release.sh" \
  --manifest "$manifest_file" >/dev/null

release_version="$(jq --raw-output '.release' "$manifest_file")"
database_image="$(jq --raw-output '.images.database' "$manifest_file")"
backend_image="$(jq --raw-output '.images.backend' "$manifest_file")"
frontend_image="$(jq --raw-output '.images.frontend' "$manifest_file")"
caddy_image="$(jq --raw-output '.images.caddy' "$manifest_file")"

temporary_output="$(mktemp "$output_dir/.multiforum-production-env.XXXXXX")"
trap 'rm -f "$temporary_output"' EXIT
chmod 600 "$temporary_output"

if ! awk \
  -v release="$release_version" \
  -v database="$database_image" \
  -v backend="$backend_image" \
  -v frontend="$frontend_image" \
  -v caddy="$caddy_image" '
    BEGIN {
      ordered_key[1] = "MULTIFORUM_RELEASE_VERSION"
      ordered_key[2] = "MULTIFORUM_NEO4J_IMAGE"
      ordered_key[3] = "MULTIFORUM_BACKEND_IMAGE"
      ordered_key[4] = "MULTIFORUM_FRONTEND_IMAGE"
      ordered_key[5] = "MULTIFORUM_CADDY_IMAGE"
      replacement[ordered_key[1]] = release
      replacement[ordered_key[2]] = database
      replacement[ordered_key[3]] = backend
      replacement[ordered_key[4]] = frontend
      replacement[ordered_key[5]] = caddy
    }
    {
      key = $0
      sub(/^[[:space:]]*(export[[:space:]]+)?/, "", key)
      sub(/=.*/, "", key)
      if (key in replacement && $0 ~ /^[[:space:]]*(export[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*=/) {
        seen[key]++
        if (seen[key] > 1) {
          printf "Duplicate release setting in current environment: %s\n", key > "/dev/stderr"
          duplicate = 1
        } else {
          printf "%s=%s\n", key, replacement[key]
        }
        next
      }
      print
    }
    END {
      for (key_index = 1; key_index <= 5; key_index++) {
        key = ordered_key[key_index]
        if (!(key in seen)) {
          printf "%s=%s\n", key, replacement[key]
        }
      }
      if (duplicate) {
        exit 42
      }
    }
  ' "$current_env_file" >"$temporary_output"; then
  echo "Candidate environment was not created." >&2
  exit 1
fi

"$script_root/scripts/validate-self-hosting-release.sh" \
  --manifest "$manifest_file" \
  --env-file "$temporary_output" >/dev/null

mv -f "$temporary_output" "$output_env_file"
trap - EXIT

echo "Prepared protected upgrade environment: $output_env_file"
echo "Review it, then pass it to scripts/upgrade-self-hosting.sh."
