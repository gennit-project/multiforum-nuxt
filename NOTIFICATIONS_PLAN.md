# Notifications Implementation Plan

This plan addresses all notification-related requirements from FEATURE_ROADMAP.md.

**Status: ✅ All phases complete**

---

## Requirements Implemented

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Mod mentions (/m) in issues/discussions trigger notifications | ✅ |
| 2 | Text editor shows /m, /u, /bot mentions appropriately | ✅ |
| 3 | Fix broken permalink in notification | ✅ |
| 4 | Get notified of feedback | ✅ |
| 5 | Notification page has separate tabs (feedback vs other) | ✅ |
| 6 | Toggle notifications for feedback | ✅ |
| 7 | Email notification does not reveal feedback content | ✅ |
| 8 | Edits visible from feedback page | ✅ |
| 9 | Notification when subscribed issue has moderation action | ✅ |
| 10 | Archived content notification mentions reopening issue | ✅ |
| 11 | One-click unsubscribe links in notifications | ✅ |
| 12 | Notification shows subscription status with links | ✅ |
| 13 | Unsubscribe via `?action=unsubscribe` query param | ✅ |
| 14-17 | Unsubscribe flow for discussions, events, comments, issues | ✅ |

---

## Implementation Order

### Sprint 1: Foundation
1. [x] Phase 3 Schema Change - Add `notificationType` field to Notification
2. [x] Phase 1 - Bug fix for broken permalink (verified existing code is correct)
3. [x] Phase 3 Backend - Feedback notifications (feedbackNotificationHook.ts)

### Sprint 2: Mod Mentions & UI
4. [x] Phase 2 Backend - Mod mention notifications (modMentionNotificationHook.ts)
5. [x] Phase 2 Frontend - Text editor /m autocomplete
6. [x] Phase 3 Frontend - Notification tabs (NotificationTabs.vue)

### Sprint 3: Unsubscribe Flow
7. [x] Phase 5 Frontend - Handle `?action=unsubscribe` param (useAutoUnsubscribe composable)
8. [x] Phase 5 Backend - Add unsubscribe links to notifications (notificationFooter.ts)
9. [x] Phase 6 - Notification footer with subscription status (included in Phase 5 Backend)

### Sprint 4: Issue Notifications
10. [x] Phase 4 - Issue moderation action notifications (already implemented via notifyIssueSubscribers)
11. [x] Phase 4 - Enhanced archived content notifications (archivedContentNotificationHook.ts)

---

## Files to Modify/Create

### Backend (New Files)
- [x] `hooks/modMentionNotificationHook.ts` - Created
- [x] `hooks/feedbackNotificationHook.ts` - Created
- [x] `hooks/archivedContentNotificationHook.ts` - Created (notifies content authors when archived)
- [x] `utils/notificationFooter.ts` - Created

### Backend (Modify)
- [x] `typeDefs.ts` - Added `notificationType` field to Notification
- [x] `hooks/notificationHelpers.ts` - Updated to accept notificationType
- [x] `services/commentNotificationService.ts` - Integrated feedback, mod mention, user mention hooks, and unsubscribe footer
- [x] `services/issueNotifications.ts` - Added unsubscribe footer

### Frontend (New Files)
- [x] `components/notifications/NotificationTabs.vue` - Created
- [x] `composables/useAutoUnsubscribe.ts` - Created

### Frontend (Modify)
- [x] `pages/notifications/index.vue` - Updated to use NotificationTabs
- [x] `graphQLData/notification/queries.js` - Added GET_FEEDBACK_NOTIFICATIONS, GET_GENERAL_NOTIFICATIONS
- [x] `components/discussion/detail/DiscussionCommentsWrapper.vue` - Handle unsubscribe action via useAutoUnsubscribe
- [x] `components/event/detail/EventCommentsWrapper.vue` - Handle unsubscribe action via useAutoUnsubscribe
- [x] `components/mod/IssueDetail.vue` - Handle unsubscribe action via useAutoUnsubscribe
- [x] Text editor components - Added /m autocomplete

---

## Verification Guide

This section contains detailed step-by-step instructions for manually verifying notification features. Each item includes prerequisites, test steps, and expected outcomes.

---

### Notification Tabs Verification

#### Verify General and Feedback Tab Separation

**Prerequisites:**

- Two test user accounts (User A as content author, User B as moderator)
- User A has `notifyOnFeedback` enabled in account settings
- User B has moderator permissions with feedback capability

**Test Steps:**

1. Log in as User B (moderator)
2. Navigate to a discussion authored by User A
3. Open the moderator menu and select "Give Feedback"
4. Submit feedback on the discussion
5. Log in as User A
6. Navigate to `/notifications`
7. Observe the notification tabs

