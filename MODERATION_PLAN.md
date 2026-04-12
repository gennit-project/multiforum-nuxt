# Moderation Features: Current State vs Roadmap Plan

## Wiki Revision Moderation Roadmap

This section tracks the wiki/discussion/comment revision-history work from the current roadmap. Most items still need coding changes. Completed items are listed here so follow-up work can build on the right foundation.

### Completed Foundation Work

| Task                                        | Status | Notes                                                                                                                                 |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Normalize shared revision diff rendering    | Done   | Added shared revision diff content and updated wiki, discussion, and comment revision modals to use it.                               |
| Share revision pairing primitives           | Done   | Added shared revision history pairing helpers and applied them to comment/wiki edit dropdowns plus wiki revision pages.               |
| Consolidate wiki revision detail diff view  | Done   | Replaced the standalone wiki revision detail `v-code-diff` implementation with the shared revision diff content.                      |
| Use danger-action revision redaction UI     | Done   | Comment, discussion, and wiki revision modals use a neutral primary action and expose redaction as an authorized danger action.       |
| Add wiki revision diff selector             | Done   | Wiki revision diff pages can switch compared revisions without returning to the revision history list.                                |
| Add wiki edit reasons                       | Done   | Wiki create/edit forms write edit reasons and wiki revision queries/pages display `editReason`.                                       |
| Gate backend wiki edits for suspensions     | Done   | Backend wiki page create/update, child page creation, and wiki home page update flows use channel permission suspension checks.       |
| Gate frontend wiki edits for suspensions    | Done   | Wiki create/edit entry points and direct forms now surface `SuspensionNotice` and block suspended users before mutation submit.       |
| Add wiki revision report UI                 | Done   | Wiki revision diff pages can submit reports through the shared broken-rules modal and `reportWikiEdit` mutation.                      |
| Render wiki report targets in moderation UI | Done   | Issue queries and moderation surfaces now include wiki page/revision target fields and label wiki edit reports in issue lists/detail. |
| Add wiki delete permission gates            | Done   | Wiki page deletion allows the original page author, server admin, or moderators with the dedicated `canDeleteWiki` permission.        |
| Add wiki edits to user profiles             | Done   | User profiles include a wiki edits count, tab, and `/u/[username]/wiki-edits` page with channel filtering.                            |

### Remaining Coding Changes

| Task                                                          | Location           | Type    | Notes                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Add wiki edits to contribution charts                         | Backend + Frontend | Feature | Extend `GET_USER_CONTRIBUTIONS`, backend contribution resolver logic, and `UserContributionChart` so wiki edits appear in contribution history.                    |

---

## Remaining Implementation Work

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

### Wiki Revision Moderation Verification

#### Verify Wiki Revision Redaction Uses a Danger Action

**Prerequisites:**

- A wiki page with at least two revisions
- A user who is either the wiki page original author or a moderator/admin with revision redaction permission

**Test Steps:**

1. Navigate to the wiki page revision history
2. Open a revision diff modal
3. Check the modal footer actions
4. Redact a revision with the authorized danger action
5. Reload the revision history and open the same diff again

**Expected Outcome:**

- The primary action should be neutral, such as "Close"
- Redaction should appear as a danger/destructive action only when authorized
- The redacted revision remains in chronological revision history
- The redacted body displays as `[deleted]`

#### Verify Wiki Revision Diff Selector

**Prerequisites:**

- A wiki page with three or more revisions

**Test Steps:**

1. Navigate to `/forums/[forumId]/wiki/revisions/[slug]`
2. Open a revision diff page
3. Use the revision selector dropdown to choose a different revision
4. Confirm the page updates to the selected comparison
5. Navigate directly to the updated diff URL and refresh

**Expected Outcome:**

- The dropdown lists available revisions in a usable order
- Selecting a revision updates the compared versions without returning to the revision list
- The URL and rendered diff stay in sync after refresh

#### Verify Wiki Edit Reasons

**Prerequisites:**

- Permission to create and edit wiki pages in a channel

**Test Steps:**

1. Create a wiki home page with an edit reason
2. Edit the wiki home page with a different edit reason
3. Create a child wiki page with an edit reason
4. Edit the child wiki page with another edit reason
5. Open each page's revision history and revision diff views

**Expected Outcome:**

- Wiki create/edit forms show an "Edit reason" field
- Submitted edit reasons are saved on the corresponding revision data
- Revision history and diff views display wiki edit reasons consistently with discussion/comment revisions

#### Verify Backend Blocks Suspended Users from Wiki Edits

**Prerequisites:**

- A user suspended in a channel
- A wiki-enabled channel with an existing home page
- Access to the related issue used for the suspension

**Test Steps:**

1. Log in as the suspended user
2. Attempt to create a wiki home page through GraphQL or the UI if the page is available
3. Attempt to edit an existing wiki home page
4. Attempt to create a child wiki page
5. Attempt to edit an existing child wiki page

**Expected Outcome:**

- Backend mutations for wiki create/update should be rejected for the suspended user
- The same channel suspension notification behavior used by discussions/comments should apply
- The related suspension issue should be linked in any generated blocked-action notification
- Non-wiki `updateChannels` mutations should preserve their existing behavior

#### Verify Frontend Blocks Suspended Users from Wiki Edit UI

**Prerequisites:**

- A user suspended in a wiki-enabled channel
- A wiki home page and at least one child wiki page

**Test Steps:**

1. Log in as the suspended user
2. Navigate to `/forums/[forumId]/wiki`
3. Check the "Add Page", "Edit Wiki", and bottom "Edit this page" actions
4. Navigate directly to `/forums/[forumId]/wiki/create`
5. Navigate directly to `/forums/[forumId]/wiki/create-child`
6. Navigate directly to `/forums/[forumId]/wiki/edit/home`
7. Navigate directly to `/forums/[forumId]/wiki/edit/[childSlug]`

**Expected Outcome:**

