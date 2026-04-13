# Feature Roadmap

## Remaining Implementation Work

### Downloads and Collections

| Task                                                                                                    | Type    |
| ------------------------------------------------------------------------------------------------------- | ------- |
| Things you download are listed in your 'library' (auto-saved to special private collection on download) | Feature |
| Download detail page shows count of unique and total downloads                                          | Feature |
| Remove X/Twitter link from "share this download" component                                              | Cleanup |
| Customize attribution in the modal that appears after clicking download                                 | Feature |
| OP or mod with sufficient permissions can permanently delete downloadable file on backend               | Feature |
| Uploader can configure download modal to include links to Patreon, Buy Me a Coffee, Ko-fi, or PayPal.me | Feature |
| Can exclude packs when filtering downloads                                                              | Feature |
| Can change the order of a collection                                                                    | Feature |
| Can delete/update/add filter group                                                                      | Feature |
| Can share a collection to forum as a discussion if visibility is set to public                          | Feature |
| User profile has up to four pinned posts                                                                | Feature |
| Allow images to be in more than one album                                                               | Feature |
| Image detail page shows albums containing this image by OP and by others                                | Feature |

---

### Wiki

| Task                                                                                                                                 | Type    |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| Channel sidebar has pinned wiki pages                                                                                                | Feature |
| Channel owners and mods with appropriate permissions see "pin wiki page here" button to attach existing wiki page to channel sidebar | Feature |
| Can also pin a wiki page to channel sidebar as an action menu item on wiki detail page                                               | Feature |
| Can lock a wiki page so only channel owners can edit it                                                                              | Feature |
| Mod can sticky a comment on a discussion or event, making it appear at the top of comments list                                      | Feature |
| Server admins can add featured wiki pages (via server settings) that show up at /wiki/search                                         | Feature |

---

### Notifications ✅ Complete

All notification tasks have been implemented. See [NOTIFICATIONS_PLAN.md](./NOTIFICATIONS_PLAN.md) for detailed verification guide.

| Task                                                                                                                                                                       | Type    | Status |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| If you tag a mod (/m) in an issue or discussion comment, they get a notification                                                                                           | Feature | ✅     |
| Text editor in issue mentions /m and /u; mentions /bot only if it's a discussion and channel has bots configured                                                           | Feature | ✅     |
| Fix broken permalink in notification ("freshManySlimyShoe edited your discussion test post September 28")                                                                  | Bug     | ✅     |
| Get notified of feedback                                                                                                                                                   | Feature | ✅     |
| Notification page has separate tabs for feedback vs everything else                                                                                                        | Feature | ✅     |
| Can toggle receiving notifications on feedback                                                                                                                             | Feature | ✅     |
| Email notification does not reveal feedback content                                                                                                                        | Privacy | ✅     |
| Make sure edits are visible from feedback page                                                                                                                             | Feature | ✅     |
| Get notified when a support ticket you subscribed to has a moderation action                                                                                               | Feature | ✅     |
| If content was archived, notification tells user they can reopen and comment on the issue; include support email as fallback                                               | Feature | ✅     |
| All notifications have one-click unsubscribe links                                                                                                                         | Feature | ✅     |
| Notification says whether you are subscribed by default; link to notification settings to unsubscribe from all future, or link to detail page to unsubscribe from this one | Feature | ✅     |
| Notification about reply to discussion contains "unsubscribe" link that goes to discussion with `?action=unsubscribe` query param                                          | Feature | ✅     |
| If `?action=unsubscribe` param present and user logged in, show notification saying unsubscribed and update button state                                                   | Feature | ✅     |
| Similar unsubscribe flow for event replies                                                                                                                                 | Feature | ✅     |
| Similar unsubscribe flow for comment replies                                                                                                                               | Feature | ✅     |
| Similar unsubscribe flow for issue notifications                                                                                                                           | Feature | ✅     |

---

### Misc

| Task                                                                                                                            | Type        | Status |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| Adding emoji to comment should not update last updated date; need new field `textLastEdited`                                    | Bug         | ✅     |
| In comment section, can search comments by text to find specific comments                                                       | Feature     | ✅     |
| Album image and detail page has share button (copy link, crosspost)                                                             | Feature     | ✅     |
| Discussion detail page comments have less left side padding at mobile width                                                     | UI          |        |
| In comment search results page, each result list item should be a permalink                                                     | Feature     | ✅     |
| Well-tested function for making accurate permalink to comment on event, discussion, feedback, issue (both frontend and backend) | Feature     |        |
| Reduce API calls on favorites lists - include whether user has favorited each item in fetch-list API call                       | Performance |        |
| Auto-save for server settings and channel admin settings (at least for plugins; should not have two save buttons)               | UX          |        |
| Activity feed shows title edit history of an event (similar to discussion detail pages)                                         | Feature     |        |
| Can see description edits of event                                                                                              | Feature     |        |
| Add a way to deprecate a channel - lock for reasons unrelated to sitewide rule violations                                       | Feature     |        |

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

