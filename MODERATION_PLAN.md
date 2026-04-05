# Moderation Features: Current State vs Roadmap Plan

## Executive Summary

This document analyzes the current moderation implementation across both the frontend (gennit-nuxt) and backend (gennit-backend) codebases, compares it against the planned roadmap, identifies gaps, and proposes implementation tasks including tech debt items and new tests.

---

## Current Implementation Overview

### What's Already Built

#### Suspension System
- **User Suspensions**: Time-limited or indefinite, channel-scoped
- **Mod Suspensions**: Separate from user suspensions, uses SuspendedModRole
- **Server-Level Checks**: `hasServerPermission.ts` blocks `canCreateChannel` for suspended users
- **Automatic Expiration**: Expired suspensions are disconnected from channels (fire-and-forget cleanup)
- **Notifications**: In-app notifications sent when suspended users are blocked from actions

#### Permission Enforcement
- **Two-Tier System**: User permissions vs Moderator permissions
- **Role Hierarchy**: Admin > Elevated Mod > Standard Mod > Suspended Mod
- **Channel & Server Scopes**: Different enforcement paths for each

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
- Emoji reactions likely not permission-checked against suspension status
- Need to investigate if `canComment` or similar permission controls emoji reactions

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Add emoji reaction permission check using canComment permission | Backend | Feature |
| Suppress error for suspended users attempting emoji (graceful failure) | Backend | Feature |
| Verify UI doesn't show error toast for suspended emoji attempts | Frontend | Feature |
| Add E2E test for suspended user emoji restriction | Frontend | Test |

---

### 2. Server-Scope Suspension - Forum Creation

**Roadmap Item:**
> "when suspended at server scope, cannot create forums"

**Current State:**
- ✅ Backend implements this in `hasServerPermission.ts` (lines 59-122)
- ✅ Frontend test exists: `serverLevelSuspension.spec.cy.ts`
- ❓ Need to verify the test is passing and comprehensive

**Required Work:**
| Task | Location | Type |
|------|----------|------|
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

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Add E2E test verifying expired suspension cleanup | Frontend | Test |
| Add unit test for `isExpiredSuspension()` logic | Backend | Test |
| Verify cleanup handles both user and mod suspensions | Backend | Test |

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
- ❓ Need to verify reversal workflow works

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify notification includes issue link, expiration date, blocked action | Backend | Verification |
| Add E2E test for unsuspension enabling previously blocked action | Frontend | Test |
| Add test for notification received on blocked action | Frontend | Test |
| Ensure notification UI shows issue link and expiration clearly | Frontend | Feature/Polish |

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
| Task | Location | Type |
|------|----------|------|
| Add "Report" menu item to feedback page comment headers | Frontend | Feature |
| Add "Report" button/menu to mod profile page | Frontend | Feature |
| Add "Report" option to issue activity feed mod actions | Frontend | Feature |
| Create `reportModComment` mutation if needed | Backend | Feature |
| E2E test for reporting mod from feedback page | Frontend | Test |
| E2E test for reporting mod from profile page | Frontend | Test |
| E2E test for reporting mod from issue page | Frontend | Test |

#### Phase 2: Suspend from Mod Actions
| Task | Location | Type |
|------|----------|------|
| Add "Suspend Mod" option to issue comment context menu | Frontend | Feature |
| Add "Suspend Mod" option to mod action context in activity feed | Frontend | Feature |
| Ensure suspension creates proper Issue linking to reported content | Backend | Feature |

---

### 6. Suspended Mod Perspective

**Roadmap Item:**
> "from suspended mod's perspective all mod actions should be disabled"

**Current State:**
- ✅ `headerPermissionUtils.ts` checks mod suspension status
- ✅ `canPerformModActions()` returns false for suspended mods
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
- No Suspension nodes created for bots

**Required Work:**

**Decision Required:** Should bots be suspendable like human accounts, or is deprecation sufficient?

| Task | Location | Type |
|------|----------|------|
| DECISION: Define bot suspension vs deprecation strategy | Both | Design Decision |
| If suspendable: Add bot suspension support to backend | Backend | Feature |
| If suspendable: Add bot suspension UI | Frontend | Feature |
| If deprecated only: Document that bots can't be suspended | Docs | Documentation |
| Test that deprecated bots cannot perform actions | Frontend | Test |

---

### 9. Mod Profile Suspension Workflow

**Roadmap Item:**
> "Plan, implement and test workflows for suspending and banning mod profiles while leaving user profiles intact"

