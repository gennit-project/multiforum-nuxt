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

---

## Tech Debt & Refactoring

### High Priority

| Task                                                                                     | Location | Reason                                                                                                                                      |
| ---------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Verify whether any remaining moderation surfaces still bypass the shared suspension-aware blocked-action behavior | Frontend | The major create, reaction, and comment-entry paths are now covered; this is now an audit/polish item rather than a known implementation gap |
| Verify whether any `getActiveSuspension()` cleanup/selection edge cases remain uncovered after the latest sequencing tests | Backend | The main active/expired cases are now covered; this is now a narrow follow-up audit instead of a broad stabilization task |

### Medium Priority

| Task                                                                                         | Location | Reason                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extend the shared moderation action workflow layer beyond suspend/unsuspend buttons into archive/report entry points | Frontend | Suspend user/mod buttons now share the basic modal and notification state, but archive/report actions still duplicate adjacent workflow logic |
| Extract additional moderation modal behavior into composables where the remaining duplication is still high-value | Frontend | The suspend/unsuspend button state is shared now; the next step is only worth doing for the heavier archive/report flows |
| Add focused backend indexing for active-suspension lookups                                   | Backend  | Once logic is stabilized, `username`, `modProfileName`, `suspendedUntil`, and `suspendedIndefinitely` become obvious hot-path fields for permission checks                                                |
| Add a moderation architecture note documenting permission flow and suspension lifecycle      | Both     | The system now spans user permissions, mod permissions, issue workflows, cleanup side effects, and server-vs-channel membership concepts; it needs one canonical reference before more roadmap work lands |

### Low Priority

| Task                                                                     | Location | Reason                                                                                                         |
| ------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| Consolidate broader permission helpers into a single frontend composable | Frontend | Valuable eventually, but lower leverage than first fixing backend correctness and shared suspension resolution |
| Add caching for non-critical permission lookups                          | Backend  | Helpful for scale, but should follow correctness and test coverage                                             |
| Standardize all GraphQL error text for moderation blocks                 | Backend  | Useful polish after suspension flows and notices are behaviorally consistent                                   |

---

## Test Coverage Gaps

### Stabilization Tests

| Test                                                                                     | Priority | Location      |
| ---------------------------------------------------------------------------------------- | -------- | ------------- |
| Verify whether expired suspension cleanup still has uncovered active/no-active edge cases | High     | Backend tests |

### Missing Unit Tests

| Test                                                                                     | Priority | Location       |
| ---------------------------------------------------------------------------------------- | -------- | -------------- |
| Additional component-level server badge rendering on any still-uncovered major surface   | Medium   | Frontend tests |

---

## Phase 1 Execution Checklist

### Backend First

- [ ] Audit whether any backend `getActiveSuspension()` edge cases remain after the current coverage pass

### Frontend Second

- [ ] Audit whether any remaining blocked-action surfaces still bypass the shared suspension-aware behavior
- [ ] Add component-level badge coverage only if additional uncovered surfaces are identified

### Verification Then Follow-On

- [ ] Run the remaining stabilization verification from the dedicated Cypress section at the end of this document
- [ ] Only after the above is stable, move into suspended-user polish and suspended-mod workflow expansion

---

## Roadmap Gap Analysis

### 1. Suspended User Emoji Reactions

**Roadmap Item:**

> "suspended user can't do emoji - borrow can comment rule - suppress error"

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify existing emoji mutations are blocked for suspended users via `canUpvote*` permissions | Backend | Verification |

---

### 2. Server-Scope Suspension - Forum Creation

**Roadmap Item:**

> "when suspended at server scope, cannot create forums"

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Consider `canSuspendFromServer` permission for mod profiles | Backend | Decision/Feature |

**Open Question:**

> "do we need canSuspendFromServer for mod profile permissions?"

**Recommendation:** Yes, if server admins should be able to suspend users server-wide (not just channel-by-channel). This would require:

- New permission in ModServerRole
- New mutation `suspendUserFromServer`
- UI in admin panel for server-level suspensions

---

### 3. Expired Suspension Cleanup

**Roadmap Item:**

> "when a user tries to do something with an expired suspension, the suspension gets severed from channel"

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Add any missing edge-case coverage around `getActiveSuspension()` and cleanup interactions | Backend | Test |

---

### 4. Suspended User Content Creation + Notifications

**Roadmap Items:**

> - "cannot create discussions or events"
> - "If the mod reverses the decision, I can do the action"
> - "on failing to create, suspended user receives a notification with a link to the relevant issue, and can see the message about my suspension. I can see the related issue and expiration date."

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify notification includes issue link, expiration date, blocked action | Backend | Verification |
| Ensure notification UI shows issue link and expiration clearly | Frontend | Feature/Polish |
| Finish any remaining create-flow suspension UX cleanup beyond the implemented forum/comment/discussion/event paths | Frontend | Refactor |

---

### 5. Suspended Mods - Reporting Workflow

**Roadmap Items:**

> - "need workflow to report a mod's comment from the feedback page, from their mod profile page, or an issue detail page (their comments or mod actions)"
> - "can suspend mods from their issue comments, feedback comments or mod actions (on issues)"

**Current State:**

- ❌ No "Report" option on mod comments in feedback pages
- ❌ No "Report" option on mod profile pages
- ❌ No "Report" option on mod actions in issue activity feed
- `SuspendModButton.vue` exists for suspending mods

**Required Work:**

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

**Roadmap Item:**

