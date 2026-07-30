# Public Plugin Pipelines — Implementation Plan

## Status

Approved direction. Phases 1–7 were implemented on 2026-07-30.

## Product intent

Plugin pipelines are part of the public trust and recovery model for content.
When a plugin check can delay, change, or block a download, people should be able
to see what was required, what ran, what passed or failed, and what can be done
next.

Pipeline history and useful diagnostics are public whenever the associated
content is public. Visibility follows the content for private, unpublished, or
removed content. Permissions control actions such as starting, retrying,
approving, or cancelling work rather than hiding ordinary pipeline history.

The experience should resemble GitHub Actions:

- configured checks are visible before they run;
- each execution is a durable, shareable attempt;
- attempts contain ordered plugin jobs;
- public diagnostics help uploaders get support from the community;
- uploaders can start missing required checks and rerun eligible failed work;
- moderators can retry or manually approve according to their permissions;
- abandoned work reaches a truthful terminal state instead of spinning forever.

## Core concepts

### Applicable pipeline

The pipeline definition that currently applies to a target, event, and scope.
It may exist even when no execution has ever occurred. This lets the UI show a
required check as **Not executed** for legacy downloads.

### Pipeline attempt

A first-class record for one execution of an applicable pipeline. A pipeline
attempt owns an ordered collection of plugin job runs and has its own status,
timestamps, trigger, initiating actor, configuration snapshot, and retry
lineage.

### Plugin job run

One plugin step within a pipeline attempt. The existing `PluginRun` record
continues to represent this concept and is related to its parent attempt.

### Public diagnostic

Structured, intentionally public output produced by a plugin. Public
diagnostics are distinct from internal operational telemetry. Existing
arbitrary plugin logs are not considered safe public diagnostics until a plugin
adopts the public diagnostic contract.

### Applicability state

Whether a configured check is required for a specific file:

- `NOT_REQUIRED` — excluded by rollout policy;
- `NOT_EXECUTED` — required, but no attempt exists;
- `QUEUED`;
- `RUNNING`;
- `PASSED`;
- `FAILED`;
- `SKIPPED`;
- `TIMED_OUT`;
- `CANCELLED`;
- `MANUALLY_APPROVED`.

`NOT_EXECUTED` is not the same as `PENDING`. A row inferred from configuration
must not create a placeholder database job.

## Pipeline rollout policy

Adding a new required check must not implicitly block or enqueue every existing
file. Each applicable pipeline stores rollout metadata:

```ts
{
  event: 'downloadableFile.created',
  effectiveAt: '2026-07-30T20:00:00.000Z',
  applicability: 'NEW_FILES_ONLY',
  steps: [...]
}
```

Supported rollout modes:

1. `NEW_FILES_ONLY` — recommended default. New binary uploads and replacement
   versions must pass; older files are explicitly `NOT_REQUIRED`.
2. `ALL_FILES_GRADUAL` — new files are enforced immediately and existing files
   enter a controlled, rate-limited backfill campaign.
3. `ALL_FILES_IMMEDIATE` — every applicable unscanned file is held until it
   passes. The administration UI must preview the impact and require explicit
   confirmation.

A future `ON_NEXT_DOWNLOAD` mode may scan legacy files lazily when they are next
requested.

“New” is determined from the uploaded binary or file-version timestamp relative
to `effectiveAt`, not from the discussion edit time. A replacement binary is
always evaluated as a new file version.

The policy version and applicability decision are recorded with an attempt so a
later configuration change cannot rewrite history.

## Public and internal output

Public pipeline pages may show:

- attempt and job status;
- plugin name and version;
- timestamps and duration;
- public result messages;
- structured diagnostic codes and details;
- remediation and documentation links;
- retry lineage;
- manual approval and initiating actor information;
- sanitized public logs.

They must never expose:

- credentials, tokens, cookies, or authorization headers;
- server or plugin secrets;
- signed URLs or private storage locations;
- email addresses, IP addresses, or private identifiers;
- internal prompt-debug data;
- raw moderation flags that contain private information;
- scanner-provider internals that materially assist evasion;
- unbounded arbitrary payloads.

