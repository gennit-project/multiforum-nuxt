# Moderation Features: Current State vs Roadmap Plan

## Executive Summary

This document analyzes the current moderation implementation across both the frontend (gennit-nuxt) and backend (gennit-backend) codebases, compares it against the planned roadmap, identifies gaps, and proposes implementation tasks including tech debt items and new tests.

---

## Tech Debt & Refactoring

### High Priority

| Task                                                                    | Location | Reason                                                                                                                                                                                           |
| ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fix server-scope permission correctness in `canCreateChannel`           | Backend  | `rules.ts` currently calls `hasServerPermission(...)` without awaiting it, so forum-creation suspension enforcement is not trustworthy until corrected                                           |
| Consolidate suspension target resolution into one shared backend helper | Backend  | `createSuspensionResolver.ts`, `createUnsuspendResolver.ts`, and `isOriginalPosterSuspended.ts` each rediscover the issue target independently, which is brittle and likely to drift             |
| Unify suspension state reads around `getActiveSuspension()`             | Backend  | Expiration cleanup, issue-linked suspension state, and permission checks should all use the same active/expired determination logic                                                              |
| Standardize suspension-blocked UX for existing actions                  | Frontend | Current flows mix silent failures, raw GraphQL errors, and explicit suspension notices; emoji/forum/comment/create flows should behave consistently                                              |
| Replace `showAdminTag` with ServerConfig-scoped admin/mod relationships | Both     | Server-scoped moderation UX should mirror channel-scoped moderation: labels and permissions should come from relationships attached directly to `ServerConfig`, not role flags embedded on users |
| Add targeted TypeScript coverage for moderation permission objects      | Frontend | Permission and moderation components still rely on weakly typed objects, which makes regressions in role shape and fallback behavior harder to catch                                             |

### Medium Priority

| Task                                                                                         | Location | Reason                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create a unified moderation action workflow layer for suspend/unsuspend/archive entry points | Frontend | Modal launching, success notifications, and issue refetch logic are duplicated across `SuspendUserButton`, `SuspendModButton`, and related issue components                                               |
| Extract suspend/unsuspend modal behavior into composables after backend stabilization        | Frontend | Several moderation components repeat the same mutation, cache update, and notification pattern                                                                                                            |
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

| Test                                                                                               | Priority | Location                                   |
| -------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------ |
| `canCreateChannel` actually awaits and enforces `hasServerPermission()`                            | Done     | Backend rule test                          |
| Server-level suspended user cannot create forum after permission fix                               | High     | `tests/cypress/e2e/suspensions/`           |
| `isOriginalPosterSuspended` agrees with `getActiveSuspension()` for user and mod targets           | Done     | Backend tests                              |
| Expired suspension disconnects on attempted action and then allows the action                      | High     | Backend + `tests/cypress/e2e/suspensions/` |
| Unsuspension immediately restores blocked actions without stale UI state                           | High     | `tests/cypress/e2e/suspensions/`           |
| Server-scoped admin/mod membership resolves from `ServerConfig` relationships instead of `showAdminTag` | Partially Done | Backend tests complete, frontend tests pending |

### Missing E2E Tests

| Test                                                                  | Priority | Location                         |
| --------------------------------------------------------------------- | -------- | -------------------------------- |
| Suspended user cannot react with emoji                                | High     | `tests/cypress/e2e/suspensions/` |
| Suspended mod sees no mod UI elements                                 | High     | `tests/cypress/e2e/mod/`         |
| Suspended mod cannot act on issue detail, comments, or feedback pages | High     | `tests/cypress/e2e/mod/`         |
| Reporting mod comment from feedback page                              | Medium   | `tests/cypress/e2e/mod/`         |
| Reporting mod from profile page                                       | Medium   | `tests/cypress/e2e/mod/`         |
| Reporting mod from issue detail / mod action context                  | Medium   | `tests/cypress/e2e/mod/`         |
| Mod suspension doesn't affect user actions                            | High     | `tests/cypress/e2e/suspensions/` |
| Server admin badge on comments via ServerConfig membership            | Medium   | `tests/cypress/e2e/comments/`    |
| Server mod badge on comments via ServerConfig membership              | Medium   | `tests/cypress/e2e/comments/`    |
| Bot deprecation prevents actions                                      | Medium   | `tests/cypress/e2e/bots/`        |

