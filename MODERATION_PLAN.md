# Moderation Features: Current State vs Roadmap Plan

## Remaining Implementation Work

### Shared Bot Context Infrastructure

#### Beta Bot Overlap

These beta bot items are not the main moderation roadmap, but they share the same context-construction dependency and should be planned with that reuse in mind.

| Task                                                                                                     | Location          | Type    |
| -------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| Add API key configuration for the beta bot plugin                                                        | Frontend + Plugin | Feature |
| Allow channel settings to update beta bot display name, description, and prompt after the bot is created | Frontend + Plugin | Feature |
| Ensure all 4 beta bot identities are created for the beta bot plugin and labeled in the sidebar          | Frontend + Plugin | Feature |

The moderation bot should reuse the same moderation-profile-based audit surface as human moderators. That means its reports should show up on the bot's mod profile page, using the existing mod profile route and history views rather than a separate bot-only audit UI.

### Suspended Bots

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

### Auto-Moderation Bot Plugin

**Current State:**

- ❌ Not implemented
- Plugin system exists and is already capable of channel opt-in, bot user provisioning, and pipeline-style execution, so this should be built as a plugin feature rather than a bespoke moderation subsystem
- First version should only report content and create issues for human review; it should not archive or suspend automatically

#### Backend Tasks

| Task                                                                                                                                                  | Location          | Type    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| Create an experimental moderation bot plugin in `/Users/catherineluse/gennit/gennit-nuxt/multiforum-plugins` with configurable scope mode             | Frontend + Plugin | Feature |
| Define plugin schema for a report-only moderation bot                                                                                                 | Backend           | Design  |
| Create `ModerationBotPlugin` type or equivalent report-only plugin model                                                                              | Backend           | Feature |
| Create bot user for automated moderation                                                                                                              | Backend           | Feature |
| Ensure the content moderation bot acts through a `ModerationProfile`, so its reports and actions appear on a normal mod profile page for auditability | Backend + Plugin  | Feature |
| Implement report-only issue creation based on rule violations                                                                                         | Backend           | Feature |
| Have the bot leave issue-linked/report-linked comments that clearly indicate automated reporting                                                      | Backend           | Feature |

#### Frontend Tasks

| Task                                                                                                                                                             | Location          | Type          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------- |
| Add the experimental moderation bot plugin to channel settings with configurable scope mode                                                                      | Frontend          | Feature       |
| Configure which rules trigger auto-moderation                                                                                                                    | Frontend          | Feature       |
| Display bot comments with clear "automated" indicator                                                                                                            | Frontend          | Feature       |
| Add README/docs explaining that this is an experimental proof of concept that only reports for human review today and may later expand to actions like archiving | Frontend + Plugin | Documentation |
| Support scope configuration in the plugin UI so the same plugin can run in channel-scoped or server-scoped mode                                                  | Frontend          | Feature       |

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

## Verification Guide

This section contains detailed step-by-step instructions for manually verifying moderation features. Each item includes prerequisites, test steps, and expected outcomes.

### User Suspension Verification

#### Verify Server-Scoped Suspended Users Cannot Create Forums

**Prerequisites:**
- A user account that is suspended at the server level (not just channel level)
- Admin access to create the suspension

**Test Steps:**
1. Log in as an admin
2. Navigate to `/admin/suspended-users`
3. If no server-suspended user exists, create one:
   - Find an issue related to a user
   - Use the "Suspend User" action with server scope
4. Log out and log in as the suspended user
5. Navigate to the forum creation page (`/forums/create` or similar)
6. Attempt to create a new forum

**Expected Outcome:**
- The forum creation should be blocked
- User should see a suspension notice explaining why they cannot create forums
- The notice should link to the related issue

#### Verify Emoji Reactions Are Blocked for Suspended Users

**Prerequisites:**
- A suspended user account (channel or server scope)
- A discussion or comment with emoji reactions enabled

**Test Steps:**
1. Log in as a suspended user
2. Navigate to a discussion detail page
3. Attempt to add an emoji reaction to the discussion
4. Navigate to a comment and attempt to add an emoji reaction

**Expected Outcome:**
- Emoji reaction buttons should be disabled or hidden
- If clicked, a suspension notice should appear
- No emoji should be added to the content

#### Verify Blocked-Action Notifications for Suspended Users

**Prerequisites:**
- A suspended user account
- Suspension notification preferences enabled (default)

**Test Steps:**
1. Log in as a suspended user
2. Attempt to create a discussion
3. Attempt to create a comment
4. Attempt to create an event
5. Check the notification area after each blocked action