**Current State:**
- ✅ Separate Suspension nodes for users vs mods
- ✅ `SuspendedMods` relationship on Channel
- ✅ `SUSPEND_MOD` and `UNSUSPEND_MOD` mutations exist
- ❓ UI workflow may need improvement

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Verify mod suspension doesn't affect user permissions | Backend | Test |
| Verify suspended mod can still create content as user | Frontend | Test |
| Add clear UI indication when mod profile suspended vs user account | Frontend | Feature |
| E2E test: suspend mod, verify can still post as user | Frontend | Test |
| E2E test: suspend mod, verify can't moderate | Frontend | Test |

---

### 10. Auto-Moderation Bot Plugin

**Roadmap Item:**
> "add plugin that channels can opt into - optional moderation for channel rules - bot comment says it was archived and if there's a mistake, comment on the issue and request it to be unarchived"

**Current State:**
- ❌ Not implemented
- Plugin system exists for other purposes

**Required Work:**

#### Backend
| Task | Location | Type |
|------|----------|------|
| Define plugin schema for moderation bot | Backend | Design |
| Create `ModerationBotPlugin` type | Backend | Feature |
| Create bot user for automated moderation | Backend | Feature |
| Implement auto-archive based on rule violations | Backend | Feature |
| Implement bot comment on archived content | Backend | Feature |

#### Frontend
| Task | Location | Type |
|------|----------|------|
| Add moderation bot plugin to channel settings | Frontend | Feature |
| Configure which rules trigger auto-moderation | Frontend | Feature |
| Display bot comments with clear "automated" indicator | Frontend | Feature |
| Add appeal workflow UI | Frontend | Feature |

#### Tests
| Task | Location | Type |
|------|----------|------|
| E2E test for enabling moderation bot plugin | Frontend | Test |
| E2E test for bot auto-archiving rule violation | Frontend | Test |
| E2E test for bot comment appearing on archived content | Frontend | Test |
| E2E test for appeal workflow | Frontend | Test |

---

### 11. Server Admin Labels

**Roadmap Item:**
> "can make list of server admins, comments by server admins are labeled as such in comments"

**Current State:**
- ❓ ServerRoles exist but unclear if "server admin" is distinguished
- Comment author status extraction exists in `getCommentAuthorStatus()`
- Some badge display logic exists

**Required Work:**
| Task | Location | Type |
|------|----------|------|
| Add `ServerAdmins` relationship to ServerConfig | Backend | Feature |
| Add query to fetch server admins | Backend | Feature |
| Add server admin management UI in admin panel | Frontend | Feature |
| Update `getCommentAuthorStatus()` to detect server admin | Frontend | Feature |
| Display "Server Admin" badge on comments | Frontend | Feature |
| E2E test for server admin badge display | Frontend | Test |

---

## Tech Debt & Refactoring

### High Priority

| Task | Location | Reason |
|------|----------|--------|
| Consolidate permission checking into single composable | Frontend | Code scattered across multiple utils |
| Add comprehensive TypeScript types for all permission objects | Frontend | Many `any` casts in permission code |
| Create unified moderation action handler | Frontend | Duplicate modal/action logic across components |
| Add error boundary for failed permission checks | Frontend | Silent failures possible |
| Index frequently queried suspension fields | Backend | Performance optimization |

### Medium Priority

| Task | Location | Reason |
|------|----------|--------|
| Extract modal workflows into composables | Frontend | Reduce component complexity |
| Consolidate `suspendUser` and `suspendMod` resolvers | Backend | Shared logic in createSuspensionResolver.ts |
| Add caching for permission lookups | Backend | Reduce DB queries |
| Create permission documentation page | Frontend | Complex system needs docs |

### Low Priority

| Task | Location | Reason |
|------|----------|--------|
| Standardize GraphQL error messages for suspension blocks | Backend | Inconsistent messaging |
| Add analytics for moderation actions | Backend | Track mod activity |
| Create moderation dashboard with metrics | Frontend | Visibility into mod workload |

---

## Test Coverage Gaps

### Missing E2E Tests

