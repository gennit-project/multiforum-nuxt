# Download Security Scan — Enforcement & Creator UX (Design)

**Status:** Proposal / scoping. Not yet implemented.

**Already shipped (prerequisites):**
- The `security-attachment-scan` plugin now actually runs on upload (backend fixes in [multiforum-backend#152]).
- The block *decision* is configurable and no longer has the fail-open footgun: `blockOn` (`suspicious`/`malicious`) is separate from `onError` (`block`/`allow`, default fail-closed) — plugin `v0.4.0`.

---

## The gap this addresses

The scan produces a verdict and the plugin returns `success: false` when a file should be blocked — **but nothing acts on that today:**

1. `DownloadableFile.scanStatus` is **never updated** from the scan result (it stays `PENDING`).
2. **No code gates a download's availability** on the scan result. A "blocked" file is still downloadable.
3. The **creator sees nothing** — no message, no status.
4. There is a **pre-scan availability window**: a `DownloadableFile` is created and immediately downloadable, and the scan runs asynchronously *afterward* (on `downloadableFile.created`). A malicious file is briefly live before the scan can block it.

So "blocked" is currently only a failed `PluginRun` record + a moderation flag; enforcement and UX are unbuilt.

## Goals

1. **Enforce** the verdict — a blocking result makes the file unavailable to the public until cleared.
2. **Close the pre-scan window** — files aren't publicly downloadable until they've been scanned.
3. **Cause-aware creator UX** — tell the creator what happened, tailored to *why*.
4. **Distinguish content-block from server-side failure** — a scan that *couldn't run* (service down, misconfig, quota) is not the creator's fault → "problem on our end, open an issue" + alert admins. Never imply their file is malicious when it wasn't judged so.
5. **Support human re-review** (aligns with the moderation roadmap: flag → human decides → notify OP → OP can request re-review).

---

## Current data model

- `enum ScanStatus { PENDING, CLEAN, INFECTED, SUSPICIOUS, FAILED }`
- `DownloadableFile.scanStatus: ScanStatus! @default(PENDING)`, `scanCheckedAt: DateTime`
- Downloads are served via the `createSignedStorageURL` / `trackDownload` mutations.
- Scan runs recorded as `PluginRun`; `ctx.storeFlag()` creates moderation flags.

**Proposed additions:** `DownloadableFile.scanReason: String` (human-readable, e.g. `"Disallowed file type: installer.exe"`) so the UI can explain a block without re-deriving it.

## Proposed flow

```
upload → DownloadableFile (scanStatus = PENDING, NOT publicly downloadable)
   │
   ▼  downloadableFile.created → security-attachment-scan runs
   │
   ▼  download trigger maps the aggregate verdict → scanStatus + scanReason + scanCheckedAt
        clean      → CLEAN        (available)
        suspicious → SUSPICIOUS   (server policy: available-with-warning OR held for review)
        malicious  → INFECTED     (unavailable)
        error      → FAILED       (unavailable if onError=block; available if onError=allow)
   │
   ▼  availability gate (createSignedStorageURL / trackDownload):
        public download allowed only when scanStatus = CLEAN (+ SUSPICIOUS if the server allows).
        PENDING / INFECTED / FAILED → refused for the public; OP + mods may still access for review.
```

### Where the "is it available" decision lives

Recommendation: **the download trigger owns mapping verdict → `scanStatus`**, and **the availability gate (`createSignedStorageURL`/`trackDownload`) is the single source of truth for public availability**, keyed on `scanStatus` + requester role. The plugin's `blockOn`/`onError` continue to govern the *pipeline* signal (fail the step) and flagging. This keeps plugins simple and download-agnostic, and puts enforcement in the download layer where it belongs.

## Cause-aware creator UX (the crux of the second concern)

Branch the message on **why** the file isn't available:

| State | Cause | Creator message | Actions |
|-------|-------|-----------------|---------|
| `PENDING` | Scan in progress | "Scanning your upload…" (spinner) | — |
| `CLEAN` | Passed | (normal available UI) | — |
| `INFECTED` / `SUSPICIOUS` | **Content** tripped a rule | "This upload was blocked by the security scan: *{scanReason}*." | Replace file · Request human review |
| `FAILED` | **Server-side** — scan couldn't complete (service down, misconfigured, quota) | "We couldn't complete the security scan — a problem on our end, not your file. Try again shortly, or **open an issue**." | Retry · Open an issue |

The `FAILED` path is the one the requester specifically flagged: because we **fail closed** by default, a scanner outage would otherwise silently block creators and imply their files are bad. The fix is (a) honest "it's us, not you" copy with an escalation path, and (b) **admin alerting** so the operational problem gets fixed.

## Admin alerting

A `FAILED` scan status (especially "service unreachable" / misconfiguration) is an **operational** problem, not a content one. Surface it:
- Add a "scan failures" signal to the existing `getServerHealthDashboard` and/or the moderation dashboard.
- Optionally notify server admins when the failure rate crosses a threshold (a persistent scan outage blocks all uploads while fail-closed).

## Re-review flow (roadmap alignment)

- Blocked/flagged files already create moderation flags (`storeFlag`). They enter the moderation queue.
- A moderator can clear a file → `scanStatus = CLEAN` → available. OP is notified.
- OP edits/replaces the file → `downloadableFile.updated` → re-scan → status recomputed. This gives creators a fast, self-serve path back.

## Implementation surface

**Backend (`gennit-backend`)**
- `services/plugin/downloadTrigger.ts`: after the runs complete, update `DownloadableFile.scanStatus` + `scanReason` + `scanCheckedAt` from the aggregate verdict.
- Add `scanReason: String` to `DownloadableFile` in `typeDefs.ts`.
- `createSignedStorageURL` / `trackDownload`: gate public serving on `scanStatus` + requester role; allow OP/mods for review.
- Create `DownloadableFile`s as `PENDING` and treat `PENDING` as not-publicly-downloadable (closes the pre-scan window).
- Emit an admin signal on `FAILED`.

**Frontend (`multiforum-nuxt`)**
- `components/channel/DownloadSidebar.vue`: render the state machine above (scanning / available / blocked+reason / scan-error) instead of the current always-"Available Instantly".
- Creator/detail view: cause-aware copy + actions (Replace, Request review, Open issue).
- Admin: surface scan `FAILED` in the moderation/health dashboard.

**Plugin (`multiforum-plugin-security-attachment-scan`)**
- No change strictly required — it already returns the verdict and block decision. Optionally emit a stable machine-readable reason code alongside `summary` for cleaner UI mapping.

## Open decisions

1. **`SUSPICIOUS` policy:** hard-block, hold-for-review, or allow-with-warning badge? (Recommend hold-for-review or allow-with-badge — not a hard block — since "suspicious" is lower confidence.)
2. **Enforcement model:** hard-unavailable vs quarantine-pending-review. (Recommend: `INFECTED`/`FAILED` → unavailable; `SUSPICIOUS` → review.)
3. **New `ScanStatus` values?** The existing five likely suffice; prefer adding `scanReason` over new enum values.
4. **Pre-scan window:** confirm we're OK making new downloads non-public until the first scan completes (a few seconds), which is the clean way to avoid a live-malware window.

[multiforum-backend#152]: https://github.com/gennit-project/multiforum-backend/pull/152
