# Notifications Implementation Plan

This plan addresses all notification-related requirements from FEATURE_ROADMAP.md, organized into logical phases that build upon each other.

## Overview of Requirements

| # | Requirement | Type |
|---|-------------|------|
| 1 | Mod mentions (/m) in issues/discussions trigger notifications | Feature |
| 2 | Text editor shows /m, /u, /bot mentions appropriately | Feature |
| 3 | Fix broken permalink in notification | Bug |
| 4 | Get notified of feedback | Feature |
| 5 | Notification page has separate tabs (feedback vs other) | Feature |
| 6 | Toggle notifications for feedback | Feature |
| 7 | Email notification does not reveal feedback content | Privacy |
| 8 | Edits visible from feedback page | Feature |
| 9 | Notification when subscribed issue has moderation action | Feature |
| 10 | Archived content notification mentions reopening issue | Feature |
| 11 | One-click unsubscribe links in notifications | Feature |
| 12 | Notification shows subscription status with links | Feature |
| 13 | Unsubscribe via `?action=unsubscribe` query param | Feature |
| 14-17 | Unsubscribe flow for discussions, events, comments, issues | Feature |

---

## Phase 1: Bug Fix - Broken Permalink

**Problem:** Notification text like "freshManySlimyShoe edited your discussion test post September 28" has a broken permalink.

**Investigation needed:**
- Find where discussion edit notifications are created
- Check the URL generation logic

### Tasks

| Task | File | Type |
|------|------|------|
| Identify notification creation for discussion edits | Backend hooks | Investigation |
| Fix permalink URL generation | Backend | Bug Fix |
| Add test for correct permalink format | Backend | Test |

---

## Phase 2: Mod Mention Notifications (/m)

**Goal:** When someone tags a mod using `/m/modProfileName` in an issue or discussion comment, that mod gets a notification.

### Backend Changes

| Task | File | Type |
|------|------|------|
| Create `modMentionNotificationHook.ts` similar to `userMentionNotificationHook.ts` | `hooks/modMentionNotificationHook.ts` | Feature |
| Extract mod mentions from text using regex `/m/([a-zA-Z0-9_-]+)` | Hook | Feature |
| Look up ModerationProfile by displayName to get associated User | Hook | Feature |
| Call `createInAppNotification` for each mentioned mod's user | Hook | Feature |
| Register hook in comment triggers (discussion, issue, event) | `hooks/commentTrigger.ts` | Integration |

**Notification text format:**
```
[@username](/u/username) mentioned you in a comment on [Discussion Title](/forums/channel/discussions/id)
```

### Frontend Changes

| Task | File | Type |
|------|------|------|
| Add `/m/` autocomplete to text editor mention suggestions | Text editor component | Feature |
| Show mod profiles in mention dropdown when typing `/m/` | Text editor component | Feature |
| Only show `/bot` option if channel has bots configured | Text editor component | Feature |

---

## Phase 3: Feedback Notifications

**Goal:** Users can opt-in to receive notifications when someone gives them feedback, with privacy considerations.

### Backend Changes

| Task | File | Type |
|------|------|------|
| User already has `notifyOnFeedback` field in schema | `typeDefs.ts` | Exists |
| Create notification when feedback comment is created | `commentTrigger.ts` or new hook | Feature |
| Notification text should NOT include feedback content (privacy) | Hook | Privacy |
| Email subject should be generic: "You received feedback" | Email service | Privacy |

**Notification text format (privacy-safe):**
```
You received feedback on your [comment](/forums/channel/discussions/id/comments/commentId). [View feedback](/forums/channel/feedback/discussionId)
```

### Frontend Changes

| Task | File | Type |
|------|------|------|
| Add "Feedback" tab to notification page | `pages/notifications/index.vue` | Feature |
| Create `NotificationTabs.vue` component | `components/notifications/NotificationTabs.vue` | Feature |
| Filter notifications by type (feedback vs general) | Notification queries | Feature |
| Add `isFeedbackNotification` field or text pattern matching | Query/Component | Feature |

**Approach for identifying feedback notifications:**
- Option A: Add `notificationType` field to Notification schema
- Option B: Pattern match notification text (starts with "You received feedback")

**Recommendation:** Option A is cleaner - add `type` field to Notification schema.

### Schema Change

```graphql
type Notification {
  id: ID! @id
  createdAt: DateTime! @timestamp(operations: [CREATE])
  read: Boolean
  text: String
  type: String  # NEW: "feedback", "mention", "reply", "moderation", etc.
}
```

---

## Phase 4: Issue/Moderation Action Notifications

**Goal:** Notify users subscribed to issues when moderation actions occur.

### Backend Changes

| Task | File | Type |
|------|------|------|
| Create `issueModerationActionNotificationHook.ts` | `hooks/issueModerationActionNotificationHook.ts` | Feature |
| Trigger notification when ModerationAction is created on Issue | Hook | Feature |
| Get all users with `SUBSCRIBED_TO_NOTIFICATIONS` on the Issue | Cypher query | Feature |
| Notification text includes action type and link to issue | Hook | Feature |

**Notification text format:**
```
A moderation action was taken on [Issue #123](/forums/channel/issues/123) you are subscribed to.
```

### Archived Content Notification Enhancement

| Task | File | Type |
|------|------|------|
| Update archive notification text to mention reopening | Archive mutation | Feature |
| Include support email as fallback | Notification text | Feature |