### Missing Unit Tests

| Test                                                                             | Priority       | Location       |
| -------------------------------------------------------------------------------- | -------------- | -------------- |
| `isExpiredSuspension()` logic                                                    | Covered        | Backend tests  |
| `getActiveSuspension()` edge cases                                               | Partially Done | Backend tests  |
| `disconnectExpiredSuspensions()` no-op and mixed user/mod cleanup paths          | Covered        | Backend tests  |
| Shared suspension target resolution for discussion/event/comment-backed issues   | Done           | Backend tests  |
| Frontend permission fallback chains for user vs suspended user vs suspended mod  | Medium         | Frontend tests |
| Mod action visibility on issue detail for suspended vs unsuspended mods          | Medium         | Frontend tests |
| Emoji/reaction controls hidden or disabled for suspended users                   | Medium         | Frontend tests |
| Server-scoped author badge resolution using ServerConfig admin/mod relationships | Medium         | Frontend tests |

---

## Phase 1 Execution Checklist

### Backend First

- [x] Fix `canCreateChannel` in `/rules/rules.ts` so server-scope forum-creation checks actually await `hasServerPermission()`
- [x] Add a backend rule test that proves suspended users are blocked from forum creation after the fix
- [x] Create one shared helper for resolving the issue target from discussion/event/comment-backed issues
- [x] Refactor `createSuspensionResolver.ts`, `createUnsuspendResolver.ts`, and `isOriginalPosterSuspended.ts` to use that shared helper
- [x] Make issue-linked suspension reads use the same active/expired logic as `getActiveSuspension()`
- [x] Add backend tests for `isExpiredSuspension()`, `getActiveSuspension()` edge cases, and mixed user/mod cleanup in `disconnectExpiredSuspensions()`
- [x] Introduce `ServerAdmins` and `ServerModerators` relationships on `ServerConfig`
- [x] Add backend queries/helpers that resolve server-scoped admin/mod membership from `ServerConfig`, not `showAdminTag`
- [x] Add backend tests proving server-scoped membership reads come from `ServerConfig`

### Frontend Second

- [ ] Standardize suspension-blocked UX across forum creation, discussion creation, event creation, comment creation, and emoji/reaction attempts
- [ ] Hide or disable emoji controls where suspended state is already known, while preserving backend enforcement as the source of truth
- [ ] Add stronger TypeScript typing for moderation permission objects and suspension-related UI state
- [ ] Start replacing `showAdminTag`-driven server-scoped labels with data derived from `ServerConfig` membership
- [ ] Rework comment/detail/list author badge resolution so server-scoped labels mirror channel-scoped labels
- [ ] Add frontend tests for suspended-user reaction UI, permission fallback chains, suspended-mod action visibility, and ServerConfig-based badge resolution

### Verification Then Follow-On

- [ ] Re-run and tighten `tests/cypress/e2e/suspensions/serverLevelSuspension.spec.cy.ts` against the fixed backend rule path
- [ ] Add E2E coverage for expired suspension cleanup and immediate post-unsuspension recovery
- [ ] Add E2E coverage for server admin and server mod badges based on `ServerConfig` relationships
- [ ] Confirm any remaining `showAdminTag` usage is either removed or explicitly scoped as temporary migration code
- [ ] Only after the above is stable, move into suspended-user polish and suspended-mod workflow expansion

---

## Current Implementation Overview

### What's Already Built

#### Suspension System

- **User Suspensions**: Time-limited or indefinite, channel-scoped
- **Mod Suspensions**: Separate from user suspensions, uses SuspendedModRole
- **Server-Level Checks**: `hasServerPermission.ts` now feeds a correctly awaited `canCreateChannel` rule, so server-scope forum creation checks are on the same enforcement path as the rest of the permission system
- **Automatic Expiration**: Expired suspensions are disconnected from channels (fire-and-forget cleanup)
- **Notifications**: In-app notifications sent when suspended users are blocked from actions

