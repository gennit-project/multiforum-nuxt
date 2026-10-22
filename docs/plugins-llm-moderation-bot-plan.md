# LLM Moderation Bot Plugin — Design Doc & Implementation Plan

**Status:** Proposal / Draft — for review
**Date:** 2026-10-22
**Scope:** Experimental plugin. Full-stack: new plugin repo + external service, plus changes in `gennit-backend` and `multiforum-nuxt`.

> This is a design proposal, not a commitment. Sections marked **Decision needed** call out
> choices to confirm before implementation. File:line references point at the code the design
> builds on; they reflect `main` as of the date above and should be re-checked before coding.

---

## 1. Summary

Add an experimental LLM-backed moderation bot that an admin installs **at server scope** so it reviews
**every discussion and comment** against the server's rules and **reports** likely violations for human
moderators. The admin can additionally **enable it per forum (channel)** so that, for posts in that forum,
the same single evaluation also considers that forum's rules.

The bot **only reports** — it never edits, archives, deletes, or suspends. Each report includes a
recommendation ("suggest edit" or "suggest removal") and cites the specific rules it believes were
violated. Humans take all actions.

To keep latency, cost, and rate pressure under control, the LLM work runs **asynchronously** via an
**external service** (a Cloud Run service / cloud function, following the existing security-scan
precedent) and is **rate limited**. It is acceptable for the bot to take some time to get to each item.

---

## 2. Motivation, goals, non-goals

### Goals
- Server-scope install → review new discussions and comments against **server rules** and report violations,
  with an admin-chosen **mode**: all forums, an **allowlist** of forums (trial / phased rollout), or off (§4.1).