**Enhanced notification text:**
```
Your [comment](/link) was archived. You can request review by commenting on [Issue #123](/forums/channel/issues/123). If you need help, contact support@example.com.
```

---

## Phase 5: One-Click Unsubscribe Links

**Goal:** Every notification includes an unsubscribe link that takes the user directly to unsubscribe.

### Backend Changes

| Task | File | Type |
|------|------|------|
| Include unsubscribe info in notification text | All notification hooks | Feature |

**Notification text format (enhanced):**
```
[@user](/u/user) replied to [Discussion Title](/forums/channel/discussions/id?action=unsubscribe).

You are subscribed by default. [Change notification settings](/account_settings#notifications) | [Unsubscribe from this discussion](/forums/channel/discussions/id?action=unsubscribe)
```

### Frontend Changes

| Task | File | Type |
|------|------|------|
| Handle `?action=unsubscribe` query param on discussion detail | `pages/forums/[forumId]/discussions/[discussionId].vue` | Feature |
| Auto-unsubscribe and show toast notification | Discussion detail page | Feature |
| Update subscribe button state after auto-unsubscribe | Discussion detail page | Feature |
| Implement same for events, comments, issues | Multiple pages | Feature |

**Implementation pattern:**
```typescript
// In onMounted or setup
const route = useRoute();
if (route.query.action === 'unsubscribe' && isAuthenticated.value) {
  await unsubscribeFromDiscussion();
  showToast('You have been unsubscribed from this discussion.');
  // Remove query param from URL
  router.replace({ query: { ...route.query, action: undefined } });
}
```

---

## Phase 6: Notification Preferences UI Enhancement

**Goal:** Notification text indicates subscription status with clear links.

### Notification Text Enhancements

All reply notifications should include footer:

```
---
You received this because you are subscribed [by default | to this discussion].
[Notification settings](/account_settings#notifications) | [Unsubscribe](/link?action=unsubscribe)
```

### Frontend Changes

| Task | File | Type |
|------|------|------|
| Create `NotificationFooter` helper that generates unsubscribe text | Backend hook utility | Feature |
| Update all notification-creating hooks to use this footer | Multiple hooks | Feature |

---

## Implementation Order

### Sprint 1: Foundation
1. [x] Phase 3 Schema Change - Add `notificationType` field to Notification
2. [x] Phase 1 - Bug fix for broken permalink (verified existing code is correct)
3. [x] Phase 3 Backend - Feedback notifications (feedbackNotificationHook.ts)

### Sprint 2: Mod Mentions & UI
4. [x] Phase 2 Backend - Mod mention notifications (modMentionNotificationHook.ts)
5. [ ] Phase 2 Frontend - Text editor /m autocomplete
6. [x] Phase 3 Frontend - Notification tabs (NotificationTabs.vue)

### Sprint 3: Unsubscribe Flow
7. Phase 5 Frontend - Handle `?action=unsubscribe` param
8. Phase 5 Backend - Add unsubscribe links to notifications
9. Phase 6 - Notification footer with subscription status

### Sprint 4: Issue Notifications
10. Phase 4 - Issue moderation action notifications
11. Phase 4 - Enhanced archived content notifications

---

## Files to Modify/Create

### Backend (New Files)
- [x] `hooks/modMentionNotificationHook.ts` - Created
- [x] `hooks/feedbackNotificationHook.ts` - Created
- [ ] `hooks/issueModerationActionNotificationHook.ts`
- [ ] `utils/notificationFooter.ts`

### Backend (Modify)
- [x] `typeDefs.ts` - Added `notificationType` field to Notification
- [x] `hooks/notificationHelpers.ts` - Updated to accept notificationType
- [x] `services/commentNotificationService.ts` - Integrated feedback, mod mention, and user mention hooks
- [ ] All notification-creating hooks - Add unsubscribe footer

### Frontend (New Files)
- [x] `components/notifications/NotificationTabs.vue` - Created

### Frontend (Modify)
- [x] `pages/notifications/index.vue` - Updated to use NotificationTabs
- [x] `graphQLData/notification/queries.js` - Added GET_FEEDBACK_NOTIFICATIONS, GET_GENERAL_NOTIFICATIONS
- [ ] `pages/forums/[forumId]/discussions/[discussionId].vue` - Handle unsubscribe action
- [ ] `pages/forums/[forumId]/events/[eventId].vue` - Handle unsubscribe action
- [ ] `pages/forums/[forumId]/issues/[issueId].vue` - Handle unsubscribe action
- [ ] Text editor components - Add /m autocomplete

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

### Pending Verification (Future Sprints)

#### Mod Mention Autocomplete (Sprint 2)
- [ ] Typing `/m/` shows mod profile autocomplete dropdown
- [ ] Autocomplete shows only moderators for the current channel
- [ ] Selecting a mod inserts `/m/profileName` syntax

#### Unsubscribe Flow (Sprint 3)
- [ ] Clicking unsubscribe link navigates to content with `?action=unsubscribe`
- [ ] Page auto-unsubscribes authenticated user
- [ ] Toast notification confirms unsubscription
- [ ] Subscribe button updates to "Subscribe" state
- [ ] Works for discussions, events, comments, and issues

#### Issue Moderation Notifications (Sprint 4)
- [ ] Moderation action on issue triggers notification to all subscribers
- [ ] Archived content notification mentions how to reopen/appeal
- [ ] Notification includes link to the related issue