| Test | Priority | Location |
|------|----------|----------|
| Suspended user cannot react with emoji | High | `tests/cypress/e2e/suspensions/` |
| Expired suspension allows action | High | `tests/cypress/e2e/suspensions/` |
| Unsuspension immediately enables actions | High | `tests/cypress/e2e/suspensions/` |
| Suspended mod sees no mod UI elements | High | `tests/cypress/e2e/mod/` |
| Reporting mod comment from feedback page | Medium | `tests/cypress/e2e/mod/` |
| Reporting mod from profile page | Medium | `tests/cypress/e2e/mod/` |
| Mod suspension doesn't affect user actions | High | `tests/cypress/e2e/suspensions/` |
| Server admin badge on comments | Low | `tests/cypress/e2e/comments/` |
| Bot deprecation prevents actions | Medium | `tests/cypress/e2e/bots/` |

### Missing Unit Tests

| Test | Priority | Location |
|------|----------|----------|
| `isExpiredSuspension()` logic | High | Backend tests |
| `getActiveSuspension()` edge cases | High | Backend tests |
| `canPerformModActions()` all paths | Medium | Frontend tests |
| Permission fallback chains | Medium | Frontend tests |

---

## Implementation Phases

### Phase 1: Foundation & Missing Tests (Week 1-2)
1. Audit and verify existing tests pass
2. Add missing tests for current features
3. Fix any broken permission checks found during audit
4. Add TypeScript types for permission objects

### Phase 2: Suspended User Polish (Week 3)
1. Implement emoji reaction restriction
2. Verify notification content is complete
3. Add suspension status UI improvements
4. E2E tests for all suspended user flows

### Phase 3: Suspended Mod Workflows (Week 4-5)
1. Add "Report" options to mod comments/profiles/actions
2. Add "Suspend Mod" from various contexts
3. Verify mod/user separation is complete
4. E2E tests for mod suspension workflows

### Phase 4: Bot Decision & Server Admins (Week 6)
1. Make decision on bot suspension vs deprecation
2. Implement chosen bot strategy
3. Implement server admin list and badges
4. E2E tests for new features

### Phase 5: Auto-Moderation Plugin (Week 7-8)
1. Design plugin schema
2. Implement backend bot logic
3. Implement frontend configuration
4. Implement appeal workflow
5. Comprehensive E2E tests

### Phase 6: Tech Debt & Documentation (Week 9)
1. Consolidate permission code
2. Add caching optimizations
3. Create moderation documentation
4. Final test coverage review

---

## Open Questions for Product Decision

1. **Bot Suspension**: Should bots be suspendable (creating Suspension nodes) or is deprecation sufficient? Deprecation removes the bot entirely, while suspension would just block its actions temporarily.

2. **Server-Level Mod Suspension**: Should there be a `canSuspendFromServer` permission allowing server admins to suspend users across all channels? Current system requires channel-by-channel suspension.

3. **Auto-Moderation Scope**: Should the auto-moderation bot:
   - Only archive, or also suspend?
   - Work on server rules, channel rules, or both?
   - Require human review before taking action?

4. **Appeal Timeline**: What should the SLA be for reviewing appeals of auto-moderated content?

5. **Notification Preferences**: Should suspended users be able to opt out of receiving suspension notifications? (Currently they cannot.)

---

## File Reference

### Frontend Key Files
- `/utils/permissionUtils.ts` - Core permission logic
- `/utils/headerPermissionUtils.ts` - UI menu permission logic
- `/components/mod/` - All moderation components
- `/graphQLData/mod/` - Moderation GraphQL operations
- `/tests/cypress/e2e/suspensions/` - Suspension tests

### Backend Key Files
- `/customResolvers/rules/permission/hasChannelPermission.ts` - User permission enforcement
- `/customResolvers/rules/permission/hasChannelModPermission.ts` - Mod permission enforcement
- `/customResolvers/rules/permission/hasServerPermission.ts` - Server permission enforcement
- `/customResolvers/rules/permission/getActiveSuspension.ts` - Suspension detection
- `/customResolvers/rules/permission/disconnectExpiredSuspensions.ts` - Expiration cleanup
- `/customResolvers/rules/permission/suspensionNotification.ts` - Notification creation
- `/customResolvers/mutations/suspendUser.ts` - Suspension mutation
- `/customResolvers/mutations/unsuspendUser.ts` - Unsuspension mutation

---

## Conclusion

The moderation system has a solid foundation with most core functionality implemented. The main gaps are:

1. **Reporting workflows** for mod comments/profiles/actions
2. **UI polish** for suspended user/mod experience
3. **Bot handling** decision and implementation
4. **Auto-moderation plugin** (new feature)
5. **Server admin badges** (new feature)
6. **Test coverage** for edge cases and new scenarios

The recommended approach is to start with Phase 1 (testing foundation) to ensure existing code is solid before adding new features.