- Wiki create/edit entry point buttons should be disabled for the suspended user
- A `SuspensionNotice` should explain that the user cannot edit wiki pages in the forum
- Direct create/edit pages should show the same notice and hide the form
- Unsuspended authenticated users should still see working wiki create/edit controls

#### Verify Wiki Revision Report UI

**Prerequisites:**

- A moderator account with permission to report in the wiki page channel
- A wiki page with at least one revision

**Test Steps:**

1. Navigate to `/forums/[forumId]/wiki/revisions/diff/[slug]/[revisionId]`
2. Click "Report Edit"
3. Select at least one broken forum or server rule
4. Add optional report context
5. Submit the report
6. Navigate to the channel issue list and open the created issue

**Expected Outcome:**

- The shared broken-rules report modal should open with "Report Wiki Edit"
- Submitting should call `reportWikiEdit` with the wiki page id, revision id, selected rules, report text, and channel id
- A success notification should appear after submission
- The resulting moderation issue should target the wiki page/revision and identify the wiki edit author when available
- The channel issue list should label the issue as a wiki edit report
- The issue detail page should show the related content type as a wiki edit and include the related wiki page/revision identifiers

#### Verify Wiki Delete Permission Gates

**Prerequisites:**

- A wiki-enabled channel with a wiki page and at least one revision
- The wiki page's original author account
- A moderator account with `canDeleteWiki`
- A moderator account without `canDeleteWiki`

**Test Steps:**

1. As the original wiki page author, delete a wiki page through the app or GraphQL mutation.
2. As the moderator with `canDeleteWiki`, delete another wiki page or redact a wiki revision.
3. As the moderator without `canDeleteWiki`, attempt the same wiki page deletion or wiki revision redaction.
4. As a server admin, delete a wiki page.

**Expected Outcome:**

- The original author can delete their own wiki page.
- A moderator with `canDeleteWiki` can delete wiki pages and redact wiki revisions in the channel.
- A moderator without `canDeleteWiki` is blocked from wiki page deletion and wiki revision redaction.
- A server admin can delete wiki pages.
- Wiki revision redaction still replaces the revision body with `[deleted]` instead of hard-deleting the revision.

#### Verify Wiki Edits User Profile Tab

**Prerequisites:**

- A user account that authored at least one wiki revision
- At least one wiki edit in a channel that can be selected in the profile channel filter

**Test Steps:**

1. Navigate to `/u/[username]`.
2. Confirm the profile redirects to `/u/[username]/comments`.
3. Open the "Wiki Edits" tab.
4. Confirm the count on the tab matches the user's authored wiki revision count.
5. Use the profile channel filter to select a channel where the user has wiki edits.
6. Open a wiki page link and a revision link from the wiki edits list.

**Expected Outcome:**

- The "Wiki Edits" tab appears alongside comments, discussions, downloads, events, images, and albums.
- `/u/[username]/wiki-edits` lists the user's wiki edits with page title, channel, timestamp, and edit reason when present.
- Channel filtering narrows the wiki edit list to selected channels.
- Wiki page links route to `/forums/[forumId]/wiki/[slug]`.
- Revision links route to `/forums/[forumId]/wiki/revisions/diff/[slug]/[revisionId]`.

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

#### Verify Revision Redaction Preserves History

**Location:** Backend resolver tests and manual GraphQL checks

**What to verify:**

- `deleteCommentRevision`, `deleteDiscussionBodyRevision`, and `deleteWikiRevision` update the `TextVersion.body` to `[deleted]`
- Redaction does not delete the `TextVersion` node
- Redaction preserves `id`, `createdAt`, `updatedAt`, `editReason`, and `Author` data needed by revision history views
- Re-redacting an already-redacted revision is a no-op and still returns the revision
- Direct generated `deleteTextVersions` is denied by GraphQL Shield permissions

#### Verify Revision Redaction Permission Gates

**Location:** Backend resolver tests and manual GraphQL checks

**What to verify:**

- A comment author can redact their own comment revision
- A discussion OP can redact their own discussion body revision
- A wiki page original author can redact a wiki revision
- A moderator with `canEditComments` can redact comment revisions in the relevant channel
- A moderator with `canEditDiscussions` can redact discussion body revisions in the relevant channel
- A moderator with `canEditDiscussions` can redact wiki revisions until a dedicated wiki delete permission exists
- A server admin can redact any supported revision type
- Non-authors without the relevant mod permission are rejected
- Calling a mismatched mutation, such as `deleteCommentRevision` with a wiki revision id, is rejected

---

### Beta Bot Plugin Verification

These items verify the beta reader bot plugin configuration and display.

#### Verify API Key Configuration for Beta Bot Plugin

**Prerequisites:**

- Server admin access
- Beta reader bot plugin installed

**Test Steps:**

1. Log in as a server admin
2. Navigate to `/admin/settings/plugins/beta-reader-bot`
3. Find the Secrets section
4. Enter an OpenAI API key
5. Save the configuration
6. Verify the secret status indicator shows "Valid" or "Set"

**Expected Outcome:**

- Secret field should accept the API key
- Status indicator should update after validation
- Key should be stored securely (not visible after save)

#### Verify Channel Settings Update Beta Bot Profiles

**Prerequisites:**

- Server admin has configured the beta bot with a bot name
- Channel admin access

**Test Steps:**

1. Log in as a channel admin
2. Navigate to `/forums/[forumId]/edit/plugins/beta-reader-bot`
3. Find the Bot Profiles section
4. Edit an existing profile's display label
5. Edit the profile's system prompt
6. Save changes
7. Verify changes persist on page reload

**Expected Outcome:**

- Display label and prompt should be editable
- Profile ID should be read-only (immutable after creation)
- Changes should save successfully
- Server-level profiles should appear as read-only references

#### Verify All 4 Beta Bot Identities in Sidebar

**Prerequisites:**