**Expected Outcome:**
- Each blocked action should trigger a notification
- Notification should include:
  - The action that was blocked
  - Link to the related issue
  - Suspension expiration date (if not indefinite)
- User can opt out of these notifications in account settings

#### Verify Suspension Expiration and Automatic Cleanup

**Prerequisites:**
- Create a time-limited suspension (e.g., 1 minute for testing, or use a past date)
- Access to modify suspension dates in the database (for testing)

**Test Steps:**
1. Log in as an admin and create a time-limited suspension for a test user
2. Log in as the suspended user and confirm actions are blocked
3. Wait for the suspension to expire (or manually set `suspendedUntil` to a past date)
4. Trigger a permission check (attempt any blocked action)
5. Verify the action is now allowed

**Expected Outcome:**
- Before expiry: Actions are blocked with suspension notice
- After expiry: Actions are allowed without needing to refresh or re-login
- The expired suspension should be automatically cleaned up from the active list

#### Verify Unsuspension Recovery

**Prerequisites:**
- A currently suspended user
- Admin access to unsuspend

**Test Steps:**
1. Log in as the suspended user in one browser/tab
2. Confirm actions are blocked
3. In another browser/tab, log in as admin
4. Navigate to the issue and unsuspend the user
5. Back in the suspended user's session, attempt the previously blocked action

**Expected Outcome:**
- Actions should be immediately re-enabled
- No page refresh should be required
- No stale "you are suspended" messages should appear

---

### Moderator Suspension Verification

#### Verify Suspended Mod Sees No Mod UI Elements

**Prerequisites:**
- A mod profile that is suspended (channel or server scope)
- The suspended mod should have the user account logged in

**Test Steps:**
1. Log in as a user whose mod profile is suspended
2. Navigate to a discussion in a channel where the mod profile was active
3. Check the comment headers for moderation action buttons
4. Check the discussion header for moderation actions
5. Navigate to the channel's issue list

**Expected Outcome:**
- No "Archive", "Report", or other mod actions should appear on comments
- No mod actions should appear on discussions or events
- The issue list may still be visible but mod actions within should be disabled

#### Verify Suspended Mod Cannot Act on Issue Detail Page

**Prerequisites:**
- A suspended mod profile
- An open issue in a channel where the mod was active

**Test Steps:**
1. Log in as the user with the suspended mod profile
2. Navigate to an issue detail page (`/forums/[forumId]/issues/[issueNumber]`)
3. Attempt to:
   - Add a comment to the issue
   - Close the issue
   - Lock the issue
   - Suspend the reported user

**Expected Outcome:**
- Issue comment form should be disabled with a suspension notice
- All moderation action buttons should be disabled
- Attempting any action should show a clear message about the mod suspension

#### Verify Issue Page Editing Is Disabled for Suspended Mods

**Prerequisites:**
- A suspended mod profile
- An issue that the mod previously created or can edit

**Test Steps:**
1. Log in as the user with the suspended mod profile
2. Navigate to an issue they authored
3. Look for edit controls (title edit, body edit)
4. Attempt to modify the issue

**Expected Outcome:**
- Edit buttons should be disabled or hidden
- If accessed directly, edits should be rejected
- A suspension notice should explain why editing is blocked

#### Verify Mod Suspension Does Not Affect User Permissions

**Prerequisites:**
- A user account with a suspended mod profile
- The user account itself should NOT be suspended

**Test Steps:**
1. Log in as the user with the suspended mod profile
2. Navigate to a discussion
3. Create a new comment as a regular user
4. Upvote a discussion
5. Create a new discussion
6. Add emoji reactions

**Expected Outcome:**
- All regular user actions should work normally
- The suspension only affects moderation capabilities
- User content creation, reactions, and upvotes should succeed

#### Verify Suspended Mod Can Still Post as User

**Prerequisites:**
- A user account with a suspended mod profile

**Test Steps:**
1. Log in as the user with the suspended mod profile
2. Navigate to any discussion
3. Write and submit a comment
4. Verify the comment appears with the user's username (not mod profile)

**Expected Outcome:**
- Comment should be created successfully
- Comment should show the username, not the mod profile name
- No suspension errors should appear for user-level actions

#### Verify Mod Actions Re-Enable After Unsuspension

**Prerequisites:**
- A currently suspended mod profile
- Admin access to unsuspend

**Test Steps:**
1. Log in as the user with the suspended mod profile
2. Confirm mod actions are disabled on an issue page
3. In another session, log in as admin and unsuspend the mod
4. Return to the suspended user's session
5. Refresh the issue page
6. Attempt mod actions (add issue comment, archive content, etc.)

