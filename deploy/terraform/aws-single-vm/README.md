# AWS single-VM Terraform production example

This example provisions the AWS host for Multiforum's
[production Compose foundation](../../../docs/self-hosting-production.md). It
creates one Ubuntu 24.04 EC2 instance, installs Docker and Docker Compose,
prepares `/opt/multiforum/.env.production`, pre-pulls the selected images, and
assigns a stable Elastic IP. Caddy then serves the forum over automatic HTTPS.

This is a practical operator-owned deployment for one host and one frontend
replica, not a high-availability platform. Neo4j and the application volumes
remain local to the instance.

Terraform intentionally does **not** receive application secrets. Auth0
credentials, the Neo4j password, encryption keys, and optional integration
credentials stay out of Terraform plans and state. Cloud-init writes only the
domain, ACME email, instance name, and selected non-secret image references;
you add secrets directly on the host before starting the stack.

## What it creates

- one EC2 instance in the account's default VPC;
- one encrypted gp3 root volume (40 GiB by default), including Docker volumes;
- one security group allowing SSH only from `admin_cidr`;
- inbound TCP 80 and 443 plus UDP 443 from `application_cidrs`; and
- one Elastic IP and a DNS A-record output.

Ports 3000, 4000, 7474, and 7687 are not admitted by the AWS security group.
They remain loopback-only host bindings in Compose. The instance metadata
service requires IMDSv2 tokens.

## Prerequisites

- Terraform 1.8 or newer;
- AWS credentials available to Terraform;
- an existing EC2 key pair in the selected region;
- a default VPC with at least one subnet;
- a domain whose DNS records you can change; and
- an Auth0 Regular Web Application and Auth0 API.

The default `t3.large` is a conservative starting size for Neo4j, the backend,
the frontend, and Caddy on one machine. Review current EC2, EBS, data-transfer,
and Elastic IP pricing before applying. This example creates billable resources.

## Provision the host

```bash
cd deploy/terraform/aws-single-vm
cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars
terraform init
terraform plan
terraform apply
```

Set `admin_cidr` to a `/32` containing only your current public IPv4 address.
Set `application_cidrs` to `0.0.0.0/0` for a public forum and Caddy's normal
ACME flow. Pin `repository_ref` and every image input to revisions you have
tested together rather than relying on `main` or `edge` in production.

Terraform prints the stable IP, HTTPS URL, SSH command, and DNS record to
create. Add that A record at your DNS provider:

```bash
terraform output dns_a_record
```

Wait for DNS to resolve to the reported Elastic IP before starting Caddy.
Cloud-init may continue for a few minutes after EC2 reports the instance as
running. Follow it with:

```bash
ssh ubuntu@PUBLIC_IP
cloud-init status --wait
```

Cloud-init clones the selected repository revision, copies
`.env.production.example` to `.env.production`, injects the non-secret Terraform
inputs, restricts the file to mode `0600`, and pre-pulls Neo4j, backend,
frontend, and Caddy images. It also stages—but does not enable—the production
backup service, daily timer, Restic configuration example, and encrypted
off-site upload drop-in. It deliberately does not start Compose, activate
off-site storage, or enable the backup timer while required secrets are empty.

## Configure Auth0 and secrets

Follow the [Auth0 and secret setup](../../../docs/self-hosting-production.md#configure-auth0)
for your domain. The Auth0 application must allow:

- `https://YOUR_DOMAIN/auth/callback` as a callback URL; and
- `https://YOUR_DOMAIN` as a logout URL.

Then edit the protected environment file on the host and fill every required
empty value:

```bash
ssh ubuntu@PUBLIC_IP
cd /opt/multiforum
$EDITOR .env.production
```

Keep `.env.production` out of Git, images, Terraform variables, and Terraform
state. Optional mail, maps, geocoding, and storage values may remain empty; the
corresponding capabilities remain disabled.

## Validate and start Multiforum

Validate the merged model before creating containers:

```bash
cd /opt/multiforum
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  config --quiet
```

Compose fails immediately if a required production value is missing. Once it
passes, start the stack and watch Caddy obtain the certificate:

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

Run production verification, then complete a real Auth0 sign-in:

```bash
scripts/verify-self-hosting.sh --env-file .env.production
```

The full production guide covers backups, recovery, upgrades, and current
single-host limitations.

After a manual backup succeeds, review `/etc/multiforum/backup.env` and enable
the staged daily schedule:

```bash
sudo systemctl start multiforum-backup.service
sudo systemctl enable --now multiforum-backup.timer
systemctl list-timers multiforum-backup.timer
```

The default retains seven complete local bundles. Follow the production guide
to configure the staged
[encrypted off-host upload](../../../docs/self-hosting-production.md#encrypt-and-copy-backups-off-the-host),
run the documented
[freshness check](../../../docs/self-hosting-production.md#monitor-backup-freshness)
from a monitoring agent, and perform restore drills. The local timer alone does
not protect data from instance or regional loss.

## Updates and destruction

Terraform provisions infrastructure; it is deliberately not an in-place
application updater. Use the production guide's
[safe upgrade command](../../../docs/self-hosting-production.md#updates-and-limitations)
to pre-pull pinned images, take a safety backup, and recreate the existing
stack. Changing `repository_ref` or image variables in Terraform does not rerun
cloud-init on an existing instance.

The Canonical SSM parameter selects the current Ubuntu 24.04 image at initial
creation. Later AMI changes are ignored because silently replacing this
stateful host would also replace its local data disk. Apply operating-system
security updates on the host and plan host migrations as explicit
backup-and-restore operations.

Back up Neo4j off-host before replacing or destroying the instance. From
`/opt/multiforum`, use the production guide's
[cold-backup command](../../../docs/self-hosting-production.md#persistent-state-and-backups),
then encrypt and copy the completed bundle away from the VM. The root volume is
deleted with the instance by default, so `terraform destroy` removes the forum
data along with the infrastructure. The same guide documents the
[guarded restore procedure](../../../docs/self-hosting-production.md#restore-a-cold-backup)
for a replacement host.