- Beta reader bot enabled in a channel
- Default profiles configured (developmental-editor, line-editor, thriller-fan, character-driven-fantasy-fan)

**Test Steps:**

1. Navigate to a channel with the beta bot enabled
2. Look at the channel sidebar
3. Find the "Bots" section
4. Check for all 4 bot profiles

**Expected Outcome:**

- Sidebar should show a "Bots" section
- All 4 profiles should be listed with:
  - Display name (or profile label)
  - Invoke command format (`/bot/{handle}`)
- Deprecated bots should show an "Inactive" badge

#### Verify Context-Rich Tagged Invocation

**Prerequisites:**

- Beta bot configured with API key
- A discussion with some content

**Test Steps:**

1. Navigate to a discussion in a channel with the beta bot
2. Create a comment that tags a bot profile (e.g., `/bot/developmental-editor`)
3. Wait for the bot to respond
4. Check the bot's response for context awareness

**Expected Outcome:**

- Bot should respond within a reasonable time
- Response should reference the discussion context (title, body, prior comments)
- Response should follow the profile's system prompt personality
- Prompt debug logs should be written (if enabled)

---

### Bot Suspension Verification

These steps verify the bot suspension workflow implemented for bots (User records with `isBot: true`).

#### Verify Bot Badge Appears in Issue List

**Prerequisites:**

- A channel with a bot enabled
- Content created by the bot (e.g., a bot comment)
- A report filed against the bot's content

**Test Steps:**

1. Log in as a mod or admin
2. Navigate to the channel's issue list (`/forums/[forumId]/issues`)
3. Find an issue that targets bot-authored content
4. Look for the "Bot" badge on the issue list item

**Expected Outcome:**

- Issue list item should display a "🤖 Bot" badge in blue
- Badge should appear for issues where `relatedUsername` starts with `bot-`
- Badge helps moderators identify bot-related issues at a glance

#### Verify Suspend Bot Button Label

**Prerequisites:**

- A mod profile with suspension permissions
- An issue targeting bot-authored content

**Test Steps:**

1. Log in as a mod with suspension permissions
2. Navigate to an issue that targets a bot's content
3. Look at the suspension button in the moderation actions

**Expected Outcome:**

- Button should display "Suspend Bot" instead of "Suspend Author (Includes Archive)"
- Clicking should open the suspension modal with bot-appropriate language
- Unsuspend button should display "Unsuspend Bot" instead of "Unsuspend Author"

#### Verify Suspended Bot Cannot Comment

**Prerequisites:**

- A bot that has been suspended via the suspension workflow
- The channel where the bot was active

**Test Steps:**

1. Log in as an admin and suspend a bot through an issue
2. In the channel, tag the suspended bot to trigger it (e.g., `/bot/profile-name`)
3. Wait for the bot response timeout
4. Check server logs for suspension block message

**Expected Outcome:**

- Suspended bot should NOT create any comments
- Server logs should show: `Bot "bot-{channel}-{name}-{id}" is suspended - action blocked`
- The bot remains silent rather than posting an error message

#### Verify Suspended Bot Cannot Report

**Prerequisites:**

- A bot with reporting capabilities that has been suspended
- Content that would normally trigger the bot to report

**Test Steps:**

1. Suspend a bot that has reporting capabilities
2. Trigger content that would normally cause the bot to file a report
3. Verify no report is created

**Expected Outcome:**

- Suspended bot should NOT create any reports
- Server logs should show the suspension block message
- No new issues should be created by the suspended bot

#### Verify Bot Badge in Suspended Users List

**Prerequisites:**

- At least one suspended bot
- Server admin access

**Test Steps:**

1. Log in as a server admin
2. Navigate to `/admin/suspended-users`
3. Find the suspended bot in the list

**Expected Outcome:**

- Suspended bot should appear in the list with other suspended users
- A "🤖 Bot" badge should appear next to the bot's username
- Badge styling should match the issue list badge (blue background)
- All standard suspension info should display (dates, reason, linked issue)

#### Verify Unsuspending a Bot Re-Enables Actions

**Prerequisites:**

- A currently suspended bot
- Admin access to unsuspend

**Test Steps:**

1. Log in as an admin
2. Navigate to the issue that caused the bot suspension
3. Click "Unsuspend Bot"
4. Confirm the unsuspension
5. Trigger the bot in the channel

**Expected Outcome:**

- Unsuspend action should succeed
- Bot should respond normally when triggered
- No suspension block messages in server logs
- Bot appears active in all relevant UI surfaces

#### Verify Bot Suspension Badge in Channel Sidebar

**Prerequisites:**

- A channel with a bot enabled
- The bot has been suspended via the suspension workflow

**Test Steps:**

1. Navigate to any page within the channel (e.g., discussions list)
2. Look at the channel sidebar on the right
3. Find the "Bots" section
4. Look for the suspended bot in the list

**Expected Outcome:**

- The suspended bot should display a red "Suspended" badge
- The badge should appear instead of the normal "(active)" indicator
- Non-suspended bots should show as "(active)" or "Inactive" (if deprecated)
- Suspended badge styling: red background with white text

#### Verify Bot Suspension Badge in Channel Settings

**Prerequisites:**

- A channel with a bot plugin enabled
- At least one bot profile that has been suspended
- Channel admin access to view plugin settings

**Test Steps:**

1. Log in as a channel admin
2. Navigate to `/forums/[forumId]/edit/plugins/[pluginId]` (e.g., beta-reader-bot)
3. Look at the "Bot Users Preview" section
4. Find the suspended bot in the "Existing Bots" list

**Expected Outcome:**

- Suspended bots should display:
  - Red ban icon (instead of green checkmark)
  - Red "Suspended" badge
- Non-suspended bots should display:
  - Green checkmark icon
  - "(active)" label
- Deprecated bots that are also suspended should show both "Suspended" and "(will be deprecated)" labels

#### Automated Verification

Run these from `/Users/catherineluse/gennit/gennit-backend`:

```bash
npm run tsc
npm test
```

Run these from `/Users/catherineluse/gennit/gennit-nuxt/wt-feature-moderation`:

```bash
npm run tsc
npm run test:unit:run
```

Expected outcome:

- Type checking succeeds in both repositories
- All backend tests pass (including `resolveIssueTarget.test.ts`)
- All frontend unit tests pass

---

### Channel Reporting and Locking Verification

#### Verify Channel Report Creates Server-Scoped Issue

**Prerequisites:**

- A mod profile (required to report channels)
- A channel to report

**Test Steps:**

1. Log in as a user with a mod profile
2. Navigate to a channel's About page (`/forums/[forumId]/about`)
3. Look for the "Server Moderation" section
4. Click the "Report Forum" button
5. Select one or more server rules that were violated
6. Add optional context text
7. Submit the report

**Expected Outcome:**

- Report modal should show server rules only (not channel rules)
- After submission, a server-scoped issue should be created
- Issue should appear in `/admin/channel-reports`
- Issue should have `relatedChannelUniqueName` set to the reported channel
- Issue should have `channelUniqueName` as null (server-scoped)
- Success notification should appear

#### Verify Channel Reports Page Displays Reports

**Prerequisites:**

- At least one channel report (or create one using the steps above)
- Server admin or mod access

**Test Steps:**

1. Log in as a server admin or mod
2. Navigate to `/admin/channel-reports`
3. Review the page layout and displayed information
4. Toggle the "Show open reports only" checkbox
5. Click "View" on a report to see the issue detail

**Expected Outcome:**

- Page should list all channel reports
- Each report should show:
  - Issue number
  - Channel name (linked to the channel)
  - Open/Closed status badge
  - Locked status badge (if channel is locked)
  - Reporter name and time
  - Report count
- Filter should work to show/hide closed reports
- "View" should navigate to the issue detail page
- "Lock"/"Unlock" buttons should appear based on channel state

#### Verify Lock Channel from Channel Reports Page

**Prerequisites:**

- A channel report for an unlocked channel
- Server mod with `canLockChannel` permission

**Test Steps:**

1. Log in as a server mod
2. Navigate to `/admin/channel-reports`
3. Find a report for an unlocked channel
4. Click the "Lock" button
5. Enter a reason in the lock dialog
6. Confirm the lock action

**Expected Outcome:**

- Lock dialog should open with channel name
- After confirming:
  - Channel should be marked as locked
  - "Locked" badge should appear on the report row
  - "Lock" button should change to "Unlock"
  - A moderation action should be added to the issue activity feed

#### Verify Unlock Channel from Channel Reports Page

**Prerequisites:**

- A locked channel with a report
- Server mod with `canLockChannel` permission

**Test Steps:**

1. Log in as a server mod
2. Navigate to `/admin/channel-reports`
3. Find a report for a locked channel
4. Click the "Unlock" button
5. Optionally enter a reason
6. Confirm the unlock action

**Expected Outcome:**

- Unlock dialog should open with channel name
- After confirming:
  - Channel should be unlocked
  - "Locked" badge should disappear
  - "Unlock" button should change to "Lock"
  - A moderation action should be added to the issue activity feed

#### Verify Locked Channel Banner Displays

**Prerequisites:**

- A locked channel

**Test Steps:**

1. Navigate to the locked channel (`/forums/[forumId]/discussions`)
2. Look for the locked banner at the top of the page
3. Check the banner content

**Expected Outcome:**

- Yellow/orange banner should appear below the header
- Banner should state "This forum is locked"
- Banner should show:
  - Lock reason (if provided)
  - Who locked it
  - When it was locked
- Banner should be visible on all channel pages (discussions, events, etc.)

#### Verify Locked Channel Blocks Content Creation

**Prerequisites:**

- A locked channel
- A regular user account

**Test Steps:**

1. Log in as a regular user
2. Navigate to the locked channel
3. Attempt to create a new discussion
4. Attempt to create a new event (if events are enabled)
5. Attempt to add a comment to an existing discussion

**Expected Outcome:**

- Create discussion should be blocked with an error message
- Create event should be blocked with an error message
- Create comment should be blocked with an error message
- The locked banner should explain why content creation is disabled

#### Verify Lock/Unlock from Channel About Page

**Prerequisites:**

- Server mod with `canLockChannel` permission
- A channel (locked or unlocked)

**Test Steps:**

1. Log in as a server mod
2. Navigate to a channel's About page (`/forums/[forumId]/about`)
3. Look for the "Server Moderation" section
4. Click "Lock Forum" (if unlocked) or "Unlock Forum" (if locked)
5. Complete the dialog and confirm

**Expected Outcome:**

- Lock/Unlock buttons should appear in the "Server Moderation" section
- Only one button should be visible based on current lock state
- After action:
  - Channel lock state should change
  - Button should toggle to the opposite action
  - Locked banner should appear/disappear accordingly

#### Verify Issue Detail Shows Related Channel

**Prerequisites:**

- A server-scoped issue with `relatedChannelUniqueName` set
- Server mod access

**Test Steps:**

1. Log in as a server mod
2. Navigate to a channel report issue (`/admin/issues/[issueNumber]`)
3. Look for the "Related Channel" section at the top of the issue

**Expected Outcome:**

- "Related Channel" section should appear
- Should show:
  - Channel name (linked to the channel)
  - Lock state badge (Locked/Active)
  - If locked: lock details (who, when, reason)
- Should have Lock/Unlock button for server mods with permission
- Clicking Lock/Unlock should work the same as other entry points

#### Verify Channel Lock Creates/Links Issue

**Prerequisites:**

- An unlocked channel with no existing reports
- Server mod with `canLockChannel` permission

**Test Steps:**

1. Log in as a server mod
2. Navigate to a channel's About page
3. Click "Lock Forum"
4. Enter a reason and confirm
5. Navigate to `/admin/channel-reports`

