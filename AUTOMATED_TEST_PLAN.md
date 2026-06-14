# Automated Test Plan for Feature-Moderation Branch

This document outlines the automated test plan for the new functionality introduced in the `feature-moderation` branch. The plan follows a 10% integration tests (Playwright with mocked backend) / 90% unit tests (Vitest frontend, Node test runner backend) distribution.

---

## Remaining Work

### Phase 3: Content Moderation (Current)

#### 5. Wiki Moderation

**Playwright Integration Tests**

**File:** `tests/playwright/mocked/wiki/wikiModeration.spec.ts`

| Test | Description |
|------|-------------|
| `suspended user cannot edit wiki pages` | Mock suspended user, verify wiki edit buttons disabled |
| `wiki revision report creates issue` | Click report edit, submit form, verify success toast |

**Frontend Unit Tests**

**File:** `components/wiki/WikiRevisionDiffModal.spec.ts` (existing, extend)

| Test | Description |
|------|-------------|
| `shows redact button for authorized users` | |
| `hides redact button for unauthorized users` | |
| `displays [deleted] for redacted revisions` | |
| `shows edit reason when present` | |

**File:** `components/wiki/WikiEditsDropdown.spec.ts` (new)

| Test | Description |
|------|-------------|
| `builds sequential revision pairs correctly` | |
| `shows current version badge on most recent` | |
| `opens diff modal on revision click` | |

**File:** `pages/u/[username]/wiki-edits.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays user wiki edits with page links` | |
| `filters by channel when selected` | |

**Backend Unit Tests**

**File:** `resolvers/wikiModeration.test.ts` (new)

| Test | Description |
|------|-------------|
| `deleteWikiRevision redacts body to [deleted]` | |
| `deleteWikiRevision preserves revision metadata` | |
| `reportWikiEdit creates issue with revision context` | |
| `suspended user blocked from wiki mutations` | |
| `wiki author can redact own revisions` | |

---

#### 6. Image Moderation

**Playwright Integration Tests**

**File:** `tests/playwright/mocked/images/imageModeration.spec.ts`

| Test | Description |
|------|-------------|
| `report image from lightbox creates issue` | Open lightbox, click report, submit form, verify toast |
| `archived image hidden from album view` | Mock archived image, verify not displayed |

**Frontend Unit Tests**

**File:** `components/image/ImageLightbox.spec.ts` (extend)

| Test | Description |
|------|-------------|
| `shows report button for logged-in users` | |
| `hides report button for anonymous users` | |
| `opens report modal on report click` | |

**File:** `components/mod/ImageIssueContent.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays image thumbnail and metadata` | |
| `shows uploader info with profile link` | |
| `displays report count badge` | |

**File:** `pages/admin/image-reports.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays image reports with type badges` | |
| `filters by open/closed status` | |

**Backend Unit Tests**

**File:** `resolvers/imageModeration.test.ts` (new)

| Test | Description |
|------|-------------|
| `archiveImage sets archived flag and creates action` | |
| `unarchiveImage clears archived flag` | |
| `permanentlyRemoveImage requires admin permission` | |
| `archived images excluded from album queries` | |

---

#### 7. Channel Reporting & Locking

**Playwright Integration Tests**

**File:** `tests/playwright/mocked/channels/channelLocking.spec.ts`

| Test | Description |
|------|-------------|
| `locked channel shows banner and blocks content creation` | Mock locked channel, verify banner, attempt create discussion |
| `channel report creates server-scoped issue` | Navigate to about page, report channel, verify issue created |

**Frontend Unit Tests**

**File:** `components/channel/LockedChannelBanner.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays lock reason when provided` | |
| `shows who locked and when` | |
| `renders on all channel pages` | |

**File:** `pages/admin/channel-reports.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays channel reports with lock status` | |
| `shows lock/unlock buttons based on state` | |
| `filters by open/closed status` | |

**Backend Unit Tests**

**File:** `resolvers/channelLocking.test.ts` (new)

