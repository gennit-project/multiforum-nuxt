# AWS single-VM Terraform example

This example creates one Ubuntu 24.04 EC2 instance for Multiforum, installs
Docker and Docker Compose with cloud-init, clones the frontend repository into
`/opt/multiforum` for its deployment configuration, pre-pulls the official
backend and frontend images, and assigns a stable Elastic IP. It is deliberately
a small operator-owned starting point, not a managed production platform.

Terraform does **not** receive application secrets. The bootstrap credentials,
Neo4j password, and optional integration keys therefore stay out of Terraform
plans and state. The selected non-secret image references are stored in state
and written to `/opt/multiforum/.env.quickstart`; you add secrets directly on
the host after provisioning.

## What it creates

- one EC2 instance in the account's default VPC;
- one encrypted gp3 root volume (40 GiB by default), including Docker volumes;
- one security group exposing SSH only to `admin_cidr`;
- port 3000 only to the explicitly configured `application_cidrs`; and
- one Elastic IP for a stable address.

Neo4j's ports (7474 and 7687) and the backend port (4000) are not admitted by
the AWS security group. The instance metadata service requires IMDSv2 tokens.

## Prerequisites

- Terraform 1.8 or newer;
- AWS credentials available to Terraform;
- an existing EC2 key pair in the selected region; and
- a default VPC with at least one subnet.

The default `t3.large` is a conservative starting size for Neo4j, the backend,
and the frontend on one machine. Review current EC2, EBS, and Elastic IP pricing
before applying. This example creates billable resources.

## Provision the host

```bash
cd deploy/terraform/aws-single-vm
cp terraform.tfvars.example terraform.tfvars
# Replace admin_cidr and ssh_key_name before continuing.
terraform init
terraform plan
terraform apply
```

Use a `/32` containing only your current public IPv4 address for `admin_cidr`.
During initial setup, consider restricting `application_cidrs` to that same
address. Terraform prints the resulting SSH command and temporary application
URL.

Cloud-init may continue installing packages for a few minutes after EC2 reports
the instance as running. It clones the selected `repository_ref`, writes the
selected image references, and runs `docker compose pull`. Follow its progress
with:

```bash
ssh ubuntu@PUBLIC_IP
cloud-init status --wait
```

## Configure and start Multiforum

Cloud-init creates `/opt/multiforum/.env.quickstart` from the repository example
and injects the selected image references. On the host, replace the default
credentials with strong, unique values before starting. Maps, geocoding, mail,
and storage remain optional and degrade when omitted.

```bash
cd /opt/multiforum
$EDITOR .env.quickstart
docker compose --env-file .env.quickstart up -d
docker compose ps
```

Do not use either placeholder password left in `.env.quickstart` by cloud-init.

This stack uses Multiforum's local development authentication and is for a
private evaluation environment only. Restrict `application_cidrs` to trusted
addresses and do not expose this configuration as a public production forum.

Port 3000 serves plain HTTP only. A public production deployment also needs a
production identity provider, a TLS reverse proxy or load balancer, a domain,
and removal of public port-3000 access. Those production-hardening steps remain
outside this private evaluation example.

## Updating and destroying

The image inputs select the initial installation; Terraform is deliberately not
an in-place application updater. Update an existing host explicitly:

```bash
ssh ubuntu@PUBLIC_IP
cd /opt/multiforum
git fetch --tags
git checkout RELEASE_TAG
# Set the new backend and frontend image references.
$EDITOR .env.quickstart
docker compose --env-file .env.quickstart pull
docker compose --env-file .env.quickstart up -d
```

Cloud-init runs only when the instance is first created. Before provisioning a
replacement host, update `repository_ref`, `backend_image`, and `frontend_image`
in `terraform.tfvars` to match the revisions you tested. Automated in-place
application upgrades are deliberately outside this example's current scope.

The Canonical SSM parameter selects the current Ubuntu 24.04 image when the
instance is first created. Later AMI changes are ignored because replacing this
stateful host as an automatic upgrade would also replace its local data disk.
Apply operating-system security updates on the host and plan image migrations
as explicit backup-and-restore operations.

Back up Neo4j data before replacing or destroying the instance. The root volume
is deleted with the instance by default, so `terraform destroy` removes the
forum data as well as the infrastructure.
