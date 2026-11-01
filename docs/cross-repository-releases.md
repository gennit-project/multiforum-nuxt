# Cross-repository GraphQL compatibility and releases (#701)

A schema pin proves a known build-time contract. Neither a merge, a green check,
a release tag nor an uploaded image proves which revision is serving traffic.
Backend maintainers own candidate schema export and the backend release gate;
frontend maintainers own the complete operation inventory and its freshness.
Both owners review changes to the supported-client set and intentional breaks.

## Evidence and supported clients

Record the exact frontend commit, backend commit, image digests, environment and
observation time before approving a rollout. Obtain revisions from deployment
records and public version/health metadata; do not infer them from `main` or
inspect production records or credentials. If either revision is unavailable,
record **unknown**, stop deployment approval, and continue isolated CI validation.
At the start of #701, the latest frontend main was `cff508ff` and its schema pin
was backend `3d356e90aaaf11b44d0012e82d2c044a07ce4343`; deployed revisions were
unknown. These are source evidence, not deployment evidence.

There is no established N-1 or time-based support policy in this repository.
Do not introduce one implicitly. The backend gate's reviewed support list must
identify immutable frontend commits and operation checksums. Start with the
current migrated frontend as a **source compatibility target**, not a claim
that older deployed clients have expired. Before releasing, add every observed
active frontend and the intended rollback frontend. Keep an old client supported
until maintainers have evidence that its traffic/cached assets are retired and
have approved the rollback replacement. An older client without this artifact
needs a separately reviewed inventory capture; never call missing evidence a pass.

## Reproducible artifacts and checks

`graphql-operations/operations.json` is the portable data-only inventory of every
production document from the existing strict extractor. It contains original
source locations, resolved fragment dependencies, source and document SHA-256s,
the frontend lockfile hash and the original schema pin. It does not contain
credentials or runtime data. Repeated generation is deterministic:

```sh
pnpm install --frozen-lockfile
pnpm schema:check
pnpm schema:types:check
pnpm operations:check
pnpm graphql:check
pnpm operations:contract:check
pnpm compatibility:test
```

For an intentional frontend source change, run
`pnpm operations:contract:generate` and commit the reviewed snapshot. Do not
regenerate artifacts as part of the freshness check. `schema:types:check`
compares schema-wide generated types without writing them; `operations:check`
continues checking typed documents and all migrated consumer boundaries.

From a clean checkout, `pnpm operations:export` verifies freshness and writes
`artifacts/frontend-operations/{operations.json,manifest.json}`. Its manifest
binds the bundle checksum and length to the exact checkout SHA and lockfile.
Tests CI uploads `frontend-operations-<checkout SHA>`; PR runs use the synthetic
merge SHA, not the PR head SHA. Select artifacts by repository, successful
workflow, exact checkout SHA and expected artifact name, never by latest run.
Hashes establish integrity, not author authenticity: use trusted GitHub run/source
provenance as well. Export refuses dirty checkouts rather than labelling edits
as HEAD. Offline reproduction from the exact commit and frozen lockfile is valid.

The candidate backend retains its existing versioned `schema:export` artifacts.
Export from the exact candidate checkout, and compare its manifest revision to
that checkout. For each supported frontend, retain its original `graphql-schema`
as the baseline, then run the following using a reviewed checker revision:

```sh
pnpm compatibility:check \
  --schema /path/to/candidate-backend/artifacts/graphql-schema \
  --backend-revision FULL_CANDIDATE_BACKEND_SHA \
  --operations /path/to/frontend-operation-artifact \
  --frontend-revision FULL_SUPPORTED_FRONTEND_SHA \
  --baseline /path/to/supported-frontend/graphql-schema
```

The gate validates all documents, reports file/line/operation diagnostics and
compares the full schema for GraphQL breaking and dangerous changes. This catches
changes to unused fields too, and enum expansion/default changes that may leave
a query valid but alter behavior. Tests explicitly reject removal of the real
`writeWikiPage` mutation and a reversion of `createIssue` to its old input type,
and accept an additive field against the complete real schema inventory.

A manifest mismatch, missing artifact, failed extraction, stale output, unavailable
repository or malformed schema is a failed gate. Restore access through the
normal reviewed configuration or reproduce the exact pinned input locally;
never fall back to an unpinned branch, a live endpoint, an empty inventory, or
silently skip a client. Preserve the diagnostic output with the failed run.

Backend integration must invoke this check for each explicitly supported revision
before publication, using its own newly exported candidate schema. Frontend CI
proves export/freshness and validates the pinned pair; it cannot by itself block
a future backend release. The companion backend change owns that enforcement.
Use read-only public repository access and `contents: read`; no cross-repository
PAT is needed. Parse downloaded contracts as data. Never execute scripts supplied
by an untrusted PR in a privileged `pull_request_target`/`workflow_run` context.
Checks should run without deployment secrets; publication consumes successful
checks of the same candidate SHA.

## Intentional breaking changes and rollout

There is no wildcard bypass or operation-error baseline. A failing operation must
be repaired while its frontend remains supported. For an intentional schema
break, open a coordinated change reviewed by both owners. Attach the exact
candidate/baseline hashes, affected clients, complete diagnostics, migration path,
retirement evidence, rollback pair and support-list update. Do not refresh a
supported client's original baseline just to make the diff disappear. If a
semantically safe but GraphQL-dangerous change needs an exception, design and
review a narrowly scoped exception with owner, reason and expiry before release;
this initial gate deliberately has no automatic waiver.

Evaluate all four pairs in disposable tests: old frontend/old backend, old
frontend/new backend, new frontend/old backend and new frontend/new backend.
For #415/#707, `createIssue` changed `IssueCreateInput!` to `SubmitIssueInput!`;
new wiki writes and album/crosspost inputs also require the new backend. Merely
saying "backend first" does not prove either mixed pair works. A static operation
pass does not prove variable values, authorization, persistence or attribution.

1. Record observed and target revisions, and run the compatibility matrix.
2. Exercise crosspost references, album membership/metadata ownership, issue
   identity/numbering and wiki revisions/attribution against disposable Neo4j.
   Backend `tests/integration/frontendInputContracts.test.ts` already covers
   these families through the augmented schema and permissions middleware.
   Preserve that suite and run it for the exact candidate; do not replace it
   with mocks. Add frontend-boundary tests where the existing smoke supports them.
3. Keep the existing coordinated container smoke in
   `.github/workflows/container-image.yml`: it validates the selected release
   bundle, bootstrap, session and same-origin GraphQL proxy using temporary
   containers and volumes. Its success alone does not prove these four writes.
   Image digests in `deploy/releases/release-components.json` are separately
   reviewed release inputs; updating the schema pin does not update that image.
4. Prefer an additive backend bridge that accepts old and new clients, deploy
   that backend, validate the overlap, then release the new frontend. Retire the
   old shape only after the support window is explicitly closed. If no bridge
   exists, coordinate a controlled paired cutover with maintainers; do not claim
   a rolling zero-downtime upgrade.
5. Roll back to a previously tested **pair** of frontend/backend image digests.
   Confirm schema/data migration reversibility and cached-client compatibility
   before starting. A frontend-only or backend-only rollback needs its own mixed
   pair evidence. Use the existing self-hosting release/rollback scripts and
   manifest, rather than mutable image tags.

Any unknown deployed revision, unsupported active client, failed write/permission
check or unverified mixed pair escalates to both repository owners before release.
Shared staging/production writes and deployment require separate authorization;
all automated write checks described here are restricted to disposable instances.