- Optional per-forum enable → additionally evaluate against **that forum's rules** (independent of the mode).
- A post in a forum where the bot is channel-enabled is evaluated in a **single consolidated LLM call**
  (server rules + that forum's rules together) producing a **single report** — not one call/report per scope.
- The unit of evaluation is the per-forum submission (`DiscussionChannel`) or a comment (which lives in one
  forum); a discussion shared to multiple forums is evaluated once **per forum** (§4.5).
- Human-in-the-loop: the bot's output is a **report with a recommendation** (edit / remove); only humans act.
- **Re-check on edit** — creation-only checks are trivially bypassable (submit clean, then edit to violate),
  so edited discussions/comments are re-evaluated for every forum they live in (§4.6).
- Asynchronous, rate-limited processing via an external service; some delay per item is acceptable.
- Reuse the existing moderation (Issue/ModerationAction) and plugin admin surfaces wherever possible.

### Non-goals (for the initial version)
- The bot taking any moderation **action** (edit/archive/delete/suspend). Report-only, by construction.
- Batching **multiple posts** into one LLM call (a separate future optimization — see §7.4).
- Per-channel LLM API keys / billing (server-scoped secret only; see §6.1 and the gap in §10).
- Moderating non-discussion surfaces (feedback comments, event comments, issue-thread comments) — these are
  currently skipped by the comment trigger (§10, gap 7).

---

## 3. What already exists (reuse these)

Research into the current codebase found that **most of the moderation-bot machinery already exists**; this
plugin is largely an assembly + extension job, not a greenfield build.

### 3.1 `auto-moderation-bot` — the closest precedent (reuse heavily)
`gennit-project/multiforum-plugin-auto-moderation-bot` already does LLM moderation:
- OpenAI Chat Completions via the runtime's global `fetch` (no `openai` npm dep; zero runtime deps). Default `gpt-4o-mini`.
- Trigger `events: ["comment.created"]`.
- **Structured JSON output** (`response_format: { type: "json_object" }`) parsed and clamped into
  `{ hasViolation, confidence, violatedRules[], explanation, suggestedAction: "report" | "none" }`,
  gated by a configurable `confidenceThreshold` (default 0.7).
- Reports via `context.reportContentAsBot(...)` when `hasViolation && confidence >= threshold`.
- Server + channel settings (`settingsDefaults.server`/`.channel`, `ui.forms.server`/`.channel`), with a
  channel `overrideProfiles` toggle. `OPENAI_API_KEY` as a `scope: "server"` secret.

Its siblings `chatgpt-bot-profiles` and `beta-reader-bot` are the conversational reply variants (the
"beta bot"). **This design extends the `auto-moderation-bot` pattern** rather than starting over — see §11
for the "extend vs. new plugin" decision.

### 3.2 `security-attachment-scan` + `security-scan-service` — the external-service precedent
A TypeScript plugin that runs in-process and makes an authenticated HTTP call to a standalone
**Python/FastAPI service on Cloud Run** which does the heavy/risky work. This is the model for moving LLM
work off the backend process:
- Plugin → service: `POST ${serviceUrl}/<route>`, `x-api-key` shared secret (from a server secret),
  `x-correlation-id` from `execution.correlationId`, JSON body. Service URL is a **setting**; the API key is a **secret**.
- Service: FastAPI, constant-time `X-API-Key` auth, pydantic settings (`SCAN_`-prefixed env), `/health` +
  authed work route, injectable httpx client for hermetic tests.
- Deploy: slim Dockerfile on `$PORT`, Cloud Run v2 via Terraform, secrets in Secret Manager (Terraform owns
  containers + IAM, values pushed via `gcloud`), Artifact Registry, keyless WIF CI, scale-to-zero.
- Install/enable + pipeline wiring is reconciled from a desired-state manifest applied with
  `mfctl plugin-config apply` (`apiVersion: multiforum.gennit.dev/v1alpha1`).

**Important caveat:** this precedent is **synchronous** (the plugin `await`s the service inline and blocks the
pipeline step). Genuine async (fire-and-forget + callback) is **new work** — see §7.

### 3.3 The report / moderation model (reuse as-is)
- A report creates an **`Issue`** with an `ActivityFeed` of **`ModerationAction`** nodes; the originating
  report is a `ModerationAction` with `actionType: "report"`. Actor is a `ModerationProfile | User` union.
- `services/botReportService.ts` `createBotReport(...)` ensures the bot user + `ModerationProfile`, finds or
  creates the Issue for the target (dedupes by `relatedCommentId`/`relatedDiscussionId`/`relatedEventId`),
  appends the report action, and reopens the Issue. It **requires at least one cited rule**
  (`selectedForumRules` and/or `selectedServerRules`) — and it already accepts **both** lists, which is the
  key enabler for the consolidated server+channel report (§4).
- Exposed to comment plugins as `context.reportContentAsBot({ contentType, contentId, reportText,
  selectedForumRules, selectedServerRules, botName, profileId, profileLabel })` (`commentTrigger.ts` ~578–610).
  It is **suspension-gated** (a misbehaving bot can be suspended).
- The bot **cannot** take mod actions: `archiveComment`/`suspendUser`/`unarchiveComment` are not exposed to
  plugins. Report-only is guaranteed by construction.

### 3.4 Plugin admin UI (reuse unchanged)
`multiforum-nuxt` already has the full lifecycle UI — a correct manifest renders automatically with **no new
admin code**:
- Server: `pages/admin/settings/plugins/[pluginId].vue` (install version, enable/disable via
  `EnableServerPlugin`, set secrets via `SetServerPluginSecret`, save settings; "enable" gated on
  `hasCompleteConfig`). Driven by `manifest.ui.forms.server` + `manifest.secrets`.
- Per-forum: `pages/forums/[forumId]/edit/plugins/index.vue` (per-forum enable toggle + version selector +
  Configure) via `UpdateChannelEnabledPlugins`; per-forum config form from `manifest.ui.forms.channel`.
- Pipelines: `pages/admin/settings/plugins/pipelines.vue` binds `eventType → pluginId[]`.
- Registries/docs pages already exist.

---

## 4. Scope model: server-wide review + additive per-forum review (the core design)

This is the central behaviour and the part that needs the most care.

### 4.1 Desired behaviour
- **Server-rule checking has a mode (Decision 4.E).** Because this is an experimental bot with a large blast
  radius (cost + report volume), the admin chooses *how broadly* the server rules are applied:
  - `all_forums` — review every discussion and comment in every forum against the server rules (full rollout).
  - `allowlist` — review only forums on an admin-chosen allowlist. This is the **trial / phased-rollout**
    path: pilot the bot on a few forums, build trust, then switch to `all_forums`. The allowlist also doubles
    as a **cost gate**.
  - `off` — no server-rule checking (the bot does only per-forum channel-rule checking where enabled).
- **Per-forum channel-rule checking (additive, and independent of the mode above):** in a forum where the
  admin enables the bot, each post is **additionally** evaluated against **that forum's own rules** (e.g.
  catching "good advice" posted in a `bad_advice` forum, or an off-topic post in `cats`). This is a separate
  switch from the server-rule mode — keeping them distinct avoids two confusingly-overlapping per-forum toggles.
- **Consolidation (unchanged):** when both server-rule checking (per the mode) and channel-rule checking are
  active for a post's forum, they are evaluated in **one** LLM call (server rules + that forum's rules
  together) producing **one** report. If only one dimension is active, it's still one call with that rule set.
  Never a server call + a separate channel call; never two reports for one piece of content in one forum.
- **Per-forum matrix** — for a given post's forum:

  | Server-rule checking active here? | Channel-rule checking enabled here? | Evaluated against |
  |---|---|---|
  | yes (mode `all_forums`, or forum in allowlist) | yes | server rules + forum rules (one call) |
  | yes | no | server rules only |
  | no (mode `off`, or not allowlisted) | yes | forum rules only |
  | no | no | not evaluated (skipped — no call, no cost) |

### 4.2 Why this is feasible and is the right design
- The report model already represents "violations from both scopes in one report": `createBotReport` takes
  **both** `selectedServerRules` and `selectedForumRules` and writes a **single Issue** per target. So the
  *output* side is a direct fit — no new reporting primitive needed.
- One call per post (instead of two) is strictly better for **cost and rate limiting**, which the user
  explicitly cares about.
