# Moderation Features: Current State vs Roadmap Plan

## Wiki Revision Moderation Roadmap

This section tracks the wiki/discussion/comment revision-history work from the current roadmap. Most items still need coding changes. Completed items are listed here so follow-up work can build on the right foundation.

### Completed Foundation Work

| Task                                       | Status | Notes                                                                                                                   |
| ------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Normalize shared revision diff rendering   | Done   | Added shared revision diff content and updated wiki, discussion, and comment revision modals to use it.                 |
| Share revision pairing primitives          | Done   | Added shared revision history pairing helpers and applied them to comment/wiki edit dropdowns plus wiki revision pages. |
| Consolidate wiki revision detail diff view | Done   | Replaced the standalone wiki revision detail `v-code-diff` implementation with the shared revision diff content.        |

### Remaining Coding Changes

| Task                                                          | Location           | Type            | Notes                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------- | ------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Change revision deletion from hard delete to redaction        | Backend + Frontend | Feature         | Replace direct `deleteTextVersions` usage with purpose-specific mutations such as `deleteDiscussionBodyRevision`, `deleteCommentRevision`, and `deleteWikiRevision`. Mutations should preserve `TextVersion` chronology and replace body/title with `[deleted]`. |
| Add backend permission gates for revision/page deletion       | Backend            | Feature         | Discussion body revision deletion should allow OP or a moderator with the relevant permission. Wiki page/revision deletion should allow original wiki page author or a moderator with explicit delete permission.                                                |
| Add original wiki page author modeling if missing             | Backend            | Feature         | `WikiPage.VersionAuthor` appears to represent the last editor, not necessarily the original author. Add a stable original-author relationship if the backend does not already have one.                                                                          |
| Add dedicated wiki delete permissions if schema supports them | Backend            | Feature         | Prefer explicit permissions such as `canDeleteWiki` / `canDeleteWikiRevision` over reusing `canEditWiki` for destructive actions.                                                                                                                                |
| Fix revision modal action semantics                           | Frontend           | UX + Permission | Comment revision history should not have delete as the primary action. Move delete/redact to an authorized danger action and use a neutral primary action such as Close. Apply the same pattern to discussion and wiki revision UIs.                             |
| Add revision selector dropdown on wiki diff page              | Frontend           | Feature         | The wiki revision diff page should let users switch compared revisions without returning to the history list. Reuse the shared revision pairing model.                                                                                                           |
| Include and display wiki edit reasons                         | Backend + Frontend | Feature         | Add `editReason` to wiki revision queries and display it consistently with discussion/comment revision history.                                                                                                                                                  |
| Add edit summaries to wiki create/edit forms                  | Backend + Frontend | Feature         | Wire a wiki edit summary field to `TextVersion.editReason`. Keep product copy consistent with existing "Edit reason" language unless intentionally renamed.                                                                                                      |
| Enforce suspended-user wiki edit blocking                     | Backend + Frontend | Feature         | Apply the same suspension rules used for discussions/comments to wiki create/edit/delete. Gate frontend wiki create/edit controls and forms with resolved permission state and `SuspensionNotice`.                                                               |
| Add report wiki edit workflow                                 | Backend + Frontend | Feature         | Extend issue targets to wiki page and/or wiki revision `TextVersion`. Add `reportWikiEdit` and related moderation activity rendering so wiki reports participate in existing report -> issue -> suspend flows.                                                   |
| Add wiki edits to user profiles                               | Backend + Frontend | Feature         | Add wiki edit counts to `GET_USER`, add a "Wiki Edits" profile tab, and add a `/u/[username]/wiki-edits` page modeled after comments.                                                                                                                            |
| Add wiki edits to contribution charts                         | Backend + Frontend | Feature         | Extend `GET_USER_CONTRIBUTIONS`, backend contribution resolver logic, and `UserContributionChart` so wiki edits appear in contribution history.                                                                                                                  |

---

## Remaining Implementation Work

### Album and Image Moderation

**Current State:** Not implemented

#### Current Data Model Analysis

