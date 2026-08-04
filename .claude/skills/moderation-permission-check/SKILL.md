---
name: moderation-permission-check
description: Implement, review, or test moderation permission and suspension logic. Use whenever gating UI on moderator permissions, adding a Give Feedback / Report / Archive action, checking channel vs server scope, working with SuspendedRole / DefaultSuspendedRole, or writing tests that verify unprivileged/suspended users cannot see or use mod actions.
---

# Moderation & permission checks (Multiforum)

**Single source of truth:** [docs/moderation-architecture.md](../../../docs/moderation-architecture.md).
Read it for permission precedence/fallback order, suspension lifecycle, issue-linked
workflow, and the server-scope vs channel-scope model. Do not re-derive these rules.

## Where the logic lives
- `utils/permissionUtils.ts` — `checkPermission()`, `getAllPermissions()`, the
  `CORE_PERMISSION_KEYS` / `ADDITIONAL_PERMISSION_KEYS` / `ROLE_STATE_KEYS` flag sets,
  and `PermissionFlags` / `Role` / `PermissionData` types. **Check specific permission
  flags** — never infer capability from "is a moderator" alone.
- `utils/headerPermissionUtils.ts` — `canPerformModActions()`,
  `buildModerationSection()`, `getDiscussionHeaderMenuItems()`,
  `getEventHeaderMenuItems()`, `getCommentMenuItems()`. Header menus should surface
  "Give Feedback" and "Report" whenever resolved permissions allow them.
- Each has a colocated `*.spec.ts` — extend those when you change behavior.

## Rules to preserve
- **Gate on specific flags**, not moderator status. The "Moderation Actions" section
  should appear for any actor with **at least one** moderation permission.
- **Two scopes**: channel-level suspensions use `SuspendedRole` (very restricted);
  any active suspension makes server actions (e.g. creating a forum) use
  `DefaultSuspendedRole`.
- **Suspension is active** if `suspendedIndefinitely` is true OR `suspendedUntil` is in
  the future; expired suspensions are cleaned up (disconnected from the channel).
- **Blocked suspended users get an in-app notification** naming the channel, the blocked
  action, and the related moderation issue.

## Tests must verify
- Unprivileged users do **not** see moderation actions.
- Suspended moderators **cannot** use moderation features.
- The correct permission level resolves for the actor + scope.

Prefer extracting new permission logic into `utils/` and unit-testing it directly
(see [write-unit-test](../write-unit-test/SKILL.md)); cover the UI-gating flow with a
mocked Playwright test (see [write-mocked-playwright-test](../write-mocked-playwright-test/SKILL.md)),
using the content-type-specific report-modal test IDs.
