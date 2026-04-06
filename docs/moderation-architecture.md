# Moderation Architecture

## Overview

Moderation in Multiforum spans both frontend and backend concerns:

- permission evaluation for users and moderation profiles
- suspension detection and expiry cleanup
- issue-linked moderation workflows
- server-scoped and channel-scoped role membership
- UI gating, notices, and moderation action flows

The system is intentionally issue-centric. Reports and moderation actions should create or reference an issue so there is an audit trail for what happened, why it happened, and who performed the action.

## Core Model

At a high level, moderation decisions are driven by four concepts:

1. Roles
- Positive/content permissions come from role assignments.
- Channel scope uses `ChannelRole` and `ModChannelRole`.
- Server scope uses `ServerRole` and `ModServerRole`.

2. Membership
- Channel-scoped admin/mod behavior is based on relationships attached to `Channel`.
- Server-scoped admin/mod behavior is based on relationships attached to `ServerConfig`.

3. Suspensions
- Users and moderation profiles can be suspended.
- Channel scope currently uses `SuspendedUsers` and `SuspendedMods` on `Channel`.
- Server scope is moving toward the same pattern on `ServerConfig`.

4. Issues
- Reports and moderation actions should link back to an issue.
- Suspensions should preserve this issue linkage so blocked users, blocked mods, and eventually blocked bots can see the reason and moderators can audit the history.

## Permission System

The application has two separate but related permission systems:

1. User permissions
- control regular-user actions such as creating content and reacting

2. Moderator permissions
- control moderation actions such as reporting, giving feedback, archiving, locking, and related workflows

### User Permission Levels

1. Standard users
- use the channel `DefaultChannelRole`, or the server `DefaultServerRole` as fallback
- typically cover create-discussion, create-comment, create-event, and upvote/react actions

2. Channel admins/owners
- users in `Channel.Admins`
- bypass both user and moderator permission checks

3. Suspended users
- users in `Channel.SuspendedUsers`
- use `SuspendedRole`, or `DefaultSuspendedRole` as fallback
- should have heavily restricted content permissions

### Moderator Permission Levels

1. Standard moderators
- all authenticated users are treated as standard moderators by default
- they are not explicitly in `Channel.Moderators` and not in `Channel.SuspendedMods`
- they can perform basic moderation actions such as report and give feedback
- these permissions come from `DefaultModRole`

2. Elevated moderators
- explicitly included in `Channel.Moderators`
- can perform stronger actions such as archiving and moderator management, depending on configuration
- these permissions come from `ElevatedModRole`

3. Suspended moderators
- included in `Channel.SuspendedMods`
- have heavily restricted moderator permissions
- these permissions come from `SuspendedModRole`

### Permission Flow

Several rules are important for understanding the system:

- channel-specific roles take precedence over server-wide defaults
- channel admins/owners bypass both user and moderator permission checks
- suspended status overrides other status for the same permission type
- fallback order is channel-specific roles, then server defaults, then deny

Some actions effectively require both user and moderator permission context.

- for example, archive-related UI should respect the specific moderator permission rather than checking only whether the actor “is a moderator”

### Permission Checking Order

The frontend and backend should conceptually agree on this sequence:

1. Check whether the actor is a channel owner/admin
- if yes, grant all permissions

2. Check user suspension status
- if suspended, use suspended user role permissions

3. Check moderator suspension status
- if suspended mod, use suspended moderator role permissions

4. Check elevated moderator status
- if present, use elevated moderator role permissions

5. Otherwise, use standard user and standard moderator role permissions

UI components should consume the resolved permission object rather than layering on extra ad hoc restrictions.

### Common UI Pitfalls

These are recurring sources of moderation bugs:

- showing moderation menus only for “elevated” moderators instead of any actor with at least one moderation permission
- hiding standard moderator actions like report or give feedback from users who should receive them via `DefaultModRole`
- checking for status labels or membership directly instead of the actual permission flags

In practice:

- header moderation menus for discussions, events, and comments should show the correct items based on specific permissions
- the “Moderation Actions” section should appear whenever the actor has at least one moderation permission

## Backend Flow

### Permission Enforcement

Backend permission checks are the source of truth.

- `rules/rules.ts` contains GraphQL Shield rules such as `canCreateChannel`
- `rules/permission/hasChannelPermission.ts` handles user-facing channel permissions
- `rules/permission/hasChannelModPermission.ts` handles moderation-profile permissions
- `rules/permission/hasServerPermission.ts` handles server-scoped permissions

These checks should determine whether the actor can perform the action even if the frontend UI is stale or permissive.

The frontend mirrors this through:

- `utils/permissionUtils.ts` for shared permission derivation
- `utils/headerPermissionUtils.ts` for UI/menu gating

Channel admins/owners should bypass all permission checks in both places.

### Suspension Resolution

Suspension reads should flow through shared helpers instead of ad hoc lookups.

- `rules/permission/getActiveSuspension.ts` is the shared read path for active vs expired suspension state
- expired suspensions are returned separately so callers can trigger cleanup
- issue-linked suspension reads should reuse the same logic so UI, mutations, and permission checks agree

Issue target resolution is also centralized:

- `customResolvers/shared/resolveIssueTarget.ts` resolves the discussion, event, or comment associated with an issue-backed moderation action

### Suspension Lifecycle