The plugin API will distinguish the two channels:

```ts
ctx.diagnostics.public({
  level: 'error',
  code: 'ARCHIVE_CONTAINS_EXECUTABLE',
  message: 'The archive contains an executable file.',
  details: { path: 'setup.exe' },
  helpUrl: 'https://example.invalid/help/archive-check',
});

ctx.log.internal({
  message: 'Scanner provider response',
  providerRequestId,
});
```

The server centrally validates, bounds, and redacts public diagnostics. Legacy
`ctx.log()` calls remain internal by default and receive a generic public
result until migrated.

## Authorization

- Anyone who can view the content can view its applicable pipeline, attempts,
  jobs, and public diagnostics.
- The original uploader can start missing required checks and rerun eligible
  failed, timed-out, or cancelled attempts for their content.
- Authorized moderators can start or rerun checks and manually approve held
  content.
- Administrators can access separate internal operational telemetry.
- Only one active attempt may exist for the same target, event, scope, and file
  version.

All authorization is enforced by backend resolvers. UI visibility is not a
security boundary.

## Phase 1 — First-class attempts and applicability

### Goals

- Introduce `PluginPipelineRun` as the durable parent of existing `PluginRun`
  jobs.
- Compute pipeline status server-side.
- Snapshot the resolved pipeline definition when an attempt starts.
- Record event, target, scope, trigger, initiator, attempt number, retry
  lineage, policy metadata, and timestamps.
- Relate newly created plugin jobs to their attempt while preserving existing
  `pipelineId` compatibility.
- Add reusable download-pipeline applicability resolution, including rollout
  policy and expected steps.
- Keep legacy runs readable; no data migration is required in this phase.

### Acceptance criteria

- Every new download pipeline execution creates exactly one parent attempt.
- Its ordered plugin jobs reference that parent and share its compatibility
  `pipelineId`.
- The parent moves through `QUEUED`/`RUNNING` to a server-computed terminal
  status.
- Its configuration snapshot contains plugin IDs, versions, order, conditions,
  and policy metadata without secrets.
- Applicability resolution can return required expected jobs even when the
  target has no run history.
- `NEW_FILES_ONLY` excludes files uploaded before `effectiveAt`.
- Existing pipeline components and queries continue to work.

## Phase 2 — Public diagnostic contract and safe APIs

- Add structured public diagnostics to the plugin runtime.
- Add central validation, size limits, URL checks, and secret redaction.
- Store public diagnostics separately from internal telemetry.
- Replace raw public `PluginRun.payload` access with purpose-built APIs:
  - `getApplicablePluginPipeline`;
  - `getPipelineSummary`;
  - `getPublicPipelineRun`.
- Add separate moderator/admin internal-detail queries.
- Make pipeline visibility follow content visibility.
- Add regression tests with deliberately planted secrets and signed URLs.

### Acceptance criteria

Unauthenticated visitors can inspect safe pipeline data for public downloads,
and no raw internal payload is obtainable through the public schema.

## Phase 3 — Read-only public Pipelines tab

Add:

```text
/forums/:forumId/downloads/:discussionId/pipelines
```

Show the tab when either an applicable pipeline or historical attempt exists.

The tab displays:

- applicable required checks;
- `NOT_REQUIRED` policy explanations;
- `NOT_EXECUTED` rows when no attempt exists;
- attempt history, newest first;
- server and channel scopes;
- ordered jobs and overall status;
- public diagnostics and documentation links;
- stable shareable attempt URLs;
- polling while work is active.

Move the full `ScopedPipelineView` out of the sidebar. Retain a compact status
and “View checks” link beside the download action.

### Acceptance criteria

A visitor can distinguish “not required,” “not executed,” “running,” and every
terminal result without authentication.

## Phase 4 — Start missing required checks

Add an owner/moderator-authorized mutation:

```graphql
startPluginPipeline(
  targetId: ID!
  targetType: String!
  eventType: String!
  channelId: String
): PluginPipelineRun!
```

`channelId` is omitted for server pipelines and required for channel pipelines
so a cross-posted discussion resolves the intended channel unambiguously.

