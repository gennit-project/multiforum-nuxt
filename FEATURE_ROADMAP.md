# Feature Roadmap

## Remaining Implementation Work

### Super Upvotes

A super upvote is a **second upvote** unlocked only after the user has already upvoted AND writes a thank-you note to the author. The note goes to the author's **scratchpad** (a public comments section on their profile). The author can choose to make it visible or ignore it.

#### Phase 1: Schema Changes (Backend) - COMPLETED

| Task | File | Status |
|------|------|--------|
| Add `ScratchpadEntry` type with fields: id, createdAt, text, isPublic, sourceType, sourceId, sourceChannelUniqueName | `typeDefs.ts` | Done |
| Add `Author` relationship (User who wrote the entry) to ScratchpadEntry | `typeDefs.ts` | Done |
| Add `Recipient` relationship (User who receives the entry) to ScratchpadEntry | `typeDefs.ts` | Done |
| Extend User with `ScratchpadEntries` and `WrittenScratchpadEntries` relationships | `typeDefs.ts` | Done |
| Add `SuperUpvotedByUsers` relationship to Comment type | `typeDefs.ts` | Done |
| Add `SuperUpvotedByUsers` relationship to DiscussionChannel type | `typeDefs.ts` | Done |

#### Phase 2: Backend Mutations - COMPLETED

| Task | File | Status |
|------|------|--------|
| Create `createScratchpadEntry` mutation - validates user has upvoted, creates entry with isPublic=false, creates SUPER_UPVOTED relationship, sends notification | `createScratchpadEntry.ts` | Done |
| Create `updateScratchpadEntryVisibility` mutation - recipient can set isPublic true/false | `updateScratchpadEntryVisibility.ts` | Done |
| Create `deleteScratchpadEntry` mutation - recipient can delete entry (does not undo super upvote) | `deleteScratchpadEntry.ts` | Done |

#### Phase 3: Backend Queries - COMPLETED

Auto-generated OGM queries support filtering by Recipient and isPublic fields.

| Task | File | Status |
|------|------|--------|
| Fetch public entries for a user profile | OGM auto-generated | Done |
| Fetch private/pending entries for profile owner | OGM auto-generated | Done |

#### Phase 4: Frontend - Vote Button Changes - COMPLETED

| Task | File | Status |
|------|------|--------|
| Add rainbow super upvote button that appears only after user has regular-upvoted | `Votes.vue`, `VoteButtons.vue` | Done |
| Add rainbow super upvote button to discussion votes | `DiscussionVotes.vue`, `VoteButtons.vue` | Done |
| Show filled rainbow icon if user has already super-upvoted | Both VoteButtons | Done |
| Add `superUpvoteActive` and `superUpvoteLoading` props | Both VoteButtons | Done |

#### Phase 5: Frontend - Super Upvote Modal - COMPLETED

| Task | File | Status |
|------|------|--------|
| Create `SuperUpvoteModal.vue` - textarea for thank-you note, placeholder "thanks for your comment in [forumName]", 500 char limit | `SuperUpvoteModal.vue` | Done |
| Add gradient "Send & Super Upvote" button | `SuperUpvoteModal.vue` | Done |
| Wire modal to `createScratchpadEntry` mutation | `SuperUpvoteModal.vue` | Done |

#### Phase 6: Frontend - Scratchpad Components

| Task | File | Type |
|------|------|------|
| Create `ScratchpadEntry.vue` - displays single entry with author avatar, text, source link, timestamp | `ScratchpadEntry.vue` | Feature |
| Add "Make Public" and "Ignore" buttons for pending entries (recipient only) | `ScratchpadEntry.vue` | Feature |
| Create `ScratchpadSection.vue` - displays pending (owner only) and public entries | `ScratchpadSection.vue` | Feature |

#### Phase 7: Frontend - User Profile Integration

| Task | File | Type |
|------|------|------|
| Add "Scratchpad" tab to user profile page | `[username].vue` | Feature |
| Create `pages/u/[username]/scratchpad.vue` page | `scratchpad.vue` | Feature |
| Add "Super Upvotes Received" stat to UserProfileSidebar | `UserProfileSidebar.vue` | Feature |

#### Phase 8: Notifications

| Task | File | Type |
|------|------|------|
| Send notification when someone writes on user's scratchpad | `createScratchpadEntry.ts` | Feature |
| Notification text: "@username wrote on your scratchpad" with link to scratchpad page | Backend | Feature |

#### Phase 9: Karma Integration

| Task | File | Type |
|------|------|------|
| Update `weightedVotesCount` calculation: regular upvote = 1, super upvote = +1 additional | Backend | Feature |
| Add `superUpvoteKarma` field to User or calculate from relationships | Backend | Feature |

---

### Downloads and Collections

| Task | Type |
|------|------|
| Things you download are listed in your 'library' (auto-saved to special private collection on download) | Feature |
| Download detail page shows count of unique and total downloads | Feature |
| Remove X/Twitter link from "share this download" component | Cleanup |
| Customize attribution in the modal that appears after clicking download | Feature |
| OP or mod with sufficient permissions can permanently delete downloadable file on backend | Feature |
| Uploader can configure download modal to include links to Patreon, Buy Me a Coffee, Ko-fi, or PayPal.me | Feature |
| Can exclude packs when filtering downloads | Feature |
| Can change the order of a collection | Feature |
| Can delete/update/add filter group | Feature |
| Can share a collection to forum as a discussion if visibility is set to public | Feature |
| User profile has up to four pinned posts | Feature |
| Allow images to be in more than one album | Feature |
| Image detail page shows albums containing this image by OP and by others | Feature |