#### Permission Enforcement

- **Two-Tier System**: User permissions vs Moderator permissions
- **Role Hierarchy**: Admin > Elevated Mod > Standard Mod > Suspended Mod
- **Channel & Server Scopes**: Different enforcement paths for each
- **Server-Scoped Identity UX**: Backend primitives now exist for `ServerConfig`-attached `Admins` and `Moderators`, plus a shared membership helper with legacy fallback; current comment/list UIs still lean on `showAdminTag` in some places, so the remaining work is the frontend migration onto those relationships

#### Moderation Actions

- Report, Archive, Unarchive (discussions, events, comments)
- Give Feedback system
- Issue tracking with ActivityFeed
- Lock/Unlock issues

#### E2E Tests

- `suspendedUserPermissions.spec.cy.ts` - Tests suspended users can't create content
- `serverLevelSuspension.spec.cy.ts` - Tests server-level forum creation block
- Various archive/report/feedback tests

---

## Roadmap Gap Analysis

### 1. Suspended User Emoji Reactions

**Roadmap Item:**

> "suspended user can't do emoji - borrow can comment rule - suppress error"

**Current State:**

- Backend emoji mutations are already gated through `canUpvoteComment` / `canUpvoteDiscussion`, and suspended roles deny those permissions
- Frontend reaction controls are still rendered broadly, so the current gap is mostly UX consistency, graceful failure, and explicit coverage
- The roadmap note to "borrow can comment rule" does not appear necessary if the current upvote-based permission model is kept

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify existing emoji mutations are blocked for suspended users via `canUpvote*` permissions | Backend | Verification |
| Suppress raw mutation errors for suspended users attempting emoji | Frontend | Feature |
| Hide or disable emoji controls for suspended users where suspension state is already known | Frontend | Feature |
| Add E2E test for suspended user emoji restriction | Frontend | Test |

---

### 2. Server-Scope Suspension - Forum Creation

**Roadmap Item:**

> "when suspended at server scope, cannot create forums"

**Current State:**

- ✅ Backend permission logic now correctly awaits `hasServerPermission.ts` through the `canCreateChannel` rule path
- ✅ Frontend test exists: `serverLevelSuspension.spec.cy.ts`
- ❓ Need to verify the existing test is actually covering the fixed behavior after the backend rule bug is corrected

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify the new `canCreateChannel` rule test remains part of backend coverage | Backend | Verification |
| Verify `serverLevelSuspension.spec.cy.ts` test passes | Frontend | Test Verification |
| Add test case for indefinite server suspension | Frontend | Test |
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

**Current State:**

- ✅ Implemented in `disconnectExpiredSuspensions.ts`
- Uses fire-and-forget async pattern
- Keeps Suspension node for historical tracking, removes relationship
- ✅ Issue-linked suspension reads now go through the same active/expired logic as `getActiveSuspension()`

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Add E2E test verifying expired suspension cleanup | Frontend | Test |
| Add unit test for `isExpiredSuspension()` logic | Backend | Test |
| Verify cleanup handles both user and mod suspensions | Backend | Test |
| Refactor issue-linked suspension reads to use the same active/expired source of truth | Backend | Refactor |

---

### 4. Suspended User Content Creation + Notifications

**Roadmap Items:**

> - "cannot create discussions or events"
> - "If the mod reverses the decision, I can do the action"
> - "on failing to create, suspended user receives a notification with a link to the relevant issue, and can see the message about my suspension. I can see the related issue and expiration date."

**Current State:**

- ✅ Content creation blocked (`suspendedUserPermissions.spec.cy.ts`)
- ✅ Notifications sent with issue link and expiration date (`suspensionNotification.ts`)
- ❓ Need to verify notification content includes all required info
- ❓ Need to verify reversal workflow works without stale frontend state or inconsistent error handling

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify notification includes issue link, expiration date, blocked action | Backend | Verification |
| Add E2E test for unsuspension enabling previously blocked action | Frontend | Test |
| Add test for notification received on blocked action | Frontend | Test |
| Ensure notification UI shows issue link and expiration clearly | Frontend | Feature/Polish |
| Standardize create-flow handling so suspended forum/comment/discussion/event attempts show the same suspension UX | Frontend | Refactor |