It:

- validates content ownership or moderation authority;
- resolves the current applicable pipeline;
- rejects `NOT_REQUIRED` targets unless a supported “run anyway” option is
  explicitly requested;
- rejects empty pipelines and duplicate active attempts;
- snapshots current configuration;
- creates the attempt and job records;
- records the initiating actor and `OWNER_START`/`MODERATOR_START` trigger;
- executes through the normal runner.

For a legacy required download, visitors see “The uploader must run this
check.” The uploader sees **Run checks**.

### Acceptance criteria

The preserved pre-scan fixtures can move from `NOT_EXECUTED` to a real attempt
and reach a truthful result without replacing the file.

## Phase 5 — Whole-pipeline retries

Add:

```graphql
rerunPluginPipeline(pipelineRunId: ID!): PluginPipelineRun!
```

Initial behavior reruns the complete applicable pipeline with the current
enabled configuration. The new attempt links to the previous one and preserves
the previous attempt unchanged. The UI labels this **Run checks again** and
states that current configuration is used.

The initial guardrails use a one-minute cooldown between retry attempts and
allow at most three retry attempts per target pipeline in a rolling hour. Only
the latest failed, timed-out, or cancelled attempt is eligible. Attempts
snapshot the file upload timestamp as `targetVersion`, preventing a retry from
running an old attempt against replacement bytes.

Guards:

- owner/moderator authorization;
- eligible terminal source status;
- one active attempt per target/event/scope/file version;
- cooldown and rate limiting;
- audit of initiator and reason;
- protections against duplicated external side effects.

The specialized downloadable-file scan retry is routed through this service
and later deprecated.

Per-job retries are deferred. A plugin may eventually opt in with an explicit
idempotent retry policy.

## Phase 6 — Stuck-job detection and recovery

- Add `queuedAt`, `startedAt`, `heartbeatAt`, `finishedAt`, and `timeoutAt`.
- Introduce execution leases.
- Have long-running jobs renew their lease.
- Add a scheduled watchdog that converts expired jobs to `TIMED_OUT`.
- Compute the parent terminal status and release the active-attempt lock.
- Permit a safe owner/moderator rerun after timeout.
- Surface queue age, timeout rates, repeated failures, and retry storms to
  administrators.

Frontend presence or page refreshes have no effect on execution.

### Acceptance criteria

Terminating a worker during a test job eventually produces `TIMED_OUT`, releases
the lock, and makes **Run checks again** available.

## Phase 7 — Rollout campaigns and community polish

### Existing-file campaigns

- Preview affected file count, storage accessibility, estimated provider use,
  and enforcement behavior.
- Run with configurable concurrency and rate limits.
- Support pause/resume.
- Display completed, running, failed, and timed-out totals.
- Link directly to failures.
- Preserve policy and campaign IDs on generated attempts.

### Community UX

- Add **Copy diagnostics** and **Share this attempt**.
- Give each attempt a stable URL.
- Publish documentation for stable diagnostic codes.
- Link diagnostics to community support discussions.
- Notify uploaders when attempts finish or time out.
- Show significant pipeline events in the Activity tab.
- Add attempt filters.
- Migrate first-party plugins to structured public diagnostics.
- Document the contract for third-party plugin authors.

## Cross-cutting verification

Every phase includes:

- resolver authorization tests;
- content-visibility tests;
- state-transition tests;
- concurrency and duplicate-execution tests;
- redaction tests with planted secrets;
- timeout/watchdog tests when applicable;
- uploader, moderator, and visitor frontend tests;
- mocked Playwright coverage for public viewing and owner actions;
- compatibility coverage for legacy `PluginRun` records and logging APIs.

## Preserved legacy fixtures

The current safe pre-scan downloads remain untouched. They are intentional
acceptance fixtures for Phase 4:

1. A visitor sees the public Pipelines tab and a required scan marked
   `NOT_EXECUTED`.
2. The visitor cannot start it.
3. The original uploader can select **Run checks**.
4. The state advances through queued and running to its terminal result.
5. A passing scan makes the download available.
6. The public attempt history and diagnostics remain shareable afterward.
