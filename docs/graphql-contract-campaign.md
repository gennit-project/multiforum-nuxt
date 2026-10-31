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

- `scripts/generate-graphql-types.mjs` generates schema entity/input types. The unused `codegen.ts` preset with its
  placeholder TSX glob has been retired. `pnpm compile` also runs the phase-3
  pilot operation generator described below.
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
missed. At introduction, 79 schema diagnostics affected 31 documents. These have been
resolved, and strict validation is now the CI gate:

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

These counts were schema diagnostics, not confirmed user-visible bugs. Collection
queries and mutations, favorites, and cache fragments now match the pinned schema.

### Commands and validation policy

```sh
pnpm graphql:test       # extractor, source mapping and validator tests
pnpm graphql:inventory  # write artifacts/graphql/operations.json, including all findings
pnpm graphql:check      # strict CI gate and inventory report
pnpm graphql:validate   # strict check without writing a report
```

The CI gate validates every discovered document and fails on any schema
diagnostic, extraction error, or schema pin/hash mismatch. Fix invalid documents
before merging; do not use a baseline to suppress failures in CI.

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

## Phase 3: typed operation pilot

`pnpm compile` generates schema entities and `__generated__/operations.ts` offline.
The latter uses the same strict extractor as `graphql:check`, resolving the actual
source selections and imported fragments without executing application modules.
The explicit `pilotDocuments` list in `scripts/generate-graphql-operations.mjs`
limits generation to public profiles, account settings, archived-comment issue
links, comment notification/sticky mutations, and the comment read slices below. These consumers import typed ASTs:

```ts
import { GetPublicUserProfileDocument } from '@/__generated__/operations';
const { result } = useQuery(GetPublicUserProfileDocument, {
  username: 'alice',
});
// result contains only the selected fields; bio remains string | null.
```

Apollo infers results, variables, callbacks, and mutation/cache payloads directly
from the document. Do not add explicit Apollo generics or cast an operation result
to a full schema entity. For shared function arguments, derive a subset from an
operation result or generated fragment. Existing schema input types remain in
`@/__generated__/graphql`; use annotations or `satisfies`, not assertions, when
constructing inputs. The pilot fixes account updates to send
`where: { username: { eq: username } }` and handles an absent first user explicitly.

```sh
pnpm operations:generate # regenerate committed pilot artifacts after source edits
pnpm operations:check    # fail if committed output differs (does not rewrite it)
pnpm graphql:test        # extraction, validation, composition and negative fixtures
pnpm graphql:check       # all production documents, no suppression baseline
pnpm tsc                 # includes tests/types/graphql-operations.ts negative cases
```

CI checks freshness **before** generation, then regenerates from the verified
schema pin and checks TypeScript. Commit generated output with source changes;
never edit it by hand. Codegen plugins are pinned direct dependencies. Operation
DateTime outputs are strings and JSON outputs are unknown; schema input types
retain the existing schema-generator scalar policy. Typed documents contain plain
ASTs (no runtime gql parsing and no `loc.source.body`); test routers must inspect
ASTs or use GraphQL `print`. Fragments are unmasked, composed, and deduplicated by
name; conflicting definitions fail generation rather than silently shadowing.

The extractor's phase-2 syntax boundaries still apply. Additionally, typed pilots
must be named, and runtime interpolation even inside GraphQL string values is
rejected: move values to variables. Identical shared definitions are supported;
conflicting operation names in different legacy documents must be renamed before
adding both to this output. Add each desired source ID to `pilotDocuments`,
regenerate, replace imports in a bounded vertical slice, then remove conflicting
response types and fix the resulting nullability/variable errors. Add negative
compile cases and runtime/component/browser coverage for each migrated path.

## Phase 5, slice 1: recursive comment replies (#700)

This slice migrates one additional production Apollo query (seven generated
operations total), not all of #700. `GET_COMMENT_REPLIES` / `getCommentWithReplies`
is generated from its unchanged `CommentFields` and `CommentVoteFields`
composition. `ChildComments.vue` imports `GetCommentWithRepliesDocument`; Apollo
infers variables, results and `fetchMore` merges. A variables getter passes plain
values and follows changes to parent ID, moderation profile, and sort. Nullable
reply results render an empty list without a load-more control. A null next page
retains the current page; a valid next page can replace a null previous page.

### Slice call-site and consumer inventory