---

### 5. Suspended Mods - Reporting Workflow

**Roadmap Items:**

> - "need workflow to report a mod's comment from the feedback page, from their mod profile page, or an issue detail page (their comments or mod actions)"
> - "can suspend mods from their issue comments, feedback comments or mod actions (on issues)"

**Current State:**

- ❌ No "Report" option on mod comments in feedback pages
- ❌ No "Report" option on mod profile pages
- ❌ No "Report" option on mod actions in issue activity feed
- ✅ `SuspendModButton.vue` exists for suspending mods

**Required Work:**

#### Phase 1: Add Report Mod Comment UI

| Task                                                    | Location | Type    |
| ------------------------------------------------------- | -------- | ------- |
| Add "Report" menu item to feedback page comment headers | Frontend | Feature |
| Add "Report" button/menu to mod profile page            | Frontend | Feature |
| Add "Report" option to issue activity feed mod actions  | Frontend | Feature |
| Create `reportModComment` mutation if needed            | Backend  | Feature |
| E2E test for reporting mod from feedback page           | Frontend | Test    |
| E2E test for reporting mod from profile page            | Frontend | Test    |
| E2E test for reporting mod from issue page              | Frontend | Test    |

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

**Current State:**

- ✅ `headerPermissionUtils.ts` checks mod suspension status
- ✅ Backend mod permission enforcement exists via `hasChannelModPermission.ts`
- ⚠️ Frontend mod-action disablement is spread across multiple components and needs a broader audit than one helper
- ❓ Need to verify ALL mod UI elements are hidden/disabled

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Audit all mod-only UI elements for suspension checks | Frontend | Tech Debt |
| Add "You are suspended" banner on moderation pages for suspended mods | Frontend | Feature |
| E2E test verifying suspended mod cannot see any mod actions | Frontend | Test |
| Verify issue page editing disabled for suspended mods | Frontend | Verification |

---

### 7. Mod Actions Require Unsuspension

**Roadmap Item:**

> "cannot take mod actions unless suspension is reversed or expired"

**Current State:**

- ✅ Backend enforces via `hasChannelModPermission.ts`
- ✅ Applies SuspendedModRole (typically all permissions false)

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Add E2E test for mod action blocked when suspended | Frontend | Test |
| Add E2E test for mod action enabled after unsuspension | Frontend | Test |
| Add E2E test for mod action enabled after suspension expires | Frontend | Test |

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

**Current State:**

- ✅ Separate Suspension nodes for users vs mods
- ✅ `SuspendedMods` relationship on Channel
- ✅ `SUSPEND_MOD` and `UNSUSPEND_MOD` mutations exist
- ❓ Current model supports suspension, but "ban mod profile while leaving user intact" likely needs explicit product and schema semantics beyond the current suspension workflow

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Decide whether mod-profile bans are a new state distinct from suspension | Both | Design Decision |
| If yes, design mod-profile-only ban model and permission effects | Backend | Design |
| Verify mod suspension doesn't affect user permissions | Backend | Test |
| Verify suspended mod can still create content as user | Frontend | Test |
| Add clear UI indication when mod profile suspended vs user account | Frontend | Feature |
| E2E test: suspend mod, verify can still post as user | Frontend | Test |
| E2E test: suspend mod, verify can't moderate | Frontend | Test |

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

| Task                                                   | Location | Type |
| ------------------------------------------------------ | -------- | ---- |
| E2E test for enabling moderation bot plugin            | Frontend | Test |
| E2E test for bot auto-archiving rule violation         | Frontend | Test |
| E2E test for bot comment appearing on archived content | Frontend | Test |
| E2E test for appeal workflow                           | Frontend | Test |

---

### 11. Server Admin Labels

**Roadmap Item:**

> "can make list of server admins, comments by server admins are labeled as such in comments"

**Current State:**

