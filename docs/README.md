# Documentation

Developer documentation for the Multiforum Nuxt frontend. See the
[project README](../README.md) for a high-level overview.

## Getting started & architecture

- [Local self-hosting quick-start](./self-hosting-quickstart.md) — start a usable instance with one Docker Compose command
- [Production Compose foundation](./self-hosting-production.md) — run the official images with Auth0, persistent sessions, and automatic TLS
- [Frontend runtime configuration](./frontend-runtime-configuration.md) — configure one built frontend image at container startup
- [Frontend container image](./frontend-container-image.md) — official image tags, architectures, and runtime behavior
- [Development setup](./development-setup.md) — local environment and tooling
- [AWS single-VM Terraform example](../deploy/terraform/aws-single-vm/README.md) — provision a Docker-ready self-hosting VM without storing app secrets in Terraform state
- [Frontend architecture and authentication](./architecture-and-auth.md)
- [Moderation architecture](./moderation-architecture.md) — canonical reference for permissions and suspensions
- [Performance](./performance.md) — code splitting, caching, image optimization

## Feature areas & plans

- [Feature roadmap](./feature-roadmap.md)
- [Moderation plan](./moderation-plan.md)
- [Notifications plan](./notifications-plan.md)
- Plugins — [implemented](./plugins-implemented.md) · [roadmap](./plugins-roadmap.md) · [implementation plan](./plugins-implementation-plan.md) · [bot/betabot plan](./plugins-bot-betabot-plan.md)
- Maps — [developer docs](./map-developer-docs.md) · [clustering guide](./map-clustering-guide.md)
- [Automated test plan](./automated-test-plan.md)

## Showcase

- [Screenshots gallery](./screenshots.md)
- [Feature updates (2025)](./feature-updates.md)

## Archive

Historical spikes, migration notes, and handoffs are kept in
[`archive/`](./archive/) for reference. They are not maintained.

## Assets

Images referenced by these docs live in [`assets/`](./assets/) (the header
image and the [`assets/screenshots/`](./assets/screenshots/) gallery).
