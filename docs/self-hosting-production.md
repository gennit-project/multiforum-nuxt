# Production Compose foundation

This deployment path runs the official Multiforum images behind Caddy with
automatic HTTPS and Auth0 authentication. It is intended for one host and one
frontend replica. It is a practical production foundation, not a high-
availability platform: the host and its local Neo4j volume remain single points
of failure.

Start with the [local quick-start](./self-hosting-quickstart.md) before using
this configuration. Do not reuse its credentials or local authentication mode.

If you need an AWS host, the
[single-VM Terraform example](../deploy/terraform/aws-single-vm/README.md)
provisions the production ports, stable IP, Docker runtime, protected
environment template, and pinned images used by this overlay. It leaves DNS,
Auth0 configuration, application secrets, startup, and backups under operator
control so secrets never enter Terraform state.

## Requirements

- a Linux host with Docker Engine and Docker Compose v2;
- a domain with its `A` and, when applicable, `AAAA` records pointing to the
  host;
- inbound TCP ports 80 and 443 plus UDP port 443 allowed by the host and cloud
  firewalls;
- an Auth0 Regular Web Application and Auth0 API; and
- an off-host backup destination for the Neo4j data.

Caddy obtains and renews certificates automatically. Port 80 must remain
reachable for HTTP-to-HTTPS redirects and ACME validation unless you configure
another supported Caddy challenge method.

## Configure Auth0

Create a Regular Web Application for the Nuxt server and a dedicated Auth0 API
for the GraphQL backend. In the application settings for `forum.example.com`,
configure:

- Allowed Callback URL: `https://forum.example.com/auth/callback`
- Allowed Logout URL: `https://forum.example.com`

Use the API identifier as `AUTH0_AUDIENCE`. The same domain, client ID, and API
audience are supplied to the frontend and backend so the access tokens issued
by the server-side Auth0 session are accepted by GraphQL.

Set `MULTIFORUM_SUPERADMIN_EMAIL` to a tightly controlled, verified Auth0
account. It is the backend's break-glass root identity and bypasses normal role
checks.

## Prepare the environment

Copy the production template and restrict it before adding secrets:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Generate independent secrets rather than reusing passwords:

```bash
openssl rand -hex 32 # Neo4j password
openssl rand -hex 16 # 32-character plugin encryption key
openssl rand -hex 64 # Auth0 session encryption secret
```

Fill every required empty value in `.env.production`. Pin Neo4j, the backend,
the frontend, and Caddy to versions tested together rather than using floating
or `edge` tags in production. Optional mail, maps, geocoding, and storage
settings can remain empty; the instance capability status will keep those
features disabled.

Validate the merged Compose model before starting anything:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  config --quiet
```

Compose fails immediately when a required Auth0 or encryption value is empty.
The environment file contains secrets: do not commit it, copy it into images,
or make it world-readable.

## Start and verify

Start the stack and follow Caddy while it obtains the certificate:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  up -d

docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  logs --tail=100 caddy frontend backend
```

Verify the HTTPS origin, sign-in redirect, and container health:

```bash
curl --fail --show-error --head https://forum.example.com
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  ps
```

Only Caddy publishes public ports. The frontend, backend, and Neo4j ports retain
loopback-only bindings for host diagnostics. Caddy adds HSTS, MIME-sniffing, and
referrer-policy headers and proxies traffic to the frontend over the private
Compose network.

## Persistent state and backups

The deployment has two important persistent data sets:

- `neo4j-data` contains the forum database; and
- `frontend-data` contains encrypted Auth0 sessions for this single frontend
  replica.

Losing `frontend-data` signs users out but does not remove forum content.
Losing `neo4j-data` loses the forum.

Configure automated, encrypted, off-host backups before inviting users. For a
simple cold snapshot, stop the write path and database, snapshot or copy the
Neo4j volume with your infrastructure provider's tooling, and then restart:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  stop frontend backend database

# Create and export an off-host snapshot of the neo4j-data volume here.

docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  up -d
```

Use Neo4j's backup or dump tooling when your selected edition and operational
requirements support it. Whichever method you choose, document retention,
encrypt backups, monitor failures, and test restoring onto a separate host.

## Updates and limitations

Update one component at a time by changing its pinned image tag, pulling, and
recreating the stack. Back up Neo4j first and review release notes for data or
configuration migrations.

This foundation does not yet provide multiple application replicas, managed
Neo4j, zero-downtime upgrades, automated restores, or an open-source OIDC
provider. Filesystem Auth0 sessions are intentionally scoped to one frontend
replica; a multi-replica deployment needs a shared session store.
