# Self-hosting release manifests

A production release manifest identifies an application version and the exact
four-image set tested together for self-hosting. It is the compatibility
contract between a Multiforum release and the production Compose stack.

The repository includes an example contract, not a claim that those example
tags have been released. Every `v*.*.*` frontend tag build creates a manifest,
preserves it as a workflow artifact, verifies that every selected component is
publicly pullable, and attaches it to the matching GitHub Release.

Schema version 1 requires:

- a SemVer `release` without a leading `v`;
- the official backend and frontend repositories, pinned to exact SemVer tags,
  immutable `sha-*` tags, or SHA-256 digests; and
- pinned Neo4j and Caddy tags or digests.

## Maintainer release input

`release-components.json` is the reviewed input for the next release. It pins
the backend, Neo4j, and Caddy images. Before merging a release PR, maintainers
should update the backend reference to an immutable `sha-*` tag whose backend
container workflow passed. The frontend tag workflow adds its own published
multi-architecture digest and the release version; neither is guessed in the
curated input.

The generator can be exercised locally without publishing anything:

```bash
scripts/create-self-hosting-release-manifest.sh \
  --release 1.2.3 \
  --frontend-image \
    ghcr.io/gennit-project/multiforum-nuxt@sha256:REPLACE_WITH_DIGEST \
  --output /tmp/multiforum-self-hosting-1.2.3.json
```

Generation is atomic and runs the same release validator used by operators.

Validate a downloaded manifest by itself:

```bash
scripts/validate-self-hosting-release.sh \
  --manifest multiforum-self-hosting-release.json
```

After copying its version and image references into `.env.production.next`,
validate the complete resolved deployment:

```bash
scripts/validate-self-hosting-release.sh \
  --manifest multiforum-self-hosting-release.json \
  --env-file .env.production.next
```

The second form rejects any image mismatch and requires every production
container to carry the same `net.multiforum.release` label.
