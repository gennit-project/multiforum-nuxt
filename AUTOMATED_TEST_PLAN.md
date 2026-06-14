# Automated Test Plan for Feature-Moderation Branch

This document outlines the automated test plan for the new functionality introduced in the `feature-moderation` branch. The plan follows a 10% integration tests (Playwright with mocked backend) / 90% unit tests (Vitest frontend, Node test runner backend) distribution.

## Overview

### Feature Categories

Based on the manual verification guides in `MODERATION_PLAN.md`, `NOTIFICATIONS_PLAN.md`, and `FEATURE_ROADMAP.md`, the new functionality spans these areas:

1. **User Suspension System** - Server and channel-level suspensions
2. **Moderator Suspension System** - Mod profile suspensions separate from user accounts
3. **Bot Suspension System** - Suspending automated bot accounts
4. **Server Admin/Mod Invites** - Invite workflow with pending/accept states
5. **Wiki Moderation** - Wiki revision redaction, reporting, edit history
6. **Image Moderation** - Album/profile/channel image reporting and archiving
7. **Channel Reporting & Locking** - Server-scoped channel reports and lock workflow
8. **Notification System** - Feedback tabs, mod mentions, unsubscribe links
9. **Download Labels Moderation** - Mod-editable download labels with audit trail
10. **Auto-Moderation Bot Plugin** - AI-powered content analysis

---

## Test Distribution Summary

| Category | Playwright (Integration) | Frontend Unit | Backend Unit | Total |
|----------|-------------------------|---------------|--------------|-------|
| User Suspension | 2 | 8 | 6 | 16 |
| Mod Suspension | 2 | 6 | 4 | 12 |
| Bot Suspension | 1 | 4 | 3 | 8 |
| Server Invites | 1 | 5 | 3 | 9 |
| Wiki Moderation | 2 | 8 | 5 | 15 |
| Image Moderation | 2 | 6 | 4 | 12 |
| Channel Lock | 2 | 6 | 4 | 12 |
| Notifications | 2 | 10 | 8 | 20 |
| Download Labels | 1 | 4 | 3 | 8 |
| Auto-Mod Bot | 1 | 3 | 4 | 8 |
| **Total** | **16** | **60** | **44** | **120** |

---

## 1. User Suspension System

### Playwright Integration Tests

**File:** `tests/playwright/mocked/suspensions/userSuspension.spec.ts`

| Test | Description |
|------|-------------|
| `suspended user sees blocked action notification` | Mock suspended user state, attempt to create discussion, verify suspension notice appears with issue link |
| `suspension expiry re-enables actions` | Mock expired suspension, verify user can create content without refresh |

### Frontend Unit Tests

**File:** `components/mod/SuspensionNotice.spec.ts`

| Test | Description |
|------|-------------|
| `renders channel suspension message with issue link` | |
| `renders server suspension message` | |
| `shows expiration date for time-limited suspensions` | |
| `shows indefinite text for permanent suspensions` | |

**File:** `composables/useUserSuspension.spec.ts`

| Test | Description |
|------|-------------|
| `returns active suspension when suspendedUntil is in future` | |
| `returns active suspension when suspendedIndefinitely is true` | |
| `returns null for expired suspensions` | |
| `computes isSuspended correctly` | |

### Backend Unit Tests

**File:** `hooks/suspensionCleanupHook.test.ts` (new)

| Test | Description |
|------|-------------|
| `disconnectExpiredSuspensions removes expired user suspensions` | |
| `disconnectExpiredSuspensions ignores indefinite suspensions` | |
| `disconnectExpiredSuspensions handles mixed expired/active` | |

**File:** `utils/suspensionUtils.test.ts` (new)

| Test | Description |
|------|-------------|
| `isExpiredSuspension returns true for past dates` | |
| `isExpiredSuspension returns false for future dates` | |
| `isExpiredSuspension returns false for indefinite suspensions` | |

---

## 2. Moderator Suspension System

### Playwright Integration Tests

**File:** `tests/playwright/mocked/suspensions/modSuspension.spec.ts`

| Test | Description |
|------|-------------|
| `suspended mod sees no mod UI elements on discussions` | Mock suspended mod profile, verify archive/report buttons hidden |
| `suspended mod can still post as regular user` | Verify comment creation works despite mod suspension |

### Frontend Unit Tests

**File:** `composables/useModSuspension.spec.ts` (new)

| Test | Description |
|------|-------------|
| `returns suspension when mod profile is suspended` | |
| `returns null for unsuspended mod profiles` | |
| `separates mod suspension from user suspension` | |

**File:** `components/mod/SuspendModButton.spec.ts` (new)

| Test | Description |
|------|-------------|
| `renders suspend button when mod is not suspended` | |
| `renders unsuspend button when mod is suspended` | |
| `disables button when user lacks permission` | |