**Expected Outcome:**

- Two tabs should appear: "General" and "Feedback"
- The "Feedback" tab should show an unread count badge
- Clicking "Feedback" tab shows only the feedback notification
- The feedback notification text should NOT reveal the feedback content
- Clicking "General" tab shows other notifications (replies, mentions, etc.)
- The feedback notification should NOT appear in the General tab

#### Verify Tab Unread Counts

**Prerequisites:**

- A user with multiple unread notifications of different types

**Test Steps:**

1. Generate test notifications:
   - Have another user reply to your comment (creates reply notification)
   - Have another user mention you with @username (creates mention notification)
   - Have a moderator give you feedback (creates feedback notification)
2. Navigate to `/notifications` without marking any as read
3. Observe the badge counts on each tab

**Expected Outcome:**

- General tab shows count of unread non-feedback notifications
- Feedback tab shows count of unread feedback notifications
- Clicking "Mark all as read" updates the counts for the active tab only

---

### Feedback Notification Privacy Verification

#### Verify Feedback Content is NOT Revealed in Notification

**Prerequisites:**

- User A with `notifyOnFeedback` enabled
- User B with moderator feedback permission
- A discussion or comment authored by User A

**Test Steps:**

1. Log in as User B
2. Navigate to User A's content
3. Give detailed feedback (e.g., "This post contains misinformation about X and Y")
4. Log in as User A
5. Check the notification in the Feedback tab
6. Also check any email notification sent

**Expected Outcome:**

- In-app notification says "You received feedback on your [post/comment]" with a link
- The actual feedback text ("This post contains misinformation...") is NOT visible
- Email notification (if sent) uses generic subject like "You received feedback"
- Email body does NOT include the feedback content
- User must click the link to view the actual feedback

#### Verify notifyOnFeedback Preference is Respected

**Prerequisites:**

- Two test users

**Test Steps:**

1. Log in as User A
2. Go to account settings and disable `notifyOnFeedback`
3. Log in as User B (moderator)
4. Give feedback on User A's content
5. Log in as User A
6. Check notifications

**Expected Outcome:**

- No feedback notification should be created for User A
- The Feedback tab should remain empty (or unchanged)
- Re-enable `notifyOnFeedback` and repeat - notification should now appear

---

### Mod Mention Notification Verification

#### Verify /m/ Mention Creates Notification

**Prerequisites:**

- A moderator with a ModerationProfile (display name, e.g., "alice")
- The moderator's associated user account has `notifyWhenTagged` enabled
- Another user who can post comments

**Test Steps:**

