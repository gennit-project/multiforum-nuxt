# Moderation Features: Current State vs Roadmap Plan

## Mod Profile Suspension Workflow

| Task                                                                                                                          | Location | Type     |
| ----------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| Treat channel-scope and server-scope suspended-mod lists as the primary model instead of introducing a separate mod-ban state | Both     | Decision |

## Suspended Mods - Reporting Workflow

### Planned Code Changes

| Task                                                               | Location | Type    |
| ------------------------------------------------------------------ | -------- | ------- |
| Add "Suspend Mod" option to issue comment context menu             | Frontend | Feature |
| Add "Suspend Mod" option to mod action context in activity feed    | Frontend | Feature |
| Ensure comment-report issues preserve `relatedUsername` or `relatedModProfileName` for later suspension workflows | Backend  | Feature |
| Ensure suspension creates proper Issue linking to reported content | Backend  | Feature |

## Shared Bot Context Infrastructure

Both the moderation bot plugin and the existing partially completed beta bot need the same core problem solved: build the right amount of forum/discussion/comment context before sending a prompt to a bot.

### Shared Backend / Plugin Work

| Task                                                                                                                                               | Location         | Type             |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------- |
| Create shared logic for bot invocation context so beta bot and the moderation bot do not each rebuild forum/discussion/comment context differently | Backend + Plugin | Refactor/Feature |
| Include forum context in the shared bot payload: forum name, forum description, and forum rules                                                    | Backend + Plugin | Feature          |
| Include discussion context in the shared bot payload: discussion title and discussion body                                                         | Backend + Plugin | Feature          |
| Include threaded comment context in the shared bot payload, walking parent comments all the way to the root when reviewing a child comment         | Backend + Plugin | Feature          |
| Support different context envelopes depending on invocation type: tagged bot invocation vs automatic moderation review                             | Backend + Plugin | Feature          |
| Add debug logging for the final prompt/context sent to bots, at least in local logs                                                                | Backend + Plugin | Debugging        |

### Beta Bot Overlap

These beta bot items are not the main moderation roadmap, but they share the same context-construction dependency and should be planned with that reuse in mind.

| Task                                                                                                     | Location          | Type    |
| -------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| Add API key configuration for the beta bot plugin                                                        | Frontend + Plugin | Feature |
| Allow channel settings to update beta bot display name, description, and prompt after the bot is created | Frontend + Plugin | Feature |
| Ensure all 4 beta bot identities are created for the beta bot plugin and labeled in the sidebar          | Frontend + Plugin | Feature |
| Test context-rich tagged invocation in a forum like Bad Advice once shared context assembly is in place  | Verification      | QA      |

The moderation bot should reuse the same moderation-profile-based audit surface as human moderators. That means its reports should show up on the bot's mod profile page, using the existing mod profile route and history views rather than a separate bot-only audit UI.

## Suspended User Content Creation + Notifications

| Task                                                                                      | Location | Type           |
| ----------------------------------------------------------------------------------------- | -------- | -------------- |
| Ensure notification UI shows issue link and expiration clearly                            | Frontend | Feature/Polish |
| Add suspension notification opt-out to notification settings                              | Frontend | Feature        |
| Persist and honor the suspension-notification preference in backend notification delivery | Backend  | Feature        |

## Suspended Bots

**Current State:**

- ❌ Bots do not yet participate in the full suspension workflow used for users and mods
- Bots use ModerationProfile for comments
- `channelBotsMiddleware.ts` marks bots as deprecated, not suspended
- Bot accounts are still real `User` records with moderation profiles, so some human suspension logic may already apply depending on which mutation path a bot uses

| Task                                                                                                                                   | Location | Type    |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| Reuse the existing report -> issue -> suspend workflow for bots so moderation actions create the same paper trail as human suspensions | Both     | Feature |
| Extend suspension target resolution and permission checks so bots can be suspended like human accounts                                 | Backend  | Feature |
| Surface bot suspension state, linked issues, and reason visibility through the existing moderation UI patterns                         | Frontend | Feature |

## Auto-Moderation Bot Plugin

**Current State:**

- ❌ Not implemented
- Plugin system exists and is already capable of channel opt-in, bot user provisioning, and pipeline-style execution, so this should be built as a plugin feature rather than a bespoke moderation subsystem
- First version should only report content and create issues for human review; it should not archive or suspend automatically

### Backend

