#!/usr/bin/env bash

set -euo pipefail

env_file=".env.production"
base_url=""
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/verify-self-hosting.sh [--env-file PATH] [--base-url URL]

Verifies the selected production images, container health, public HTTPS
security headers, and the same-origin GraphQL proxy. This command is read-only.
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
    --env-file)
      if [[ -z "${2:-}" ]]; then
        echo "--env-file requires a path." >&2
        usage >&2
        exit 2
      fi
      env_file="$2"
      shift 2
      ;;
    --base-url)
      if [[ -z "${2:-}" ]]; then
        echo "--base-url requires an HTTPS URL." >&2
        usage >&2
        exit 2
      fi
      base_url="$2"
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

if [[ ! -f "$env_file" ]]; then
  echo "Production environment file not found: $env_file" >&2
  exit 1
fi

if [[ -n "$base_url" && "$base_url" != https://* ]]; then
  echo "Production verification requires an HTTPS base URL." >&2
  exit 1
fi

require_command docker
require_command jq
require_command curl
require_command grep
require_command tr

env_file="$(cd -- "$(dirname -- "$env_file")" && pwd)/$(basename -- "$env_file")"
compose=(
  docker compose
  --env-file "$env_file"
  --file "$script_root/docker-compose.yml"
  --file "$script_root/docker-compose.production.yml"
)

compose_config="$("${compose[@]}" config --format json)"

if [[ -z "$base_url" ]]; then
  configured_domain="$(jq --raw-output '.services.caddy.environment.MULTIFORUM_DOMAIN // empty' <<<"$compose_config")"
  if [[ -z "$configured_domain" ]]; then
    echo "Production Compose did not resolve MULTIFORUM_DOMAIN." >&2
    exit 1
  fi
  base_url="https://$configured_domain"
fi
base_url="${base_url%/}"

echo "Verifying configured images and container health..."
for service in database backend frontend caddy; do
  expected_image="$(jq --raw-output --arg service "$service" '.services[$service].image // empty' <<<"$compose_config")"
  container_id="$("${compose[@]}" ps -q "$service")"

  if [[ -z "$container_id" || "$container_id" == *$'\n'* ]]; then
    echo "Expected exactly one container for production service: $service" >&2
    exit 1
  fi

  inspect_result="$(docker inspect \
    --format '{{.Config.Image}}|{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
    "$container_id")"
  IFS='|' read -r running_image container_status health_status <<<"$inspect_result"

  if [[ "$running_image" != "$expected_image" ]]; then
    echo "Running image does not match the selected configuration: $service" >&2
    echo "Configured: $expected_image" >&2
    echo "Running:    $running_image" >&2
    exit 1
  fi

  if [[ "$container_status" != running ]]; then
    echo "Production container is not running: $service ($container_status)" >&2
    exit 1
  fi

  if [[ "$health_status" != none && "$health_status" != healthy ]]; then
    echo "Production container is not healthy: $service ($health_status)" >&2
    exit 1
  fi

  if [[ "$service" != caddy && "$health_status" != healthy ]]; then
    echo "Production container has no healthy status: $service ($health_status)" >&2
    exit 1
  fi
done

echo "Verifying public HTTPS and Caddy security headers..."
home_response="$(curl \
  --fail \
  --silent \
  --show-error \
  --include \
  --max-time 30 \
  "$base_url/")"
home_response="$(tr -d '\r' <<<"$home_response")"

if ! grep --ignore-case --extended-regexp '^strict-transport-security:.*max-age=31536000' <<<"$home_response" >/dev/null; then
  echo "Public response is missing the expected Strict-Transport-Security header." >&2
  exit 1
fi
if ! grep --ignore-case --extended-regexp '^x-content-type-options:[[:space:]]*nosniff' <<<"$home_response" >/dev/null; then
  echo "Public response is missing the expected X-Content-Type-Options header." >&2
  exit 1
fi
if ! grep --ignore-case --extended-regexp '^referrer-policy:[[:space:]]*strict-origin-when-cross-origin' <<<"$home_response" >/dev/null; then
  echo "Public response is missing the expected Referrer-Policy header." >&2
  exit 1
fi

echo "Verifying the public GraphQL proxy..."
graphql_response="$(curl \
  --fail \
  --silent \
  --show-error \
  --max-time 30 \
  --header 'content-type: application/json' \
  --data '{"query":"query SelfHostingVerification { __typename }"}' \
  "$base_url/api/graphql")"

if ! jq --exit-status '
  .data.__typename == "Query" and
  ((.errors // []) | length == 0)
' <<<"$graphql_response" >/dev/null; then
  echo "The public GraphQL proxy did not return the expected read-only response." >&2
  exit 1
fi

echo "Production verification passed: $base_url"
