# GraphQL contract campaign

## Phase 1: a reproducible schema pin

The backend owns the augmented public schema. The frontend commits a reviewed
copy in `graphql-schema/`, with `manifest.json` identifying the exact backend
repository and full commit, installed GraphQL/Neo4j dependency versions,
lockfile checksum, and schema byte length/checksum. CI verifies that artifact
and generates schema types from it before TypeScript checking.

`pnpm compile` is offline: it reads the verified schema pin, not a running
backend or `GRAPHQL_URL_FOR_TYPES`. This establishes which backend revision the
frontend is checked against. It does not assert which version is deployed.
The phase-2 check described below validates frontend documents against the pin.

### Update workflow

1. Choose a clean backend commit. Use its `.nvmrc` Node version and run
   `pnpm install --frozen-lockfile` followed by `pnpm schema:export`.
   The output is `artifacts/graphql-schema/`. Alternatively, download the
   `graphql-schema-<checkout SHA>` artifact from a trusted successful backend
   Tests CI run and extract it. Main-branch artifacts are preferred; PR artifacts
   identify GitHub's checked-out merge commit. Artifacts expire after 90 days,
   but a clean commit and its lockfile can reproduce them.
2. In the frontend, run:

   ```sh
   pnpm schema:update /path/to/backend/artifacts/graphql-schema
   pnpm schema:check
   pnpm schema:test
   pnpm compile
   pnpm tsc
   ```

3. Review and commit both `graphql-schema/` and generated type changes in
   `__generated__/graphql.ts`. Include the backend revision and compatibility
   impact in the PR. Merge/deploy compatible backend changes in the required
   order; this campaign does not introduce automatic deployment coordination.

The importer checks provenance fields, schema integrity and validity before
replacing the pin. It accepts an explicit local artifact directory; it never
follows a mutable branch or falls back to a live endpoint. CI needs no private
backend-repository credentials or schema endpoint secrets. A checksum detects
corruption, not authenticity: only import artifacts from a trusted source.

The SDL includes deprecated filter inputs. Replacing it with a truncated
introspection response could silently lose compatibility fields. Do not edit
the schema or manifest by hand; regenerate them from the backend.

## Inventory at the start of the campaign

Baseline frontend: `201d19b60` (after the null-filter fix). This phase-1 inventory
counts **gql template locations**, including fragments, rather than unique named
operations. Phase 2 additionally found four annotated server-side operations;
see the live phase-2 inventory below. Interpolation and re-exports mean these
counts differ from named operation counts.

| Source         | Template locations | Files containing templates |
| -------------- | -----------------: | -------------------------: |
| `graphQLData/` |                358 |                         32 |
| `components/`  |                  7 |                          7 |
| `composables/` |                  1 |                          1 |
| `pages/`       |                  5 |                          5 |
| `utils/`       |                  1 |                          1 |
| Total          |                372 |                         46 |

These counts exclude test/spec files. There are also 503 direct `useQuery(` /
`useMutation(` call sites in production component, composable and page source;
this is a textual inventory, not a count of unique operations or inferred
coverage. The validator inventories documents; a complete mapping from every
Apollo call site to its document remains future work. To reproduce this earlier
template count, run:

```sh
rg -n '\bgql\x60' graphQLData components composables pages utils --glob '*.{js,ts,vue}' --glob '!*.spec.ts' --glob '!*.test.ts'
```

### Current type and test boundaries

- `scripts/generate-graphql-types.mjs` generates schema entity/input types. It
  does not generate operation types. The unused `codegen.ts` preset with its
  placeholder TSX glob has been retired. `pnpm compile` generates entity types;
  phase 3 will add operation-specific generation.
- Most shared operations are JavaScript gql templates. Apollo is not yet
  uniformly receiving generated documents carrying exact variables/results.
  Handwritten response subsets and broad schema entity types remain.
- Inline operations occur outside `graphQLData/`. The phase-2 scanner covers
  the source groups below, interpolation, fragments and aliases, as well as
  standalone `.graphql` files.
- Existing fragment-resolution and null-filter tests complement schema
  validation. Nullable filters can pass schema validation and still fail inside
  a backend resolver.
- The backend starts with `typeDefs.ts`; Neo4j augments its generated API.
  `customResolvers.ts` composes `customResolvers/queryResolvers.ts`,
  `mutationResolvers.ts` and `typeResolvers.ts`. The baseline backend has 46
  explicitly wired query fields and 127 mutation fields (including factory
  wiring); custom type-field resolvers also need review.