- Combining the rule sets in a single prompt tends to produce **more coherent** judgments than two
  independent passes that can't see each other.

### 4.3 The thing to get right: dispatch must be ONE run per post
The risk: if per-forum enablement is modelled as a **second trigger** (a channel pipeline entry *and* a
server pipeline entry both naming this plugin), a comment in `cats` fires the plugin **twice** → two LLM
calls and potentially two reports. The current dispatcher resolves channel `pluginPipelines` and server
`pluginPipelines` and, absent a configured pipeline, falls back to running every enabled plugin that handles
the event (`commentTrigger.ts` ~238–315) — so double-dispatch is a real hazard.

**Recommended model — channel enablement is an additive modifier on a single server-driven run:**
- The plugin runs **at most once per post**. A run fires when **server-rule checking covers this forum**
  (mode `all_forums`, or the forum is on the allowlist) **or** the bot is **channel-enabled** for the forum;
  if neither applies, the post is skipped (no run, no cost).
- Within that single run, the plugin includes the **server rules** when server-rule checking covers the forum,
  and **that forum's rules** when channel-enabled — per the §4.1 matrix — in one consolidated prompt.
- The LLM returns violated rules tagged by scope; the bot calls `reportContentAsBot` **once** with
  `selectedServerRules` and/or `selectedForumRules` populated.

This keeps the generic pipeline model intact (one server pipeline step) while making per-forum enablement a
*configuration* the single run reads — not an independent execution.

**Decision needed (4.A):** confirm this "single server-driven run, channel-enable as a modifier" model vs.
the alternative of keeping two pipeline entries and adding **coalescing/idempotency** in the dispatcher so
the plugin still runs once with the union of rules. The former is simpler and recommended; the latter keeps
scopes orthogonal but needs new dedup logic in `commentTrigger`.

### 4.4 What the plugin run needs in context to do this
For the single run to evaluate both scopes it must have, in `handleEvent`'s payload/context:
1. **Server rules** — *gap:* the comment context currently supplies the **forum** rules
   (`channel.rules[]` via `buildBotInvocationContext.ts`); confirm/add **server** rules to the context.
2. **This forum's rules** — already present as `channel.rules[]`.
3. **Whether the bot is channel-enabled for this forum** — so it knows whether to include the forum rules.
   This can be read from the channel's `EnabledPlugins` edge (`ChannelPluginProperties.enabled` /
   `settingsJson`) and passed into the run, or encoded in the merged settings handed to the plugin.

**Decision needed (4.B):** should "channel-enabled" be surfaced to the plugin as (a) a resolved boolean +
the forum rules in the invocation context (backend does the lookup), or (b) left for the plugin to infer
from merged `settings.channel`? Option (a) is cleaner and keeps the plugin dumb.

### 4.5 The unit of evaluation is the `DiscussionChannel`, not the `Discussion`

