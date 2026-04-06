# Moderation Features: Current State vs Roadmap Plan

## Executive Summary

This document analyzes the current moderation implementation across both the frontend (gennit-nuxt) and backend (gennit-backend) codebases, compares it against the planned roadmap, identifies gaps, and proposes implementation tasks including tech debt items and new tests.

---

## Needs Manual Testing/QA

These items are implemented and should stay visible for validation, regression checks, and UX review, but they are no longer part of the active to-do list.

### Stabilization Work Completed

- `canCreateChannel` now correctly awaits `hasServerPermission()`
- Shared issue-target resolution is in place for discussion/event/comment-backed issues
- Issue-linked suspension reads now use the same active/expired logic as `getActiveSuspension()`
- `ServerConfig` now owns explicit server admin/server moderator relationships
- User-facing frontend badge resolution has been migrated off `showAdminTag`
- Admin UI now manages server-scoped membership directly from the admin roles page
- Comment/detail/list author badge resolution now mirrors channel-scoped labels for server-scoped membership
- Remaining `showAdminTag` usage has been removed from the user-facing frontend
- Create/forum/discussion/event/comment suspension flows now prefer suspension notices over raw permission errors where suspension context is already known
- Comment and discussion emoji interactions now surface suspension-aware blocked-action UI instead of falling through to mutation noise
- Moderation permission objects now use an explicit shared frontend type instead of loose `Record<string, boolean>` maps
- Inline discussion and event root-comment forms now suppress raw permission errors when suspension context is already known
- Component-level server badge rendering is now covered directly in discussion and event UI
- Suspend/unsuspend button UI now shares one composable for modal state and success-notification handling
- Report/archive/unarchive/archive-and-suspend outcome state is now shared across discussion headers, event headers, and feedback moderation surfaces
- Comment-section and archive-button moderation flows now use the same shared moderation outcome state instead of local duplicate modal/notification logic

### Implemented Tests To Re-Verify

| Item                                                                                                                    | Location                             | QA Focus                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `canCreateChannel` actually awaits and enforces `hasServerPermission()`                                                 | Backend rule test                    | Keep this in backend coverage and verify it protects the real server-suspension forum-creation path       |
| `isOriginalPosterSuspended` agrees with `getActiveSuspension()` for user and mod targets                                | Backend tests                        | Re-verify against future suspension refactors                                                             |
| `isExpiredSuspension()` logic                                                                                           | Backend tests                        | Validate expiry edge cases against production-like timestamps                                             |
| `disconnectExpiredSuspensions()` no-op and mixed user/mod cleanup paths                                                 | Backend tests                        | Re-verify both cleanup branches under real mutation flows                                                 |
| Shared suspension target resolution for discussion/event/comment-backed issues                                          | Backend tests                        | Re-verify issue target resolution against future issue model changes                                      |
| Server-scoped admin/mod membership resolves from `ServerConfig` relationships instead of `showAdminTag`                 | Backend + frontend implementation    | Manual validation across comments, discussions, events, profile/library surfaces, and admin editing flows |
| Display "Server Admin" and "Server Mod" labels consistently on comments                                                 | Frontend implementation              | Manual cross-surface verification before relying solely on E2E coverage                                   |
| Create/forum/discussion/event/comment flows suppress raw suspension-blocked errors when suspension context is available | Frontend unit tests + implementation | Re-verify against real GraphQL permission failures and stale cache cases                                  |
| Comment and discussion emoji controls show suspension-aware blocked-action UI                                           | Frontend unit tests + implementation | Manual verification across both existing reactions and add-reaction entry points                          |
| Suspended moderator issue-comment and moderation controls stay disabled in the main moderation UI                       | Frontend unit tests + implementation | Re-verify on actual issue detail pages and related moderation surfaces                                    |
| `useServerRoleMembership()` maps `ServerConfig.Admins` and `ServerConfig.Moderators` into the shared badge inputs       | Frontend unit tests                  | Re-verify if the `ServerConfig` membership shape changes again                                            |
| Inline discussion and event root-comment forms suppress raw permission errors when suspension context is already known | Frontend unit tests + implementation | Re-verify against real blocked comment mutations in discussion and event detail pages                     |
| Shared suspend/unsuspend button UI composable preserves modal and notification behavior                                | Frontend unit tests + refactor       | Re-verify suspend/unsuspend flows across both user and mod issue actions                                  |
| Shared moderation outcome UI composable preserves report/archive/unarchive/archive-and-suspend notifications and modal closing behavior | Frontend unit tests + refactor | Re-verify discussion, event, and feedback moderation flows after real modal submissions |
| Comment section and archive button now rely on the shared moderation outcome workflow                                  | Frontend unit tests + refactor       | Re-verify archive/unarchive/report flows from comment lists and issue action surfaces                     |

