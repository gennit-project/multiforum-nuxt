---
name: graphql-codegen
description: Regenerate or update the generated GraphQL types in __generated__/graphql.ts. Use whenever backend schema fields are missing from the frontend types, before running `pnpm run compile`, or when adding/fixing types like X / XCreateInput / XUpdateInput. Read this FIRST — the naive codegen run destroys the checked-in types.
---

# Regenerating GraphQL types (multiforum-nuxt)

**⚠️ Do not naively run `pnpm run compile` expecting it to rebuild the types — it deletes
them.** `codegen.ts` uses the client preset with `documents: ['src/**/*.tsx']`, which matches
**nothing** in this repo (there is no `src/**/*.tsx`). So `graphql-codegen` emits a ~3-line
file and **wipes the checked-in `__generated__/graphql.ts`** (~82k lines) that the whole app
imports from (`@/__generated__/graphql`). The checked-in artifact is also already behind the
backend schema, so no script in the repo currently regenerates it faithfully.

## Choose the right path

### A. Small change — add/fix a few fields (preferred, low-risk)
Hand-edit `__generated__/graphql.ts` directly. Fields within a type are sorted
**alphabetically**; add the field to the entity type **and** its input types where relevant:
`X`, `XCreateInput`, `XUpdateInput` (and `…Where` / `…Options` if the field is queryable).
This is the fastest safe way to unblock a missing backend field (e.g. a new
`featuredWikiPageIds`).

### B. Full regenerate from the backend schema (when many fields drift)
The schema is the backend's, and it can be produced **DB-free** from `typeDefs`:
1. On the backend, emit an introspection JSON from the schema
   (`Neo4jGraphQL.getSchema()` + `introspectionFromSchema` — `build_scripts/generateTypes.ts`
   does exactly this, though it deletes its output afterward). Capture that JSON.
2. Point codegen's `schema` at the introspection JSON (or the running backend via
   `GRAPHQL_URL_FOR_TYPES`) and run it to emit `__generated__/graphql.ts`.
3. **Do not** rely on the default `pnpm run compile` until the `documents` glob is fixed
   (see cleanup below), or it will emit an empty file.

## Always verify before trusting the result
```bash
git diff --stat __generated__/graphql.ts
```
A regenerate that shows the file shrinking from ~82k lines to a handful is the failure mode
above — discard it. A good run shows added/changed type fields, not mass deletion.

## Known cleanup (not yet done)
The real fix is to repoint `codegen.ts` `documents` at where this repo actually uses `gql`
(its `.ts`/`.vue`/`graphQLData/**`), not `src/**/*.tsx`. Until then, treat `compile` as unsafe
and prefer path A or the explicit path B above.

## Related
- Consuming these types correctly (inputs/responses, `Pick` for subsets): [apollo-data](../apollo-data/SKILL.md).