Multiforum's data model matters here:
- A **comment** always belongs to exactly **one** forum — it hangs off a single `DiscussionChannel` (the
  per-forum submission node, which owns that forum's comment section). So a comment is always **one**
  evaluation: server rules + (if channel-enabled) that one forum's rules → one report in that forum.
- A **discussion** can be **shared to multiple forums**. Each share is its own `DiscussionChannel` node with
  its own comment section and its own forum rules. The discussion *body* is shared, but the *applicable
  channel rules* and the *mod team / report queue* differ per forum.

**Consequence (confirms the intended behaviour):** a discussion submitted to both `cats` and `dogs`, with the
bot channel-enabled in both, is evaluated **per `DiscussionChannel`** → **two LLM calls and two reports**:
one with (server rules + `cats` rules) filed in `cats`, one with (server rules + `dogs` rules) filed in
`dogs`. This is correct because channel rules are only meaningful within their forum and because Issues are
per-forum (`issueNumber` is per-channel; a `cats`-rule violation belongs in the `cats` mod queue).

So the evaluation unit is **"content as it appears in one forum"** — a `(DiscussionChannel, body)` for the
discussion submission, or a `(DiscussionChannel, comment)` for a comment. This unifies comments and
discussion-submissions and composes naturally with §4.1–4.3 (per unit: server rules always, forum rules when
channel-enabled, one consolidated call, one report).

This also dovetails with the existing event model: the backend already fires **`discussionChannel.created`
once per forum submission** (a valid channel-pipeline event), so a discussion shared to N forums produces N
triggers automatically — the two-calls behaviour falls out of the existing per-`DiscussionChannel` event
rather than needing new fan-out logic.

**Known redundancy (accept for v1):** evaluating the *same* discussion body against the *same* server rules
once per forum is duplicated work and duplicated spend when a discussion is widely shared. For v1 this is
acceptable (it keeps report routing trivially per-forum). A later optimization could cache a pure
server-rule verdict keyed by `(discussionId, bodyHash, serverRulesVersion)` and only re-run the
*channel-rule* portion per forum — but that complicates where a server-only violation's report is filed when
the content lives in several forums, so it is deliberately deferred. **Decision needed (4.C):** confirm
per-`DiscussionChannel` evaluation for v1 (recommended) with the dedup optimization deferred.

### 4.6 Edits are a first-class trigger (closing the "edit after approval" hole)

Checking only at **creation** is trivially bypassable: an author can submit conformant content, pass the
bot, then **edit** it to be non-conformant. So re-checking on edit is a **core requirement**, not a later
nice-to-have — without it the bot provides little real protection.

- **Comment edit** (`comment.edited`): re-evaluate the comment in its single forum.
- **Discussion-body edit:** re-evaluate the body for **every `DiscussionChannel`** the discussion is shared
  to (fan-out), each against server rules + that forum's rules — the same per-forum model as creation
  (§4.5). One edit to a discussion shared to `cats` and `dogs` → **two** re-evaluations. (The discussion
  title/body is shared, so one edit can change conformance in all forums it lives in at once.)
- **Re-use Issue dedup:** a newly-introduced violation opens or appends to the existing per-forum Issue
  (`createBotReport` finds-or-creates and reopens), so edits update the case rather than spawning duplicates.
  If an edit *removes* a previously-reported violation, the bot does **not** auto-resolve — humans decide
  (report-only); it may optionally append a note that the content changed.
- **Content-change guard (spend optimization, not a security relaxation):** skip re-evaluation when an edit
  doesn't materially change the moderated text (hash/length compare), but **always** re-evaluate on material
  change. This controls churn/cost without opening the evasion hole.

**Per-forum, not cross-forum consolidated (Decision 4.D).** When a discussion shared to many forums is edited,
re-evaluate **once per `DiscussionChannel`** (server rules + that forum's rules) — **not** a single call
carrying all forums' rule sets. Collapsing N forums into one multi-forum call would save input tokens (the
shared body + server rules are otherwise re-sent per forum) and one-call-vs-N eases rate limits, but it is
**not recommended as the default**:
- *Accuracy:* asking one call to attribute violations across (say) 10 rule sets to the correct forum is
  markedly more error-prone than N focused single-forum calls. For moderation, mis-attribution means a report
  in the wrong forum's queue citing the wrong rules — the worst failure mode.
- *Complexity / asymmetry:* it adds a second, discussion-edit-only evaluation shape (multi-forum prompt +
  response schema + result fan-out) that diverges from the uniform per-`DiscussionChannel` unit used
  everywhere else (comments are always single-forum), and makes retry coarse (one failure fails all forums).
- *Benefit is tail-only:* most discussions live in 1–3 forums, and the async queue + rate limiting (§7)
  already absorbs the N-call burst ("it's OK to take time"), so the win mostly applies to the uncommon
  widely-shared + frequently-edited + long-body case.

If cost on widely-shared discussions ever bites, prefer the **server-rule dedup** from §4.5 (evaluate the
shared body against server rules once; keep channel-rule evaluation per forum) over a giant multi-forum call
— it removes the duplicated tokens without the attribution risk. Deferred either way.

Because this is a correctness/anti-evasion property rather than a feature, the edit events (gap 1) and the
per-forum re-evaluation should land in the **same milestone as creation coverage**, not a deferred phase.

---

## 5. Architecture overview

```
 New discussion / comment (or edit)
        │
        ▼
 gennit-backend: per-DiscussionChannel trigger (discussionChannel.created / comment.created / *.edited)
        │   builds invocation context: content + author + SERVER rules + (if channel-enabled) FORUM rules
        ▼
 Rate-limited async queue  ──►  enqueue a moderation job (do NOT block the write mutation)
        │   (worker drains at a bounded rate; "it's OK to take time")
        ▼
 LLM moderation plugin (handleEvent)  ──►  POST to external moderation service (Cloud Run)
        │                                         │  x-api-key, x-correlation-id, JSON {content, rules[], policy}
        │                                         ▼
        │                                   External service calls the LLM, returns structured verdict
        ▼                                         │   {violations:[{scope, ruleId}], recommendation, confidence, rationale}
 Plugin maps verdict → reportContentAsBot(...) ◄──┘
        │   (only if confidence >= threshold and at least one rule violated)
        ▼
 Issue + ModerationAction(actionType:"report") authored by the bot's ModerationProfile
        │   recommendation (edit | remove) + cited server/forum rules + rationale
        ▼
 Human moderators see it in the existing Issue queues / ModerationWizard and decide
```

---

## 6. Detailed design

### 6.1 The plugin (new repo: `multiforum-plugin-llm-moderation` or similar)
Model on `auto-moderation-bot` + the security-scan plugin's external-call shape.

- **Manifest (`plugin.json`):**
  - `id`, `name`, `version`, `description`, `entry: "dist/index.js"`.
  - `events`: `["comment.created", "comment.edited", "discussion.created", "discussion.updated"]`
    (the last three are **new backend events** — see §6.3 / §10 gap 1).
  - `compatibility: { minServerVersion, apiVersion: "1" }`.
  - `secrets`: `OPENAI_API_KEY` (or provider key) `scope: "server"`, required; plus
    `MODERATION_SERVICE_API_KEY` `scope: "server"` (shared secret for the external service).
  - `settingsDefaults.server`: `{ serviceUrl, model, temperature, maxTokens, confidenceThreshold,
    recommendationPolicy, serverProfileId/profilesJson, serverRuleCheckMode ("all_forums" | "allowlist" |
    "off"), serverRuleForumAllowlist (forum ids, used when mode = "allowlist"), shadowMode (bool, optional
    dry-run) }`.
  - `settingsDefaults.channel`: `{ enabled toggle is handled by the ENABLED edge; optional per-forum
    confidenceThreshold / profile override }`.
  - `ui.forms.server` / `ui.forms.channel`, `metadata`, `documentation.readmePath: "README.md"`, `source`.
- **Code shape:** default-exported class; `constructor(ctx: HookContext)`; `async handleEvent(envelope)`;
  static `validateSecrets(secrets)`. Read key from `ctx.secrets.server`, service URL from `ctx.settings`.
  Guard against `author.isBot` to avoid loops. Return `{ success, result | error, retryable? }`.
- **Behaviour per event:** assemble `{ content, serverRules[], channelRules[] (if channel-enabled),
  policy }`, call the external service, parse the structured verdict, and if it clears the threshold call
  `reportContentAsBot` once (see §8).

**Decision needed (6.A):** does the LLM call live **in the external service** (recommended — lets us do
true async, keep the provider key off the backend process, and add batching later), or **in the plugin**
(simpler, matches `auto-moderation-bot`, but re-introduces the in-process synchronous problem)? This design
assumes the external service owns the LLM call.

### 6.2 The external moderation service (new repo: `multiforum-plugin-llm-moderation-service`)
Mirror `security-scan-service`:
- FastAPI (or a GCP cloud function), `/health` + authed `POST /moderate`.
- Constant-time `X-API-Key` auth; pydantic settings (`MOD_`-prefixed env); provider key from Secret Manager.
- `POST /moderate` request: `{ content: {type, id, title?, body}, rules: [{scope, id, text}], policy }`.
  Response (structured): `{ violations: [{ scope: "server"|"channel", ruleId, ruleText }],
  recommendation: "edit" | "remove" | "none", confidence: 0..1, rationale: string }`.
- Owns the LLM call (OpenAI/other), the prompt construction (system = instructions + rules; user = content),
  structured-output enforcement, and provider-side retry/timeout. Echoes `X-Correlation-ID`, structured logs.
- Deploy: Dockerfile on `$PORT`, Cloud Run v2 + Terraform + Secret Manager + Artifact Registry + WIF CI,
  scale-to-zero, public ingress + app-level API key (so a non-GCP backend can call it).

**Rate limiting / backpressure** can live here (service-side concurrency + token-bucket per minute) and/or
in the backend queue (§7). Recommended: **both** — a hard ceiling in the backend worker (so we never enqueue
faster than we drain) and a provider-rate guard in the service.

### 6.3 Backend (`gennit-backend`) changes
1. **Events — creation already exists; edits are the gap.** The unit is the `DiscussionChannel` (§4.5):
   - **Creation is already covered.** `discussionChannel.created` (per-forum submission) and `comment.created`
     already exist in `services/plugin/constants.ts` `PLUGIN_EVENTS` and are both valid channel-pipeline
     events (`VALID_CHANNEL_EVENTS`). A discussion shared to N forums already fires N
     `discussionChannel.created` triggers. For discussion-body moderation we trigger on
     `discussionChannel.created` and evaluate the discussion **body** (not just its first comment).
   - **Edits are new (gap 1).** Add edit events + middleware so re-posted/edited content is re-checked:
     - `updateComments` → fire `comment.edited` (new middleware, mirror `commentPluginPipelineMiddleware.ts`).
     - discussion-body update → fire a per-forum edit event (e.g. `discussionChannel.updated`, fanning out to
       each `DiscussionChannel` the discussion is shared to). Add it to `PLUGIN_EVENTS` + `VALID_CHANNEL_EVENTS`.
   - **Expose the report callback on the channel-trigger path (gap 5).** `reportContentAsBot` /
     `createCommentAsBot` are currently only on the **comment** trigger context; `channelTrigger.ts`
     (which handles `discussionChannel.created`) does not expose them. Add `reportContentAsBot` there so the
     bot can report discussion submissions, not only comments.
   - Note: the frontend pipeline editor also lists `discussion.created`/`event.created` as event types
     (`graphQLData/admin/queries.js`) that the backend doesn't dispatch; we standardize on the
     per-`DiscussionChannel` events above and can tidy that list separately.
2. **Async queue + rate limiting on the event path (gap 2 & 3).** Today comment runs execute **inline and
   synchronously** inside `createComments`, with no throttle; the only limiter
   (`pipelineCampaign.ts` `concurrency`/`rateLimitPerMinute`) is scoped to download backfill campaigns.
   Introduce an **enqueue-and-drain** path so the write mutation is not blocked and runs are rate limited.
   **Decision needed (6.B):** (a) **generalize the existing campaign limiter** to the comment/discussion
   event path (least new infra, reuses `PluginPipelineRun`/lease/watchdog), or (b) **true async**: enqueue a
   job, return immediately, let the external service process and **call back** a new authenticated backend
   webhook that writes the report. (b) is the best fit for "it's OK to take time" + long LLM latency, but is
   the most new infrastructure (a callback endpoint, job store, idempotency). (a) is a pragmatic first step.
3. **Server rules in the bot context (§4.4).** Ensure `buildBotInvocationContext.ts` / the trigger supplies
   **server rules** (and a resolved `channelEnabled` flag + forum rules) to `handleEvent`.
4. **Single-run consolidation (§4.3).** Implement the chosen dispatch model so the plugin runs **once** per
   post with the union of applicable rules.
5. **Recommendation field (gap 4).** See §6.4.
6. (Optional) **Per-channel secret** support if a per-forum provider key is ever needed (gap 6) — out of
   scope for v1.

### 6.4 Data-model change: structured recommendation (gap 4)
Currently `ModerationAction.actionType` is a free `String` and the recommendation would only live in free-text
`reportText`. To render a typed recommendation in the UI, add a structured field:
- Add `recommendedAction` (enum-ish: `EDIT` | `REMOVE` | `NONE`) and optional `confidence` / `rationale` to
  the bot's `ModerationAction` (or `Issue`). Keep `reportText` as the human-readable explanation.
- "Remove" maps to the human **archive** action (soft removal); Multiforum has no one-click hard delete for
  comments/discussions (only `permanentlyRemoveImage`). The doc should use "remove/archive", not "delete".

**Decision needed (6.C):** add `recommendedAction` on `ModerationAction` vs. on `Issue`. On the action keeps
it with the report event and the activity feed; on the Issue makes it a top-level attribute of the case.

### 6.5 Frontend (`multiforum-nuxt`) changes
Admin install/enable/config/secrets/pipelines + per-forum enable all **reuse existing UI**. New work:
1. **Recommendation display.** Surface `recommendedAction` + confidence + rationale in
   `components/mod/ModerationWizard.vue`'s decision card (~:386–408), ideally pre-selecting the matching human
   action button (Edit → `EditContentModal`; Remove → `ArchiveButton`). Extend the relevant Issue GraphQL
   (`graphQLData/issue/queries.js` `ISSUE_FIELDS`, `graphQLData/issue/mutations.js`).
2. **Bot actor badge in the activity feed.** `components/mod/ActivityFeedListItem.vue` currently has no bot
   badge for the report actor; add one (copy the pattern from `components/comments/CommentHeader.vue`'s bot
   badge). The report itself already surfaces in every Issue queue for free because the Issue author is the
   bot's `ModerationProfile`/`User`.
3. **Server-rule mode + forum allowlist control.** The server config form needs a mode selector
   (`all_forums` / `allowlist` / `off`) and, for `allowlist`, a **forum picker**. A multi-select of forums
   likely exceeds the current manifest `ui.forms` field types (text/select/toggle), so this may need a new
   field type or a small custom admin control. UI copy must clearly distinguish **server-rule checking
   (mode)** from the existing **per-forum channel-rule enable** so the two per-forum notions aren't confused.

---

## 7. Async processing, rate limiting & cost control (the net-new piece)

This is the largest genuinely new area; everything else is extension/assembly.

### 7.1 Why async
LLM latency is far higher than the hash-lookup in the security-scan precedent, and we must not hold the
`createComments`/discussion write open on a model call, nor let bursts of posts translate 1:1 into bursts of
LLM calls. The user explicitly accepts delay ("it's OK for it to take some time… rate limited").

### 7.2 Options (Decision 6.B)
- **A — Generalize the campaign limiter to the event path.** Reuse `pipelineCampaign.ts`
  (`concurrency`, `rateLimitPerMinute`), `PluginPipelineRun`, `executionLease.ts`, `pipelineWatchdog.ts`.
  New posts enqueue a `PENDING` run; a ticking service drains at a bounded rate. The plugin call is still
  synchronous *within the worker*, but off the request path and throttled. **Least new infra; recommended v1.**
- **B — True fire-and-forget + callback.** Backend enqueues a job and returns; the external service processes
  and calls back an authenticated backend webhook that writes the report. Best for very long LLM work and
  future batching, but needs a callback endpoint, idempotency keys, and a durable job store. **v2.**

### 7.3 Rate limiting & cost
- Hard per-minute + concurrency ceiling in the backend worker (so enqueue never outruns drain).
- Provider-rate guard + timeout + retry in the external service.
- Config knobs (server scope): `rateLimitPerMinute`, `concurrency`, `maxTokens`, `model`,
  `confidenceThreshold`. Consider a daily spend cap.
- Skip re-evaluation when an edit doesn't materially change content (hash/length guard) to avoid churn.

### 7.4 Future: batching multiple posts (out of scope v1)
Distinct from §4's per-post consolidation: a worker could batch several queued posts into one LLM call to cut
cost further. Deferred; the service contract (`POST /moderate`) can later accept an array.

---

## 8. Reporting semantics
- Report only when `confidence >= confidenceThreshold` **and** at least one rule is violated (matches
  `createBotReport`'s "≥1 cited rule" requirement).
- One `reportContentAsBot` call per post, populating `selectedServerRules` and/or `selectedForumRules` from
  the LLM's scope-tagged violations, plus `reportText` (human-readable rationale) and the structured
  `recommendedAction`.
- **Dedup / re-evaluation on edit:** `createBotReport` finds-or-creates the Issue per target and reopens it,
  so re-evaluating an edited post **updates the existing Issue** rather than spawning duplicates. Define
  whether an edit appends a new report action or updates the latest (recommend: append, so the feed shows
  history).
- **Report-only guarantee:** the bot uses only `reportContentAsBot` (and never `createCommentAsBot` unless we
  later want it to also explain itself in-thread). Action mutations are not exposed to plugins.
- **Suspension:** `reportContentAsBot` is suspension-gated — a misbehaving bot can be stopped by suspending
  its bot user / ModerationProfile.

---

## 9. Security & trust
- **In-process execution (no sandbox).** Plugins are loaded via `pluginLoader.ts` (`import()` of a downloaded
  GCS/HTTP tarball) and run **in the backend process** with backend privileges and their own network egress.
  An experimental moderation bot therefore runs trusted code; the external-service design keeps the LLM
  provider key and the heavy logic **off** the backend process, which is a meaningful trust improvement.
- **Secrets** are AES-256-GCM encrypted (`services/plugin/encryption.ts`). Note: the encryption key falls back
  to an **insecure hardcoded default** if `PLUGIN_SECRET_ENCRYPTION_KEY` is unset — ensure it is set in every
  environment before storing a real provider key. (Worth fixing independently.)
- **Shared-secret auth** between plugin and service (`X-API-Key`), plus correlation IDs for cross-system logs.
- **PII / content egress:** post content is sent to an LLM provider. Call this out for forum operators;
  consider provider zero-retention settings and a per-server opt-in.
- **Edit-to-evade:** creation-only moderation is bypassable by editing after approval; the design treats
  edit re-checks (per forum the content is shared to) as a core anti-evasion requirement (§4.6).

---

## 10. Gaps summary — exists vs. new

| # | Capability | Status today | Work needed |
|---|---|---|---|
| — | LLM moderation → report | **Exists** (`auto-moderation-bot`) | Extend / re-point |
| — | Plugin install (server) + enable (server & per-channel) + config/secrets UI | **Exists** | Reuse unchanged |
| — | Issue/ModerationAction report model; report with both server + forum rules | **Exists** (`createBotReport`) | Reuse |
| — | External plugin→Cloud Run service pattern | **Exists** (security-scan) | Reuse (but it's synchronous) |
| — | Per-forum discussion + comment **creation** events (`discussionChannel.created`, `comment.created`) | **Exists** (valid channel-pipeline events) | Reuse; evaluate discussion **body** on `discussionChannel.created` |
| 1 | **Edit** events (`comment.edited`, per-forum discussion-body edit e.g. `discussionChannel.updated`) | **Missing** | Add events + middleware |
| 2 | Async queue + rate limiting on the event path | **Missing** (only download campaigns) | Build (§7) |
| 3 | External fire-and-forget + callback/webhook | **Missing** | v2 (§7.2 B) |
| 4 | Structured recommendation (edit/remove) | **Missing** (free-text only) | Schema + UI |
| 5 | `reportContentAsBot` on the channel-trigger (`discussionChannel.*`) context | Comment path only | Add to channel path (needed to report discussion submissions) |
| — | Server rules in bot invocation context | Forum rules only | Add server rules (§4.4) |
| 6 | Per-channel secrets (per-forum LLM key) | **Missing** | Out of scope v1 |
| 7 | Moderating feedback/event/issue comments | Skipped by `isDiscussionComment` | Out of scope v1 |
| 8 | Dedicated per-channel enable resolver / audit | Rides generic `updateChannels` | Optional |

---

## 11. Open questions / decisions needed
- **(11.A) Extend `auto-moderation-bot` or ship a new plugin?** It already does comment-created LLM
  moderation → report. The new requirements (discussion + edit events, consolidated server+channel evaluation,
  external service, async + rate limiting, structured recommendation) are substantial. Recommendation:
  **new experimental plugin** that borrows `auto-moderation-bot`'s code, so the stable bot is undisturbed —
  and publish the new one to the **experimental registry** created in the registry-split PR.
- **(4.A)** Single server-driven run + channel-enable modifier (recommended) vs. two pipeline entries + dispatcher coalescing.
- **(4.B)** Backend resolves `channelEnabled` + forum rules into context vs. plugin infers from merged settings.
- **(4.C)** Per-`DiscussionChannel` evaluation for v1 (recommended; discussion shared to N forums → N evaluations/reports) with the server-rule dedup optimization deferred.
- **(4.D)** Discussion-**edit** re-checks run per `DiscussionChannel` (recommended) rather than one consolidated multi-forum call; cross-forum token optimization deferred (prefer the §4.5 server-rule dedup if it's ever needed).
- **(4.E)** Server-rule checking is a mode: `all_forums` | `allowlist[forums]` (trial/phased rollout + cost gate) | `off`, kept independent of the per-forum channel-rule enable (§4.1). Sub-questions: default mode (recommend `allowlist` or `off` for an experimental bot so it never goes server-wide unintentionally); whether to also ship the optional `shadowMode` dry-run.
- **(6.A)** LLM call in the external service (recommended) vs. in the plugin.
- **(6.B)** Async model: generalize the campaign limiter (v1) vs. true callback/webhook (v2).
- **(6.C)** `recommendedAction` on `ModerationAction` vs. `Issue`.
- Cost controls: per-server daily spend cap? default `model`? default `rateLimitPerMinute`/`concurrency`?
- Should the bot also post an in-thread bot comment explaining its report, or only file the Issue? (Default: only the Issue.)

---

## 12. Phased rollout

### Phase 0 — Spike (no schema changes)
- [ ] New plugin repo from the `auto-moderation-bot` template; new external service repo from the
      `security-scan-service` template. End-to-end on `comment.created` only, synchronous, server rules only.
- [ ] Publish to the **experimental** registry.

### Phase 1 — Consolidated server + per-forum evaluation (per `DiscussionChannel`)
- [ ] Backend: supply server rules (+ `channelEnabled` + forum rules) to the bot context.
- [ ] Server-rule **mode** (`all_forums` | `allowlist` | `off`) + forum allowlist (Decision 4.E); dispatch
      gates on it (§4.3) so non-covered forums are skipped. Default to a conservative mode for the trial.
- [ ] Single-run consolidation per `DiscussionChannel` (Decisions 4.A/4.C); one `reportContentAsBot` with
      both rule lists; discussion shared to N forums → N evaluations/reports.
- [ ] Plugin: build the combined prompt; service returns scope-tagged violations.

### Phase 2 — Discussion submissions & edits
- [ ] Evaluate the discussion **body** on the existing `discussionChannel.created`; expose
      `reportContentAsBot` on the channel-trigger context (gap 5).
- [ ] Add edit events + middleware: `comment.edited` and a per-forum discussion-body edit event
      (e.g. `discussionChannel.updated`).
- [ ] Re-evaluation-on-edit semantics (dedup / append to existing Issue).

### Phase 3 — Async + rate limiting
- [ ] Enqueue-and-drain off the write path with a per-minute + concurrency ceiling (Decision 6.B, option A).
- [ ] Config knobs + (optional) daily spend cap.

### Phase 4 — Recommendation UX
- [ ] Schema: `recommendedAction` (+ confidence/rationale) (Decision 6.C).
- [ ] `ModerationWizard.vue`: show the recommendation, pre-select the matching human action.
- [ ] `ActivityFeedListItem.vue`: bot actor badge.

### Phase 5 (optional / v2)
- [ ] True fire-and-forget + authenticated callback webhook.
- [ ] Multi-post batching in the service.
- [ ] Per-channel secrets; audited per-channel enable resolver.

---

## Appendix — key source references
- Backend plugin runtime & triggers: `services/plugin/commentTrigger.ts`, `channelTrigger.ts`,
  `downloadTrigger.ts`, `constants.ts`, `buildBotInvocationContext.ts`, `pluginLoader.ts`.
- Async/lease/rate-limit infra: `services/plugin/{executionLease,pipelineAttempt,pipelineWatchdog,pipelineCampaign,pipelineNotifications}.ts`.
- Report model: `services/botReportService.ts`; `customResolvers/mutations/reportComment.ts`; `typeDefs.ts` (Issue/ModerationAction ~1189–1296, plugins/ServerConfig ~2165–2583, Channel plugin edges ~761–763).
- Install/enable/secrets: `customResolvers/mutations/{installPluginVersion,enableServerPlugin,setServerPluginSecret,updateChannelPluginPipelines}.ts`; `customResolvers/queries/getInstalledPlugins.ts`.
- Manifest/handler contract: `gennit-backend/PLUGIN_REQUIREMENTS.md`.
- Precedent plugins: `multiforum-plugin-security-attachment-scan` + `multiforum-plugin-security-scan-service`; `gennit-project/multiforum-plugin-auto-moderation-bot`.
- Frontend moderation UI: `components/mod/{ModerationWizard,ActivityFeed,ActivityFeedListItem,IssueDetail}.vue`; `graphQLData/issue/{queries,mutations}.js`.
- Frontend plugin admin UI: `pages/admin/settings/plugins/[pluginId].vue`, `pages/forums/[forumId]/edit/plugins/index.vue`, `pages/admin/settings/plugins/pipelines.vue`.
- Related plan docs: `docs/plugins-bot-betabot-plan.md`, `docs/plugins-implementation-plan.md`, `docs/moderation-architecture.md`.
