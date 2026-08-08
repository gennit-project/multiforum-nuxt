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

echo "Testing the production release/version contract..."
scripts/self-hosting-tests/validate-self-hosting-release.test.sh
scripts/self-hosting-tests/create-self-hosting-release-manifest.test.sh
scripts/self-hosting-tests/download-self-hosting-release.test.sh
scripts/self-hosting-tests/smoke-self-hosting-release.test.sh
scripts/self-hosting-tests/prepare-self-hosting-upgrade.test.sh
scripts/validate-self-hosting-release.sh \
  --manifest deploy/releases/self-hosting-release.example.json
scripts/create-self-hosting-release-manifest.sh \
  --release 0.0.0-contract \
  --frontend-image ghcr.io/gennit-project/multiforum-nuxt:sha-1234567 \
  --output "$contract_tmp_dir/current-release-components.json"

grep --fixed-strings \
  'scripts/create-self-hosting-release-manifest.sh' \
  .github/workflows/container-image.yml >/dev/null
grep --fixed-strings \
  'gh release upload "$GITHUB_REF_NAME"' \
  .github/workflows/container-image.yml >/dev/null
grep --fixed-strings \
  'scripts/smoke-self-hosting-release.sh' \
  .github/workflows/container-image.yml >/dev/null
grep --fixed-strings \
  'uses: actions/attest@v4' \
  .github/workflows/container-image.yml >/dev/null
grep --fixed-strings \
  'subject-digest: ${{ steps.build.outputs.digest }}' \
  .github/workflows/container-image.yml >/dev/null
grep --fixed-strings \
  'subject-path: ${{ steps.release-manifest.outputs.path }}' \
  .github/workflows/container-image.yml >/dev/null
grep --fixed-strings \
  'actions: write' \
  .github/workflows/release-please.yml >/dev/null
grep --fixed-strings \
  "if: steps.release.outputs.release_created == 'true'" \
  .github/workflows/release-please.yml >/dev/null
grep --fixed-strings \
  'gh workflow run container-image.yml' \
  .github/workflows/release-please.yml >/dev/null
grep --fixed-strings -- \
  '--ref "$RELEASE_TAG"' \
  .github/workflows/release-please.yml >/dev/null

echo "Testing the production cold-backup command..."
scripts/self-hosting-tests/backup-self-hosting.test.sh

echo "Testing encrypted off-site backup uploads..."
scripts/self-hosting-tests/upload-self-hosting-backup.test.sh
scripts/self-hosting-tests/check-self-hosting-backups.test.sh
if command -v restic >/dev/null 2>&1; then
  scripts/self-hosting-tests/upload-self-hosting-backup.integration.test.sh
elif [[ "${MULTIFORUM_REQUIRE_RESTIC_INTEGRATION:-false}" == true ]]; then
  echo "Required command not found: restic" >&2
  exit 1
else
  echo "Skipping the real Restic integration test because restic is unavailable."
fi

echo "Testing the guarded production restore command..."
scripts/self-hosting-tests/restore-self-hosting.test.sh

echo "Drilling backup and restore against disposable Docker volumes..."
scripts/self-hosting-tests/backup-restore.integration.test.sh

echo "Testing the safe production upgrade command..."
scripts/self-hosting-tests/upgrade-self-hosting.test.sh

echo "Testing production verification..."
scripts/self-hosting-tests/verify-self-hosting.test.sh

echo "Testing guarded upgrade promotion..."
scripts/self-hosting-tests/promote-self-hosting-upgrade.test.sh

echo "Testing guarded upgrade rollback..."
scripts/self-hosting-tests/rollback-self-hosting-upgrade.test.sh

echo "Validating the systemd backup schedule..."
grep --fixed-strings \
  'EnvironmentFile=/etc/multiforum/backup.env' \
  deploy/systemd/multiforum-backup.service >/dev/null
