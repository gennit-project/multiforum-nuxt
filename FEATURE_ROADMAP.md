# Feature Roadmap

## Remaining Implementation Work

### Downloads and Collections

#### 1. Normalize Download Tracking and Library Auto-Save

**Goal:** Every successful download should have a durable record that can power download counts and the user's library.

**Backend work:**

- Confirm the existing download tracking model records both the downloaded file/item and the authenticated user, while still supporting anonymous total counts.
- Add or reuse a dedicated private system collection/list for each user's downloaded items, for example `Downloaded Items` or `Downloads`.
- On successful download, upsert the downloaded item into that private collection without duplicating entries when the same user downloads the same item multiple times.
- Keep download activity separate from collection membership so repeat downloads can increment total counts without creating duplicate library entries.
- Add tests for anonymous downloads, first authenticated download, repeat authenticated download, and download by a second user.

**Frontend work:**

- Show the auto-saved download collection in the user's library.
- Ensure the collection is private by default and cannot be accidentally shared unless the user explicitly changes visibility, if that is supported.
- Add copy explaining why a downloaded item appeared there, without treating it as a manually curated collection.

**Manual validation:**

- Download an item while logged out and verify only total count changes.
- Download an item while logged in and verify it appears in the user's library.
- Download the same item twice and verify the library has one entry but total downloads increase.
- Log in as a second user and verify unique download count increases.

#### 2. Add Download Counts to Download Detail Pages

**Goal:** Download detail pages should show both unique downloader count and total download count.

**Backend work:**

- Add query fields or resolver output for `uniqueDownloadCount` and `totalDownloadCount`.
- Count anonymous downloads only toward total downloads unless there is a stable anonymous identity model.
- Count each authenticated user once for unique downloads, regardless of repeat downloads.
- Add resolver tests for anonymous, repeat, and multi-user download scenarios.

**Frontend work:**

- Add both counts to the download detail page near existing download metadata.
- Use labels that distinguish "downloads" from "downloaders" clearly.
- Keep count display resilient when the backend returns zero or null during rollout.

#### 3. Clean Up and Extend Download Share/Attribution UX

**Goal:** Modernize the post-download/share flow and let uploaders configure appropriate attribution/support links.

**Frontend work:**

- Remove the X/Twitter link from the existing "share this download" component.
- Audit the modal that appears after clicking download and identify the source of its attribution text.
- Add uploader-controlled attribution text if the schema already supports it; otherwise add backend fields first.
- Add optional support links for Patreon, Buy Me a Coffee, Ko-fi, and PayPal.me.
- Validate link format on write and render only configured links in the post-download modal.
- Avoid showing empty sections when the uploader has not configured support links.

**Backend work:**

- Add structured fields for attribution/support links if they do not already exist.
- Validate allowed support-link domains or URL patterns server-side, not just in the form.
- Ensure only the uploader or an authorized moderator can update this configuration.

**Manual validation:**

- Download an item with no support links and verify the modal remains clean.
- Configure each supported link type and verify it appears after download.
- Try an invalid support URL and verify it is rejected.
- Verify the X/Twitter share option no longer appears.

#### 4. Add Permanent Delete Permission Flow for Downloadable Files

**Goal:** OPs and moderators with sufficient permissions can permanently delete downloadable files through explicit backend permission checks.

**Backend work:**

- Define the exact permission required for moderators, using the existing moderation permission pattern rather than an ad hoc mod check.
- Allow the uploader/OP to permanently delete their own downloadable file unless product rules require moderator-only deletion after publication.
- Decide whether permanent deletion removes the file blob, detaches it from content, marks it as deleted, or combines these steps.
- Preserve enough metadata for moderation/audit history if hard-deleting the file blob.
- Add tests for OP allowed, unrelated user rejected, permitted moderator allowed, and moderator without permission rejected.

**Frontend work:**

- Add a destructive action only where the current user is authorized.
- Use a confirmation dialog that clearly says the file will be permanently removed.
- Refresh download detail and list views after deletion.

#### 5. Review Download List Filtering and Filter Group Configuration

**Goal:** Filtering downloads should support excluding packs/items, and channel admins should be able to maintain filter groups reliably.