| Boundary                                                                                                                              | Migrated contract / operation                                                                                                            | Remaining work                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ChildComments.vue`: `useQuery`, `fetchMore`, slot                                                                                    | Generated `GetCommentWithRepliesDocument` and exact query result                                                                         | None for this read                                                                     |
| `Comment.vue` recursive props and forwarded interaction payloads                                                                      | `CommentView`, derived from generated `CommentFieldsFragment`; `ReplyComment` is the exact selected reply                                | Other producers below still supply legacy context                                      |
| `CommentHeader`, `CommentButtons`, `VoteButtons`, `ReplyButton`, `CommentEditsDropdown`                                               | Selected comment fields; revision pairs use selected `PastVersions`; author unions narrow by available fields, no full-entity assertions | Vote/reaction/revision/favorite mutations remain separate slices                       |
| `useCommentPermalink`, `useCommentSubscription`, `useCommentStickyMutations`, `useBestAnswerMutations`                                | Selected view or minimal `Pick` inputs; pin/unpin documents remain typed from phase 3                                                    | Subscription migrated in slice 3; best-answer operations/cache fragments remain legacy |
| `useCommentFormState`, `useCommentSectionModals`, `useCommentFeedbackMutation`, `BrokenRulesModal`, `ConfirmUndoCommentFeedbackModal` | Reply edit/report/feedback inputs accept the selected view; cache eviction identifies `Comment` by id                                    | Their write operations and new-feedback response are not migrated here                 |
| `commentDisplay`, `commentPermalink`, `routerUtils`                                                                                   | Structural display helpers accept only the fields they inspect; feedback route input requires ids rather than complete entities          | Shared context operation migration below                                               |

### Reviewed compatibility exceptions (owner: frontend, follow-up #700)

`CommentView` is a shared presentation contract, not an Apollo response type.
Its non-null fragment fields remain required. Only nullable selected fields may
also be absent, recursively, because the existing schema entity types used by
legacy callers mark those keys optional. The exact reply result still retains
GraphQL nullability and selected-field guarantees; no query result is cast to a
schema entity. Apollo's injected author `__typename` is optional at this shared
boundary. JSON reaction data remains unknown until narrowed to the existing
string format expected by the emoji control.

Legacy context is explicitly optional and schema-derived: channel/issue and
feedback-target links, event channel names, author display names, and feedback
counts. Replies do not claim to select those fields. These fields preserve
behavior for `CommentSection`, `PinnedAnswers`, `CommentOnFeedbackPage`,
`EditCommentFeedbackModal`, discussion feedback modals, `CommentDetails`,
`GithubContributionChart`, and profile/library/mod/event/discussion pages using
the shared renderer. Migrate those producers by vertical slice, generating their
actual operations and replacing these compatibility fields with composed
selection fragments. Remove the nullable-key compatibility mapping once those
producers no longer use schema entity response annotations. Root comment lists,
profile tabs, unrelated writes, server-side operations, and cross-repository
backend response enforcement remain outside this slice.

CI's reply component test asserts its single query uses the generated document
identity (not a raw/untyped document). Compile fixtures assert reply-to-view
compatibility, reject unselected schema fields and invalid pagination variables,
and enforce nullable results/text. Component tests exercise empty/error/loading
states, pagination and null-page merges, real recursive rendering with exact
selected-field fixtures, and existing edit/report/vote/subscription interactions.
The existing nested-comment browser flow runs in normal CI. Strict validation,
offline generation/freshness, and existing resolver null-filter safeguards remain
unchanged.

## Phase 5, slice 2: permalinked comments (#700)

One more read is migrated (eight generated operations total):
`GET_COMMENT_AND_REPLIES` now names its operation `getPermalinkedComment`, avoiding
its former collision with the recursive `getCommentWithReplies` operation. The
exported source constant and composed `CommentFields`/`CommentVoteFields`
selections are unchanged. Operation-name mocks must distinguish these two reads.

| Boundary                                              | Contract                                                                                             | Remaining work                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `PermalinkedComment.vue` query and named slot         | `GetPermalinkedCommentDocument`; exact `GetPermalinkedCommentQuery['comments'][number]` slot payload | None for this read                                     |
| Discussion and event `comments/[commentId].vue` pages | Inferred slot payload passes directly to the existing `CommentView` renderer                         | Existing interaction operations remain separate slices |

The component is the single route-ID source; the wrappers no longer snapshot or
pass an undeclared `comment-id` attribute. A reactive variables getter accepts
only nonempty scalar IDs and disables the query for missing, blank, or array
values. Loading/error states and a matching-result-ID guard prevent an old
comment and its context link from appearing during navigation. Context links
require scalar forum/discussion/event route IDs. Nullable text, author and parent
remain nullable; no schema entity assertions or new compatibility types are used.

CI asserts generated-document identity and source/fragment equivalence, invalid
ID types and missing variables, selected-field/nullability guarantees, and root
and child compatibility with the shared renderer. Component/page tests cover
invalid IDs, state transitions, navigation, context links, nested rendering and
interaction forwarding. Browser coverage exercises discussion and event comment
permalinks, parent navigation and accessibility; recursive reply mocks keep their
original operation name. Pinned schema provenance, offline freshness generation,
strict validation and null guards remain in force.

Root feeds, profile tabs, mutations/cache writes and backend enforcement remain
follow-up work owned by frontend #700 (or the backend campaign). Slice 1's shared
presentation compatibility exceptions remain necessary for their other producers.

## Phase 5, slice 3: comment reply-notification subscriptions (#700)

Two more operations are generated (ten total): `SUBSCRIBE_TO_COMMENT` and
`UNSUBSCRIBE_FROM_COMMENT`. Their selections and operation names are unchanged.
`useCommentSubscription` is their only production Apollo consumer; the shared
`Comment.vue` menu and its `?action=unsubscribe` integration use that composable.
The input is a minimal `Pick<CommentFieldsFragment, 'id' |
'SubscribedToNotifications'>`; both mutations infer exact variables and nullable
results from generated documents without schema-entity assertions.

The previous explicit cache modifier wrote subscribers onto the current render
prop's ID. A late mutation response after navigation could therefore modify the
wrong comment. Both returned comments select `id`, and Apollo adds `__typename`,
so normal entity normalization replaces the selected subscriber list on the
returned comment. The redundant modifiers are removed. Real Apollo/normalized
cache tests cover repeated subscribe/unsubscribe, empty/null results, errors and
navigation while a request is pending. Document-identity and source-equivalence
checks guard this migrated boundary; negative compilation fixtures reject wrong
ID types, missing variables and unselected fields. Browser coverage exercises
repeated Watch/Unwatch Replies menu actions without a reload.

Root-list migration remains separate: `GET_DISCUSSION_COMMENTS` feeds discussion
detail fallback data, downloads, answer pagination and multiple form cache writes;
`GET_EVENT_COMMENTS` likewise crosses the shared section/form boundaries. Migrate
those coordinated consumers together instead of widening profile queries or
weakening renderer types. Profile, root-list, other mutation/cache consumers and
existing presentation compatibility exceptions remain frontend-owned #700 work.
Discussion/event/issue subscription operations and the shared auto-unsubscribe
lifecycle are unchanged by this slice.

## Phase 5, slice 4: discussion/download root comments and creation (#700)

Eight coordinated operations plus the existing single-comment hydration read are
generated (nineteen total):
`GET_DISCUSSION_COMMENTS`, both discussion-channel comment aggregates,
`GET_DISCUSSION_DETAIL`, `GET_DOWNLOAD_DETAIL`, `GET_DISCUSSION`,
`GET_DISCUSSION_DETAIL_ANSWERS_PAGE`, `CREATE_COMMENT`, and `GET_COMMENT`. Import their documents
and exact selections from `@/__generated__/operations`; `pnpm compile` generates
offline and `pnpm operations:check` checks freshness against the pinned schema.
The all-comment aggregate is named `getDiscussionChannelCommentAggregate`; the
root-filtered aggregate retains `getDiscussionChannelRootCommentAggregate`.
Mocks must distinguish their filters. No backend schema or projection changed.

| Boundary                                                                                       | Migrated contract                                                                                                  | Explicit remaining exception                                                                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `DiscussionDetailContent.vue` root reads, fallback and pagination                              | Generated documents and exact root/answer selections; matching conversation and pagination-scope guards            | Activity and media-page operations remain raw; their local responses use the matching selected subsets, not full entities       |
| Download comments page and discussion/download metadata/title callers                          | Generated detail/fallback/count documents and reactive scalar variables                                            | Event root reads and profile producers remain separate                                                                          |
| `DiscussionCommentsWrapper`, `CommentSection`, detail header/layout/body/album/feedback inputs | `DiscussionPresentation` / `CommentChannelView`, derived from selected operations                                  | These presentation-only contracts allow documented optional fields for legacy callers; they are never Apollo result/cache types |
| Root and inline forms, event create form, `useCommentCrudMutations` create branch              | All four `CREATE_COMMENT` callers infer their selected results and variables                                       | Other mutations and event read/cache contracts remain unmigrated                                                                |
| `PinnedAnswers` / `HydratedAnswer`                                                             | Exact answer summaries; existing single-comment operation hydrates each visible answer before interactive controls | Backend summary projections remain unchanged                                                                                    |

Pinned answers keep summary text during loading/error and offer retry. Matching-ID
and query-state guards hide stale controls. Cache-first loading reuses complete
cached selections; only visible/paginated answers mount queries. The single-comment operation does
not fetch child reply lists; those retain their existing pagination. Reply/edit state
is forwarded from the shared section to the hydrated renderer. Nullable data is
preserved. Summary fields alone are deliberately insufficient for `CommentView`.

Root creation updates only existing first-page cache entries matching the captured
forum/discussion/sort/moderator scope, across the actual 20/50 page sizes. It uses
the mutation's normalized comment reference rather than claiming its selection is
a root-query result. Cache misses do not fabricate sections or modify unrelated
lists. Duplicate results do not duplicate list items or increment counts twice;
only the count predicates selected by the root operation are incremented.
Completion after navigation cannot close another conversation's editor. Root and
answer page merges reject stale conversations and retain null guards.

Contract coverage includes source/document equivalence, invalid variables,
selected-field/nullability guarantees, summary-vs-renderer incompatibility,
normalized-cache isolation/counts, answer hydration/retry/navigation and forwarded
interactions. Browser scenarios cover immediate discussion/download creation and
pinned-answer recovery/reply controls, alongside existing nested-reply/event flows.

This is a partial #700 migration, not completion of the issue. Event root reads,
profiles/mod/library producers, the remaining comment mutations/cache writes and
backend/#701 work are still out of scope. The comprehensive call-site checklist
is maintained in issue #700; this table inventories only this slice.

## Phase 5, slice 5: event root-comment reads (#700)

Four more operations are generated (twenty-three total): `GET_EVENT`,
`GET_EVENT_COMMENTS`, `GET_EVENT_ROOT_COMMENT_AGGREGATE`, and
`GET_EVENT_CHANNEL` (`getEventChannelID`). Their documents retain the exact
source selections and use the same pinned offline generation/freshness checks.
No backend projection or query selection was expanded.

`EventDetail.vue` now infers these four reads, narrows reactive route IDs to
scalars, and carries exact root selections through rendering and pagination.
Page merges reject stale event/forum/sort contexts, ignore null rows and deduplicate
IDs. Event detail/fallback, aggregate and archive state are matched to the current
context. The initial query is not redundantly refetched on mount; authentication
changes still refetch. The event create form uses the generated root read for its captured
refetch variables; its mutation was already migrated in slice 4.

Header, body, calendar, footer, channel links and revision presentation props use
`EventPresentation` and selected revision/channel contracts. Presentation-only
optional metadata supports the smaller root fallback and legacy callers; these
contracts are never Apollo result or cache types. Poster display-name/avatar
compatibility remains optional because these event reads do not select them.
The unused channel-link comment-count prop was removed rather than asserting an
unselected count.

Negative type tests cover invalid scalar IDs/pagination variables, nullable detail
and fallback, missing selected fields and root-renderer compatibility. Runtime
coverage includes variable reactivity, stale pagination, archive context, null/error
fallbacks and create-refetch snapshots. Browser coverage exercises overlapping
pages, URL sort, forum navigation and empty/null/error roots. Browser fixtures
supply selected event history and author fields plus normalized typenames so cache
completeness is tested rather than masked by incomplete responses.

This remains a partial #700 migration. Other `GET_EVENT` consumers (title editor,
event edit page and moderation views), other event-channel consumers, event
mutation/subscription cache helpers, event lists and profile/mod/library producers
remain separate. Existing cache-helper compatibility assertions were not removed
or extended. The comprehensive issue checklist remains the project-wide inventory;
this section records only the four operations and five migrated call sites.

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

Generated documents share identical precompiled AST node constants to keep route
bundles within existing budgets. Every exported document still contains its complete
fragment definitions; generation does not add runtime GraphQL parsing. Source/document
equivalence tests cover the shared output as well as the migrated operations.