### Backend Unit Tests

**File:** `resolvers/modSuspension.test.ts` (new)

| Test | Description |
|------|-------------|
| `suspendMod creates suspension linked to issue` | |
| `unsuspendMod removes active suspension` | |
| `mod suspension does not affect user permissions` | |
| `getActiveSuspension returns correct mod suspension state` | |

---

## 3. Bot Suspension System

### Playwright Integration Tests

**File:** `tests/playwright/mocked/suspensions/botSuspension.spec.ts`

| Test | Description |
|------|-------------|
| `suspended bot shows suspended badge in channel sidebar` | Mock suspended bot, verify red "Suspended" badge |

### Frontend Unit Tests

**File:** `components/channel/BotListItem.spec.ts` (new)

| Test | Description |
|------|-------------|
| `renders active indicator for non-suspended bots` | |
| `renders suspended badge for suspended bots` | |
| `renders bot icon for bot users` | |
| `shows deprecated badge alongside suspended badge` | |

### Backend Unit Tests

**File:** `hooks/botSuspensionHook.test.ts` (new)

| Test | Description |
|------|-------------|
| `blocks bot comment creation when suspended` | |
| `blocks bot report creation when suspended` | |
| `allows bot actions when not suspended` | |

---

## 4. Server Admin/Mod Invite Workflow

### Playwright Integration Tests

**File:** `tests/playwright/mocked/admin/serverInvites.spec.ts`

| Test | Description |
|------|-------------|
| `admin invite workflow creates pending state and shows accept page` | Mock invite, verify pending badge, navigate to accept page |

### Frontend Unit Tests

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

### Backend Unit Tests

**File:** `resolvers/serverInvites.test.ts` (new)

| Test | Description |
|------|-------------|
| `inviteServerAdmin creates pending invite` | |
| `acceptServerAdminInvite promotes user to admin` | |
| `cancelServerAdminInvite removes pending state` | |

---

## 5. Wiki Moderation

### Playwright Integration Tests

**File:** `tests/playwright/mocked/wiki/wikiModeration.spec.ts`

| Test | Description |
|------|-------------|
| `suspended user cannot edit wiki pages` | Mock suspended user, verify wiki edit buttons disabled |
| `wiki revision report creates issue` | Click report edit, submit form, verify success toast |

### Frontend Unit Tests

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

### Backend Unit Tests

**File:** `resolvers/wikiModeration.test.ts` (new)

| Test | Description |
|------|-------------|
| `deleteWikiRevision redacts body to [deleted]` | |
| `deleteWikiRevision preserves revision metadata` | |
| `reportWikiEdit creates issue with revision context` | |
| `suspended user blocked from wiki mutations` | |
| `wiki author can redact own revisions` | |

---

## 6. Image Moderation

### Playwright Integration Tests

**File:** `tests/playwright/mocked/images/imageModeration.spec.ts`

| Test | Description |
|------|-------------|
| `report image from lightbox creates issue` | Open lightbox, click report, submit form, verify toast |
| `archived image hidden from album view` | Mock archived image, verify not displayed |

### Frontend Unit Tests

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

### Backend Unit Tests

**File:** `resolvers/imageModeration.test.ts` (new)

| Test | Description |
|------|-------------|
| `archiveImage sets archived flag and creates action` | |
| `unarchiveImage clears archived flag` | |
| `permanentlyRemoveImage requires admin permission` | |
| `archived images excluded from album queries` | |

---

## 7. Channel Reporting & Locking

### Playwright Integration Tests

**File:** `tests/playwright/mocked/channels/channelLocking.spec.ts`

| Test | Description |
|------|-------------|
| `locked channel shows banner and blocks content creation` | Mock locked channel, verify banner, attempt create discussion |
| `channel report creates server-scoped issue` | Navigate to about page, report channel, verify issue created |

### Frontend Unit Tests

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

### Backend Unit Tests

**File:** `resolvers/channelLocking.test.ts` (new)

| Test | Description |
|------|-------------|
| `lockChannel creates issue and sets locked state` | |
| `unlockChannel clears locked state` | |
| `locked channel blocks content creation` | |
| `requires canLockChannel permission` | |

---

## 8. Notification System

### Playwright Integration Tests

**File:** `tests/playwright/mocked/notifications/notificationTabs.spec.ts`

| Test | Description |
|------|-------------|
| `feedback notifications appear in separate tab` | Mock feedback notification, verify tab separation |
| `unsubscribe link auto-unsubscribes and shows toast` | Navigate with ?action=unsubscribe, verify toast |

### Frontend Unit Tests

**File:** `components/notifications/NotificationTabs.spec.ts` (existing, extend)