**Investigation first:**

- Confirm whether excluding packs/items when filtering download lists is already partially implemented.
- Review the existing channel settings UI for adding, updating, and deleting download filter groups.
- Identify whether filter group state is stored in channel config, server config, or a dedicated model.

**Implementation work:**

- Add explicit include/exclude semantics to the filter query model if missing.
- Make filter group create/update/delete operations atomic and validated.
- Ensure deleting a filter group does not leave stale selected filters in download list URLs or saved channel settings.
- Add tests for include-only, exclude-only, combined include/exclude, deleted group cleanup, and invalid filter group input.

**UX review checklist:**

- Empty filter groups have a clear disabled or validation state.
- Delete actions are reversible or require confirmation.
- Labels distinguish "must include" from "must exclude."
- The downloads list URL/query state stays readable and shareable.

#### 6. Add Collection Ordering

**Goal:** Users can change the order of items in a collection in their library.

**Backend work:**

- Add a stable ordering field to collection membership. Prefer ordered membership metadata over a raw array of IDs if the graph model supports relationship properties; otherwise use a separate ordered ID array.
- Preserve order when adding/removing items.
- Define behavior when an item in the ordered array no longer exists.
- Add mutations for reordering a collection with ownership checks.
- Add tests for reorder success, non-owner rejected, missing item rejected or ignored by defined policy, and order preservation after add/remove.

**Frontend work:**

- Add reorder controls to collection detail/edit UI.
- Persist the new order through the reorder mutation.
- Keep keyboard-accessible controls for moving items up/down even if drag-and-drop is added.

#### 7. Share Public Collections to a Forum Discussion

**Goal:** A public collection can be shared to a forum by attaching it to a new or existing discussion.

**Backend work:**

- Require collection visibility to be public before it can be attached to a forum discussion.
- Add relationship fields or mutation input for attaching a collection to a discussion.
- Enforce forum posting permissions and collection ownership/visibility.
- Add tests for public collection allowed, private collection rejected, non-owner rejected unless product allows sharing any public collection, and missing forum permission rejected.

**Frontend work:**

- Add a "Share to forum" action on public collection detail pages.
- Let the user choose a forum and create a discussion with the collection attached.
- Hide or explain the action for private collections.

#### 8. Add User Profile Pinned Posts

**Goal:** Users can pin up to four posts on their profile and edit that list themselves.

**Backend work:**

- Define eligible pinned content types, likely discussions first unless comments/downloads are explicitly in scope.
- Add a profile-level ordered relationship or ordered ID list with a maximum of four entries.
- Add mutations to pin, unpin, and reorder pinned posts with user ownership checks.
- Add tests for pin limit, owner-only updates, reorder, and deleted/archived content behavior.

**Frontend work:**

- Add pinned posts to the user profile page.
- Add edit controls visible only to the profile owner.
- Provide clear empty states and limit messaging.

#### 9. Allow Images in Multiple Albums and Show Image Usage

**Goal:** Images should be reusable across albums/collections without re-uploading, preserving original attribution.

**Backend work:**

- Change album-image modeling so the same image node can belong to multiple albums.
- Preserve uploader/original attribution on the image node and avoid copying image blobs when a user saves an image into their own collection or album.
- Define permissions for adding someone else's image to a collection or album based on image visibility.
- Add image detail queries for albums containing the image, grouped by albums owned by the original poster and albums owned by others.
- Add tests for adding one image to multiple albums, attribution preservation, permission enforcement, and grouped album query results.

**Frontend work:**

- Update album add/remove flows to link existing images rather than requiring re-upload.
- Let users save an image from someone else's album to their own library/collection when permitted.
- On image detail pages, show albums containing this image by the original poster and by other users in separate sections.
- Make attribution visible anywhere the reused image appears.

#### Recommended Slice Order

1. Download tracking and library auto-save, because it creates the data foundation for counts and library behavior.
2. Download detail counts, because it can reuse the tracking data from slice 1.
3. Share modal cleanup plus attribution/support links, because it is mostly isolated UI/configuration.
4. Permanent delete permissions, because it needs careful backend authorization and destructive-action UX.
5. Download filter group review and exclude semantics.
6. Collection ordering.
7. Share public collections to forum discussions.
8. Profile pinned posts.
9. Multi-album image reuse and image usage display, because it has the broadest modeling impact.

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