**Expected Outcome:**

- A new server-scoped issue should be created automatically
- Issue should appear in the channel reports list
- Issue title should indicate it's about the locked channel
- Issue activity feed should show the lock action

#### Verify Permission Checks for Channel Lock

**Prerequisites:**

- A regular user account (not a server mod)
- A channel mod account (not a server mod)
- A server mod account with `canLockChannel` permission

**Test Steps:**

1. Log in as a regular user
2. Navigate to a channel's About page
3. Check if Lock/Unlock buttons are visible (they should not be)
4. Log in as a channel mod (not server mod)
5. Navigate to a channel's About page
6. Check if Lock/Unlock buttons are visible (they should not be)
7. Log in as a server mod with `canLockChannel`
8. Navigate to a channel's About page
9. Check if Lock/Unlock buttons are visible (they should be)

**Expected Outcome:**

- Only server mods with `canLockChannel` permission should see lock/unlock buttons
- Regular users should not see the "Server Moderation" section
- Channel-only mods should not see the lock/unlock buttons

#### Verify Channel Admins Receive Lock Notification

**Prerequisites:**

- A channel with at least one admin
- Server mod with `canLockChannel` permission

**Test Steps:**

1. Log in as a server mod
2. Lock a channel
3. Log in as one of the channel admins
4. Check notifications

**Expected Outcome:**

- Channel admin should receive a notification about the lock
- Notification should include:
  - Which channel was locked
  - Lock reason
  - Link to the related issue (for appeals)

---

## Cypress Test Backlog

These items should eventually have automated E2E coverage but can be manually verified using the instructions above.

| Test                                             | Priority | Manual Section Reference                         |
| ------------------------------------------------ | -------- | ------------------------------------------------ |
| Server-level suspended user forum-creation block | High     | User Suspension: Cannot Create Forums            |
| Suspended user emoji block                       | High     | User Suspension: Emoji Reactions Blocked         |
| Expired suspension cleanup and recovery          | High     | User Suspension: Expiration and Cleanup          |
| Unsuspension immediate recovery                  | High     | User Suspension: Unsuspension Recovery           |
| Suspended mod sees no mod UI                     | High     | Mod Suspension: No Mod UI Elements               |
| Suspended mod cannot act on issues               | High     | Mod Suspension: Cannot Act on Issue Detail       |
| Mod suspension doesn't affect user actions       | High     | Mod Suspension: Does Not Affect User Permissions |
| Mod actions re-enable after unsuspension         | High     | Mod Suspension: Re-Enable After Unsuspension     |
| Server admin badge on comments                   | Medium   | Badge: Server Admin Badge                        |
| Server mod badge on comments                     | Medium   | Badge: Server Mod Badge                          |
| Server admin invite workflow                     | Medium   | Invite: Server Admin Workflow                    |
| Server mod invite workflow                       | Medium   | Invite: Server Mod Workflow                      |
| Channel report creates server-scoped issue       | High     | Channel Lock: Report Creates Issue               |
| Lock channel from reports page                   | High     | Channel Lock: Lock from Reports Page             |
| Unlock channel from reports page                 | High     | Channel Lock: Unlock from Reports Page           |
| Locked channel banner displays                   | High     | Channel Lock: Banner Displays                    |
| Locked channel blocks content creation           | High     | Channel Lock: Blocks Content Creation            |
| Lock/unlock from channel about page              | Medium   | Channel Lock: About Page Actions                 |
| Issue detail shows related channel               | Medium   | Channel Lock: Issue Related Channel              |
| Channel lock permission checks                   | High     | Channel Lock: Permission Checks                  |
| Bot badge appears in issue list                  | Medium   | Bot Suspension: Badge in Issue List              |
| Suspend Bot button label displays correctly      | Medium   | Bot Suspension: Suspend Bot Button Label         |
| Suspended bot cannot comment                     | High     | Bot Suspension: Suspended Bot Cannot Comment     |
| Suspended bot cannot report                      | High     | Bot Suspension: Suspended Bot Cannot Report      |
| Bot badge in suspended users list                | Medium   | Bot Suspension: Badge in Suspended Users List    |
| Unsuspending bot re-enables actions              | High     | Bot Suspension: Unsuspending Re-Enables Actions  |
| Bot suspension badge in channel sidebar          | Medium   | Bot Suspension: Badge in Channel Sidebar         |
| Bot suspension badge in channel settings         | Medium   | Bot Suspension: Badge in Channel Settings        |

---

## Recently Completed Wiki Revision Refactor Verification

These steps verify the revision-history foundation work completed before the remaining wiki moderation features are added.

### Automated Verification

Run these from `/Users/catherineluse/gennit/gennit-nuxt/wt-feature-moderation`:

```bash
npm run tsc
npx vitest run components/comments/CommentRevisionDiffModal.spec.ts components/wiki/WikiRevisionDiffModal.spec.ts components/discussion/detail/activityFeed/RevisionDiffModal.spec.ts
npx vitest run tests/unit/utils/revisionHistory.spec.ts tests/unit/utils/revisionDiff.spec.ts
```

Expected outcome:

- Type checking succeeds.
- Revision modal specs pass.
- Shared `revisionHistory` and `revisionDiff` utility specs pass.

### Manual Verification: Shared Revision Modal Rendering

**Prerequisites:**

- A discussion with body revision history
- A comment with revision history
- A wiki page with revision history

**Test Steps:**

1. Open a discussion revision history modal.
2. Open a comment revision history modal.
3. Open a wiki revision history modal.
4. Confirm each modal displays:
   - From/to revision author metadata
   - Current-version badge where applicable
   - Side-by-side previous/current diff
   - Collapsed unchanged lines with show/hide behavior
   - Edit reason when the revision has one

**Expected Outcome:**

- All three revision modals render consistently through the shared diff component.
- Existing delete button behavior is unchanged for now.
- Comment and discussion edit reasons still display.

### Manual Verification: Shared Revision Pairing

