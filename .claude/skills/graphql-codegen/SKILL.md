---
name: graphql-codegen
description: Regenerate or verify generated GraphQL schema and operation types using the pinned offline backend contract.
---

# GraphQL code generation

The schema is pinned in `graphql-schema/schema.graphql` with a verified backend
provenance manifest. The previous client-preset warning is obsolete: `compile`
now invokes the offline schema generator and production operation extractor.
Do not hand-edit generated types or point generation at a live endpoint.

- `pnpm schema:check`: verify schema checksum and provenance.
- `pnpm schema:update /path/to/backend-artifact`: select a reviewed backend
  schema export, keeping SDL and manifest together.
- `pnpm compile`: regenerate schema-wide and typed-operation artifacts.
- `pnpm schema:types:check`: compare schema types without overwriting output.
- `pnpm operations:check`: verify operation freshness and typed consumers.
- `pnpm operations:contract:generate`: update the portable operation snapshot.
- `pnpm operations:contract:check`: detect stale snapshot output.
- `pnpm graphql:check` and `pnpm tsc`: validate operations and consumers.

Review generated diffs, source revision and schema hash before committing.
Keep `SubmitIssueInput`, wiki authorship and other backend-owned input contracts
aligned with the pinned schema; do not paper over errors with casts or handwritten
schema types. See `docs/graphql-contract-campaign.md` and
`docs/cross-repository-releases.md` for coordinated rollout and rollback.