- **Image type** already has `RelatedIssues: [Issue!]!` relationship - the foundation for issue linkage exists
- **Album type** is owned by User and contains Images with ordering
- **Profile pictures** are stored as `User.profilePicURL: String` (URL, not Image node)
- **Channel icons/banners** are stored as `Channel.channelIconURL` and `Channel.channelBannerURL` (URLs, not Image nodes)

#### Phase 1: Schema Extensions (Backend)

| Task                                   | Location | Type    | Notes                                                                                                                                                                             |
| -------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add image-related fields to Issue type | Backend  | Feature | Add `relatedImageId`, `relatedAlbumId`, `relatedProfilePicUserId`, `relatedChannelIconName`, `relatedChannelBannerName` to Issue type                                             |
| Add moderation fields to Image type    | Backend  | Feature | Add `archived: Boolean`, `permanentlyRemoved: Boolean`, `permanentlyRemovedAt: DateTime`, `permanentlyRemovedBy: User` relationship                                               |
| Extend resolveIssueTarget.ts           | Backend  | Feature | Handle `relatedImageId` → lookup Image/Uploader, `relatedAlbumId` → lookup Album/Owner, `relatedProfilePicUserId` → lookup User, channel icon/banner → lookup Channel/Admins     |

#### Phase 2: Report Mutations (Backend)

| Task                                 | Location | Type    | Notes                                                                                                                                                                                                       |
| ------------------------------------ | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create reportImage mutation          | Backend  | Feature | Takes `imageId`, `reportText`, `selectedForumRules`, `selectedServerRules`, `channelUniqueName`. If channel provided → channel-scoped, else server-scoped. Creates/updates Issue with `relatedImageId`.    |
| Create reportProfilePicture mutation | Backend  | Feature | Takes `username`, `reportText`, `selectedServerRules`. Always server-scoped (`channelUniqueName: null`). Sets `relatedProfilePicUserId` on Issue.                                                          |
| Create reportChannelImage mutation   | Backend  | Feature | Takes `channelUniqueName`, `imageType` (ICON/BANNER), `reportText`, `selectedServerRules`. Always server-scoped. Sets `relatedChannelIconName` or `relatedChannelBannerName`.                              |

#### Phase 3: Archive Actions (Backend)

| Task                                   | Location | Type    | Notes                                                                                                                                                                            |
| -------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create archiveImage mutation           | Backend  | Feature | Sets `Image.archived = true`, finds/creates Issue, creates ModerationAction with `actionType: "archive"`. Follows pattern of `archiveComment.ts`.                               |
| Create unarchiveImage mutation         | Backend  | Feature | Reversible archiving, sets `archived = false`, creates ModerationAction with `actionType: "unarchive"`.                                                                         |
| Create permanentlyRemoveImage mutation | Backend  | Feature | Admin-only. Sets `permanentlyRemoved = true`, `permanentlyRemovedAt`, connects `permanentlyRemovedBy`. Optionally deletes underlying file. CANNOT be undone. Creates ModerationAction. |

#### Phase 4: Permission Gates (Backend)

| Task                                | Location | Type    | Notes                                                                                                                                      |
| ----------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Add permission flags to role types  | Backend  | Feature | Add `canArchiveImage` to ModServerRole and ModChannelRole. Add `canPermanentlyRemoveImage` to ModServerRole (admin-only).                  |
| Create hasImageModPermission helper | Backend  | Feature | New file following pattern of `hasChannelModPermission.ts`. Checks archive/remove permissions by scope.                                    |

#### Phase 5: Server Moderation Queue (Frontend)

| Task                                   | Location | Type    | Notes                                                                                                                                                    |
| -------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create GET_IMAGE_REPORTS query         | Frontend | Feature | Query server-scoped issues with image-related `relatedXxxId` fields. Filter by open/closed.                                                              |
| Create image-reports admin page        | Frontend | Feature | New page at `/admin/image-reports`. List issues, show thumbnails (or placeholder if removed), actions: View Issue, Archive, Permanently Remove.          |
| Update IssueRelatedContent component   | Frontend | Feature | Handle `relatedImageId` → show image preview, `relatedProfilePicUserId` → show profile pic context, channel icon/banner → show channel image.            |
| Hide Edit Post button for image issues | Frontend | Bug     | In IssueDetail, check if issue has `relatedImageId` and hide "Edit Post" button since images aren't editable posts.                                      |

