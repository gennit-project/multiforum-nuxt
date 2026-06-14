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
