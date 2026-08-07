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

Download the `multiforum-self-hosting-VERSION.json` asset from the GitHub
Release you intend to run. It is the machine-readable compatibility contract
for the frontend, backend, Neo4j, and Caddy images. Copy its `release` value to
`MULTIFORUM_RELEASE_VERSION` and its four image references to the corresponding
variables in `.env.production`. The file under
`deploy/releases/self-hosting-release.example.json` documents the format; its
placeholder version is not an official release.

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

Validate the release manifest and resolved image selection together:

```bash
scripts/validate-self-hosting-release.sh \
  --manifest multiforum-self-hosting-release.json \
  --env-file .env.production
```

This rejects floating application tags, images from unofficial application
repositories, a mismatched image set, or containers that would not share the
same release identity.

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

Run the read-only production verification command:

```bash
scripts/verify-self-hosting.sh --env-file .env.production
```

It verifies that each running container uses the image and release identity
selected by the environment, requires healthy database and application
containers, checks the public HTTPS response for Caddy's security headers, and
sends a harmless query through the same-origin GraphQL proxy. Complete a real
Auth0 sign-in separately; the command does not accept or automate user
credentials.

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

Configure automated, encrypted, off-host backups before inviting users. The
repository includes a cold-backup command that verifies the production
services are running, stops the write path and database, archives both durable
volumes, writes a checksum manifest, and restarts the services even when an
archive operation fails.

```bash
sudo install -d -m 0700 -o "$(id -un)" -g "$(id -gn)" \
  /var/backups/multiforum
scripts/backup-self-hosting.sh \
  --env-file .env.production \
  --output-dir /var/backups/multiforum
```

Each timestamped bundle contains `neo4j-data.tar.gz`,
`frontend-data.tar.gz`, and `manifest.json`. The manifest records the selected
database, backend, and frontend images plus a SHA-256 checksum for each
archive. It deliberately excludes `.env.production`; preserve that file and
its secrets separately in encrypted secret storage.

The command creates a consistent cold copy, so the site has a brief outage
while the volumes are archived. Copy the completed bundle off the host,
encrypt it at rest, apply a retention policy, monitor scheduled runs, and test
restoring onto a separate host. Use Neo4j's online backup tooling instead when
your selected edition and recovery requirements support it.

### Schedule backups on the single-VM host

The AWS single-VM example stages a disabled systemd service and daily timer.
After the forum is running, first complete a manual backup and copy it off the
host. Then review `/etc/multiforum/backup.env`; its default policy writes to
`/var/backups/multiforum` and retains the seven newest complete local bundles.
Enable the timer only after those values are correct:

```bash
sudo systemctl start multiforum-backup.service
sudo systemctl enable --now multiforum-backup.timer
systemctl list-timers multiforum-backup.timer
```

The timer is persistent, runs daily with a randomized delay of up to 30
minutes, and uses a restrictive file-creation mask. Inspect the most recent run
and its logs with:

```bash
systemctl status multiforum-backup.service
journalctl -u multiforum-backup.service --since "2 days ago"
```

Retention runs only after a new backup completes successfully. It considers
only timestamped directories containing the manifest and both expected
archives; incomplete or unrelated paths are not deleted. The local schedule is
not an off-host backup: arrange encrypted transfer separately, monitor both the
timer and that transfer, and alert when either stops succeeding.

### Encrypt and copy backups off the host

The single-VM image includes Restic, and cloud-init stages an inactive systemd
drop-in for encrypted off-host uploads. Restic supports several remote storage
backends; select one from its
[repository documentation](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html)
and grant the host access only to the dedicated backup location.

Copy the staged configuration, restrict it, and create an independent Restic
password file. Set a repository, add any provider credentials required by that
backend, and choose a tag unique to this Multiforum instance:

```bash
sudo install -m 0600 \
  /etc/multiforum/restic.env.example \
  /etc/multiforum/restic.env
sudo install -m 0600 /dev/null /etc/multiforum/restic-password
sudoedit /etc/multiforum/restic.env
sudoedit /etc/multiforum/restic-password
```

Store the Restic password separately from both the server and the backup
repository. Without it, the encrypted remote snapshots cannot be restored.
Initialize the empty repository once:

```bash
sudo bash -c '
  set -a
  source /etc/multiforum/restic.env
  set +a
  restic init
'
```

Test an upload before connecting it to the timer. The command selects the
newest complete local bundle, verifies its manifest and both SHA-256 checksums,
uploads it under the configured tag, and only then applies remote retention:

```bash
sudo bash -c '
  set -a
  source /etc/multiforum/restic.env
  set +a
  /opt/multiforum/scripts/upload-self-hosting-backup.sh \
    --backup-root /var/backups/multiforum \
    --keep-daily "$MULTIFORUM_BACKUP_RESTIC_KEEP_DAILY" \
    --tag "$MULTIFORUM_BACKUP_RESTIC_TAG"
'
```

After a successful manual upload, activate the staged systemd drop-in:

```bash
sudo install -m 0644 \
  /etc/systemd/system/multiforum-backup.service.d/offsite.conf.example \
  /etc/systemd/system/multiforum-backup.service.d/offsite.conf
sudo systemctl daemon-reload
sudo systemctl start multiforum-backup.service
sudo systemctl enable --now multiforum-backup.timer
```

The upload runs only after the local cold backup succeeds. A remote or retention
failure marks the service failed but does not delete the newly completed local
bundle. Monitor the systemd unit and configure an external alert; periodically
run `restic check` and perform a restore drill on a separate host.

