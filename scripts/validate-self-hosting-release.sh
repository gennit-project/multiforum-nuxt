#!/usr/bin/env bash

set -euo pipefail

manifest_file=""
env_file=""
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/validate-self-hosting-release.sh --manifest PATH
       [--env-file PATH]

Validates a Multiforum self-hosting release manifest. When --env-file is
provided, also confirms that the resolved production Compose stack selects the
release version and exact image set declared by the manifest. This command is
read-only.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

while (($# > 0)); do
  case "$1" in
    --manifest)
      if [[ -z "${2:-}" ]]; then
        echo "--manifest requires a path." >&2
        usage >&2
        exit 2
      fi
      manifest_file="$2"
      shift 2
      ;;
    --env-file)
      if [[ -z "${2:-}" ]]; then
        echo "--env-file requires a path." >&2
        usage >&2
        exit 2
      fi
      env_file="$2"
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

if [[ -z "$manifest_file" ]]; then
  echo "--manifest is required." >&2
  exit 2
fi
if [[ ! -f "$manifest_file" ]]; then
  echo "Release manifest not found: $manifest_file" >&2
  exit 1
fi
if [[ -n "$env_file" && ! -f "$env_file" ]]; then
  echo "Production environment file not found: $env_file" >&2
  exit 1
fi

require_command jq

if ! jq --exit-status '
  type == "object" and
  .schemaVersion == 1 and
  (.release | type == "string" and test("^[0-9]+\\.[0-9]+\\.[0-9]+(-[0-9A-Za-z.-]+)?(\\+[0-9A-Za-z.-]+)?$")) and
  (.images | type == "object") and
  (.images | keys | sort) == ["backend", "caddy", "database", "frontend"] and
  ([.images[] | type == "string" and length > 0] | all)
' "$manifest_file" >/dev/null; then
  echo "Release manifest does not satisfy schema version 1." >&2
  exit 1
fi

release_version="$(jq --raw-output '.release' "$manifest_file")"

is_digest_reference() {
  [[ "$1" =~ @sha256:[a-fA-F0-9]{64}$ ]]
}

is_application_release_reference() {
  local image="$1"
  local repository="$2"
  local tag

  if is_digest_reference "$image"; then
    [[ "$image" == "$repository"@sha256:* ]]
    return
  fi

  [[ "$image" == "$repository":* ]] || return 1
  tag="${image##*:}"
  [[ "$tag" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ||
    "$tag" =~ ^sha-[a-fA-F0-9]{7,40}$ ]]
}

is_pinned_infrastructure_reference() {
  local image="$1"
  local image_name
  local tag

  if is_digest_reference "$image"; then
    return 0
  fi

  image_name="${image##*/}"
  [[ "$image_name" == *:* ]] || return 1
  tag="$(tr '[:upper:]' '[:lower:]' <<<"${image_name##*:}")"
  case "$tag" in
    ""|edge|latest|main|master|nightly|dev|development)
      return 1
      ;;
  esac
}

backend_image="$(jq --raw-output '.images.backend' "$manifest_file")"
frontend_image="$(jq --raw-output '.images.frontend' "$manifest_file")"
database_image="$(jq --raw-output '.images.database' "$manifest_file")"
caddy_image="$(jq --raw-output '.images.caddy' "$manifest_file")"

if ! is_application_release_reference "$backend_image" "ghcr.io/gennit-project/multiforum-backend"; then
  echo "Backend image must use the official repository and an exact release, sha-* tag, or digest." >&2
  exit 1
fi
if ! is_application_release_reference "$frontend_image" "ghcr.io/gennit-project/multiforum-nuxt"; then
  echo "Frontend image must use the official repository and an exact release, sha-* tag, or digest." >&2
  exit 1
fi
if ! is_pinned_infrastructure_reference "$database_image"; then
  echo "Database image must use an explicit non-floating tag or SHA-256 digest." >&2
  exit 1
fi
if ! is_pinned_infrastructure_reference "$caddy_image"; then
  echo "Caddy image must use an explicit non-floating tag or SHA-256 digest." >&2
  exit 1
fi

if [[ -n "$env_file" ]]; then
  require_command docker
  env_file="$(cd -- "$(dirname -- "$env_file")" && pwd)/$(basename -- "$env_file")"
  compose_config="$(docker compose \
    --env-file "$env_file" \
    --file "$script_root/docker-compose.yml" \
    --file "$script_root/docker-compose.production.yml" \
    config --format json)"

  if ! jq --exit-status \
    --arg release "$release_version" \
    --arg database "$database_image" \
    --arg backend "$backend_image" \
    --arg frontend "$frontend_image" \
    --arg caddy "$caddy_image" '
      .services.database.image == $database and
      .services.backend.image == $backend and
      .services.frontend.image == $frontend and
      .services.caddy.image == $caddy and
      ([.services[] |
        .labels["net.multiforum.release"] == $release
      ] | all)
    ' <<<"$compose_config" >/dev/null; then
    echo "Production Compose does not match release $release_version." >&2
    exit 1
  fi
fi

echo "Self-hosting release contract passed: $release_version"