**Expected Outcome:**
- After unsuspension, mod actions should be re-enabled
- Issue comment form should be active
- Archive/report buttons should be clickable and functional

#### Verify Mod Actions Re-Enable After Suspension Expiry

**Prerequisites:**
- A mod profile with a time-limited suspension
- Ability to set suspension expiry to a past time for testing

**Test Steps:**
1. Create a time-limited mod suspension
2. Log in as the suspended mod and confirm actions are blocked
3. Wait for expiry or manually set `suspendedUntil` to a past date
4. Trigger a permission check by attempting a mod action

**Expected Outcome:**
- After expiry, mod actions should automatically re-enable
- No manual unsuspension should be required
- The expired suspension should be cleaned up from active lists

#### Verify Suspended-Mod Copy Communicates Account Separation

**Prerequisites:**
- A suspended mod profile

**Test Steps:**
1. Log in as the user with the suspended mod profile
2. Navigate to the issue that caused the suspension
3. Read the suspension notice
4. Navigate to account settings or profile

**Expected Outcome:**
- Suspension notices should clearly state that the **mod profile** is suspended
- Notices should explain that the user account remains active
- No confusing language suggesting the user is banned entirely

---

### Server Admin/Mod Invite Workflow Verification

#### Verify Server Admin Invite Workflow

**Prerequisites:**
- Admin access to the server
- A user account to invite as admin

**Test Steps:**
1. Log in as an existing server admin
2. Navigate to `/admin/roles`
3. Find the Server Membership section
4. Enter a username in the "Server Admins" invite field
5. Click "Invite"
6. Verify the user appears in "Pending Invites" with a (pending) label
7. Log in as the invited user
8. Navigate to `/admin/accept-admin-invite`
9. Accept the invitation
10. Verify the user now appears in "Current Admins" list

**Expected Outcome:**
- Invite creates a pending state, not immediate admin access
- Invited user must explicitly accept
- After acceptance, user has full admin privileges
- Pending invite can be cancelled before acceptance

#### Verify Server Mod Invite Workflow

**Prerequisites:**
- Admin access to the server
- A user account with an existing mod profile to invite

**Test Steps:**
1. Log in as a server admin
2. Navigate to `/admin/roles`
3. Find the Server Membership section
4. Enter a username in the "Server Moderators" invite field
5. Click "Invite"
6. Verify the user appears in "Pending Invites"
7. Log in as the invited user (who has a mod profile)
8. Navigate to `/admin/accept-mod-invite`
9. Accept the invitation
10. Verify the mod profile now appears in "Current Moderators" list

**Expected Outcome:**
- Invite creates a pending state
- User must have a mod profile to accept (page shows error if not)
- After acceptance, mod profile has server-wide moderation privileges

#### Verify Accept Pages Handle Edge Cases

**Prerequisites:**
- Access to the accept invite pages

**Test Steps:**
1. **Not logged in:** Navigate to `/admin/accept-admin-invite` without being logged in
2. **No pending invite:** Log in as a user with no pending invite and visit the page
3. **No mod profile:** Log in as a user without a mod profile and visit `/admin/accept-mod-invite`

**Expected Outcome:**
- Not logged in: Shows "Sign In Required" message
- No pending invite: Shows error or "no invitation found" message
- No mod profile: Shows message explaining a mod profile is required, with link to create one

#### Verify Cancel Invite Functionality

**Prerequisites:**
- A pending admin or mod invite

**Test Steps:**
1. Log in as a server admin
2. Navigate to `/admin/roles`
3. Find a pending invite in the list
4. Click "Cancel" next to the pending invite
5. Verify the invite is removed from the pending list
6. Have the previously invited user try to accept

**Expected Outcome:**
- Cancel removes the pending invite immediately
- The invited user can no longer accept (no invitation found)

---

### Badge and Label Verification

#### Verify Server Admin Badge on Comments

**Prerequisites:**
- A user who is a server admin (via ServerConfig.Admins relationship)
- Comments authored by that user

**Test Steps:**
1. Navigate to a discussion with comments from a server admin
2. Look at the comment header/author area
3. Check for "Server Admin" badge or label

**Expected Outcome:**
- Server admins should have a visible "Server Admin" badge
- Badge should appear consistently across all comment views
- Badge should not appear for non-admins

#### Verify Server Mod Badge on Comments

**Prerequisites:**
- A mod profile that is a server moderator (via ServerConfig.Moderators relationship)
- Comments authored by that mod profile

