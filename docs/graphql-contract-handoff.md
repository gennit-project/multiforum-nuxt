> Completion checkpoint: the exact backend commit `fb711efdfcca9d7af5a18b10c592461c87f23ef8`
> was exported locally with Node 26 and its hash/size verified, then pinned using
> `schema:update`. All eleven former boundaries are migrated or eliminated;
> the production audit reports 555 generated consumers and zero exceptions.
> Final runtime/browser/CI validation is recorded in draft PR #707. The matrix
> below preserves the original handoff requirements, not an outstanding blocker list.

# Remaining #700 contract handoff

Frontend baseline: `feat/700-typed-event-comments` at
`9af86915d82c5476caf18dd5507b905f92c0f3f4`, draft PR #707. Eleven raw-variable
boundaries remain. Backend contract implementation is authorized in a companion
task; this checklist does not prescribe unverified operation or input names.

## Artifact required before migration

Provide the exact committed backend revision and its exported `schema.graphql`
plus `manifest.json`. The manifest must identify that revision, resolved dependency
versions, backend lockfile SHA-256, and the schema's SHA-256/byte count. Export from
the actual final backend schema, not a frontend-patched SDL. Supply the companion
PR and integration-test results alongside the artifact.

Use `pnpm schema:update <artifact-directory>`, then `pnpm compile`. The supported
updater verifies provenance structure, schema validity, digest and byte count
before replacing either pinned file. Check the supplied revision/artifact against
the backend handoff independently; syntactically valid provenance alone does not
prove which code produced it. Do not refresh fingerprints to bless a new pin while
the remaining application inputs are still unsupported.

## Exact frontend mapping

| Boundary | Required behavior and response data | Existing test entry points |
| --- | --- | --- |
| `components/discussion/form/CreateDiscussion.vue` create | Existing crosspost ID; authenticated author; tags/flairs/channel connections; optional initial album; resulting discussion/channel IDs for cache insertion and navigation | `CreateDiscussion.spec.ts`; `tests/playwright/mocked/discussions/createEditDeleteDiscussions.spec.ts` |
| `components/download/form/CreateDownload.vue` create | Same crosspost/authorship semantics; existing downloadable-file IDs; create response identifies the new discussion | `CreateDownload.spec.ts`; download browser suites |
| Same CreateDownload file, album follow-up | Attach ordered existing image IDs to the created discussion without assigning uploader rights; do not navigate as if the album saved after failure | `CreateDownload.spec.ts`; download creation browser coverage |
| `components/discussion/detail/AlbumEditForm.vue` save | Create or update the discussion album; ordered membership, removals and authorized metadata edits; retain discussion-owner/moderator authorization | `AlbumEditForm.spec.ts`; album browser flows |
| `composables/useAlbumAutoSave.ts` | Same album behavior under debounce; handle repeated edits, unmount, rejection and identity changes without saving stale targets | `tests/unit/composables/useAlbumAutoSave.spec.ts` |
| `pages/forums/[forumId]/downloads/edit/[discussionId].vue` | Coordinated text/channel/tag/file/album update; distinguish omitted album from an empty membership snapshot; preserve removal/order semantics and error handling | Colocated page spec; `utils/albumUpdateInput.spec.ts`; `tests/unit/utils/albumUpdateInput.spec.ts`; download browser suites |
| `components/mod/CreateIssueForm.vue` | Generic issue without an invented content target; both forum and server scope; authenticated user/moderator identity; server-assigned issue number; nullable channel plus number in response for routes/count caches | `CreateIssueForm.spec.ts`; issue creation browser coverage |
| `pages/forums/[forumId]/wiki/create.vue` | Create/link a forum home page with authenticated editor and initial revision; return enough identity for refetch/navigation | Colocated spec; `tests/playwright/mocked/wiki/wikiAuthoring.spec.ts` |
| `pages/forums/[forumId]/wiki/create-child.vue` | Create child under an existing parent in the correct forum; authenticated editor and initial revision; retain slug/ID | Colocated spec; wiki authoring/revision browser suites |
| `pages/forums/[forumId]/wiki/edit/[slug].vue`, regular page update | Update selected page with title/body/edit reason, authenticated editor and revision snapshot; preserve lock/permission checks | Colocated spec; wiki authoring/revision/report browser suites |
| Same wiki edit page, home update | Equivalent edit semantics for the current forum home page, without a generated ChannelUpdateInput relationship workaround | Same wiki test entry points |

The issue form currently chooses the signed-in moderation profile when available,
otherwise the signed-in user. The final contract must state whether this choice is
derived from context or represented by a validated persona selector. It must never
allow arbitrary author impersonation. Empty forum selection means server scope,
not a dummy channel or fabricated issue target.

For albums, omitted input means no album change; an explicit empty image list
must support removing all membership. Existing image IDs refer to reuse, not
creation or ownership transfer. Keep metadata patches separate from membership:
the frontend can omit unchanged metadata, and the backend must authorize actual
changes. Return the selected album/image identity/order fields used by the UI.
Document whether the combined discussion/album save is transactional so failures
cannot be presented as a complete save after only part of the edit persisted.

## Tests to complete against the verified contract

- Replace every raw hook and explicit legacy result/variable generic with generated
  document inference. Remove `legacyWikiWrites` and the old album input adapters
  when their consumers are migrated; do not keep a second unchecked write path.
- Update negative type tests to reject route arrays, missing required target IDs,
  invalid metadata types, client-owned identity/number fields and unselected result
  fields. Retain nullable result guards. Replace obsolete missing-field assertions
  with assertions for the actual new contract rather than deleting coverage.
- Run actual variable coercion against the new pinned schema for all eleven
  builders, including empty/nullable/optional branches. Known-rejection tests must
  become successful-coercion tests with separate invalid-input cases.
- Add meaningful runtime/cache tests for duplicate completion, cache misses,
  forum/server scope, navigation while a mutation is pending, missing responses,
  permission errors, partial failures, and repeated save/debounce behavior.
- Browser coverage must exercise submitted writes, not only form rendering:
  crosspost creation, download with reused images, album reorder/removal/save,
  forum/server issue creation, and wiki home/child create plus edit/revision flows.
  Mocks use actual generated variable/result contracts; backend companion tests
  separately execute requests through coercion, authorization and persistence.
- Remove each exception only after its source hook and tests migrate. Final target:
  an empty exception ledger, zero raw/unresolved/overridden consumers, strict
  document validation, reproducible offline generation and unchanged budgets.

Complete full local gates and exact-head CI on the coordinated frontend/backend
heads. Keep both PRs unmerged and #707 draft until the user reviews the result.