### Phase 1 Checklist Items Completed

#### Backend

- Fix `canCreateChannel` in `/rules/rules.ts` so server-scope forum-creation checks actually await `hasServerPermission()`
- Add a backend rule test that proves suspended users are blocked from forum creation after the fix
- Create one shared helper for resolving the issue target from discussion/event/comment-backed issues
- Refactor `createSuspensionResolver.ts`, `createUnsuspendResolver.ts`, and `isOriginalPosterSuspended.ts` to use that shared helper
- Make issue-linked suspension reads use the same active/expired logic as `getActiveSuspension()`
- Add backend tests for `isExpiredSuspension()`, `getActiveSuspension()` edge cases, and mixed user/mod cleanup in `disconnectExpiredSuspensions()`
- Introduce `ServerAdmins` and `ServerModerators` relationships on `ServerConfig`
- Add backend queries/helpers that resolve server-scoped admin/mod membership from `ServerConfig`, not `showAdminTag`
- Add backend tests proving server-scoped membership reads come from `ServerConfig`

#### Frontend

- Replace `showAdminTag`-driven server-scoped labels with data derived from `ServerConfig` membership
- Rework comment/detail/list author badge resolution so server-scoped labels mirror channel-scoped labels
- Confirm remaining `showAdminTag` usage is removed or explicitly scoped
- Standardize suspension-blocked UX across the implemented create/reaction surfaces
- Add explicit frontend typing for moderation permission objects
- Add focused suspended-mod UI coverage for issue comment and moderation controls
- Add component-level coverage for ServerConfig-based badge rendering
- Add blocked-comment-form coverage for the remaining discussion/event root-comment surfaces
- Share moderation outcome workflow state across headers and feedback moderation surfaces
- Share moderation outcome workflow state across comment sections and archive button surfaces

---

## Verification & QA Backlog

This section is intentionally verification-only. If an item requires new product code, it belongs later in the document under implementation planning.

### Manual / Product QA

| Task                                                                                     | Location | Reason                                                                                                                                      |
| ---------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Verify blocked-action UX on real pages after the shared suspension-aware pass            | Frontend | The major create, reaction, and comment-entry paths are implemented; what remains is manual verification against real GraphQL failures and stale cache states |
| Re-check `getActiveSuspension()` against any newly discovered production edge case before broadening its API surface | Backend | The helper now has direct sequencing and fallback coverage; remaining risk is mostly production-data shape drift rather than a known code gap |
| Validate the new server membership editor UX for larger admin/mod lists                  | Frontend | The data model migration is done; remaining risk is usability for large server teams                                                       |

### Non-E2E Verification Gaps

| Test                                                                                     | Priority | Location       |
| ---------------------------------------------------------------------------------------- | -------- | -------------- |
| Verify whether expired suspension cleanup still has uncovered active/no-active edge cases | High     | Backend tests  |
| Additional component-level server badge rendering on any still-uncovered major surface   | Medium   | Frontend tests |

### Phase 1 Verification Checklist

- [ ] Manually verify the implemented blocked-action flows on real pages and move any failures into the Cypress section or a new bug list
- [ ] Re-verify `getActiveSuspension()` only if a new production edge case appears during QA or future suspension work
- [ ] Add component-level badge coverage only if QA uncovers an untested major surface
- [ ] Run the remaining stabilization verification from the dedicated Cypress section at the end of this document

---

## Planned Code Changes

### Tech Debt & Refactoring

### High Priority

| Task                                                                                         | Location | Reason                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit whether any remaining archive/report moderation surfaces still keep separate success/modal state after the current shared-workflow pass | Frontend | The main header, feedback, comment section, and archive button flows are now shared; this is now a narrow cleanup audit rather than a planned extraction project |

### Medium Priority

| Task                                                                                         | Location | Reason                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add focused backend indexing for active-suspension lookups                                   | Backend  | Once logic is stabilized, `username`, `modProfileName`, `suspendedUntil`, and `suspendedIndefinitely` become obvious hot-path fields for permission checks                                                |
| Add a moderation architecture note documenting permission flow and suspension lifecycle      | Both     | The system now spans user permissions, mod permissions, issue workflows, cleanup side effects, and server-vs-channel membership concepts; it needs one canonical reference before more roadmap work lands |