| Task                                                                                                                                                  | Location          | Type    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| Create an experimental moderation bot plugin in `/Users/catherineluse/gennit/gennit-nuxt/multiforum-plugins` with configurable scope mode             | Frontend + Plugin | Feature |
| Define plugin schema for a report-only moderation bot                                                                                                 | Backend           | Design  |
| Create `ModerationBotPlugin` type or equivalent report-only plugin model                                                                              | Backend           | Feature |
| Create bot user for automated moderation                                                                                                              | Backend           | Feature |
| Ensure the content moderation bot acts through a `ModerationProfile`, so its reports and actions appear on a normal mod profile page for auditability | Backend + Plugin  | Feature |
| Implement report-only issue creation based on rule violations                                                                                         | Backend           | Feature |
| Have the bot leave issue-linked/report-linked comments that clearly indicate automated reporting                                                      | Backend           | Feature |

#### Frontend

| Task                                                                                                                                                             | Location          | Type          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------- |
| Add the experimental moderation bot plugin to channel settings with configurable scope mode                                                                      | Frontend          | Feature       |
| Configure which rules trigger auto-moderation                                                                                                                    | Frontend          | Feature       |
| Display bot comments with clear "automated" indicator                                                                                                            | Frontend          | Feature       |
| Add README/docs explaining that this is an experimental proof of concept that only reports for human review today and may later expand to actions like archiving | Frontend + Plugin | Documentation |
| Support scope configuration in the plugin UI so the same plugin can run in channel-scoped or server-scoped mode                                                  | Frontend          | Feature       |

## Server Admin Labels

- Bring `ServerConfig` admin/mod membership management to feature parity with the channel-scope invite-style workflow
- Add a later-phase restricted-admin design using `ServerConfig.SuperAdmins` plus a `canCreateAdmins` server-role permission so non-super-admin accounts cannot create additional admins

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

## Needs Manual Testing/QA

These items are implemented and should stay visible for validation, regression checks, and UX review, but they are no longer part of the active to-do list.

### Implemented Tests To Re-Verify

| Item                                                                                                                                             | Location                             | QA Focus                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `canCreateChannel` actually awaits and enforces `hasServerPermission()`                                                                          | Backend rule test                    | Keep this in backend coverage and verify it protects the real server-suspension forum-creation path       |
| `isOriginalPosterSuspended` agrees with `getActiveSuspension()` for user and mod targets                                                         | Backend tests                        | Re-verify against future suspension refactors                                                             |
| `isExpiredSuspension()` logic                                                                                                                    | Backend tests                        | Validate expiry edge cases against production-like timestamps                                             |
| `disconnectExpiredSuspensions()` no-op and mixed user/mod cleanup paths                                                                          | Backend tests                        | Re-verify both cleanup branches under real mutation flows                                                 |
| Shared suspension target resolution for discussion/event/comment-backed issues                                                                   | Backend tests                        | Re-verify issue target resolution against future issue model changes                                      |
| `getActiveSuspension()` uses targeted database reads instead of loading and filtering full channel suspension lists                              | Backend refactor + tests             | Re-verify query behavior, expiry cleanup handoff, and mutation latency improvements under real load       |
| Request-scoped permission caching reuses `ServerConfig` and active server-suspension lookups within a single GraphQL request                     | Backend refactor + tests             | Re-verify repeated permission checks on mutation-heavy flows and watch for stale-request edge cases       |
| Moderation-related permission failures now return consistent channel/server/mod error text instead of mixed ad-hoc strings                       | Backend refactor + tests             | Re-verify blocked create/react/moderation flows and confirm the frontend suppression paths still match    |
| Server-scoped admin/mod membership resolves from `ServerConfig` relationships instead of `showAdminTag`                                          | Backend + frontend implementation    | Manual validation across comments, discussions, events, profile/library surfaces, and admin editing flows |
| Server-scoped suspension enforcement now uses `ServerConfig.SuspendedUsers` and `ServerConfig.SuspendedMods` plus `ModServerRole.canSuspendUser` | Backend implementation + tests       | Re-verify forum creation blocks, server-scoped mod-action blocks, unsuspend flows, and issue-linked state |
| Server-scoped suspend/unsuspend resolution now supports issues without a channel by resolving targets from server-scoped issue metadata          | Backend implementation + tests       | Re-verify server-scoped issue targets for both user and mod suspensions                                   |
| Display "Server Admin" and "Server Mod" labels consistently on comments                                                                          | Frontend implementation              | Manual cross-surface verification before relying solely on E2E coverage                                   |
| Server-scoped suspension management now has dedicated admin pages that mirror the channel-scope suspended-user and suspended-mod views           | Frontend implementation              | Manually review navigation, issue links, empty states, and parity with forum-level suspension pages       |
| Suspended-mod moderation UI now explicitly states that the moderator account can be suspended while the user account remains separate            | Frontend implementation + tests      | Re-verify issue detail, issue comment form, and moderation wizard copy on real suspended-mod accounts     |
| Create/forum/discussion/event/comment flows suppress raw suspension-blocked errors when suspension context is available                          | Frontend unit tests + implementation | Re-verify against real GraphQL permission failures and stale cache cases                                  |
| Comment and discussion emoji controls show suspension-aware blocked-action UI                                                                    | Frontend unit tests + implementation | Manual verification across both existing reactions and add-reaction entry points                          |
| Suspended moderator issue-comment and moderation controls stay disabled in the main moderation UI                                                | Frontend unit tests + implementation | Re-verify on actual issue detail pages and related moderation surfaces                                    |
| Mod profile comments now open the reporting modal from the mod profile route                                                                     | Frontend implementation + tests      | Re-verify reporting, issue creation, and notification behavior from `/mod/[modId]/comments`               |
| Issue activity feed comments now open the reporting modal from the moderation activity feed                                                      | Frontend implementation + tests      | Re-verify report modal routing, issue creation, and notification behavior from issue detail activity feeds |
| `useServerRoleMembership()` maps `ServerConfig.Admins` and `ServerConfig.Moderators` into the shared badge inputs                                | Frontend unit tests                  | Re-verify if the `ServerConfig` membership shape changes again                                            |
| Inline discussion and event root-comment forms suppress raw permission errors when suspension context is already known                           | Frontend unit tests + implementation | Re-verify against real blocked comment mutations in discussion and event detail pages                     |
| Shared suspend/unsuspend button UI composable preserves modal and notification behavior                                                          | Frontend unit tests + refactor       | Re-verify suspend/unsuspend flows across both user and mod issue actions                                  |
| Shared moderation outcome UI composable preserves report/archive/unarchive/archive-and-suspend notifications and modal closing behavior          | Frontend unit tests + refactor       | Re-verify discussion, event, and feedback moderation flows after real modal submissions                   |
| Comment section and archive button now rely on the shared moderation outcome workflow                                                            | Frontend unit tests + refactor       | Re-verify archive/unarchive/report flows from comment lists and issue action surfaces                     |

