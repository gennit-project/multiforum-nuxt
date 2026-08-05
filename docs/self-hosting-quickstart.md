# Local self-hosting quick-start

Try Multiforum locally before configuring Auth0, cloud storage, maps, email, or
other production integrations. The default Docker Compose stack starts Neo4j,
pulls the backend, builds the frontend, creates the initial server configuration
and roles, and provisions the first administrator automatically.

## Requirements

- Docker Engine with Docker Compose v2 (Docker Desktop includes it)
- Git
- At least 4 GB of memory available to Docker during the initial frontend build

## Start Multiforum

From this repository's root, run:

```bash
docker compose up --build
```

The first run pulls the official backend image, builds the frontend, and can
take several minutes. When all three services are healthy, open
[http://localhost:3000](http://localhost:3000) and choose **Sign in**. The local
administrator password is:

```text
multiforum-local-admin
```

The default administrator is `admin` (`admin@multiforum.local`). No manual
Cypher commands or third-party accounts are required. Neo4j Browser is
available at [http://localhost:7474](http://localhost:7474) for local debugging.

The database, API, and frontend ports bind to `127.0.0.1` by default, and data
persists in named Docker volumes between restarts.

## Choose your own local credentials

Copy the provided template, change both passwords, and start Compose with it:

```bash
cp .env.quickstart.example .env.quickstart
docker compose --env-file .env.quickstart up --build
```

The bootstrap password must contain at least 12 characters. The bootstrap user
is created only when its email is not already present, so changing the values
later does not replace an existing administrator.

The default `edge` backend image follows the backend repository's `main` branch.
For a repeatable installation, pin a full release tag or immutable commit tag:

```dotenv
MULTIFORUM_BACKEND_IMAGE=ghcr.io/gennit-project/multiforum-backend:1.2.3
# Or: ghcr.io/gennit-project/multiforum-backend:sha-0123456
```

Contributors who need to test an unmerged backend branch can retain the old
source-build behavior with the provided override:

```bash
docker compose \
  --env-file .env.quickstart \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up --build
```

Set `MULTIFORUM_BACKEND_REPOSITORY` and `MULTIFORUM_BACKEND_REF` in
`.env.quickstart` to choose the source revision for that command.

## Stop or reset the stack

Stop the containers without deleting data:

```bash
docker compose down
```

To intentionally delete all local Multiforum data and start over:

```bash
docker compose down --volumes
```

## What is deliberately disabled

Uploads, maps, geocoding, outbound email, and Auth0 are not required by this
local stack. The frontend uses the instance capability status to hide or
explain unavailable controls instead of failing. Configure those integrations
only when you need them.

Local development authentication is intentionally restricted by the backend to
`NODE_ENV=development`. Its shared bootstrap password is not a production
identity system. Do not expose this Compose configuration to the public
internet; use the production self-hosting path with Auth0 (or a future supported
OIDC provider), TLS, unique secrets, backups, and an appropriately secured
Neo4j deployment.

## Troubleshooting

Inspect service health and recent logs with:

```bash
docker compose ps
docker compose logs --tail=100 database backend frontend
```

If the initial frontend build is killed for lack of memory, increase Docker's
memory allocation and run the command again. Docker will reuse completed layers
and already-downloaded images.

If ports 3000, 4000, 7474, or 7687 are already in use, stop the conflicting
local services before starting the stack.
