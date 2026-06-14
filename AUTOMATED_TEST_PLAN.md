# Automated Test Plan for Feature-Moderation Branch

This document outlines the automated test plan for the new functionality introduced in the `feature-moderation` branch. The plan follows a 10% integration tests (Playwright with mocked backend) / 90% unit tests (Vitest frontend, Node test runner backend) distribution.

---

## Remaining Work

### Phase 5: Admin Features

#### 4. Server Admin/Mod Invite Workflow

**Playwright Integration Tests**

**File:** `tests/playwright/mocked/admin/serverInvites.spec.ts`

| Test | Description |
|------|-------------|
| `admin invite workflow creates pending state and shows accept page` | Mock invite, verify pending badge, navigate to accept page |

**Frontend Unit Tests**

**File:** `pages/admin/accept-admin-invite.spec.ts` (new)

| Test | Description |
|------|-------------|
| `shows sign in required when not authenticated` | |
| `shows no invitation found when no pending invite` | |
| `shows accept button when invite exists` | |

**File:** `pages/admin/accept-mod-invite.spec.ts` (new)

| Test | Description |
|------|-------------|
| `shows mod profile required message when user has no mod profile` | |
| `shows accept button when mod profile and invite exist` | |

**Backend Unit Tests**

**File:** `resolvers/serverInvites.test.ts` (new)

| Test | Description |
|------|-------------|
| `inviteServerAdmin creates pending invite` | |
| `acceptServerAdminInvite promotes user to admin` | |
| `cancelServerAdminInvite removes pending state` | |

---

## Running the Tests

### Frontend Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit -- --run tests/unit/composables/useUserSuspension.spec.ts

# Run tests matching pattern
npm run test:unit -- --run suspension
```

### Frontend Playwright Tests

```bash
# Run all Playwright tests (mocked backend)
npm run test:playwright:mocked

# Run specific test file
npm run test:playwright:mocked -- tests/playwright/mocked/suspensions/userSuspension.spec.ts
```

### Backend Unit Tests

```bash
cd /Users/catherineluse/gennit/gennit-backend

# Run all tests
npm test

