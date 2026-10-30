# GraphQL contract campaign

## Phase 1: a reproducible schema pin

The backend owns the augmented public schema. The frontend commits a reviewed
copy in `graphql-schema/`, with `manifest.json` identifying the exact backend
repository and full commit, installed GraphQL/Neo4j dependency versions,
lockfile checksum, and schema byte length/checksum. CI verifies that artifact
and generates schema types from it before TypeScript checking.

`pnpm compile` is offline: it reads the verified schema pin, not a running
backend or `GRAPHQL_URL_FOR_TYPES`. This establishes which backend revision the
frontend is checked against. It does not assert which version is deployed, or
validate every frontend operation yet.

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

Baseline frontend: `201d19b60` (after the null-filter fix). The following counts
are **gql template locations**, including fragments, rather than unique named
operations. Interpolation and re-exports mean those counts differ.

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
coverage. Generic hook calls and Apollo client calls require an AST inventory
in phase 2. Reproduce the template inventory with `rg -n '\bgql\x60'
 graphQLData components composables pages utils --glob '*.{js,ts,vue}'
 --glob '!*.spec.ts' --glob '!*.test.ts'` (join the command onto one line).

### Current type and test boundaries

- `scripts/generate-graphql-types.mjs` generates schema entity/input types. It
  does not scan operations. The unused `codegen.ts` preset with its placeholder TSX glob has been
  retired. `pnpm compile` is the generation entry point; phase 2/3 will add
  real operation extraction and generation.
- Most shared operations are JavaScript gql templates. Apollo is not yet
  uniformly receiving generated documents carrying exact variables/results.
  Handwritten response subsets and broad schema entity types remain.
- Inline operations occur outside `graphQLData/`; phase 2 must cover all source
  groups above, interpolation, fragments and aliases, not only `.graphql` files.
- Existing fragment-resolution and null-filter tests provide useful narrow
  checks, but do not establish application-wide schema compatibility. Nullable
  filters can pass schema validation and still fail inside a backend resolver.
- The backend starts with `typeDefs.ts`; Neo4j augments its generated API.
  `customResolvers.ts` composes `customResolvers/queryResolvers.ts`,
  `mutationResolvers.ts` and `typeResolvers.ts`. The baseline backend has 46
  explicitly wired query fields and 127 mutation fields (including factory
  wiring); custom type-field resolvers also need review.
- Bounded custom Cypher projections, vote responses and driver repositories can
  return partial objects despite a valid public schema. Phase 4 must enforce
  their actual response obligations, rather than requiring full entity types.
  End-to-end serialization tests remain necessary alongside static checking.

## Next milestones

1. **Phase 2:** extract all frontend operations, validate against this pin in CI,
   inventory every exception explicitly, and preserve runtime-specific guards.
2. **Phase 3:** pilot operation-specific typed documents through Apollo for
   profiles and discussion comments; then migrate vertical slices.
3. **Phase 4:** enforce backend custom response shapes and database boundaries.
4. **Phase 5:** finish the remaining application slices and remove exclusions.
5. **Phase 6:** backend-driven compatibility checks, breaking-change detection,
   generated-file freshness checks, and coordinated release requirements.

Phase 1 verifies and consumes a pinned schema. None of these later guarantees
should be inferred from the phase-1 CI check passing.