1. Log in as regular user
2. Navigate to a discussion in a channel where the moderator is active
3. Post a comment containing `/m/alice` (using the mod's profile display name)
4. Log in as the moderator (alice's user account)
5. Navigate to `/notifications`

**Expected Outcome:**

- Moderator receives a notification in the General tab
- Notification text says "[username] mentioned you as a moderator in a comment on [Discussion Title]"
- Clicking the link navigates to the specific comment
- The notification type is "mention"

#### Verify Self-Mention Does Not Notify

**Prerequisites:**

- A moderator who can post comments in a channel where they moderate

**Test Steps:**

1. Log in as the moderator
2. Post a comment mentioning yourself: "I'm /m/myOwnProfile and here's my take"
3. Check notifications

**Expected Outcome:**

- No notification is created for self-mentions
- Other mentioned moderators (if any) still receive notifications

#### Verify Edited Comments Don't Duplicate Notifications

**Prerequisites:**

- A moderator with ModerationProfile
- A user who can post and edit comments

**Test Steps:**

1. Log in as regular user
2. Post a comment: "Hey /m/alice check this out"
3. Verify alice receives a notification
4. Edit the comment to: "Hey /m/alice and /m/bob check this out"
5. Check notifications for both alice and bob

**Expected Outcome:**

- Alice should have received ONE notification (from original post)
- Bob should receive ONE notification (from the edit adding them)
- Alice should NOT receive a duplicate notification from the edit

---

### User Mention Notification Verification

#### Verify @username Mention Creates Notification

**Prerequisites:**

- Two test users (User A and User B)
- User B has `notifyWhenTagged` enabled

**Test Steps:**

1. Log in as User A
2. Post a comment containing `@UserB` or `u/UserB`
3. Log in as User B
4. Check notifications

**Expected Outcome:**

- User B receives a notification
- Notification text includes link to the comment
- Notification type is "mention"

---

### Discussion Edit Notification Verification

#### Verify Author is Notified When Moderator Edits Discussion

**Prerequisites:**

- User A (discussion author)
- User B (moderator with edit permission)
- A discussion authored by User A

**Test Steps:**

1. Log in as User B (moderator)
2. Navigate to User A's discussion
3. Edit the discussion body or title
4. Log in as User A
5. Check notifications

**Expected Outcome:**

- User A receives notification: "[ModeratorName] edited your discussion [Discussion Title]"
- The discussion title is a clickable link to the discussion
- Clicking the link navigates to the correct discussion page

#### Verify Author Editing Own Discussion Does NOT Notify

**Prerequisites:**

- User A with a discussion

**Test Steps:**

1. Log in as User A
2. Edit your own discussion
3. Check notifications

**Expected Outcome:**

- No notification is created for self-edits

---

### Backend Unit Test Verification

#### Run Notification Hook Tests

**Prerequisites:**

- Backend repository cloned
- Node.js and dependencies installed

**Test Steps:**

1. Navigate to `gennit-backend` directory
2. Run `npm test` to execute all tests
3. Alternatively, run specific notification tests:
   ```bash
   node --loader ts-node/esm hooks/feedbackNotificationHook.test.ts
   node --loader ts-node/esm hooks/modMentionNotificationHook.test.ts
   node --loader ts-node/esm hooks/userMentionNotificationHook.test.ts
   ```

**Expected Outcome:**

- All tests pass (165+ tests total)
- `feedbackNotificationHook.test.ts`: 6 tests pass
- `modMentionNotificationHook.test.ts`: 15 tests pass
- `userMentionNotificationHook.test.ts`: 3 tests pass

#### Run Frontend Notification Tests

**Prerequisites:**

- Frontend repository cloned
- Node.js and dependencies installed

**Test Steps:**

1. Navigate to `gennit-nuxt/wt-feature-moderation` directory
2. Run notification tab tests:
   ```bash
   npm run test:unit -- --run components/notifications/NotificationTabs.spec.ts
   ```

**Expected Outcome:**

- All 6 NotificationTabs tests pass
- Tests verify tab rendering, switching, and unread counts

---

### Mod Mention Autocomplete Verification

#### Verify /m/ Autocomplete in Discussion Comments

**Prerequisites:**

- A channel with at least one moderator configured
- User logged in with ability to comment

**Test Steps:**

1. Navigate to a discussion in a channel that has moderators
2. Open the comment form
3. Type `/m/` in the text editor
4. Observe the autocomplete dropdown

**Expected Outcome:**

- Autocomplete dropdown appears showing channel moderators
- Each suggestion shows `/m/profileName` format
- Username is displayed alongside the mod profile name
- Clicking a suggestion inserts the full `/m/profileName` syntax
- Space is added after the mention if needed

#### Run Mod Mentions Unit Tests

**Prerequisites:**

- Frontend repository cloned
- Node.js and dependencies installed

**Test Steps:**

1. Navigate to `gennit-nuxt/wt-feature-moderation` directory
2. Run mod mentions tests:
   ```bash
   npm run test:unit -- --run utils/modMentions.spec.ts
   ```

**Expected Outcome:**

- All 24 modMentions tests pass
- Tests verify:
  - `hasModMention` detects /m/ patterns
  - `buildModMentionOptions` creates proper suggestions
  - `getModMentionState` correctly identifies trigger position
  - `filterModSuggestions` filters by prefix and limits results

---

### Quick Start: Testing Notification Tabs

**Prerequisites:**

- Backend and frontend servers running
- At least two test user accounts
- One user has moderator permissions

**Steps:**

1. **Generate test notifications:**
   - User A replies to User B's comment (reply notification)
   - User A mentions User B with @UserB (mention notification)
   - Moderator gives feedback on User B's post (feedback notification)

2. **Log in as User B** and navigate to `/notifications`

3. **Verify tabs appear:**
   - "General" tab should be active by default
   - "Feedback" tab should show a badge with "1"

4. **Check General tab content:**
   - Should show the reply and mention notifications
   - Should NOT show the feedback notification

5. **Click Feedback tab:**
   - Tab should become active (orange underline)
   - Should show only the feedback notification
   - Notification should say "You received feedback on your [post]"
   - Should NOT reveal the actual feedback content

6. **Click the feedback notification link:**
   - Should navigate to the content's feedback view
   - The actual feedback should be visible there

7. **Mark all as read:**
   - Click "Mark all as read" button
   - Badge count should update
   - Notifications should show "Read" status

---

### Unsubscribe Link Verification

#### Verify Notification Contains Unsubscribe Footer

**Prerequisites:**
- User A subscribed to a discussion
- User B who can comment on that discussion

**Test Steps:**
1. Log in as User B
2. Post a comment on the discussion
3. Log in as User A
4. Check the notification in `/notifications`

**Expected Outcome:**
- Notification includes footer with:
  - "You received this because you are subscribed to this discussion"
  - Link to notification settings (`/account_settings#notifications`)
  - Unsubscribe link with `?action=unsubscribe` parameter

#### Verify Auto-Unsubscribe via URL Parameter

**Prerequisites:**
- User logged in
- Subscribed to a discussion

**Test Steps:**
1. Navigate directly to `/forums/channel/discussions/id?action=unsubscribe`
2. Observe the page behavior

**Expected Outcome:**
- Toast notification appears: "You have been unsubscribed from this discussion"
- Subscribe button shows "Subscribe" state (not "Subscribed")
- URL parameter is removed from the address bar
- Refreshing the page does NOT trigger another unsubscribe action

#### Verify Unsubscribe Works for Events and Issues

**Prerequisites:**
- User subscribed to an event and an issue

**Test Steps:**
1. Navigate to `/forums/channel/events/id?action=unsubscribe`
2. Verify toast and button state change
3. Navigate to `/forums/channel/issues/123?action=unsubscribe`
4. Verify toast and button state change

**Expected Outcome:**
- Both events and issues support the auto-unsubscribe flow
- Toast messages are appropriate for each content type

---

### Archived Content Notification Verification

#### Verify Content Author is Notified When Content is Archived

**Prerequisites:**
- User A who authored a comment
- User B who is a moderator with archive permissions

**Test Steps:**
1. Log in as User B (moderator)
2. Navigate to User A's comment
3. Archive the comment (select rule violations, submit)
4. Log in as User A
5. Check notifications in `/notifications`

**Expected Outcome:**
- User A receives a notification
- Notification text includes:
  - "Your comment was archived for violating community guidelines"
  - Link to the related Issue (e.g., "Issue #123")
  - Support email for additional help
- Notification type is "moderation"

#### Verify Self-Archive Does NOT Notify

**Prerequisites:**
- Moderator who authored content

**Test Steps:**
1. Log in as moderator
2. Archive your own content
3. Check notifications

**Expected Outcome:**
- No notification is created when archiving your own content

#### Verify Archived Content Notification for All Content Types

**Prerequisites:**
- Test content of each type (comment, discussion, event, image) by different authors

**Test Steps:**
1. Archive a comment - verify author is notified
2. Archive a discussion - verify author is notified
3. Archive an event - verify poster is notified
4. Archive an image - verify uploader is notified

**Expected Outcome:**
- Each content type generates appropriate notification
- Notification text correctly identifies the content type
- Links are correctly formatted for each content type

#### Run Archived Content Notification Unit Tests

**Prerequisites:**
- Backend repository with tests

**Test Steps:**
```bash
cd gennit-backend
node --test --experimental-strip-types hooks/archivedContentNotificationHook.test.ts
```

**Expected Outcome:**
- All 5 tests pass:
  - Calls createInAppNotification with correct parameters
  - Builds correct notification text with all information
  - Returns false and skips notification for self-archival
  - Returns false when createInAppNotification fails
  - Uses 'server' display name when channelUniqueName is 'server'

---

### Notification Footer Unit Tests

**Prerequisites:**
- Backend repository with tests

**Test Steps:**
```bash
cd gennit-backend
node --test --experimental-strip-types utils/notificationFooter.test.ts
```

**Expected Outcome:**
- All 9 tests pass covering:
  - Default reason text generation
  - Subscription-based reason text
  - Author-based reason text
  - URL building with query parameters
  - Footer formatting with all components

---

### Completed Feature Verification

All sprints have been implemented and verified:

#### Mod Mention Autocomplete (Sprint 2) ✅
- [x] Typing `/m/` shows mod profile autocomplete dropdown
- [x] Autocomplete shows only moderators for the current channel
- [x] Selecting a mod inserts `/m/profileName` syntax

#### Unsubscribe Flow (Sprint 3) ✅
- [x] Clicking unsubscribe link navigates to content with `?action=unsubscribe`
- [x] Page auto-unsubscribes authenticated user
- [x] Toast notification confirms unsubscription
- [x] Subscribe button updates to "Subscribe" state
- [x] Works for discussions, events, and issues

#### Issue Moderation Notifications (Sprint 4) ✅
- [x] Moderation action on issue triggers notification to all subscribers
- [x] Archived content notification mentions how to reopen/appeal
- [x] Notification includes link to the related issue

#### Feedback Notifications (Sprint 1) ✅
- [x] Users with `notifyOnFeedback` enabled receive notifications when feedback is given
- [x] Notification text does NOT reveal feedback content (privacy)
- [x] Feedback tab separates feedback from general notifications

#### Mod Mention Notifications (Sprint 2) ✅
- [x] `/m/modProfileName` in comments triggers notification to that moderator
- [x] Notification links to the specific comment
- [x] Self-mentions do not create notifications