---

### Wiki

| Task | Type |
|------|------|
| Channel sidebar has pinned wiki pages | Feature |
| Channel owners and mods with appropriate permissions see "pin wiki page here" button to attach existing wiki page to channel sidebar | Feature |
| Can also pin a wiki page to channel sidebar as an action menu item on wiki detail page | Feature |
| Can lock a wiki page so only channel owners can edit it | Feature |
| Mod can sticky a comment on a discussion or event, making it appear at the top of comments list | Feature |
| Server admins can add featured wiki pages (via server settings) that show up at /wiki/search | Feature |

---

### Notifications

| Task | Type |
|------|------|
| If you tag a mod (/m) in an issue or discussion comment, they get a notification | Feature |
| Text editor in issue mentions /m and /u; mentions /bot only if it's a discussion and channel has bots configured | Feature |
| Fix broken permalink in notification ("freshManySlimyShoe edited your discussion test post September 28") | Bug |
| Get notified of feedback | Feature |
| Notification page has separate tabs for feedback vs everything else | Feature |
| Can toggle receiving notifications on feedback | Feature |
| Email notification does not reveal feedback content | Privacy |
| Make sure edits are visible from feedback page | Feature |
| Get notified when a support ticket you subscribed to has a moderation action | Feature |
| If content was archived, notification tells user they can reopen and comment on the issue; include support email as fallback | Feature |
| All notifications have one-click unsubscribe links | Feature |
| Notification says whether you are subscribed by default; link to notification settings to unsubscribe from all future, or link to detail page to unsubscribe from this one | Feature |
| Notification about reply to discussion contains "unsubscribe" link that goes to discussion with `?action=unsubscribe` query param | Feature |
| If `?action=unsubscribe` param present and user logged in, show notification saying unsubscribed and update button state | Feature |
| Similar unsubscribe flow for event replies | Feature |
| Similar unsubscribe flow for comment replies | Feature |
| Similar unsubscribe flow for issue notifications | Feature |

---

### Misc

| Task | Type |
|------|------|
| Adding emoji to comment should not update last updated date; need new field `textLastEdited` | Bug |
| In comment section, can search comments by text to find specific comments | Feature |
| Album image and detail page has share button (copy link, crosspost) | Feature |
| Discussion detail page comments have less left side padding at mobile width | UI |
| In comment search results page, each result list item should be a permalink | Feature |
| Well-tested function for making accurate permalink to comment on event, discussion, feedback, issue (both frontend and backend) | Feature |
| Reduce API calls on favorites lists - include whether user has favorited each item in fetch-list API call | Performance |
| Auto-save for server settings and channel admin settings (at least for plugins; should not have two save buttons) | UX |
| Activity feed shows title edit history of an event (similar to discussion detail pages) | Feature |
| Can see description edits of event | Feature |
| Add a way to deprecate a channel - lock for reasons unrelated to sitewide rule violations | Feature |

---

## Verification Guide

This section contains detailed step-by-step instructions for manually verifying completed features.

### Super Upvotes (Phases 1-5)

**Prerequisites:**
- Backend server running with updated schema
- Frontend regenerated types (`npm run compile`)
- Two test user accounts (one to give super upvote, one to receive)

**Test: Super Upvote on Comment**
1. Log in as User A
2. Navigate to a discussion with comments authored by User B
3. Click upvote on User B's comment (arrow should turn orange)
4. Verify a rainbow star button appears next to the upvote button
5. Click the rainbow star button
6. Verify SuperUpvoteModal opens with:
   - Rainbow star icon in header
   - "Super Upvote" title
   - Link to @UserB's profile
   - Textarea with placeholder mentioning the forum name
   - Character counter showing 500 remaining
   - Disabled gradient button (until text is entered)
7. Enter a thank-you message (e.g., "Great insight!")
8. Verify button becomes active with gradient styling
9. Click "Send & Super Upvote"
10. Verify modal closes
11. Verify rainbow star button is replaced by filled rainbow indicator

**Test: Super Upvote on Discussion**
1. Follow same steps as comment test but on a discussion post
2. Verify the super upvote button appears after upvoting the discussion

**Test: Validation**
1. Try to super upvote without first upvoting - verify button doesn't appear
2. Try to super upvote your own content - verify backend rejects
3. Try to super upvote the same content twice - verify backend rejects
4. Verify text over 500 characters shows error state

**Test: Scratchpad Entry Created**
1. After super upvoting, check database for ScratchpadEntry with:
   - `isPublic: false`
   - Correct `sourceType` ("comment" or "discussion")
   - Correct `sourceId`
   - Author relationship to User A
   - Recipient relationship to User B

**Test: Notification Sent**
1. After super upvoting, log in as User B
2. Check notifications for message: "@UserA wrote on your scratchpad"