#### Phase 6: Report UI Components (Frontend)

| Task                                  | Location | Type    | Notes                                                                                                                         |
| ------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Add report option to album images     | Frontend | Feature | Update `AlbumImageMenu.vue` with report option. Opens modal, calls `reportImage` with channel from album's discussion.        |
| Add report option to profile pictures | Frontend | Feature | Update `UserProfileHeader.vue` with report option. Server rules only, calls `reportProfilePicture`.                           |
| Add report options to channel images  | Frontend | Feature | Update `ChannelAboutPage.vue` Server Moderation section. Add report for icon and banner, calls `reportChannelImage`.          |

#### Phase 7: Mod History Recording (Backend)

All image moderation actions create `ModerationAction` nodes in Issue ActivityFeed:

| Action             | actionType           | actionDescription                    |
| ------------------ | -------------------- | ------------------------------------ |
| Report image       | `"report"`           | `"Reported the image"`               |
| Archive image      | `"archive"`          | `"Archived the image"`               |
| Unarchive image    | `"unarchive"`        | `"Unarchived the image"`             |
| Permanently remove | `"permanent_remove"` | `"Permanently removed the image"`    |

These appear in Issue ActivityFeed, mod profile activity page (`/mod/[modId]`), and server mod history (`/admin/mod-activity`).

#### Phase 8: Display Gating (Frontend)

| Task                            | Location | Type    | Notes                                                                                                 |
| ------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------- |
| Hide archived images            | Frontend | Feature | Check `archived` field, show placeholder or "Image hidden" message. Allow mods to view with toggle.  |
| Hide permanently removed images | Frontend | Feature | Check `permanentlyRemoved` field, show permanent placeholder. No mod override available.              |

#### File Summary

**Backend New Files:**
- `customResolvers/mutations/reportImage.ts`
- `customResolvers/mutations/reportProfilePicture.ts`
- `customResolvers/mutations/reportChannelImage.ts`
- `customResolvers/mutations/archiveImage.ts`
- `customResolvers/mutations/unarchiveImage.ts`
- `customResolvers/mutations/permanentlyRemoveImage.ts`
- `rules/permission/hasImageModPermission.ts`

**Backend Modified Files:**
- `typeDefs.ts` (Issue, Image, ModServerRole, ModChannelRole)
- `customResolvers/shared/resolveIssueTarget.ts`
- `rules/rules.ts` (add new mutation permissions)

**Frontend New Files:**
- `pages/admin/image-reports.vue`
- `components/mod/ImageReportModal.vue`
- `components/mod/ArchiveImageModal.vue`
- `graphQLData/mod/queries/GET_IMAGE_REPORTS.ts`
- `graphQLData/mod/mutations/REPORT_IMAGE.ts` (and related)

**Frontend Modified Files:**
- `components/album/AlbumImageMenu.vue`
- `components/user/UserProfileHeader.vue`
- `components/channel/ChannelAboutPage.vue`
- `components/mod/issue/IssueRelatedContent.vue`
- `components/mod/issue/IssueDetail.vue`

### Download Labels and UI Fixes

**Current State:** Partial implementation

| Task                                                                                                 | Location | Type    |
| ---------------------------------------------------------------------------------------------------- | -------- | ------- |
| Both OP and channel mod can change labels on downloads                                               | Both     | Feature |
| Mod action button hover state should look consistent                                                 | Frontend | Bug     |
| When clicking an archived discussion list item, banner doesn't show on detail page until you refresh | Frontend | Bug     |

---

### Shared Bot Context Infrastructure

**Current State:** ✅ Complete

The shared bot context infrastructure (`buildBotInvocationContext`) provides channel details, rules, discussion title/body, comment info, and parent thread context to all bot plugins. Both `beta-reader-bot` and `chatgpt-bot-profiles` consume this shared context.

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