| Test | Description |
|------|-------------|
| `lockChannel creates issue and sets locked state` | |
| `unlockChannel clears locked state` | |
| `locked channel blocks content creation` | |
| `requires canLockChannel permission` | |

---

### Phase 4: Downloads & Plugins

#### 3. Bot Suspension System

**Playwright Integration Tests**

**File:** `tests/playwright/mocked/suspensions/botSuspension.spec.ts`

| Test | Description |
|------|-------------|
| `suspended bot shows suspended badge in channel sidebar` | Mock suspended bot, verify red "Suspended" badge |

**Frontend Unit Tests**

**File:** `components/channel/BotListItem.spec.ts` (new)

| Test | Description |
|------|-------------|
| `renders active indicator for non-suspended bots` | |
| `renders suspended badge for suspended bots` | |
| `renders bot icon for bot users` | |
| `shows deprecated badge alongside suspended badge` | |

**Backend Unit Tests**

**File:** `hooks/botSuspensionHook.test.ts` (new)

| Test | Description |
|------|-------------|
| `blocks bot comment creation when suspended` | |
| `blocks bot report creation when suspended` | |
| `allows bot actions when not suspended` | |

---

#### 9. Download Labels Moderation

**Playwright Integration Tests**

**File:** `tests/playwright/mocked/downloads/downloadLabels.spec.ts`

| Test | Description |
|------|-------------|
| `mod can update download labels and see audit trail` | Navigate to download edit, change labels, verify activity tab |

**Frontend Unit Tests**

**File:** `components/download/DownloadActivityTab.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays label change history` | |
| `shows actor name and timestamp` | |
| `displays added labels with green badge` | |
| `displays removed labels with strikethrough` | |

**File:** `pages/forums/[forumId]/downloads/edit/[discussionId].spec.ts` (new)

| Test | Description |
|------|-------------|
| `loads existing labels into form` | |
| `submits label changes via mutation` | |

**Backend Unit Tests**

**File:** `resolvers/downloadLabels.test.ts` (new)

| Test | Description |
|------|-------------|
| `updateDownloadLabels creates moderation action for non-owner` | |
| `updateDownloadLabels skips action for owner` | |
| `requires canEditDiscussions permission for non-owner` | |

---

#### 10. Auto-Moderation Bot Plugin

**Playwright Integration Tests**

**File:** `tests/playwright/mocked/plugins/autoModerationBot.spec.ts`

| Test | Description |
|------|-------------|
| `plugin settings page displays all configurable options` | Navigate to plugin settings, verify form fields |

**Frontend Unit Tests**

**File:** `components/admin/plugins/AutoModBotSettings.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays confidence threshold slider` | |
| `validates temperature range 0-1` | |
| `shows profile selection dropdown` | |

**Backend Unit Tests**

**File:** `plugins/auto-moderation-bot/analyzeContent.test.ts` (new, in plugins repo)

| Test | Description |
|------|-------------|
| `returns violation data above confidence threshold` | |
| `returns no violation below threshold` | |
| `ignores bot-authored content` | |
| `formats report with confidence and explanation` | |

---

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

## Test Distribution Summary

| Category | Playwright | Frontend Unit | Backend Unit | Status |
|----------|-----------|---------------|--------------|--------|
| User Suspension | 3 | 9 | ~27 | ✅ Complete |
| Mod Suspension | 2 | 4 | (included above) | ✅ Complete |
| Notifications | 2 | 41 | 12 files | ✅ Complete |
| Wiki Moderation | 0 | 0 | 0 | 🔲 Phase 3 |
| Image Moderation | 0 | 0 | 0 | 🔲 Phase 3 |
| Channel Lock | 0 | 0 | 0 | 🔲 Phase 3 |
| Bot Suspension | 0 | 0 | 0 | 🔲 Phase 4 |
| Download Labels | 0 | 0 | 0 | 🔲 Phase 4 |
| Auto-Mod Bot | 0 | 0 | 0 | 🔲 Phase 4 |
| Server Invites | 0 | 0 | 0 | 🔲 Phase 5 |