Suspensions can be time-limited or indefinite and are enforced at both channel and server scope.

1. Suspension creation
- a `Suspension` node is created when a moderator suspends a target
- it stores `suspendedUntil`, `suspendedIndefinitely`, and a link to the related moderation issue

2. Suspension detection
- a suspension is active if `suspendedIndefinitely` is true or `suspendedUntil` is still in the future
- expired suspensions should be treated as stale data and disconnected

3. Permission enforcement
- channel scope applies suspended-role permissions to blocked users and suspended moderators
- server scope uses suspended-role defaults for blocked server actions such as forum creation

4. User-facing explanation
- blocked actors should be able to see the related issue trail and understand why the action failed

### Expiry Cleanup

Expired suspensions should not remain logically active.

- read helpers identify expired relationships
- cleanup is handled by `rules/permission/disconnectExpiredSuspensions.ts`
- callers that detect expired suspensions should sever the stale relationship before treating the actor as blocked

### Notifications

Suspension-related blocked actions may generate notifications.

- backend notification creation lives in `rules/permission/suspensionNotification.ts`
- the intended UX is that blocked actors can navigate from the notice to the related issue and see the expiration or indefinite status
- the notification should explain what action was blocked and in which channel or scope it was blocked

## Frontend Flow

### Permission and Membership State

Frontend permission logic should derive from explicit permission objects and membership data rather than presentation flags.

- `utils/permissionUtils.ts` contains shared permission typing and permission derivation helpers
- `utils/headerPermissionUtils.ts` controls moderation/menu visibility
- `composables/useServerRoleMembership.ts` maps `ServerConfig.Admins` and `ServerConfig.Moderators` into UI badge inputs
- `utils/serverRoleBadges.ts` resolves server-scoped labels from membership relationships

The old `showAdminTag` server-label model has been removed from user-facing flows in favor of direct `ServerConfig` membership.

### Suspension Notices

Frontend forms should prefer a suspension notice over a raw permission error when issue-linked suspension context is already available.

- `composables/useSuspensionNotice.ts` resolves issue number, channel/server context, and expiration data
- create and comment-entry surfaces should show `SuspensionNotice` when they know the block is suspension-related
- the same principle applies to reaction and blocked-action surfaces: prefer issue-linked suspension context over generic GraphQL failure text

### Shared Moderation UI State

Recent refactors intentionally collapsed duplicate moderation UI state into shared composables.

- `composables/useModerationOutcomeUI.ts` handles report/archive/unarchive/archive-and-suspend modal and success-notification state
- `composables/useSuspensionActionUI.ts` handles suspend/unsuspend modal and success-notification state
- `composables/useCommentSectionNotifications.ts` and `composables/useCommentSectionModals.ts` layer comment-section-specific state on top of the shared moderation outcome flow

These shared flows are now used by:

- discussion headers
- event headers
- feedback moderation surfaces
- comment sections
- archive buttons
- suspend user/mod buttons

## Scope Rules

### Channel Scope

Channel scope is the established moderation model.

- role relationships and suspended-user/mod relationships are attached to `Channel`
- labels and permissions are based on the relationship between the actor and that channel

### Server Scope

Server scope should mirror channel scope as closely as possible.

- role and membership behavior should derive from `ServerConfig`
- server-scoped suspended users/mods should also live on `ServerConfig`
- server-scoped moderation UI should follow the same conceptual model as channel scope rather than inventing a separate badge or permission system

## Bots

Bots should follow the same auditability standards as human moderation targets.

- the planned direction is to reuse the existing report -> issue -> suspend workflow for bots
- if a bot is suspended, moderators should be able to see the related issue trail the same way they can for suspended users and suspended mods

For the first moderation-bot plugin version:

- the plugin should be experimental
- it should be report-only
- it should create issues for human review rather than auto-archive or auto-suspend
- plugin scope should be configurable rather than split into separate channel and server plugins

## Testing Guidance

Moderation testing should focus on permission level, not only surface rendering.

When testing moderator behavior:

- make sure the actor actually has the expected permission level
- verify the correct UI options appear for that level
- verify unprivileged users do not see moderation options
- verify suspended moderators cannot access moderation actions

Suspension end-to-end coverage lives in:

- `tests/cypress/e2e/suspensions/suspendedUserPermissions.spec.cy.ts`
- `tests/cypress/e2e/suspensions/serverLevelSuspension.spec.cy.ts`

## Design Direction

The moderation system should keep converging on a few principles:

- backend permission checks are authoritative
- issue linkage is required for transparency and auditability
- server scope should mirror channel scope where possible
- frontend state for moderation actions should be shared instead of duplicated
- presentation should derive from explicit relationships and permissions, not legacy display flags

## Key Files

- `utils/permissionUtils.ts`
- `utils/headerPermissionUtils.ts`
- `composables/useSuspensionNotice.ts`
- `composables/useModerationOutcomeUI.ts`
- `composables/useSuspensionActionUI.ts`
- `rules/rules.ts`
- `rules/permission/getActiveSuspension.ts`
- `rules/permission/disconnectExpiredSuspensions.ts`
- `rules/permission/hasChannelPermission.ts`
- `rules/permission/hasChannelModPermission.ts`
- `rules/permission/hasServerPermission.ts`
- `customResolvers/shared/resolveIssueTarget.ts`