**Prerequisites:**

- A comment with at least two past versions
- A wiki page with at least two past versions

**Test Steps:**

1. Open the comment "Edits" dropdown.
2. Select the current/most recent revision comparison and confirm the modal compares current content against the most recent past version.
3. Select an older revision comparison and confirm it compares adjacent past versions.
4. Repeat the same flow from the wiki "Edits" dropdown.
5. Navigate to `/forums/[forumId]/wiki/revisions/[slug]` and confirm the revision list uses the same ordering and pairing behavior.

**Expected Outcome:**

- Current revision comparisons use `current` vs most recent past version.
- Older revision comparisons use adjacent past versions.
- Wiki dropdown and wiki revision page agree on revision ordering.

### Manual Verification: Wiki Revision Detail Page Uses Shared Diff

**Prerequisites:**

- A wiki page with at least one past version

**Test Steps:**

1. Navigate to `/forums/[forumId]/wiki/revisions/[slug]`.
2. Open a revision detail page.
3. Confirm the page still shows breadcrumbs, the revision detail heading, delete action, and delete error banner area.
4. Confirm the diff content matches the shared modal style and no longer shows the old `v-code-diff` view-mode toggle.
5. Confirm the delete action still routes back to the revision list after success.

**Expected Outcome:**

- Wiki revision detail uses the shared `RevisionDiffContent` rendering.
- The page no longer exposes the old side-by-side/line-by-line `v-code-diff` toggle.
- Existing delete semantics are unchanged pending the redaction-mutation slice.

---

## Image Moderation Verification

These steps verify the image moderation workflow implemented in the Album and Image Moderation feature.

### Verify Report Image from Lightbox

**Prerequisites:**

- A logged-in user account
- A discussion with at least one image in an album

**Test Steps:**

1. Navigate to a discussion with images
2. Click an image to open the lightbox
3. Look for the flag icon (report button) in the lightbox controls
4. Click the report button
5. Select one or more broken rules in the modal
6. Add optional context text
7. Submit the report

**Expected Outcome:**

- Report button should only appear for logged-in users
- Report modal should open with forum rules and server rules
- After submission, success notification should appear
- A new issue should be created with `relatedImageId` set
- Issue should appear in the channel's issue list (if channel-scoped) or server issue list

### Verify Image Appears in Moderation Queue

**Prerequisites:**

- A reported image (create one using the steps above)
- Mod or admin access to view issues

**Test Steps:**

1. Log in as a channel mod or server admin
2. Navigate to the issue list (`/forums/[forumId]/issues` or `/admin/issues`)
3. Find the issue related to the reported image
4. Click to view the issue detail

**Expected Outcome:**

- Issue should show "Original image" section
- Image should be displayed with:
  - Thumbnail preview
  - Uploader info (name, profile pic)
  - Upload date
  - Caption, alt text, description (if set)
  - Link to the discussion context (if part of an album)
- Report count badge should show number of reports

### Verify Archive Image

**Prerequisites:**

- A mod profile with `canArchiveImage` permission
- A reported image issue

**Test Steps:**

1. Log in as a mod with archive permission
2. Navigate to the image issue
3. Use the archive action (via BrokenRulesModal with `archiveAfterReporting` enabled)
4. Select broken rules and submit

**Expected Outcome:**

- Image should be marked as archived
- ModerationAction should appear in issue activity feed
- Archived image should be filtered out of normal display queries

### Verify Archived Images Are Hidden

**Prerequisites:**

- An archived image in a discussion album

**Test Steps:**

1. Log in as a regular user (not the uploader or a mod)
2. Navigate to the discussion containing the archived image
3. Check the album/gallery display

**Expected Outcome:**

- Archived image should NOT appear in the album
- Album image count should reflect only non-archived images
- Discussion should still be viewable with remaining images

### Verify Unarchive Image

**Prerequisites:**

- A mod profile with `canArchiveImage` permission
- An archived image with an existing issue

**Test Steps:**

1. Log in as a mod with archive permission
2. Navigate to the image issue
3. Use the unarchive action
4. Provide optional explanation

**Expected Outcome:**

- Image should be marked as not archived
- ModerationAction should appear in issue activity feed
- Image should reappear in normal display queries

### Verify Permanently Remove Image (Admin Only)

**Prerequisites:**

- Server admin or mod with `canPermanentlyRemoveImage` permission
- An image issue (preferably already archived)

**Test Steps:**

1. Log in as a server admin
2. Navigate to the image issue
3. Use the permanently remove action
4. Confirm the action

**Expected Outcome:**

- Image should be marked as permanently removed
- `permanentlyRemovedAt` and `PermanentlyRemovedByMod` should be set
- ModerationAction should appear in issue activity feed
- Image should never appear in any queries (no mod override)
- This action cannot be undone

### Verify Permission Gates

**Prerequisites:**

- Multiple user accounts with different permission levels

**Test Steps:**

1. **Regular user:** Attempt to archive an image (should fail)
2. **Channel mod without canArchiveImage:** Attempt to archive (should fail)
3. **Channel mod with canArchiveImage:** Attempt to archive (should succeed for channel-scoped)
4. **Server mod with canArchiveImage:** Attempt to archive (should succeed for any image)
5. **Non-admin:** Attempt to permanently remove (should fail)
6. **Server admin:** Attempt to permanently remove (should succeed)

**Expected Outcome:**

- Each action should be gated by the appropriate permission
- Unauthorized attempts should show permission error
- Authorized actions should succeed

### Verify Profile Picture Report from User Profile Page

**Prerequisites:**

- A logged-in user account
- Another user's profile with a profile picture

**Test Steps:**

1. Log in as a regular user
2. Navigate to another user's profile page (`/u/[username]`)
3. Look for the flag icon (report button) overlaid on the profile picture
4. Click the report button
5. Select one or more server rules that were violated
6. Add optional context text
7. Submit the report

