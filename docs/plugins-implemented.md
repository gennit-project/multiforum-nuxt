# Plugin system: implemented behavior

This document is the maintained engineering summary of Multiforum's plugin
system. It describes shipped behavior rather than the order in which features
were developed.

## Lifecycle and trust boundaries

A server administrator can discover a plugin from a configured registry,
allow it, install an exact version, configure settings and encrypted secrets,
and enable that installed version. Enabling a plugin only makes it available
to pipelines: it does not subscribe the plugin to every event automatically.

Plugin packages run in the backend process. Expensive or risky work should be
delegated to a separately isolated service. The first-party attachment scanner
uses this pattern: the TypeScript plugin sends an authenticated request to a
Python scan service, which fetches and inspects the untrusted file.

Registry artifacts are checked against their SHA-256 integrity metadata.
Plugin compatibility metadata can require a minimum Multiforum server version
and plugin API version. Each pipeline job snapshots the resolved plugin version
and configuration used for that attempt.

## Events and scope

Pipelines are explicit ordered policies stored on either `ServerConfig` or a
`Channel`.

| Event | Supported scope | Purpose |
| --- | --- | --- |
| `downloadableFile.created` | Server | Run checks when a file is uploaded. |
| `downloadableFile.updated` | Server | Run checks when the file is replaced or modified. |
| `downloadableFile.downloaded` | Server | Run a check when a download request needs a fresh result. |
| `comment.created` | Server and channel | Run comment automation; a matching channel pipeline takes precedence over the server pipeline. |
| `discussionChannel.created` | Channel | Run automation when a discussion is submitted to a channel. |

Channel owners configure channel pipelines at
`/forums/[forumId]/edit/pipelines`. They can only use plugin versions that a
server administrator has installed and enabled. A channel policy cannot
disable or bypass a server policy.

The pipeline editor's YAML uses `plugin` for a step identifier and translates
it to the GraphQL/backend field `pluginId` when saving. The declarative
configuration manifest is an API-facing format and therefore uses `pluginId`
directly.

```yaml
pipelines:
  - event: downloadableFile.created
    applicability: NEW_FILES_ONLY
    stopOnFirstFailure: true
    steps:
      - plugin: security-attachment-scan
        version: "0.5.1"
        condition: ALWAYS
        continueOnError: false
```

Steps support `ALWAYS`, `PREVIOUS_SUCCEEDED`, and `PREVIOUS_FAILED` conditions,
plus step-level `continueOnError` and pipeline-level `stopOnFirstFailure`.
There is no implicit “run every enabled plugin” fallback.

## Download checks and rollout policy

Download pipeline applicability is an explicit policy:

- `NEW_FILES_ONLY` requires the check for file versions uploaded on or after
  the policy effective time;
- `ALL_FILES_GRADUAL` creates a controlled existing-file backfill campaign;
- `ALL_FILES_IMMEDIATE` immediately applies the policy to existing files.

The applicability decision, policy ID, effective time, target file version,
and campaign ID are retained with attempts. Replacing a binary creates a new
file version and requires a new decision; a prior clean result or manual
release does not carry forward.

Campaigns support preview, rate and concurrency controls, pause/resume, and
completed/running/failed/timed-out totals.

## Attempts, jobs, and recovery

A pipeline attempt contains ordered jobs. Attempt states are `QUEUED`,
`RUNNING`, `SUCCEEDED`, `FAILED`, `TIMED_OUT`, and `CANCELLED`. Jobs additionally
support `PENDING` and `SKIPPED`.

Only one attempt can be active for the same target, event, scope, channel, and
file version. Execution leases and heartbeats identify abandoned work. The
watchdog marks an expired job and attempt timed out and releases the active
attempt lock so an eligible person can retry.

The uploader or discussion author can start a required check that has not run.
A channel moderator with `canEditDiscussions` can do the same for downloads in
that channel. Those users can retry only the latest failed, timed-out, or
cancelled attempt for the unchanged file version. Retries have a one-minute
cooldown and a limit of three retry attempts in a rolling hour.