# Run specific test file
node --test --experimental-strip-types hooks/suspensionCleanupHook.test.ts
```

---

## Coverage Goals

| Category | Target Coverage |
|----------|-----------------|
| Suspension composables | 90% |
| Notification hooks | 85% |
| Moderation components | 80% |
| Admin pages | 75% |
| Permission utilities | 95% |

---

## Notes

- All Playwright tests use mocked GraphQL responses (no live backend required)
- Unit tests should mock external dependencies (Apollo, router, etc.)
- Backend tests use the Node test runner with ts-node
- Focus on testing business logic and user flows, not implementation details
- Each test should be independent and not rely on test ordering

---

---

# Completed Phases

## Phase 1: Core Suspension System ✅

**Completed:** All suspension system tests are in place.

### 1. User Suspension System

**Existing Tests:**

| File | Tests | Status |
|------|-------|--------|
| `tests/playwright/mocked/suspensions/suspendedUserNotices.spec.ts` | 3 | ✅ Existed |
| `components/SuspensionNotice.spec.ts` | 2 | ✅ Existed |
| `composables/useSuspensionNotice.spec.ts` | 2 | ✅ Existed |
| `composables/useSuspensionActionUI.spec.ts` | 4 | ✅ Existed |
| `components/comments/CommentSection.suspension.spec.ts` | 1 | ✅ Existed |

**Backend Tests (Already Existed):**

| File | Tests |
|------|-------|
| `rules/permission/getActiveSuspension.test.ts` | 15 |
| `rules/permission/disconnectExpiredSuspensions.test.ts` | 4 |
| `rules/permission/getActiveServerSuspension.test.ts` | ~5 |
| `rules/permission/suspensionNotification.test.ts` | ~3 |

### 2. Moderator Suspension System

**New Tests Created:**

| File | Tests | Status |
|------|-------|--------|
| `components/mod/SuspendModButton.spec.ts` | 4 | ✅ New |
| `tests/playwright/mocked/suspensions/suspendedModNotices.spec.ts` | 2 | ✅ New |

---

## Phase 2: Notification System ✅

**Completed:** All notification system tests are in place.

### Existing Frontend Tests

| File | Tests | Status |
|------|-------|--------|
| `components/notifications/NotificationTabs.spec.ts` | 10 | ✅ Existed |
| `utils/modMentions.spec.ts` | 24 | ✅ Existed |
| `composables/useAutoUnsubscribe.spec.ts` | 7 | ✅ Existed |

### New Playwright Tests

| File | Tests | Status |
|------|-------|--------|
| `tests/playwright/mocked/notifications/notificationTabs.spec.ts` | 1 | ✅ New |
| `tests/playwright/mocked/notifications/unsubscribeFlow.spec.ts` | 1 | ✅ New |

### Backend Tests (Already Existed)

| File | Status |
|------|--------|
| `hooks/feedbackNotificationHook.test.ts` | ✅ |
| `hooks/modMentionNotificationHook.test.ts` | ✅ |
| `hooks/userMentionNotificationHook.test.ts` | ✅ |
| `hooks/archivedContentNotificationHook.test.ts` | ✅ |
| `utils/notificationFooter.test.ts` | ✅ |
| `services/commentNotificationRecipients.test.ts` | ✅ |
| `services/commentNotificationService.test.ts` | ✅ |
| `services/eventUpdateNotifications.test.ts` | ✅ |
| `services/issueNotifications.test.ts` | ✅ |
| `middleware/issueSubscriptionNotificationMiddleware.test.ts` | ✅ |
| `tests/editNotifications.test.ts` | ✅ |
| `rules/permission/suspensionNotification.test.ts` | ✅ |

---

## Phase 3: Content Moderation ✅

**Completed:** Wiki moderation and channel locking tests are in place.

### Wiki Moderation

**New Tests Created:**

| File | Tests | Status |
|------|-------|--------|
| `components/wiki/WikiEditsDropdown.spec.ts` | 4 | ✅ New |
| `tests/playwright/mocked/wiki/wikiModeration.spec.ts` | 2 | ✅ New |

### Channel Locking

**New Tests Created:**

| File | Tests | Status |
|------|-------|--------|
| `components/channel/ChannelLockedBanner.spec.ts` | 6 | ✅ New |
| `tests/playwright/mocked/channels/channelLocking.spec.ts` | 2 | ✅ New |

---

## Phase 4: Downloads & Plugins ✅

**Completed:** Bot suspension display and download label tests are in place.

### Bot Suspension Display

**New Tests Created:**

| File | Tests | Status |
|------|-------|--------|
| `components/plugins/BotProfilesEditor.spec.ts` | 6 | ✅ New |
| `tests/playwright/mocked/suspensions/botSuspension.spec.ts` | 2 | ✅ New |

### Download Labels

**New Tests Created:**

| File | Tests | Status |
|------|-------|--------|
| `components/download/DownloadLabelPicker.spec.ts` | 6 | ✅ New |
| `tests/playwright/mocked/downloads/downloadLabels.spec.ts` | 2 | ✅ New |

### Notes

- Auto-Moderation Bot Plugin tests deferred - uses generic PluginSettingsSection component
- Backend tests for bot suspension and download labels already exist in the backend codebase

---

## Test Distribution Summary

| Category | Playwright | Frontend Unit | Backend Unit | Status |
|----------|-----------|---------------|--------------|--------|
| User Suspension | 3 | 9 | ~27 | ✅ Complete |
| Mod Suspension | 2 | 4 | (included above) | ✅ Complete |
| Notifications | 2 | 41 | 12 files | ✅ Complete |
| Wiki Moderation | 2 | 4 | (existing) | ✅ Complete |
| Channel Lock | 2 | 6 | (existing) | ✅ Complete |
| Bot Suspension | 2 | 6 | (existing) | ✅ Complete |
| Download Labels | 2 | 6 | (existing) | ✅ Complete |
| Server Invites | 0 | 0 | 0 | 🔲 Phase 5 |