**Expected Outcome:**

- Report button should appear only when viewing another user's profile (not your own)
- Report button should only appear if the profile has a picture
- Report modal should open with server rules only (no forum rules)
- Modal should show "Report Profile Picture: [username/displayName]"
- After submission, success notification should appear
- A new server-scoped issue should be created
- Note banner should explain that reports are reviewed by server admins

### Verify Profile Picture Report Button Visibility

**Prerequisites:**

- Users with and without profile pictures
- A logged-in user account

**Test Steps:**

1. Log in as a user
2. Navigate to your own profile page
3. Check if report button is visible on your own profile picture
4. Navigate to another user's profile who has a profile picture
5. Check if report button is visible
6. Navigate to a user's profile who has no profile picture (default avatar)
7. Check if report button is visible

**Expected Outcome:**

- Report button should NOT appear on your own profile picture
- Report button should appear on other users' profile pictures
- Report button should NOT appear when viewing a user with no profile picture set
- Report button should be a small flag icon in the bottom-right corner of the avatar

### Verify Channel Icon/Banner Reporting from About Page

**Prerequisites:**

- A mod profile with reporting permission (server mod or admin)
- A channel with a custom icon and/or banner set

**Test Steps:**

1. Log in as a server mod or admin
2. Navigate to the channel's About page (`/forums/[forumId]/about`)
3. Look for the "Server Moderation" section
4. Check for "Report Icon" and "Report Banner" buttons
5. Click "Report Icon" (if available)
6. Select one or more server rules that were violated
7. Add optional context text
8. Submit the report
9. Repeat for "Report Banner" (if available)

**Expected Outcome:**

- "Report Icon" button should only appear if the channel has a custom icon set
- "Report Banner" button should only appear if the channel has a custom banner set
- Both buttons should only be visible to users with `canReport` permission at server level
- Report modal should open with server rules only (no forum rules)
- Modal title should indicate whether reporting icon or banner
- After submission, success notification should appear
- A new server-scoped issue should be created

### Verify Channel Image Report Button Visibility

**Prerequisites:**

- Multiple user accounts with different permission levels
- Channels with and without custom icons/banners

**Test Steps:**

1. Log in as a regular user (not a server mod)
2. Navigate to a channel's About page
3. Check if "Server Moderation" section is visible (it should not be)
4. Log in as a server mod
5. Navigate to a channel WITHOUT a custom icon or banner
6. Check that "Report Icon" and "Report Banner" buttons are not shown
7. Navigate to a channel WITH a custom icon
8. Check that "Report Icon" button is visible
9. Navigate to a channel WITH a custom banner
10. Check that "Report Banner" button is visible

**Expected Outcome:**

- Regular users should not see the Server Moderation section
- Server mods should only see report buttons for images that exist
- Missing images should not have corresponding report buttons

### Verify Dedicated Image Reports Page

**Prerequisites:**

- Server admin or server mod access
- At least one image report (album image, profile picture, or channel icon/banner)

**Test Steps:**

1. Log in as a server admin or mod
2. Navigate to `/admin/image-reports`
3. Verify the page loads and displays image reports
4. Check the type badges for different image types:
   - Orange badge for "Album Image"
   - Purple badge for "Profile Picture"
   - Blue badge for "Channel Icon" or "Channel Banner"
5. Toggle the "Show open reports only" checkbox
6. Click "View" on a report to navigate to the issue detail

**Expected Outcome:**

- Page should list all image-related reports
- Each report should show:
  - Issue number
  - Image type badge with appropriate color
  - Open/Closed status
  - Channel context (if channel-scoped) or "(server-scoped)"
  - Reporter name and relative timestamp
  - Report count (if multiple reports)
- Filter should work to show/hide closed reports
- "View" button should navigate to the appropriate issue page (channel or admin)

### Verify Image Reports Page Shows All Image Types

**Prerequisites:**

- Create reports for different image types:
  - An album image (via lightbox report button)
  - A profile picture (via user profile)
  - A channel icon (via channel About page)

**Test Steps:**

1. Create reports for each image type (or ensure they exist)
2. Navigate to `/admin/image-reports`
3. Verify all three report types appear in the list
4. Verify each has the correct type badge

**Expected Outcome:**

- Album image reports show orange "Album Image" badge
- Profile picture reports show purple "Profile Picture" badge
- Channel icon/banner reports show blue "Channel Icon" or "Channel Banner" badge
- All reports are mixed together but clearly distinguishable by badge

### Automated Verification

Run these from `/Users/catherineluse/gennit/gennit-nuxt/wt-feature-moderation`:

```bash
npm run tsc
npm run test:unit:run
```

Run these from `/Users/catherineluse/gennit/gennit-backend`:

```bash
npm test
```

Expected outcome:

- Type checking succeeds in both repositories
- All unit tests pass
- Backend tests pass (127 tests)

---

## Download Labels Moderation Verification

These steps verify the download labels moderation feature implemented in the Download Labels section.

### Verify OP Can Update Download Labels

**Prerequisites:**

- A user account that owns a download
- A channel with filter groups configured (download labels)

**Test Steps:**

1. Log in as the user who owns a download
2. Navigate to the download edit page (`/forums/[forumId]/downloads/edit/[discussionId]`)
3. Modify the download labels (select/deselect labels)
4. Save the changes

**Expected Outcome:**

- Labels should be updated successfully
- No moderation action should be created (owner is updating their own content)
- Changes should persist when viewing the download detail page

### Verify Channel Mod Can Update Download Labels

**Prerequisites:**

- A mod profile with `canEditDiscussions` permission for the channel
- A download created by a different user
- The channel has filter groups configured

**Test Steps:**

1. Log in as the mod user
2. Navigate to the download edit page for someone else's download
3. Modify the download labels
4. Save the changes
5. Navigate to the mod profile's activity page

**Expected Outcome:**

- Labels should be updated successfully
- A ModerationAction should be created with:
  - `actionType: "label_update"`
  - `actionDescription` describing the label change and download title
