#!/usr/bin/env bash

set -euo pipefail

manifest_file=""
project_name=""
script_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
smoke_tmp_dir=""

usage() {
  cat <<'EOF'
Usage: scripts/smoke-self-hosting-release.sh --manifest PATH
       [--project-name NAME]

Starts the database, backend, and frontend images selected by a self-hosting
release manifest, verifies bootstrap, GraphQL proxying, and local sign-in, and
then deletes all smoke-test containers and volumes. The selected Caddy image is
also used to validate the production Caddyfile.
EOF
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
    --project-name)
      if [[ -z "${2:-}" ]]; then
        echo "--project-name requires a value." >&2
        usage >&2
        exit 2
      fi
      project_name="$2"
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

"$script_root/scripts/validate-self-hosting-release.sh" \
  --manifest "$manifest_file" >/dev/null

for command in docker jq curl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Required command not found: $command" >&2
    exit 1
  fi
done

release_version="$(jq --raw-output '.release' "$manifest_file")"
database_image="$(jq --raw-output '.images.database' "$manifest_file")"
backend_image="$(jq --raw-output '.images.backend' "$manifest_file")"
frontend_image="$(jq --raw-output '.images.frontend' "$manifest_file")"
caddy_image="$(jq --raw-output '.images.caddy' "$manifest_file")"

if [[ -z "$project_name" ]]; then
  project_name="multiforum-release-${release_version//./-}-$$"
fi
if [[ ! "$project_name" =~ ^[a-z0-9][a-z0-9_-]{1,62}$ ]]; then
  echo "Project name must contain 2-63 lowercase letters, digits, underscores, or hyphens." >&2
  exit 2
fi

echo "Validating the selected Caddy image and production configuration..."
docker run --rm \
  --env MULTIFORUM_DOMAIN=forum.example.com \
  --env CADDY_ACME_EMAIL=admin@example.com \
  --volume "$script_root/deploy/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  "$caddy_image" \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

smoke_tmp_dir="$(mktemp -d)"
cookie_file="$smoke_tmp_dir/cookies.txt"
compose=(
  docker compose
  --project-name "$project_name"
  --env-file "$script_root/.env.quickstart.example"
  --file "$script_root/docker-compose.yml"
)

cleanup() {
  local status=$?
  trap - EXIT

  if [[ "$status" -ne 0 ]]; then
    echo "Release-bundle smoke test failed; showing service state and logs." >&2
    "${compose[@]}" ps >&2 || true
    "${compose[@]}" logs --no-color --tail=200 database backend frontend >&2 || true
  fi

  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$smoke_tmp_dir"
  exit "$status"
}
trap cleanup EXIT

export MULTIFORUM_NEO4J_IMAGE="$database_image"
export MULTIFORUM_BACKEND_IMAGE="$backend_image"
export MULTIFORUM_FRONTEND_IMAGE="$frontend_image"
export MULTIFORUM_BACKEND_PULL_POLICY=never
export MULTIFORUM_FRONTEND_PULL_POLICY=never
export MULTIFORUM_INSTANCE_NAME="Multiforum Release $release_version"
export MULTIFORUM_BOOTSTRAP_EMAIL=release-smoke@multiforum.local
export MULTIFORUM_BOOTSTRAP_USERNAME=release-smoke-admin
export MULTIFORUM_BOOTSTRAP_PASSWORD=multiforum-release-smoke-password
export NEO4J_PASSWORD=multiforum-release-smoke-neo4j
export MULTIFORUM_BIND_ADDRESS=127.0.0.1
export MULTIFORUM_PUBLIC_FRONTEND_URL=http://127.0.0.1:3000

echo "Starting the coordinated release application stack..."
"${compose[@]}" up -d --wait --wait-timeout 300 database backend frontend

base_url=http://127.0.0.1:3000
echo "Verifying the frontend and same-origin GraphQL proxy..."
curl --fail --silent --show-error --max-time 30 "$base_url/" >/dev/null
graphql_response="$(curl \
  --fail \
  --silent \
  --show-error \
  --max-time 30 \
  --header 'content-type: application/json' \
  --data '{"query":"query ReleaseSmoke { __typename }"}' \
  "$base_url/api/graphql")"
if ! jq --exit-status '
  .data.__typename == "Query" and
  ((.errors // []) | length == 0)
' <<<"$graphql_response" >/dev/null; then
  echo "Release GraphQL proxy did not return the expected response." >&2
  exit 1
fi

echo "Verifying bootstrap credentials through the frontend sign-in boundary..."
login_response="$(curl \
  --fail \
  --silent \
  --show-error \
  --max-time 30 \
  --cookie-jar "$cookie_file" \
  --header 'content-type: application/json' \
  --data '{"password":"multiforum-release-smoke-password"}' \
  "$base_url/api/auth/local-dev/login")"
if ! jq --exit-status '.authenticated == true' <<<"$login_response" >/dev/null; then
  echo "Release local sign-in did not establish a session." >&2
  exit 1
fi

profile_response="$(curl \
  --fail \
  --silent \
  --show-error \
  --max-time 30 \
  --cookie "$cookie_file" \
  "$base_url/api/session/profile")"
if ! jq --exit-status '
  .isAuthenticated == true and
  .username == "release-smoke-admin"
' <<<"$profile_response" >/dev/null; then
  echo "Release session did not resolve the bootstrapped administrator." >&2
  exit 1
fi

echo "Self-hosting release bundle passed: $release_version"