- Bounded custom Cypher projections, vote responses and driver repositories can
  return partial objects despite a valid public schema. Phase 4 must enforce
  their actual response obligations, rather than requiring full entity types.
  End-to-end serialization tests remain necessary alongside static checking.

## Phase 2: operation validation and migration debt

The initial validator scans 986 production source files and finds 376 documents:
358 operation definitions and 18 fragment-only documents. These include four
`/* GraphQL */`-annotated server-side requests that the phase-1 gql-only count
missed. At introduction, 79 schema diagnostics affect 31 documents. The baseline
is reviewable in [`graphql-validation-baseline.json`](../graphql-validation-baseline.json):

| Area                             | Diagnostics |
| -------------------------------- | ----------: |
| Collection queries and mutations |          51 |
| Unified library favorites        |           8 |
| Library pages                    |           8 |
| Discussion form cache fragments  |           4 |
| Favorite controls                |           4 |
| Forum creation cache fragment    |           2 |
| Tag query and cache fragment     |           2 |
| Total                            |          79 |

These counts are schema diagnostics, not confirmed user-visible bugs. Some
operations may be unused or cache-only fragments; inspect each before changing
behavior. The immediate follow-up is to fix these incompatibilities in focused
slices, then remove the baseline and use strict validation as the only CI gate.

### Commands and baseline policy

```sh
pnpm graphql:test       # extractor, source mapping and ratchet tests
pnpm graphql:inventory  # write artifacts/graphql/operations.json, including all findings
pnpm graphql:check      # CI gate against the reviewed migration baseline
pnpm graphql:validate   # strict check; fails while any schema diagnostic remains
```

The CI gate validates every discovered document and prints all findings. It
fails for an unrecorded diagnostic, a stale baseline entry, a schema pin/hash
mismatch, or **any** extraction error. A baseline entry identifies the pinned
schema, document identity, complete expanded document hash, error message, and
occurrence count. The stored source locations help review the original findings;
current locations are reported separately, so unrelated line shifts do not
invalidate the baseline. Changing a document or one of its fragments
invalidates its existing entries; fix that document's errors and remove its
resolved entries. Moving a document to another file requires review. Do not blindly re-record the
baseline to make CI green. `--write-baseline <file>` is an explicit bootstrap or
reviewed schema-migration tool; inspect every addition and deletion in its diff.

The CI job publishes the complete inventory and diagnostics as the
`graphql-operation-inventory` artifact, including when validation fails. The
report lists scanned paths, documents, operation and fragment names, source
locations, and unresolved dynamic values; it does not contain runtime values.

### Extraction boundaries

Production `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts`,
`.vue`, `.graphql`, and `.gql` files are scanned. Tests, generated code,
node_modules, build artifacts, documentation, tooling scripts, and hidden
folders are excluded; the machine-readable report lists the exact source files
and exclusions. Static `gql` tags/calls, imported fragments, re-exports,
namespaces, Vue script blocks, standalone documents, and annotated raw strings
are handled without importing or executing application code. An unannotated
GraphQL-like literal, missing/ambiguous fragment, dynamic structural
interpolation, mutable fragment binding, or unsupported `gql` usage fails
extraction rather than being silently skipped.

Raw GraphQL strings must use `/* GraphQL */` immediately before the literal.
Server requests with an explicit GraphQL URL must reference a statically
resolvable document. The `/api/graphql` proxy forwards external request bodies
and does not author an operation. Arbitrary dynamic HTTP construction outside
these recognizable forms cannot be proven by static extraction; use the
supported document forms for new operations and review network-boundary changes.
Vue files containing both a normal script and script setup with GraphQL, external
Vue scripts, and `.graphql` `#import` directives currently fail closed pending
explicit support.

One existing query interpolates a date **inside** a GraphQL string. Its shape is
validated using a placeholder and its source expression is recorded in the
inventory; no application expression is evaluated. Runtime values and backend
resolver completeness are outside schema validation, so retain the null-filter
guards and real-schema integration tests.

## Next milestones

1. **Phase 2:** fix the recorded compatibility debt and remove the temporary
   ratchet, preserving runtime-specific guards and expanding unsupported syntax
   only with tests.
2. **Phase 3:** pilot operation-specific typed documents through Apollo for
   profiles and discussion comments; then migrate vertical slices.
3. **Phase 4:** enforce backend custom response shapes and database boundaries.
4. **Phase 5:** finish the remaining application slices and remove exclusions.
5. **Phase 6:** backend-driven compatibility checks, breaking-change detection,
   generated-file freshness checks, and coordinated release requirements.

Phase 1 verifies and consumes a pinned schema. None of these later guarantees
should be inferred from the phase-1 CI check passing.