- ⚠️ `showAdminTag` exists today and is already queried in several discussion/event/comment surfaces, but it should be treated as deprecated
- ✅ Some author-status and badge-display logic already exists
- ❓ Missing pieces are a canonical server-admin/server-mod membership model on `ServerConfig` and consistent comment labeling across all comment contexts

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Add `ServerAdmins` and `ServerModerators` relationships to `ServerConfig` | Backend | Feature |
| Deprecate `showAdminTag`-driven server moderation UX and migrate callers to ServerConfig membership lookups | Both | Refactor |
| Add query and admin view to list/manage server admins and server moderators | Both | Feature |
| Rework comment/detail/list badge resolution so server-scoped labels mirror channel-scoped labels | Frontend | Refactor |
| Display "Server Admin" and "Server Mod" labels consistently on comments | Frontend | Feature |
| E2E tests for server admin and server mod badge display | Frontend | Test |

---

## Implementation Phases

### Phase 1: Stabilization & Correctness (Week 1-2)

1. Fix backend permission correctness for server-scope forum creation
2. Consolidate suspension target resolution and active-suspension reads
3. Introduce ServerConfig-scoped server admin/mod relationships and start deprecating `showAdminTag`
4. Add backend rule/unit coverage for suspension lifecycle, cleanup, and server membership reads
5. Add targeted frontend typing and consistent suspension-blocked UX for existing flows

### Phase 2: Suspended User Polish (Week 3)

1. Finish suspended-user reaction UX and error suppression
2. Verify notification content is complete
3. Add suspension status UI improvements
4. E2E tests for all suspended user flows

### Phase 3: Suspended Mod Workflows (Week 4-5)

1. Add "Report" options to mod comments/profiles/actions
2. Add "Suspend Mod" from various contexts
3. Verify mod/user separation is complete and decide whether mod-profile bans are distinct from suspensions
4. E2E tests for mod suspension workflows

### Phase 4: Bot Decision & Server Admins (Week 6)

1. Audit current bot action enforcement and make decision on bot suspension vs deprecation
2. Implement chosen bot strategy
3. Finish ServerConfig-based server admin/server mod list and badge migration
4. E2E tests for new features

### Phase 5: Auto-Moderation Plugin (Week 7-8)

1. Design plugin schema
2. Implement backend bot logic
3. Implement frontend configuration
4. Implement appeal workflow
5. Comprehensive E2E tests

### Phase 6: Tech Debt & Documentation (Week 9)

1. Consolidate broader permission code where still justified after stabilization
2. Add indexing/caching optimizations
3. Create moderation documentation
4. Final test coverage review

---

## Open Questions for Product Decision

1. **Bot Suspension**: Should bots be suspendable (creating Suspension nodes) or is deprecation sufficient? Deprecation removes the bot entirely, while suspension would just block its actions temporarily.

2. **Server-Level Mod Suspension**: Should there be a `canSuspendFromServer` permission allowing server admins to suspend users or mods across all channels? Current system requires channel-by-channel suspension.

3. **Mod Profile Bans**: Is "ban mod profile while leaving user profile intact" a distinct state from suspension, or should permanent mod suspension cover that use case?

4. **ServerConfig Membership Model**: Should server-scoped admin/mod relationships fully replace `showAdminTag`, or is there any remaining role-flag use case that still needs to survive the migration?

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

## Conclusion

The moderation system has a solid foundation, but the first priority is stabilization rather than new feature breadth. The main gaps are:

1. **Backend correctness and shared suspension logic** before expanding workflows
2. **ServerConfig-based server moderation UX** to replace `showAdminTag` and mirror channel-scoped membership patterns
3. **Reporting workflows** for mod comments/profiles/actions
4. **UI consistency** for suspended user/mod experience, especially error handling and reaction controls
5. **Bot handling** audit, decision, and implementation
6. **Auto-moderation plugin** as a plugin-system feature
7. **Test coverage** for stabilization, edge cases, and new scenarios

The recommended approach is to start with Phase 1 stabilization so the permission model, suspension lifecycle, and issue-linked state are correct and testable before adding new moderation workflows.