**Test Steps:**
1. Navigate to a discussion with comments from a server mod (using their mod profile)
2. Look at the comment header/author area
3. Check for "Server Mod" badge or label

**Expected Outcome:**
- Server mods should have a visible "Server Mod" badge
- Badge should appear on comments made with the mod profile
- Badge should not appear for channel-only mods

#### Verify Badge Display Across Surfaces

**Prerequisites:**
- Users with server admin/mod status

**Test Steps:**
1. Check badge display on:
   - Discussion comment sections
   - Event comment sections
   - Issue activity feeds
   - User profile pages
   - Mod profile pages

**Expected Outcome:**
- Badges should display consistently across all surfaces
- No surfaces should be missing badge information
- Badge styling should be consistent

---

### Reporting Workflow Verification

#### Verify Reporting from Mod Profile Comments Page

**Prerequisites:**
- A mod profile with comments
- Permission to report mod comments

**Test Steps:**
1. Navigate to `/mod/[modId]/comments`
2. Find a comment authored by the mod profile
3. Click the report action (flag icon or context menu)
4. Fill out the report modal with broken rules
5. Submit the report

**Expected Outcome:**
- Report modal should open with correct context
- Submitting should create a new issue
- Issue should be linked to the reported comment
- Success notification should appear

#### Verify Reporting from Issue Activity Feed

**Prerequisites:**
- An issue with activity feed comments
- Permission to report

**Test Steps:**
1. Navigate to an issue detail page
2. Find a comment in the activity feed
3. Open the context menu (three dots)
4. Click "Report Mod Comment"
5. Complete and submit the report

**Expected Outcome:**
- Report modal opens with the correct comment context
- New issue is created for the report
- Activity feed updates appropriately

#### Verify Suspend Mod Option in Issue Comment Context Menu

**Prerequisites:**
- An issue that targets a mod profile (`relatedModProfileName` is set)
- Permission to suspend mods

**Test Steps:**
1. Navigate to an issue that targets a mod profile
2. Find a comment in the activity feed authored by that mod
3. Open the context menu (three dots)
4. Look for "Suspend Mod" option
5. Click it and verify the suspend modal opens

**Expected Outcome:**
- "Suspend Mod" option appears only when:
  - Issue has a related mod profile
  - Current user has permission to suspend
- Clicking opens the suspend modal pre-filled with issue context
- Suspension is linked to the issue

#### Verify SuspendModButton in Issue Related Content Header

**Prerequisites:**
- An issue that targets a mod profile
- Permission to suspend mods

**Test Steps:**
1. Navigate to an issue that has `relatedModProfileName` set
2. Look at the issue header/related content area
3. Find the SuspendModButton

**Expected Outcome:**
- Button should be visible for authorized users
- Button should be disabled if mod is already suspended
- Clicking should open the suspend modal

---

### Admin Pages Verification

#### Review Server Suspended Users Page

**Prerequisites:**
- At least one server-suspended user (or create one for testing)

**Test Steps:**
1. Log in as a server admin
2. Navigate to `/admin/suspended-users`
3. Review the page layout and information displayed
4. Check for:
   - List of suspended users with usernames
   - Suspension dates and durations
   - Links to related issues
   - Unsuspend actions

**Expected Outcome:**
- Page should display all server-suspended users
- Each entry should show:
  - Username and profile picture
  - When suspension was created
  - Expiration date (or "Indefinite")
  - Link to the related issue
- Unsuspend action should work correctly
- Empty state should show appropriate message when no suspensions exist

#### Review Server Suspended Mods Page

**Prerequisites:**
- At least one server-suspended mod (or create one for testing)

**Test Steps:**
1. Log in as a server admin
2. Navigate to `/admin/suspended-mods`
3. Review the page layout and information displayed
4. Check for:
   - List of suspended mod profiles
   - Suspension dates and durations
   - Links to related issues
   - Unsuspend actions

**Expected Outcome:**
- Page should display all server-suspended mods
- Each entry should show:
  - Mod profile name
  - Associated username
  - When suspension was created
  - Expiration date (or "Indefinite")
  - Link to the related issue
- Unsuspend action should work correctly
- Clear distinction from user suspensions

#### Validate Server Membership Editor UX

**Prerequisites:**
- Server admin access
- Several admins and mods to display

**Test Steps:**
1. Navigate to `/admin/roles`
2. Review the Server Membership section
3. Check the layout with:
   - Multiple current admins
   - Multiple current mods
   - Multiple pending invites
4. Test the invite and remove functionality
5. Check error handling for invalid usernames