grep --fixed-strings \
  'ExecStart=/opt/multiforum/scripts/backup-self-hosting.sh --env-file ${MULTIFORUM_BACKUP_ENV_FILE} --output-dir ${MULTIFORUM_BACKUP_OUTPUT_DIR} --retention-count ${MULTIFORUM_BACKUP_RETENTION_COUNT}' \
  deploy/systemd/multiforum-backup.service >/dev/null
grep --fixed-strings 'UMask=0077' \
  deploy/systemd/multiforum-backup.service >/dev/null
grep --fixed-strings 'OnCalendar=daily' \
  deploy/systemd/multiforum-backup.timer >/dev/null
grep --fixed-strings 'Persistent=true' \
  deploy/systemd/multiforum-backup.timer >/dev/null
grep --fixed-strings 'RandomizedDelaySec=30m' \
  deploy/systemd/multiforum-backup.timer >/dev/null
grep --fixed-strings \
  'EnvironmentFile=/etc/multiforum/restic.env' \
  deploy/systemd/multiforum-backup-offsite.conf >/dev/null
grep --fixed-strings \
  'ExecStartPost=/opt/multiforum/scripts/upload-self-hosting-backup.sh --backup-root ${MULTIFORUM_BACKUP_OUTPUT_DIR} --keep-daily ${MULTIFORUM_BACKUP_RESTIC_KEEP_DAILY} --tag ${MULTIFORUM_BACKUP_RESTIC_TAG}' \
  deploy/systemd/multiforum-backup-offsite.conf >/dev/null
grep --fixed-strings 'RESTIC_PASSWORD_FILE=/etc/multiforum/restic-password' \
  deploy/systemd/multiforum-restic.env.example >/dev/null
grep --fixed-strings 'MULTIFORUM_BACKUP_RESTIC_KEEP_DAILY=30' \
  deploy/systemd/multiforum-restic.env.example >/dev/null

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
if env \
  MULTIFORUM_RELEASE_VERSION=1.2.3 \
  MULTIFORUM_NEO4J_IMAGE=neo4j:5.1.0 \
  MULTIFORUM_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:1.2.3 \
  MULTIFORUM_FRONTEND_IMAGE=ghcr.io/gennit-project/multiforum-nuxt:1.2.3 \
  MULTIFORUM_CADDY_IMAGE=caddy:2.11.4-alpine \
  NEO4J_PASSWORD= \
  docker compose \
  --env-file .env.production.example \
  --file docker-compose.yml \
  --file docker-compose.production.yml \
  config --quiet >"$contract_tmp_dir/missing-secrets.log" 2>&1; then
  echo "Production Compose unexpectedly accepted an empty NEO4J_PASSWORD." >&2
  exit 1
fi

echo "Confirming production configuration rejects a missing release identity..."
if env \
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
  MULTIFORUM_RELEASE_VERSION= \
  MULTIFORUM_NEO4J_IMAGE=neo4j:5.1.0 \
  MULTIFORUM_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:1.2.3 \
  MULTIFORUM_FRONTEND_IMAGE=ghcr.io/gennit-project/multiforum-nuxt:1.2.3 \
  MULTIFORUM_CADDY_IMAGE=caddy:2.11.4-alpine \
  docker compose \
    --env-file .env.production.example \
    --file docker-compose.yml \
    --file docker-compose.production.yml \
    config --quiet >"$contract_tmp_dir/missing-release.log" 2>&1; then
  echo "Production Compose unexpectedly accepted an empty MULTIFORUM_RELEASE_VERSION." >&2
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
  MULTIFORUM_RELEASE_VERSION=1.2.3 \
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
  ([.services[] | .labels["net.multiforum.release"] == "1.2.3"] | all) and
  .services.database.labels["net.multiforum.component"] == "database" and
  .services.backend.labels["net.multiforum.component"] == "backend" and
  .services.frontend.labels["net.multiforum.component"] == "frontend" and
  .services.caddy.labels["net.multiforum.component"] == "caddy" and
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