### Misc

| Task                                                                                                                            | Type        | Status |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| Adding emoji to comment should not update last updated date; need new field `textLastEdited`                                    | Bug         | ✅     |
| In comment section, can search comments by text to find specific comments                                                       | Feature     | ✅     |
| Album image and detail page has share button (copy link, crosspost)                                                             | Feature     | ✅     |
| Discussion detail page comments have less left side padding at mobile width                                                     | UI          | ✅     |
| In comment search results page, each result list item should be a permalink                                                     | Feature     | ✅     |
| Well-tested function for making accurate permalink to comment on event, discussion, feedback, issue (both frontend and backend) | Feature     | ✅     |
| Reduce API calls on favorites lists - include whether user has favorited each item in fetch-list API call (see notes below)     | Performance | ⏳     |
| Auto-save for server settings and channel admin settings (at least for plugins; should not have two save buttons)               | UX          |        |
| Activity feed shows title edit history of an event (similar to discussion detail pages) (see notes below)                       | Feature     | ⏳     |
| Can see description edits of event (see notes below)                                                                            | Feature     | ⏳     |
| Add a way to deprecate a channel - lock for reasons unrelated to sitewide rule violations                                       | Feature     |        |

#### Notes on Favorites API Optimization

**Current state (April 2026):**

- **Discussions:** Already optimized. `getSiteWideDiscussionList` and `getDiscussionsInChannel` include `isFavorited` in results. `AddToDiscussionFavorites` accepts `initialIsFavorited` prop to skip refetch.
- **Comments:** Have `isFavoritedByUser` in queries but `AddToCommentFavorites` lacks `initialIsFavorited` prop.
- **Images:** `AddToImageFavorites` makes separate API call per image. Needs `initialIsFavorited` prop and backend query changes.
- **Channels:** `AddToChannelFavorites` makes separate API call per channel. Needs similar optimization.

**Work required:**

1. Add `initialIsFavorited` prop to `AddToImageFavorites`, `AddToCommentFavorites`, `AddToChannelFavorites`
2. Update image/channel list queries to include `isFavorited` computed field
3. Update parent list components to pass `initialIsFavorited` prop

#### Notes on Event Edit History

**Current state:** Events have `editReason` field but NO version history tracking. Discussions already have full version history with `PastTitleVersions`, `PastBodyVersions`, and `BodyLastEditedBy`.

**Backend work required:**

1. **Schema update** (`typeDefs.ts`) - Add to Event type:
   ```graphql
   PastTitleVersions: [TextVersion!]! @relationship(type: "HAS_EVENT_TITLE_VERSION", direction: OUT)
   PastDescriptionVersions: [TextVersion!]! @relationship(type: "HAS_EVENT_DESCRIPTION_VERSION", direction: OUT)
   DescriptionLastEditedBy: User @relationship(type: "EVENT_DESCRIPTION_LAST_EDITED_BY", direction: OUT)
   ```

2. **Middleware** - Create `eventVersionHistoryMiddleware.ts`:
   - Hook into `updateEventWithChannelConnections` mutation
   - Snapshot old title/description before update

3. **Hook** - Create `eventVersionHistoryHook.ts`:
   - Mirror `discussionVersionHistoryHook.ts` logic
   - Create TextVersion records for old title/description
   - Track `DescriptionLastEditedBy`

**Frontend work required:**

1. **Query update** - Add version fields to `GET_EVENT` query
2. **Components** - Create `EventEditsDropdown.vue` and `EventTitleVersions.vue` (can reuse `RevisionDiffContent.vue`)
3. **Mutation** - Add `deleteEventDescriptionRevision` for moderator redaction

**Reference files:**
- `hooks/discussionVersionHistoryHook.ts` - Pattern to follow
- `middleware/discussionVersionHistoryMiddleware.ts` - Middleware pattern
- `components/discussion/detail/activityFeed/EditsDropdown.vue` - UI component to adapt

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

---

### Mobile Comment Padding