---

## Verification & QA Backlog

This section is intentionally verification-only. If an item requires new product code, it belongs later in the document under implementation planning. |

### Non-E2E Verification Gaps

| Test                                                                                      | Priority | Location       |
| ----------------------------------------------------------------------------------------- | -------- | -------------- |
| Verify whether expired suspension cleanup still has uncovered active/no-active edge cases | High     | Backend tests  |
| Additional component-level server badge rendering on any still-uncovered major surface    | Medium   | Frontend tests |

### Verification Checklist

- [ ] Manually verify the implemented blocked-action flows on real pages and move any failures into the Cypress section or a new bug list
- [ ] Re-verify `getActiveSuspension()` only if a new production edge case appears during QA or future suspension work
- [ ] Add component-level badge coverage only if QA uncovers an untested major surface
- [ ] Run the remaining stabilization verification from the dedicated Cypress section at the end of this document
- [ ] Verify existing emoji mutations are blocked for suspended users via `canUpvote*` permissions
- [ ] Re-check expired suspension cleanup behavior
- [ ] Verify suspended issue notification includes issue link, expiration date, and blocked action context
- [ ] Verify server-scoped suspended users cannot create forums and server-scoped suspended mods cannot take server moderation actions
- [ ] Verify server-scoped suspend and unsuspend flows resolve the correct target and linked issue when the issue has no channel
- [ ] Review the new `/admin/suspended-users` and `/admin/suspended-mods` pages for channel-parity UX, empty states, and related-issue navigation
- [ ] Verify the suspended-mod copy clearly communicates that the mod profile can be suspended while the user account remains active
- [ ] Verify issue page editing is disabled for suspended mods
- [ ] Verify blocked and restored mod-action behavior across suspended, unsuspended, and expired states
- [ ] Verify reporting from `/mod/[modId]/comments` opens the expected report workflow and creates the expected issue trail
- [ ] Validate the new server membership editor UX for larger admin/mod lists
- [ ] Review shared bot-context design against both beta bot and moderation bot before implementing either plugin-specific context builder
- [ ] Audit bot action paths to confirm suspended bots are blocked consistently and link back to the relevant issue context
- [ ] Verify mod suspension does not affect user permissions
- [ ] Verify a suspended mod can still create content as a user
- [ ] Add automated non-Cypress coverage for report-only moderation bot enablement, issue creation, and bot comments where practical
- [ ] Audit all mod-only UI elements for suspension checks
