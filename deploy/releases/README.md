# Self-hosting release manifests

A production release manifest identifies an application version and the exact
four-image set tested together for self-hosting. It is the compatibility
contract between a Multiforum release and the production Compose stack.

The repository includes an example contract, not a claim that those example
tags have been released. Official releases can publish a manifest using the
same schema alongside their release notes.

Schema version 1 requires:

- a SemVer `release` without a leading `v`;
- the official backend and frontend repositories, pinned to exact SemVer tags,
  immutable `sha-*` tags, or SHA-256 digests; and
- pinned Neo4j and Caddy tags or digests.

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
