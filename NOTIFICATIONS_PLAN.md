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
1. Phase 3 Schema Change - Add `type` field to Notification
2. Phase 1 - Bug fix for broken permalink
3. Phase 3 Backend - Feedback notifications

### Sprint 2: Mod Mentions & UI
4. Phase 2 Backend - Mod mention notifications
5. Phase 2 Frontend - Text editor /m autocomplete
6. Phase 3 Frontend - Notification tabs (feedback vs general)

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
- `hooks/modMentionNotificationHook.ts`
- `hooks/feedbackNotificationHook.ts`
- `hooks/issueModerationActionNotificationHook.ts`
- `utils/notificationFooter.ts`

### Backend (Modify)
- `typeDefs.ts` - Add `type` field to Notification
- `hooks/commentTrigger.ts` - Register new hooks
- All notification-creating hooks - Add unsubscribe footer

### Frontend (New Files)
- `components/notifications/NotificationTabs.vue`

### Frontend (Modify)
- `pages/notifications/index.vue` - Add tabs
- `pages/forums/[forumId]/discussions/[discussionId].vue` - Handle unsubscribe action
- `pages/forums/[forumId]/events/[eventId].vue` - Handle unsubscribe action
- `pages/forums/[forumId]/issues/[issueId].vue` - Handle unsubscribe action
- Text editor components - Add /m autocomplete
- `graphQLData/notification/queries.js` - Filter by type

---

## Testing Checklist

### Mod Mentions
- [ ] Typing `/m/` shows mod profile autocomplete
- [ ] Submitting comment with `/m/modName` creates notification for mod
- [ ] Notification links to correct location

### Feedback Notifications
- [ ] Creating feedback triggers notification (if user opted in)
- [ ] Notification text does NOT include feedback content
- [ ] Email does NOT include feedback content
- [ ] Feedback tab shows only feedback notifications
- [ ] General tab excludes feedback notifications

### Unsubscribe Flow
- [ ] Clicking unsubscribe link goes to content with `?action=unsubscribe`
- [ ] Page auto-unsubscribes and shows toast
- [ ] Subscribe button updates to "Subscribe" state
- [ ] Works for discussions, events, comments, issues

### Issue Notifications
- [ ] Moderation action on issue triggers notification to subscribers
- [ ] Archived content notification mentions reopening