**Expected Outcome:**
- Lists should be scrollable/paginated for large numbers
- Current members and pending invites should be clearly separated
- Remove/Cancel actions should have confirmation or be easily reversible
- Error messages should be clear for invalid usernames or failed operations

---

### Suspension State and Notification Verification

#### Verify Suspension Notification Content

**Prerequisites:**
- A suspended user or mod

**Test Steps:**
1. Log in as the suspended account
2. Trigger a blocked action
3. Examine the notification that appears

**Expected Outcome:**
- Notification should include:
  - Clear explanation of what action was blocked
  - Link to the related issue
  - Suspension expiration date (if applicable)
  - Information about who to contact for appeals

#### Verify Notification Opt-Out Preference

**Prerequisites:**
- A suspended user account
- Access to account settings

**Test Steps:**
1. Log in as the suspended user
2. Navigate to account settings
3. Find suspension notification preferences
4. Disable suspension block notifications
5. Trigger a blocked action

**Expected Outcome:**
- Setting should auto-save
- With notifications disabled, blocked actions should fail silently (or with minimal UI feedback)
- Re-enabling should restore notification behavior

---

### Backend Unit Test Verification

These items should be verified through existing or new unit tests rather than manual testing.

#### Verify `canCreateChannel` Enforces Server Permission

**Location:** Backend rule tests

**What to verify:**
- `canCreateChannel` calls and awaits `hasServerPermission()`
- Server-suspended users are blocked from forum creation
- Non-suspended users can create forums

#### Verify `isOriginalPosterSuspended` Query

**Location:** Backend tests

**What to verify:**
- Returns correct suspension state for user targets
- Returns correct suspension state for mod targets
- Agrees with `getActiveSuspension()` results

#### Verify `isExpiredSuspension()` Logic

**Location:** Backend tests

**What to verify:**
- Returns true for past `suspendedUntil` dates
- Returns false for future dates
- Returns false for indefinite suspensions (`suspendedIndefinitely: true`)
- Handles timezone edge cases

#### Verify `disconnectExpiredSuspensions()` Cleanup

**Location:** Backend tests

**What to verify:**
- No-op when no expired suspensions exist
- Correctly disconnects expired user suspensions
- Correctly disconnects expired mod suspensions
- Handles mixed expired/active suspensions

#### Verify Suspension Target Resolution

**Location:** Backend tests

**What to verify:**
- Correctly resolves targets from discussion-backed issues
- Correctly resolves targets from event-backed issues
- Correctly resolves targets from comment-backed issues
- Handles server-scoped issues (no channel)

---

### Bot Verification (Future)

These items are for future verification once bot suspension is implemented.

#### Verify Suspended Bot Cannot Act

**Prerequisites:** (Future - requires bot suspension implementation)

**Test Steps:**
1. Suspend a bot account through the report -> issue -> suspend workflow
2. Trigger the bot (e.g., tag it in a comment)
3. Verify the bot does not respond

**Expected Outcome:**
- Suspended bots should not execute any actions
- Bot suspension should be visible in admin UI
- Related issue should be linked

#### Verify Bot Context Payload

**Prerequisites:** (Future - requires bot implementation)

**Test Steps:**
1. Enable a bot in a channel
2. Trigger the bot with a tagged comment
3. Check the bot's received context payload

**Expected Outcome:**
- Payload should include forum metadata
- Payload should include discussion context
- Payload should include parent thread information
- Prompt debug logs should be written

---

## Cypress Test Backlog

These items should eventually have automated E2E coverage but can be manually verified using the instructions above.

| Test | Priority | Manual Section Reference |
| ---- | -------- | ------------------------ |
| Server-level suspended user forum-creation block | High | User Suspension: Cannot Create Forums |
| Suspended user emoji block | High | User Suspension: Emoji Reactions Blocked |
| Expired suspension cleanup and recovery | High | User Suspension: Expiration and Cleanup |
| Unsuspension immediate recovery | High | User Suspension: Unsuspension Recovery |
| Suspended mod sees no mod UI | High | Mod Suspension: No Mod UI Elements |
| Suspended mod cannot act on issues | High | Mod Suspension: Cannot Act on Issue Detail |
| Mod suspension doesn't affect user actions | High | Mod Suspension: Does Not Affect User Permissions |
| Mod actions re-enable after unsuspension | High | Mod Suspension: Re-Enable After Unsuspension |
| Server admin badge on comments | Medium | Badge: Server Admin Badge |
| Server mod badge on comments | Medium | Badge: Server Mod Badge |
| Server admin invite workflow | Medium | Invite: Server Admin Workflow |
| Server mod invite workflow | Medium | Invite: Server Mod Workflow |