### Low Priority

| Task                                                                     | Location | Reason                                                                                                         |
| ------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| Consolidate broader permission helpers into a single frontend composable | Frontend | Valuable eventually, but lower leverage than first fixing backend correctness and shared suspension resolution |
| Add caching for non-critical permission lookups                          | Backend  | Helpful for scale, but should follow correctness and test coverage                                             |
| Standardize all GraphQL error text for moderation blocks                 | Backend  | Useful polish after suspension flows and notices are behaviorally consistent                                   |

---

## Phase 1 Execution Checklist

This section tracks remaining implementation work only. Verification-only items live above in `Verification & QA Backlog`.

### Backend First

- [ ] No remaining backend Phase 1 implementation tasks are currently identified

### Frontend Second

- [ ] No remaining frontend Phase 1 implementation tasks are currently identified

### Verification Then Follow-On

- [ ] Only after the above is stable, move into suspended-user polish and suspended-mod workflow expansion

---

## Roadmap Gap Analysis

### 1. Suspended User Emoji Reactions

- Verify existing emoji mutations are blocked for suspended users via `canUpvote*` permissions

---

### 2. Server-Scope Suspension - Forum Creation

**Planned Code Changes:**
| Task | Location | Type |
|------|----------|------|
| Use existing `ModServerRole.canSuspendUser` as the server-scope suspension permission instead of adding a new permission field | Backend | Refactor/Feature |
| Add `SuspendedUsers` and `SuspendedMods` relationships to `ServerConfig`, mirroring `Channel` | Backend | Feature |
| Use `ServerConfig.SuspendedUsers` when deciding whether a user can create a forum | Backend | Feature |
| Use `ServerConfig.SuspendedMods` when deciding whether a mod can take server-scoped moderation actions | Backend | Feature |
| Mirror channel-scope suspension/admin UI patterns for server-scope suspension management | Frontend | Feature |

---

### 3. Expired Suspension Cleanup

**Verification / QA:**

- Re-check expired suspension cleanup behavior if QA or production data exposes a new edge case

---

### 4. Suspended User Content Creation + Notifications

**Planned Code Changes:**
| Task | Location | Type |
|------|----------|------|
| Ensure notification UI shows issue link and expiration clearly | Frontend | Feature/Polish |

**Verification / QA:**

- Verify notification includes issue link, expiration date, and blocked action context
- Confirm there are no remaining create-flow suspension UX gaps beyond the implemented forum/comment/discussion/event paths

---

### 5. Suspended Mods - Reporting Workflow

**Current State:**

- ❌ No "Report" option on mod comments in feedback pages
- ❌ No "Report" option on mod profile pages
- ❌ No "Report" option on mod actions in issue activity feed
- `SuspendModButton.vue` exists for suspending mods

**Planned Code Changes:**

#### Phase 1: Add Report Mod Comment UI

| Task                                                    | Location | Type    |
| ------------------------------------------------------- | -------- | ------- |
| Add "Report" menu item to feedback page comment headers | Frontend | Feature |
| Add "Report" button/menu to mod profile page            | Frontend | Feature |
| Add "Report" option to issue activity feed mod actions  | Frontend | Feature |
| Create `reportModComment` mutation if needed            | Backend  | Feature |

#### Phase 2: Suspend from Mod Actions

| Task                                                               | Location | Type    |
| ------------------------------------------------------------------ | -------- | ------- |
| Add "Suspend Mod" option to issue comment context menu             | Frontend | Feature |
| Add "Suspend Mod" option to mod action context in activity feed    | Frontend | Feature |
| Ensure suspension creates proper Issue linking to reported content | Backend  | Feature |

---

### 6. Suspended Mod Perspective

**Planned Code Changes:**
| Task | Location | Type |
|------|----------|------|
| Audit all mod-only UI elements for suspension checks | Frontend | Tech Debt |
| Add "You are suspended" banner on moderation pages for suspended mods | Frontend | Feature |

**Verification / QA:**

- Verify issue page editing is disabled for suspended mods

---

### 7. Mod Actions Require Unsuspension

**Verification / QA:**

- Verify blocked and restored mod-action behavior across suspended, unsuspended, and expired states

---

### 8. Suspended Bots

**Current State:**

- ❌ Bots are DEPRECATED, not SUSPENDED
- Bots use ModerationProfile for comments
- `channelBotsMiddleware.ts` marks bots as deprecated, not suspended
- Bot accounts are still real `User` records with moderation profiles, so some human suspension logic may already apply depending on which mutation path a bot uses

