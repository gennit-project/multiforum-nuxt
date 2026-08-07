# Frontend container image

The official Multiforum frontend image is published at:

```text
ghcr.io/gennit-project/multiforum-nuxt
```

Images support `linux/amd64` and `linux/arm64`. They run as the unprivileged
`node` user and include an internal health check for the Nuxt server on port 3000.

## Tags

| Tag            | Meaning                                     | Recommended use                          |
| -------------- | ------------------------------------------- | ---------------------------------------- |
| `edge`         | Current `main` branch                       | Local evaluation and integration testing |
| `latest`       | Most recent stable semantic-version release | Convenient stable installs               |
| `1.2.3`        | Exact semantic-version release              | Repeatable production installs           |
| `1.2` or `1`   | Moving release series                       | Controlled automatic updates             |
| `sha-<commit>` | Immutable source revision                   | Maximum deployment reproducibility       |

Production deployments should pin an exact semantic version or immutable SHA
instead of following `edge` or another moving tag.

## Run the image

The frontend requires a reachable Multiforum backend. This minimal example
uses local development authentication and assumes the backend is named
`backend` on the same Docker network:

```bash
docker run --rm \
  --network multiforum-network \
  --publish 127.0.0.1:3000:3000 \
  --env NUXT_PUBLIC_AUTH_PROVIDER=local-dev \
  --env NUXT_PUBLIC_BASE_URL=http://localhost:3000 \
  --env NUXT_PUBLIC_SERVER_NAME='My Multiforum' \
  --env NUXT_PUBLIC_SERVER_DISPLAY_NAME='My Multiforum' \
  --env NUXT_BACKEND_GRAPHQL_URL=http://backend:4000/graphql \
  --env NUXT_LOCAL_AUTH_TOKEN_ENDPOINT=http://backend:4000/auth/local-dev/token \
  ghcr.io/gennit-project/multiforum-nuxt:edge
```

The same image supports Auth0 when the corresponding server-only
`NUXT_AUTH0_*` secrets are supplied. See
[frontend runtime configuration](./frontend-runtime-configuration.md) for the
complete variable list and security boundaries.

The `node-server` image stores Auth0 sessions below `/app/data`. Mount persistent
storage there for production use. This filesystem store supports one frontend
replica; horizontally scaled deployments require a shared session store. The
[production Compose foundation](./self-hosting-production.md) configures the
volume and TLS proxy.

The local-development provider must not be exposed to the public internet.
Production deployments require TLS, production authentication, unique secrets,
backups, and appropriately secured backend and database services.

## Supply-chain metadata

Main-branch and release publications include OCI source and revision labels,
a software bill of materials, and build provenance. Pulling by digest provides
an immutable reference independent of the tag policy:

```bash
docker pull ghcr.io/gennit-project/multiforum-nuxt@sha256:DIGEST
```

The publishing workflow tests the non-root runtime, health check, runtime
branding, same-origin GraphQL proxy, local-development mode, and rejection of
incomplete Auth0 configuration before accepting an image publication.

For semantic-version tags, the workflow also combines the published frontend
digest with the reviewed backend, Neo4j, and Caddy pins, verifies that all four
images are publicly pullable, and attaches a validated self-hosting release
manifest to the GitHub Release. Production operators should use that complete
manifest rather than selecting component versions independently.

The GHCR package must be made public once by an organization owner after its
first publication. Every subsequent publication verifies that its digest can
be pulled with an anonymous Docker configuration.
