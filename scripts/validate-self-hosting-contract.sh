#!/usr/bin/env bash

set -euo pipefail

contract_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
contract_tmp_dir="$(mktemp -d)"
terraform_dir="$contract_root/deploy/terraform/aws-single-vm"
terraform_image="hashicorp/terraform:1.8.5"
caddy_image="caddy:2.11.4-alpine"

trap 'rm -rf "$contract_tmp_dir"' EXIT

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

run_terraform() {
  docker run --rm \
    --user "$(id -u):$(id -g)" \
    --volume "$terraform_dir:/workspace" \
    --workdir /workspace \
    "$terraform_image" \
    "$@"
}

require_command docker
require_command jq

cd "$contract_root"

echo "Testing the production cold-backup command..."
scripts/self-hosting-tests/backup-self-hosting.test.sh

echo "Testing the guarded production restore command..."
scripts/self-hosting-tests/restore-self-hosting.test.sh

echo "Validating the image-based quick-start contract..."
docker compose \
  --env-file .env.quickstart.example \
  config --format json >"$contract_tmp_dir/quickstart.json"

jq --exit-status '
  .services.database.image == "neo4j:5.1.0" and
  .services.backend.image == "ghcr.io/gennit-project/multiforum-backend:edge" and
  .services.frontend.image == "ghcr.io/gennit-project/multiforum-nuxt:edge" and
  (.services.backend.build == null) and
  (.services.frontend.build == null) and
  .services.backend.environment.MULTIFORUM_AUTH_PROVIDER == "local-dev" and
  .services.frontend.environment.NUXT_PUBLIC_AUTH_PROVIDER == "local-dev" and
  (.services.caddy == null) and
  ([
    .services.database.ports[],
    .services.backend.ports[],
    .services.frontend.ports[]
  ] | all(.host_ip == "127.0.0.1"))
' "$contract_tmp_dir/quickstart.json" >/dev/null

echo "Validating the contributor source-build override..."
docker compose \
  --env-file .env.quickstart.example \
  --file docker-compose.yml \
  --file docker-compose.source.yml \
  config --format json >"$contract_tmp_dir/source.json"

jq --exit-status '
  .services.backend.image == "multiforum-backend:quickstart" and
  .services.backend.pull_policy == "build" and
  .services.backend.build.dockerfile == "docker/backend.Dockerfile" and
  .services.backend.build.args.MULTIFORUM_BACKEND_REF == "main" and
  .services.frontend.image == "multiforum-frontend:quickstart" and
  .services.frontend.pull_policy == "build" and
  .services.frontend.build.dockerfile == "Dockerfile"
' "$contract_tmp_dir/source.json" >/dev/null

echo "Confirming production configuration rejects missing secrets..."
if env NEO4J_PASSWORD= docker compose \
  --env-file .env.production.example \
  --file docker-compose.yml \
  --file docker-compose.production.yml \
  config --quiet >"$contract_tmp_dir/missing-secrets.log" 2>&1; then
  echo "Production Compose unexpectedly accepted an empty NEO4J_PASSWORD." >&2
  exit 1
fi

echo "Validating the production overlay contract..."
env \
  NEO4J_PASSWORD=contract-neo4j \
  MULTIFORUM_SUPERADMIN_EMAIL=admin@example.com \
  PLUGIN_SECRET_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef \
  AUTH0_DOMAIN=auth.example.com \
  AUTH0_CLIENT_ID=contract-client \
  AUTH0_AUDIENCE=https://api.example.com \
  NUXT_AUTH0_CLIENT_SECRET=contract-client-secret \
  NUXT_AUTH0_SESSION_SECRET=0123456789abcdef0123456789abcdef \
  CADDY_ACME_EMAIL=admin@example.com \
  MULTIFORUM_DOMAIN=forum.example.com \
  MULTIFORUM_NEO4J_IMAGE=neo4j:contract \
  MULTIFORUM_BACKEND_IMAGE=ghcr.io/example/backend:contract \
  MULTIFORUM_FRONTEND_IMAGE=ghcr.io/example/frontend:contract \
  MULTIFORUM_CADDY_IMAGE=caddy:contract \
  docker compose \
    --env-file .env.production.example \
    --file docker-compose.yml \
    --file docker-compose.production.yml \
    config --format json >"$contract_tmp_dir/production.json"

jq --exit-status '
  .services.database.image == "neo4j:contract" and
  .services.backend.image == "ghcr.io/example/backend:contract" and
  .services.frontend.image == "ghcr.io/example/frontend:contract" and
  .services.caddy.image == "caddy:contract" and
  ([.services[] | .build] | all(. == null)) and
  .services.backend.environment.NODE_ENV == "production" and
  .services.backend.environment.MULTIFORUM_AUTH_PROVIDER == "auth0" and
  .services.backend.environment.FRONTEND_URL == "https://forum.example.com" and
  .services.frontend.environment.NODE_ENV == "production" and
  .services.frontend.environment.NUXT_PUBLIC_AUTH_PROVIDER == "auth0" and
  .services.frontend.environment.NUXT_PUBLIC_BASE_URL == "https://forum.example.com" and
  ([
    .services.database.ports[],
    .services.backend.ports[],
    .services.frontend.ports[]
  ] | all(.host_ip == "127.0.0.1")) and
  ([
    .services[] | .ports[]? | select(.host_ip == null) |
    {published: (.published | tonumber), protocol: .protocol}
  ] | sort_by(.published, .protocol)) == [
    {published: 80, protocol: "tcp"},
    {published: 443, protocol: "tcp"},
    {published: 443, protocol: "udp"}
  ] and
  any(.services.frontend.volumes[];
    .type == "volume" and .target == "/app/data") and
  any(.services.caddy.volumes[];
    .type == "bind" and .target == "/etc/caddy/Caddyfile" and .read_only == true)
' "$contract_tmp_dir/production.json" >/dev/null

echo "Validating the Caddy production configuration..."
docker run --rm \
  --env MULTIFORUM_DOMAIN=forum.example.com \
  --env CADDY_ACME_EMAIL=admin@example.com \
  --volume "$contract_root/deploy/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  "$caddy_image" \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

echo "Validating and testing the Terraform example..."
run_terraform fmt -check -recursive
run_terraform init -backend=false -input=false
run_terraform validate
run_terraform test

echo "All self-hosting deployment contracts passed."