- The action should appear in the mod's activity feed/contributions

### Verify Server Admin Can Update Download Labels

**Prerequisites:**

- A server admin account
- A download created by a different user

**Test Steps:**

1. Log in as a server admin
2. Navigate to the download edit page for someone else's download
3. Modify the download labels
4. Save the changes

**Expected Outcome:**

- Labels should be updated successfully
- A ModerationAction should be created (since admin is not the owner)
- Changes should persist when viewing the download detail page

### Verify Permission Denied for Unauthorized Users

**Prerequisites:**

- A regular user account (not a mod or admin)
- A download created by a different user

**Test Steps:**

1. Log in as a regular user
2. Attempt to navigate to the download edit page for someone else's download
3. If the page loads, attempt to modify labels

**Expected Outcome:**

- The edit page should show "You do not have permission to see this page" or similar
- Or if labels can be modified, the mutation should fail with a permission error
- No changes should be persisted

### Verify Mod Action Appears in Activity Feed

**Prerequisites:**

- A mod who has updated labels on someone else's download

**Test Steps:**

1. Log in as the mod who updated labels
2. Navigate to the mod profile page (`/mod/[modName]`)
3. Look for the label update in the activity/contributions section
4. Click to view the related issue

**Expected Outcome:**

- The label update action should appear in the mod's activity feed
- The action should show:
  - The type of action (label update)
  - The new labels applied and download title
  - Timestamp of the action

---

## Download Activity Tab Verification

These steps verify the download activity tab feature showing label change history and title edit history.

### Verify Activity Tab Displays on Download Detail Page

**Prerequisites:**

- A download in a channel with filter groups configured (download labels)

**Test Steps:**

1. Navigate to a download detail page (`/forums/[forumId]/downloads/[discussionId]`)
2. Look for the tab navigation below the download header
3. Verify there are three tabs: Description, Comments, Activity

**Expected Outcome:**

- Activity tab should appear alongside Description and Comments tabs
- Clicking Activity tab should navigate to the activity page
- Tab styling should be consistent with other tabs

### Verify Label Change History in Activity Tab

**Prerequisites:**

- A download where labels have been changed at least once
- Both OP and mod label changes should be tracked

**Test Steps:**

1. Log in as the download owner
2. Navigate to the download edit page and change the labels
3. Save the changes
4. Navigate to the download detail page and click the Activity tab
5. Log in as a mod with `canEditDiscussions` permission
6. Navigate to the same download's edit page and change labels
7. Return to the Activity tab

**Expected Outcome:**

- Activity tab should show label change history entries
- Each entry should display:
  - Actor name (username for owner, mod profile name for mods)
  - Action type ("added" or "removed")
  - Label name with colored badge (green for added, red/strikethrough for removed)
  - Relative timestamp (e.g., "2 minutes ago")
- Multiple changes should be listed with option to "Show X older changes"
- Most recent change should appear at the top

### Verify Title Edit History Moved to Activity Tab

**Prerequisites:**

- A download with at least one title edit

**Test Steps:**

1. Navigate to a download that has been edited (title changed)
2. Click the Description tab
3. Verify title edit history is NOT shown on the Description tab
4. Click the Activity tab
5. Verify title edit history IS shown on the Activity tab

**Expected Outcome:**

- Description tab should only show the description content and edit button
- Activity tab should show title edit history with:
  - Author who made the change
  - Old title (strikethrough) and new title
  - Timestamp of the change
- If both title edits and label changes exist, both should appear in the Activity tab

### Verify Empty Activity State

**Prerequisites:**

- A download with no title edits and no label changes

**Test Steps:**

1. Create a new download without changing labels
2. Navigate to the Activity tab

**Expected Outcome:**

- Activity tab should display "No activity to display yet." message
- No errors should appear

---

## UI Fixes Verification

These steps verify the UI bug fixes for mod action buttons and archived banner.

### Verify Mod Action Button Hover States

**Prerequisites:**

- Access to an issue detail page with moderation actions available

**Test Steps:**

1. Log in as a mod with appropriate permissions
2. Navigate to an issue detail page (`/forums/[forumId]/issues/[issueNumber]`)
3. Hover over each mod action button:
   - Archive/Unarchive button
   - Suspend Author/Unsuspend Author button
   - Suspend Mod/Unsuspend Mod button (if applicable)
   - Close Issue button

**Expected Outcome:**

- All buttons should have consistent styling:
  - Same font weight (semibold)
  - Same padding and alignment (centered)
  - Smooth hover transition effect
- Red buttons (Archive, Suspend) should lighten on hover
- Green buttons (Unsuspend) should lighten on hover
- Blue buttons (Unarchive, Close Issue) should lighten on hover
- Disabled buttons should have gray background with no hover effect

### Verify Archived Discussion Banner Shows Immediately

**Prerequisites:**

- An archived discussion in a channel
- Access to the channel's discussion list

**Test Steps:**

1. Navigate to a channel's discussion list (`/forums/[forumId]/discussions`)
2. Find an archived discussion (should have "Archived" badge on list item)
3. Click on the archived discussion to navigate to its detail page
4. Observe whether the archived banner appears immediately

**Expected Outcome:**

- The archived banner should appear immediately when the page loads
- No page refresh should be required to see the banner
- Banner should display: "This discussion has been archived. New comments cannot be added."
- If linked to an issue, banner should include a link to the issue

### Verify Archived Banner Shows from Multiple Entry Points

**Prerequisites:**

- An archived discussion

**Test Steps:**

1. Navigate to the archived discussion from the channel discussion list
2. Verify banner appears immediately
3. Navigate away, then use the browser back button
4. Verify banner still appears
5. Navigate to the discussion via direct URL
6. Verify banner appears immediately

**Expected Outcome:**

- Archived banner should appear consistently regardless of navigation method
- No flicker or delayed appearance of the banner