> "from suspended mod's perspective all mod actions should be disabled"

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Audit all mod-only UI elements for suspension checks | Frontend | Tech Debt |
| Add "You are suspended" banner on moderation pages for suspended mods | Frontend | Feature |
| Verify issue page editing disabled for suspended mods | Frontend | Verification |

---

### 7. Mod Actions Require Unsuspension

**Roadmap Item:**

> "cannot take mod actions unless suspension is reversed or expired"

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify blocked and restored mod-action behavior across suspended, unsuspended, and expired states | Frontend | Verification |

---

### 8. Suspended Bots

**Roadmap Item:**

> "confirm that suspended bots can't do things, just like human accounts"

**Current State:**

- ❌ Bots are DEPRECATED, not SUSPENDED
- Bots use ModerationProfile for comments
- `channelBotsMiddleware.ts` marks bots as deprecated, not suspended
- Bot accounts are still real `User` records with moderation profiles, so some human suspension logic may already apply depending on which mutation path a bot uses

**Required Work:**

**Decision Required:** Should bots be suspendable like human accounts, or is deprecation sufficient?

| Task                                                                                                                | Location | Type            |
| ------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| DECISION: Define bot suspension vs deprecation strategy                                                             | Both     | Design Decision |
| Audit bot action paths to confirm whether existing permission checks already block suspended/deprecated bot actions | Backend  | Investigation   |
| If suspendable: Add bot suspension support to backend                                                               | Backend  | Feature         |
| If suspendable: Add bot suspension UI                                                                               | Frontend | Feature         |
| If deprecated only: Document that bots can't be suspended                                                           | Docs     | Documentation   |
| Test that deprecated bots cannot perform actions                                                                    | Frontend | Test            |

---

### 9. Mod Profile Suspension Workflow

**Roadmap Item:**

> "Plan, implement and test workflows for suspending and banning mod profiles while leaving user profiles intact"

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Decide whether mod-profile bans are a new state distinct from suspension | Both | Design Decision |
| If yes, design mod-profile-only ban model and permission effects | Backend | Design |
| Verify mod suspension doesn't affect user permissions | Backend | Test |
| Verify suspended mod can still create content as user | Frontend | Test |
| Add clear UI indication when mod profile suspended vs user account | Frontend | Feature |

---

### 10. Auto-Moderation Bot Plugin

Note: work is not to begin on this feature until Catherine fills out more details here.

**Roadmap Item:**

> "add plugin that channels can opt into - optional moderation for channel rules - bot comment says it was archived and if there's a mistake, comment on the issue and request it to be unarchived"

**Current State:**

- ❌ Not implemented
- Plugin system exists and is already capable of channel opt-in, bot user provisioning, and pipeline-style execution, so this should be built as a plugin feature rather than a bespoke moderation subsystem

**Required Work:**

#### Backend

| Task                                            | Location | Type    |
| ----------------------------------------------- | -------- | ------- |
| Define plugin schema for moderation bot         | Backend  | Design  |
| Create `ModerationBotPlugin` type               | Backend  | Feature |
| Create bot user for automated moderation        | Backend  | Feature |
| Implement auto-archive based on rule violations | Backend  | Feature |
| Implement bot comment on archived content       | Backend  | Feature |

#### Frontend

| Task                                                  | Location | Type    |
| ----------------------------------------------------- | -------- | ------- |
| Add moderation bot plugin to channel settings         | Frontend | Feature |
| Configure which rules trigger auto-moderation         | Frontend | Feature |
| Display bot comments with clear "automated" indicator | Frontend | Feature |
| Add appeal workflow UI                                | Frontend | Feature |

#### Tests

| Task                                                                                                 | Location | Type |
| ---------------------------------------------------------------------------------------------------- | -------- | ---- |
| Add automated test coverage for moderation bot enablement, auto-archiving, bot comments, and appeals | Frontend | Test |

---

### 11. Server Admin Labels

**Roadmap Item:**

> "can make list of server admins, comments by server admins are labeled as such in comments"

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Validate the new server membership editor UX for larger admin/mod lists | Frontend | QA/Polish |

---

---

## Open Questions for Product Decision

1. **Bot Suspension**: Should bots be suspendable (creating Suspension nodes) or is deprecation sufficient? Deprecation removes the bot entirely, while suspension would just block its actions temporarily.

2. **Server-Level Mod Suspension**: Should there be a `canSuspendFromServer` permission allowing server admins to suspend users or mods across all channels? Current system requires channel-by-channel suspension.

3. **Mod Profile Bans**: Is "ban mod profile while leaving user profile intact" a distinct state from suspension, or should permanent mod suspension cover that use case?

4. **ServerConfig Membership UX**: Does the new admin/mod membership editor need search, autocomplete, or invite-style workflows before it is considered complete for moderators managing large server teams?

5. **Auto-Moderation Scope**: Should the auto-moderation bot:
   - Only archive, or also suspend?
   - Work on server rules, channel rules, or both?
   - Require human review before taking action?

6. **Appeal Timeline**: What should the SLA be for reviewing appeals of auto-moderated content?

7. **Notification Preferences**: Should suspended users be able to opt out of receiving suspension notifications? (Currently they cannot.)

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
| Bot deprecation prevents actions                                        | Medium   | `tests/cypress/e2e/bots/`        |
| Moderation bot plugin enablement works end to end                       | Medium   | `tests/cypress/e2e/bots/`        |
| Moderation bot auto-archives matching rule violations                   | Medium   | `tests/cypress/e2e/bots/`        |
| Moderation bot comment appears on archived content                      | Medium   | `tests/cypress/e2e/bots/`        |
| Moderation bot appeal workflow works end to end                         | Medium   | `tests/cypress/e2e/bots/`        |