### Scratchpad Components (Phases 6-7)

**Test: Scratchpad Page**

1. Navigate to /u/[username]/scratchpad
2. Verify page loads without errors
3. If user has no scratchpad entries, verify empty state message appears

**Test: Pending Entries (Profile Owner)**

1. Log in as User B (who received super upvotes)
2. Navigate to your own scratchpad page
3. Verify "Pending Entries" section appears with yellow background
4. Verify each entry shows:
   - Author avatar and name
   - "super upvoted your comment/post" text with link
   - Timestamp
   - The thank-you message
   - "Make Public" and "Ignore" buttons
5. Click "Make Public" on an entry
6. Verify entry moves to "Public Entries" section
7. Verify entry now shows "Hide" and "Delete" buttons

**Test: Public Entries (All Users)**

1. Log out and view User B's scratchpad as anonymous
2. Verify only public entries are visible
3. Verify no action buttons appear for non-owners

**Test: Delete Entry**

1. Log in as User B
2. Click "Delete" on a public entry
3. Confirm deletion in dialog
4. Verify entry is removed
5. Verify super upvote relationship is NOT removed (check database)

**Test: Profile Tab**

1. Navigate to /u/[username]
2. Verify "Scratchpad" tab appears in profile tabs
3. Click tab and verify navigation to scratchpad page

---

## Quick Start: Testing Super Upvotes

### Prerequisites

- Backend server running with updated schema
- Frontend running with regenerated types (`npm run compile`)
- Two test user accounts (User A to give super upvote, User B to receive)

### Steps

1. **Log in as User A** and find content (comment or discussion) authored by User B

2. **Upvote the content** (click the regular upvote arrow)
   - The arrow should turn orange indicating an active upvote

3. **Look for the rainbow star button** that appears next to the upvote
   - This only appears after you've already upvoted

4. **Click the rainbow star** to open the Super Upvote modal
   - You should see a gradient header with a star icon
   - A textarea with placeholder text mentioning the forum
   - A character counter (500 max)
   - A disabled gradient "Send & Super Upvote" button

5. **Write a thank-you note** (e.g., "Great insight, thanks for sharing!")
   - The button should become active once you type something

6. **Click "Send & Super Upvote"**
   - Modal should close
   - The rainbow star button should be replaced by a filled rainbow indicator

7. **Log in as User B** and check:
   - **Notifications**: Should see "@UserA wrote on your scratchpad"
   - **Scratchpad page**: Navigate to `/u/[userB]/scratchpad`
   - **Pending entries**: Should see the entry with yellow background
   - **Make Public**: Click to move entry to public section
   - **Public entries**: Entry now shows with white background and "Hide"/"Delete" buttons

8. **Log out and view User B's scratchpad**
   - Only public entries should be visible
   - No action buttons should appear for non-owners

---

### Comment Text Edit vs Emoji Reaction (textLastEdited Fix)

**Purpose:** Verify that emoji reactions don't show as "Edited" but text changes do.

**Prerequisites:**

- Backend deployed with `textLastEdited` field on Comment type
- Frontend types regenerated (`npm run compile`)
- Two test user accounts

**Test: Emoji Reaction Should Not Show "Edited"**

1. Log in as User A
2. Create a new comment on any discussion
3. Note the comment header - should show "posted X ago" with no "Edited" indicator
4. Log in as User B (or use another browser)
5. Add an emoji reaction to User A's comment
6. Refresh the page
7. Verify the comment header still shows "posted X ago" with NO "Edited" indicator
8. Add more emoji reactions
9. Verify still no "Edited" indicator appears

**Expected Outcome:**

- Emoji reactions update the `emoji` JSON field and `updatedAt`
- But since `textLastEdited` is not set, no "Edited" indicator appears
- The comment appears as if it was never edited

**Test: Text Edit Should Show "Edited"**

1. Log in as User A
2. Edit the text of the same comment (change the content)
3. Submit the edit
4. Observe the comment header

**Expected Outcome:**

- "Edited X ago" indicator appears after the creation timestamp
- The "Edits" dropdown appears (if revision history exists)
- Clicking the dropdown shows the edit history
- `textLastEdited` field is populated with the edit timestamp

**Test: Backward Compatibility**

1. Find a comment that was edited BEFORE this fix was deployed
2. Verify it still shows "Edited X ago" indicator
3. This works because the frontend falls back to `updatedAt` if:
   - `textLastEdited` is not set AND
   - `PastVersions` array has entries (indicating there was a text edit)

**Files Changed:**