To retrieve the newest remote bundle for a guarded restore, load the same
Restic configuration and restore the instance tag into an empty temporary
directory:

```bash
sudo install -d -m 0700 /var/tmp/multiforum-restic-restore
sudo bash -c '
  set -a
  source /etc/multiforum/restic.env
  set +a
  restic restore latest \
    --tag "$MULTIFORUM_BACKUP_RESTIC_TAG" \
    --target /var/tmp/multiforum-restic-restore
'
sudo find /var/tmp/multiforum-restic-restore -name manifest.json -print
```

Locate the restored bundle containing that manifest, inspect it, and pass its
directory to the guarded restore command below. Securely remove the temporary
restore tree when the recovery exercise is complete.

### Monitor backup freshness

Use the backup health command as the contract between this host and your
monitoring system. A local-only check verifies that the newest complete bundle
is recent and that both archives still match their manifest checksums:

```bash
scripts/check-self-hosting-backups.sh \
  --backup-root /var/backups/multiforum \
  --max-age-hours 36
```

When off-site uploads are enabled, load the Restic configuration and require a
recent snapshot with the instance's tag. The local and remote freshness windows
can differ:

```bash
sudo bash -c '
  set -a
  source /etc/multiforum/restic.env
  set +a
  /opt/multiforum/scripts/check-self-hosting-backups.sh \
    --backup-root /var/backups/multiforum \
    --max-age-hours 36 \
    --restic-tag "$MULTIFORUM_BACKUP_RESTIC_TAG" \
    --offsite-max-age-hours 48 \
    --json
'
```

Success exits zero. Missing, stale, corrupt, unreachable, or absent protection
exits nonzero; `--json` emits a compact `ok` or `critical` object suitable for
monitoring agents. Alert on any nonzero result and on failure to run the check
itself. An external uptime check is still required because a command running on
the Multiforum host cannot report when that host is offline.

### Restore a cold backup

Restore onto a separate host first whenever possible. Before replacing the
current volumes, create a fresh safety backup and preserve the original
`.env.production` in encrypted secret storage. Inspect the selected image
versions recorded in the bundle:

```bash
jq .images /var/backups/multiforum/BACKUP_DIR/manifest.json
```

Configure the recorded Neo4j image before restoring. Neo4j stores are not
generally portable across arbitrary database versions. Then stop the write
path before the database:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  stop frontend backend
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  stop database
```

Run the guarded restore with its explicit destructive confirmation:

```bash
scripts/restore-self-hosting.sh \
  --backup-dir /var/backups/multiforum/BACKUP_DIR \
  --env-file .env.production \
  --confirm-replace-existing-data
```

The command verifies the manifest, both SHA-256 checksums, archive paths, the
stopped-service precondition, and the configured Neo4j image before replacing
either volume. It never starts application services; once restoration begins,
keep them stopped whether extraction succeeds or fails. After a successful
restore, validate the Compose model, start the stack, and run production
verification:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  config --quiet
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  up -d
scripts/verify-self-hosting.sh --env-file .env.production
```

Use `--allow-database-image-mismatch` only after reviewing Neo4j's supported
upgrade and restore paths. Restoring the original Auth0 session secret lets
the frontend read restored sessions; otherwise users may need to sign in
again.

## Updates and limitations

Prepare upgrades in a separate protected environment file so the known-good
configuration remains available for rollback:

```bash
cp -p .env.production .env.production.next
$EDITOR .env.production.next
```

Set explicit release or immutable `sha-*` tags for Neo4j, the backend, the
frontend, and Caddy. The upgrade command rejects `edge`, `latest`, branch-like
tags, and untagged target images. Review release notes for data or configuration
migrations. Copy one complete release manifest into `.env.production.next` and
validate it before running the upgrade:

```bash
scripts/validate-self-hosting-release.sh \
  --manifest multiforum-self-hosting-release.json \
  --env-file .env.production.next
```

Then run:

```bash
scripts/upgrade-self-hosting.sh \
  --current-env-file .env.production \
  --target-env-file .env.production.next \
  --backup-output-dir /var/backups/multiforum \
  --confirm-upgrade
```

The command validates both Compose models, requires the current production
services to be running, pre-pulls every target image, creates a cold safety
backup with the current image metadata, and then force-recreates the stack from
the already-pulled local images in the target file. Image pull or backup
failures happen before recreation, and Compose waits for services to become
running or healthy. The command does not overwrite `.env.production`.

Changing Neo4j is blocked unless `--allow-database-image-change` is supplied.
Use that option only after reviewing Neo4j's supported upgrade path and testing
the backup on a separate host.

Run `scripts/verify-self-hosting.sh --env-file .env.production.next`, complete a
real Auth0 sign-in, and test representative reads and writes. Once satisfied,
promote the target while retaining the old protected file through the rollback
window:

```bash
mv .env.production .env.production.previous
mv .env.production.next .env.production
```

If recreation fails, do not promote the target file. Stop any partially
recreated application services, select `.env.production` and the safety backup
created immediately before recreation, and follow the guarded restore procedure
above. Encrypt or securely remove `.env.production.previous` after the rollback
window because it contains production secrets.

This foundation does not yet provide multiple application replicas, managed
Neo4j, zero-downtime upgrades, unattended restores, or an open-source OIDC
provider. Filesystem Auth0 sessions are intentionally scoped to one frontend
replica; a multi-replica deployment needs a shared session store.