| Test | Description |
|------|-------------|
| `renders general and feedback tabs` | |
| `shows unread count badges` | |
| `switches active tab on click` | |
| `mark all as read updates correct tab` | |

**File:** `utils/modMentions.spec.ts` (existing, ensure coverage)

| Test | Description |
|------|-------------|
| `hasModMention detects /m/ patterns` | |
| `buildModMentionOptions creates proper suggestions` | |
| `getModMentionState identifies trigger position` | |
| `filterModSuggestions filters by prefix` | |

**File:** `composables/useAutoUnsubscribe.spec.ts` (new)

| Test | Description |
|------|-------------|
| `triggers unsubscribe mutation when action param present` | |
| `removes action param from URL after unsubscribe` | |
| `does not trigger on page refresh` | |

### Backend Unit Tests

**File:** `hooks/feedbackNotificationHook.test.ts` (existing, ensure coverage)

| Test | Description |
|------|-------------|
| `creates notification with privacy-preserving text` | |
| `respects notifyOnFeedback preference` | |

**File:** `hooks/modMentionNotificationHook.test.ts` (existing, ensure coverage)

| Test | Description |
|------|-------------|
| `creates notification for /m/ mention` | |
| `skips self-mentions` | |
| `avoids duplicate notifications on edit` | |

**File:** `hooks/archivedContentNotificationHook.test.ts` (existing, extend)

| Test | Description |
|------|-------------|
| `notifies author when content is archived` | |
| `skips notification for self-archival` | |
| `includes issue link in notification` | |

**File:** `utils/notificationFooter.test.ts` (existing, ensure coverage)

| Test | Description |
|------|-------------|
| `builds unsubscribe URL correctly` | |
| `generates appropriate reason text` | |

---

## 9. Download Labels Moderation

### Playwright Integration Tests

**File:** `tests/playwright/mocked/downloads/downloadLabels.spec.ts`

| Test | Description |
|------|-------------|
| `mod can update download labels and see audit trail` | Navigate to download edit, change labels, verify activity tab |

### Frontend Unit Tests

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

### Backend Unit Tests

**File:** `resolvers/downloadLabels.test.ts` (new)

| Test | Description |
|------|-------------|
| `updateDownloadLabels creates moderation action for non-owner` | |
| `updateDownloadLabels skips action for owner` | |
| `requires canEditDiscussions permission for non-owner` | |

---

## 10. Auto-Moderation Bot Plugin

### Playwright Integration Tests

**File:** `tests/playwright/mocked/plugins/autoModerationBot.spec.ts`

| Test | Description |
|------|-------------|
| `plugin settings page displays all configurable options` | Navigate to plugin settings, verify form fields |

### Frontend Unit Tests

**File:** `components/admin/plugins/AutoModBotSettings.spec.ts` (new)

| Test | Description |
|------|-------------|
| `displays confidence threshold slider` | |
| `validates temperature range 0-1` | |
| `shows profile selection dropdown` | |

### Backend Unit Tests

**File:** `plugins/auto-moderation-bot/analyzeContent.test.ts` (new, in plugins repo)

| Test | Description |
|------|-------------|
| `returns violation data above confidence threshold` | |
| `returns no violation below threshold` | |
| `ignores bot-authored content` | |
| `formats report with confidence and explanation` | |

---

## Implementation Priority

### Phase 1: Core Suspension System (High Priority)

1. User suspension unit tests (frontend + backend)
2. Mod suspension unit tests (frontend + backend)
3. Suspension Playwright tests

### Phase 2: Notification System (High Priority)

1. Notification tab unit tests
2. Mod mention unit tests
3. Unsubscribe flow tests
4. Notification Playwright tests

### Phase 3: Content Moderation (Medium Priority)

1. Wiki moderation unit tests
2. Image moderation unit tests
3. Channel locking unit tests
4. Moderation Playwright tests

### Phase 4: Downloads & Plugins (Medium Priority)

1. Download labels unit tests
2. Bot suspension tests
3. Auto-mod plugin tests
4. Downloads Playwright tests

### Phase 5: Admin Features (Lower Priority)

1. Server invite unit tests
2. Admin page unit tests
3. Admin Playwright tests

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

## Mock Data Requirements

### Playwright Mock Fixtures

Each Playwright test requires mock GraphQL responses. Create fixtures in `tests/playwright/mocked/fixtures/`:

- `suspendedUser.json` - User with active channel/server suspension
- `suspendedMod.json` - Mod profile with active suspension
- `suspendedBot.json` - Bot user with active suspension
- `lockedChannel.json` - Channel with isLocked=true
- `pendingInvite.json` - Server admin/mod pending invite
- `wikiWithRevisions.json` - Wiki page with revision history
- `reportedImage.json` - Image with active report/issue
- `downloadWithLabels.json` - Download with filter group labels

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