- Backend: `typeDefs.ts` - Added `textLastEdited: DateTime` to Comment type
- Backend: `hooks/commentVersionHistoryHook.ts` - Sets `textLastEdited` when text changes
- Frontend: `graphQLData/comment/queries.js` - Added `textLastEdited` to queries
- Frontend: `components/comments/CommentHeader.vue` - Uses `textLastEdited` for "Edited" display

---

### Comment Search Within Discussion/Event

**Purpose:** Allow users to search through comments within a discussion or event page.

**Implementation:** Client-side filtering of loaded comments (searches only currently loaded comments, not all comments in the database).

**Test: Basic Search Functionality**

1. Navigate to a discussion with multiple comments
2. Observe the search input below the sort buttons
3. Type a word that appears in one of the comments
4. Verify the comment list filters to show only matching comments
5. Verify "X of Y loaded" indicator appears showing filter results

**Expected Outcome:**

- Search input appears below sort buttons when there are comments
- Comments filter in real-time as you type
- Filter count shows "X of Y loaded" when filtering
- Search is case-insensitive

**Test: Clear Search**

1. Enter search text that filters comments
2. Click the X button in the search input
3. Verify search is cleared and all comments reappear

**Test: No Results**

1. Enter search text that doesn't match any loaded comment
2. Verify message "No comments match [search text]" appears
3. Clear search to verify comments reappear

**Test: Event Comments**

1. Navigate to an event with comments
2. Verify search input also appears on event pages
3. Test that filtering works the same as on discussions

**Limitations:**

- Only searches currently loaded comments (not all comments)
- If a discussion has 500 comments but only 50 are loaded, search only covers those 50
- Users can "Load More" then search within the expanded set

**Files Changed:**

- Frontend: `components/comments/CommentSection.vue` - Added searchText ref, filteredComments computed, and search input UI

---

### Album and Image Share Button

**Purpose:** Allow users to easily copy a permalink to an image or album page.

**Test: Image Detail Page Share**

1. Navigate to any user's image detail page (`/u/{username}/images/{imageId}`)
2. Locate the "Share" button next to "Download" in the action buttons
3. Click the "Share" button
4. Verify "Link copied!" notification appears briefly
5. Paste the clipboard contents to verify the correct URL was copied

**Expected Outcome:**

- Share button appears with link icon
- Clicking copies the full URL (e.g., `https://example.com/u/username/images/abc123`)
- Success notification shows for 2 seconds
- Button works in both light and dark mode

**Test: Album Detail Page Share**

1. Navigate to any user's album detail page (`/u/{username}/albums/{albumId}`)
2. Locate the "Share" button in the header area
3. Click the "Share" button
4. Verify "Link copied!" notification appears
5. Paste to verify the correct album URL was copied

**Expected Outcome:**

- Share button appears on the right side of the header
- Clicking copies the full album URL
- Success notification shows for 2 seconds

**Files Changed:**

- Frontend: `pages/u/[username]/images/[imageId].vue` - Added share button and copy link functionality
- Frontend: `pages/u/[username]/albums/[albumId].vue` - Added share button and copy link functionality

---

### Comment Search Result Permalinks

**Purpose:** Comment search result cards should navigate directly to the matched comment, not just the surrounding discussion or event.

**Test: Discussion Comment Result**

1. Navigate to `/comments/search?searchInput={term}` with a search term that matches a discussion comment.
2. Verify the result card shows a `View comment` link.
3. Click the result card, outside the author and context links.
4. Verify navigation goes to `/forums/{forumId}/discussions/{discussionId}/comments/{commentId}`.
5. Verify the matched comment is highlighted on the permalink page.

**Test: Event Comment Result**

1. Search for a term that matches an event comment.
2. Verify the context link points to the forum-scoped event page.
3. Click `View comment`.
4. Verify navigation goes to `/forums/{forumId}/events/{eventId}/comments/{commentId}`.
5. Verify the matched comment is highlighted on the permalink page.

**Test: Nested Links**

1. Click the author name on a search result card.
2. Verify navigation goes to the user profile, not the comment permalink.
3. Click the discussion/event context link.
4. Verify navigation goes to the parent discussion/event page, not the comment permalink.

**Files Changed:**

- Frontend: `pages/comments/search.vue` - Made result cards keyboard/click navigable to comment permalinks and added explicit `View comment` links
- Frontend: `utils/commentPermalink.ts` - Added reusable comment permalink route helper
- Frontend: `utils/commentPermalink.spec.ts` - Added unit tests for discussion, event, and issue comment permalink routes
- Frontend: `composables/useCommentPermalink.ts` - Reused the shared helper for existing comment permalink behavior
- Frontend: `graphQLData/comment/queries.js` - Added event channel context to comment search results