## Public history and private logs

When a visible download has applicable checks or history, its detail page has a
public **Pipelines** tab. It shows planned checks before execution, current and
past attempts, ordered job statuses, stable attempt links, and deliberately
published public diagnostics. The tab follows the visibility of its target; it
does not make removed or otherwise hidden content public.

Public diagnostics are structured, bounded, and sanitized before storage.
They are not a projection of arbitrary plugin logs. Internal payloads and logs
remain restricted to users with plugin-management permission and can contain
operational or provider details that are unsafe to repost publicly.

## Security scan and logical quarantine

The first-party `security-attachment-scan` plugin version `0.5.1` handles the
three `downloadableFile.*` events. It calls the separate scan service with an
`X-API-Key`; the shared backend secret is `SCAN_SERVICE_API_KEY` and must match
the service's `SCAN_API_KEY`. The VirusTotal key is configured on the scan
service, not in Multiforum.

The plugin publishes share-safe codes including `SCAN_COMPLETE`,
`SCAN_NOT_APPLICABLE`, `SCAN_SUSPICIOUS`, `SCAN_MALWARE_DETECTED`,
`SCAN_PROVIDER_ERROR`, and `SCAN_CONFIGURATION_REQUIRED`. A correlation ID
connects a public diagnostic to private backend and scan-service logs without
exposing a signed file URL.

Files in `PENDING`, `SUSPICIOUS`, `INFECTED`, or `FAILED` are logically
quarantined and cannot be downloaded. A successful check sets `CLEAN`. Users
with the server's `canPermanentlyRemoveImage` moderation permission can review
the security queue and release quarantine with a required audit reason. The
release preserves the failed or suspicious pipeline history and notifies the
uploader.

If the same security scanner is selected in both a server upload policy and a
channel submission policy, the server requirement takes precedence and the
channel trigger does not scan the same bytes a second time.

## Administration surfaces

- `/admin/settings/plugins` manages allowed, installed, and enabled versions.
- `/admin/settings/plugins/[pluginId]` manages server settings and secrets.
- `/admin/settings/plugins/pipelines` manages server pipelines and existing-file
  campaigns.
- `/forums/[forumId]/edit/plugins` manages channel plugin settings.
- `/forums/[forumId]/edit/pipelines` manages channel pipelines.
- The admin dashboard contains the download security review queue and pipeline
  health information.

## Declarative configuration

Operators can keep desired server plugin state in source control with the
`multiforum.gennit.dev/v1alpha1` manifest and the backend's `mfctl` command.
`plan` previews drift without resolving plugin secrets; `apply` preflights and
then installs versions, writes resolved secrets, configures and enables
plugins, and updates the complete managed server pipeline list.

The format is additive for plugins: an omitted plugin is not disabled or
uninstalled. Pipelines are different: omitting `pipelines` leaves them
unmanaged, while `pipelines: []` manages them as an empty list. Secret values
remain in the operator's environment or CI secret store and are write-only.

The backend reference is `docs/plugin-configuration-reconciliation.md` in the
backend repository. The public operator guide contains the supported CLI and
machine-identity workflow.

## Source locations

- Pipeline schema and editor translation: `utils/pipelineSchema.ts` and
  `utils/pipelineUtils.ts`
- Public pipeline UI: `components/plugins/PublicDownloadPipelines.vue`
- Server pipeline page: `pages/admin/settings/plugins/pipelines.vue`
- Channel pipeline page: `pages/forums/[forumId]/edit/pipelines.vue`
- Download pipeline route:
  `pages/forums/[forumId]/downloads/[discussionId]/pipelines.vue`
- Backend runtime and reconciliation: `services/plugin/` and
  `customResolvers/mutations/` in `gennit-backend`

Public behavior and operating procedures belong in the Multiforum public docs;
this document exists to keep contributors oriented to the implementation.