**Planned Code Changes:**

| Task                                                                                                                | Location | Type            |
| ------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| Reuse the existing report -> issue -> suspend workflow for bots so moderation actions create the same paper trail as human suspensions | Both | Feature |
| Extend suspension target resolution and permission checks so bots can be suspended like human accounts | Backend | Feature |
| Surface bot suspension state, linked issues, and reason visibility through the existing moderation UI patterns | Frontend | Feature |

**Verification / QA:**

- Audit bot action paths to confirm suspended bots are blocked consistently and link back to the relevant issue context

---

### 9. Mod Profile Suspension Workflow

**Planned Code Changes:**
| Task | Location | Type |
|------|----------|------|
| Treat channel-scope and server-scope suspended-mod lists as the primary model instead of introducing a separate mod-ban state | Both | Decision |
| Add `ServerConfig.SuspendedMods` support so server-scoped mod suspension mirrors the existing channel-scoped model | Backend | Feature |
| Add clear UI indication when mod profile suspended vs user account | Frontend | Feature |

**Verification / QA:**

- Verify mod suspension does not affect user permissions
- Verify a suspended mod can still create content as a user

---

### 10. Auto-Moderation Bot Plugin

Note: work is not to begin on this feature until Catherine fills out more details here.

**Current State:**

- ❌ Not implemented
- Plugin system exists and is already capable of channel opt-in, bot user provisioning, and pipeline-style execution, so this should be built as a plugin feature rather than a bespoke moderation subsystem
- First version should only report content and create issues for human review; it should not archive or suspend automatically

**Planned Code Changes:**

#### Backend

| Task                                            | Location | Type    |
| ----------------------------------------------- | -------- | ------- |
| Create an experimental plugin in `/Users/catherineluse/gennit/gennit-nuxt/multiforum-plugins` for a channel-scoped moderation bot proof of concept | Frontend + Plugin | Feature |
| Define plugin schema for a report-only moderation bot | Backend  | Design  |
| Create `ModerationBotPlugin` type or equivalent report-only plugin model | Backend  | Feature |
| Create bot user for automated moderation        | Backend  | Feature |
| Implement report-only issue creation based on rule violations | Backend  | Feature |
| Have the bot leave issue-linked/report-linked comments that clearly indicate automated reporting | Backend  | Feature |

#### Frontend

| Task                                                  | Location | Type    |
| ----------------------------------------------------- | -------- | ------- |
| Add the experimental channel-scoped moderation bot plugin to channel settings | Frontend | Feature |
| Configure which rules trigger auto-moderation         | Frontend | Feature |
| Display bot comments with clear "automated" indicator | Frontend | Feature |
| Add README/docs explaining that this is an experimental proof of concept that only reports for human review today and may later expand to actions like archiving | Frontend + Plugin | Documentation |
| Decide whether the future server-scoped moderation bot should be a separate plugin or a scope mode of the same plugin | Both | Design Decision |

**Verification / QA:**

- Add automated non-Cypress coverage for report-only moderation bot enablement, issue creation, and bot comments where practical

---

### 11. Server Admin Labels

**Planned Code Changes:**

- Bring `ServerConfig` admin/mod membership management to feature parity with the channel-scope invite-style workflow

**Verification / QA:**

- Validate the new server membership editor UX for larger admin/mod lists

---

---

## Open Questions for Product Decision

1. **ServerConfig Membership UX**: The target is feature parity with the channel-scope invite-style workflow. Do we want to explicitly track the later “restricted admin account” / anti-privilege-escalation design as a separate roadmap item now, or leave it out of this moderation plan for the moment?

2. **Auto-Moderation Plugin Shape**: I lean toward one moderation-bot plugin with a scope mode rather than separate channel-scoped and server-scoped plugins, because the workflow, bot identity, and review/audit model appear likely to stay the same while only the scope changes. If you want them separate anyway, that should be treated as an explicit product decision before implementation.

3. **Notification Preferences**: Suspended users should be able to opt out of suspension notifications, so this should be added to notification settings. The remaining question is whether there are any suspension-related notifications that should remain mandatory despite that preference.

---

## File Reference

### Frontend Key Files

- `/utils/permissionUtils.ts` - Core permission logic
- `/utils/headerPermissionUtils.ts` - UI menu permission logic
- `/components/mod/` - All moderation components
- `/graphQLData/mod/` - Moderation GraphQL operations
- `/tests/cypress/e2e/suspensions/` - Suspension tests