**Purpose:** Reduce left-side padding on discussion/event comments at mobile widths to provide more horizontal space for content.

**Test: Mobile Width Padding Reduction**

1. Navigate to a discussion with nested comments
2. Open browser developer tools and toggle device toolbar (Cmd+Shift+M or Ctrl+Shift+M)
3. Select a mobile viewport (e.g., iPhone 12 or 375px width)
4. Observe the comment layout:
   - Nested comment indentation should be visibly reduced
   - Comment text should have more horizontal reading space
   - Comments should not feel cramped or extend beyond viewport
5. Toggle to desktop viewport (e.g., 1280px width)
6. Verify the original larger padding returns at desktop widths

**Expected Behavior:**

| Element               | Mobile (< 640px) | Desktop (≥ 640px) |
| --------------------- | ---------------- | ----------------- |
| Nested comment indent | `pl-2`           | `pl-4`            |
| Comment body margin   | `ml-2`           | `ml-4`            |
| Comment body padding  | `pl-2`           | `pl-4`            |
| Comment text margin   | `ml-1`           | `ml-3`            |
| Child comments margin | `ml-1`           | `ml-3`            |

**Test: Event Comments**

1. Navigate to an event with comments
2. Repeat the mobile viewport test
3. Verify the same padding reduction applies to event comments

**Test: Deeply Nested Comments**

1. Find or create a discussion with 3+ levels of nested replies
2. At mobile width, verify the cumulative indentation is manageable
3. Comments should remain readable without excessive horizontal scrolling

**Files Changed:**

- Frontend: `components/comments/Comment.vue` - Added responsive Tailwind classes (`sm:` prefix) to reduce left margin and padding at mobile widths

---

### Comment Permalink Utility

**Purpose:** Provide a well-tested, centralized function for generating accurate permalinks to comments across all content types (discussions, events, issues, feedback).

**Implementation Overview:**

The `getCommentPermalinkRoute` function in `utils/commentPermalink.ts` handles all comment permalink generation:
- Accepts a comment object with optional context (DiscussionChannel, Event, Issue, Channel)
- Returns a Vue Router route object or null if insufficient context
- Supports fallback options for missing context fields
- Used by `useCommentPermalink` composable and search results page

**Test: Run Unit Tests**

```bash
npm run test:unit -- --run utils/commentPermalink.spec.ts
```

**Expected Outcome:**

- 6 tests pass covering:
  - Discussion comment permalinks
  - Event comment permalinks with channel context
  - Fallback to provided forum/event context
  - Issue comment permalinks
  - Null return when required context is missing
  - Forum ID resolution priority (Channel > DiscussionChannel > Event > Issue)

**Test: Verify Discussion Comment Permalinks**

1. Navigate to a discussion with comments
2. Click the "..." menu on any comment
3. Click "Copy Link"
4. Paste the URL - should match pattern: `/forums/{forumId}/discussions/{discussionId}/comments/{commentId}`
5. Navigate to the copied URL
6. Verify the correct comment is highlighted

**Test: Verify Event Comment Permalinks**

1. Navigate to an event with comments
2. Copy permalink from any comment
3. Verify URL matches: `/forums/{forumId}/events/{eventId}/comments/{commentId}`
4. Navigate to copied URL
5. Verify correct comment is highlighted

**Test: Verify Issue Comment Permalinks**

1. Navigate to a moderation issue with comments
2. Copy permalink from a comment
3. Verify URL matches: `/forums/{forumId}/issues/{issueNumber}/comments/{commentId}`
4. Navigate to copied URL
5. Verify correct comment is highlighted

**Test: Backend Email URLs**

1. Post a comment on a discussion that another user is subscribed to
2. Check the email notification sent to the subscriber
3. Verify the "View the comment" link points to the correct comment permalink
4. Click the link and verify it highlights the correct comment

**Files:**

- Frontend: `utils/commentPermalink.ts` - Core permalink generation function
- Frontend: `utils/commentPermalink.spec.ts` - 6 unit tests
- Frontend: `composables/useCommentPermalink.ts` - Vue composable wrapper
- Backend: `customResolvers/mutations/shared/emailUtils.ts` - Uses consistent URL patterns for emails