### Backend Key Files

- `/rules/rules.ts` - GraphQL Shield rules including `canCreateChannel`
- `/rules/permission/hasChannelPermission.ts` - User permission enforcement
- `/rules/permission/hasChannelModPermission.ts` - Mod permission enforcement
- `/rules/permission/hasServerPermission.ts` - Server permission enforcement
- `/rules/permission/getActiveSuspension.ts` - Suspension detection
- `/rules/permission/disconnectExpiredSuspensions.ts` - Expiration cleanup
- `/rules/permission/suspensionNotification.ts` - Notification creation
- `/customResolvers/mutations/suspendUser.ts` - Suspension mutation
- `/customResolvers/mutations/unsuspendUser.ts` - Unsuspension mutation
- `/customResolvers/mutations/shared/createSuspensionResolver.ts` - Shared suspend mutation logic
- `/customResolvers/mutations/shared/createUnsuspendResolver.ts` - Shared unsuspend mutation logic
- `/customResolvers/queries/isOriginalPosterSuspended.ts` - Issue-linked suspension state query

---

## Cypress / End-to-End Verification

This section intentionally centralizes all Cypress work so the rest of the roadmap can stay focused on implementation and non-E2E stabilization tasks.

### Phase 1 Stabilization Cypress

| Test                                                                                                        | Priority | Location                                                            |
| ----------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| Re-run and tighten server-level suspended user forum-creation coverage after the backend permission fix     | High     | `tests/cypress/e2e/suspensions/serverLevelSuspension.spec.cy.ts`    |
| Add indefinite server-suspension forum-creation coverage                                                    | High     | `tests/cypress/e2e/suspensions/serverLevelSuspension.spec.cy.ts`    |
| Run the new suspended-user emoji coverage in a safe local test environment pointed at the test database     | High     | `tests/cypress/e2e/suspensions/suspendedUserPermissions.spec.cy.ts` |
| Add expired-suspension cleanup coverage that proves the blocked action becomes allowed after cleanup        | High     | `tests/cypress/e2e/suspensions/`                                    |
| Add unsuspension recovery coverage that proves blocked actions re-enable immediately without stale UI state | High     | `tests/cypress/e2e/suspensions/`                                    |
| Add blocked-action notification coverage for suspended-user create flows                                    | High     | `tests/cypress/e2e/suspensions/`                                    |
| Add server admin and server mod badge coverage based on `ServerConfig` relationships                        | High     | `tests/cypress/e2e/comments/`                                       |
| Add suspended-mod issue-detail coverage proving moderation controls stay unavailable                        | High     | `tests/cypress/e2e/mod/`                                            |

### Roadmap Cypress Backlog

| Test                                                                    | Priority | Location                         |
| ----------------------------------------------------------------------- | -------- | -------------------------------- |
| Suspended mod sees no mod UI elements                                   | High     | `tests/cypress/e2e/mod/`         |
| Suspended mod cannot act on issue detail, comments, or feedback pages   | High     | `tests/cypress/e2e/mod/`         |
| Reporting mod comment from feedback page                                | Medium   | `tests/cypress/e2e/mod/`         |
| Reporting mod from profile page                                         | Medium   | `tests/cypress/e2e/mod/`         |
| Reporting mod from issue detail / mod action context                    | Medium   | `tests/cypress/e2e/mod/`         |
| Mod suspension doesn't affect user actions                              | High     | `tests/cypress/e2e/suspensions/` |
| Suspended mod can still post as a user while moderation remains blocked | High     | `tests/cypress/e2e/suspensions/` |
| Mod actions re-enable after unsuspension                                | High     | `tests/cypress/e2e/mod/`         |
| Mod actions re-enable after suspension expiry                           | High     | `tests/cypress/e2e/mod/`         |
| Server admin badge on comments via ServerConfig membership              | Medium   | `tests/cypress/e2e/comments/`    |
| Server mod badge on comments via ServerConfig membership                | Medium   | `tests/cypress/e2e/comments/`    |
| Suspended bot cannot act and links back to the related issue trail      | Medium   | `tests/cypress/e2e/bots/`        |
| Moderation bot plugin enablement works end to end                       | Medium   | `tests/cypress/e2e/bots/`        |
| Moderation bot creates report issues for matching rule violations       | Medium   | `tests/cypress/e2e/bots/`        |
| Moderation bot comment appears on reported content / issue context      | Medium   | `tests/cypress/e2e/bots/`        |
