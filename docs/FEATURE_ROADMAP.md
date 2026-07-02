# Feature Roadmap

## Prioritized Checklist

Status labels:
- `[complete]` The roadmap item is implemented and covered by targeted tests.
- `[partial]` Some frontend and/or schema groundwork exists, but the feature is not complete.
- `[not started]` No meaningful implementation was found in this frontend repo.

### 1. Downloads: auto-save downloaded items into the user's library `[complete]`

- [x] Confirm the download tracking model records the downloaded file/item and authenticated user while still supporting anonymous total counts.
- [x] Add or reuse a dedicated private system collection/list for downloaded items, such as `Downloaded Items` or `Downloads`.
- [x] On successful authenticated download, upsert the item into that private collection without duplicates.
- [x] Keep download activity separate from collection membership so repeat downloads increase totals without creating duplicate library entries.
- [x] Show the auto-saved download collection in the library with copy explaining why items appear there.
- [x] Add tests for anonymous download, first authenticated download, repeat authenticated download, and second-user download.
- [x] Ensure the special auto-saved downloads collection is private by default and cannot be accidentally exposed.

Notes:
- Completed by the merged downloads backend and frontend PRs.

### 2. Collections default to private on creation `[complete]`

- [x] Make newly created user collections private by default unless the user explicitly chooses another visibility.
- [x] Audit every collection-creation entry point so they behave consistently.
- [x] Add tests covering default-private creation and explicit visibility overrides.

Notes:
- The add-to-list creation flow now defaults to `PRIVATE` and includes an explicit public visibility override.
- The backend collection-create sanitizer also defaults missing visibility to `PRIVATE` while preserving explicit overrides.

### 3. Downloadable file permanent delete permission flow `[partial]`

- [x] Define the exact moderator permission using the existing moderation permission model.
- [x] Decide whether OP/uploader self-delete is allowed and under what product rules.
- [x] Decide whether deletion hard-deletes the blob, detaches it, marks it deleted, or combines those steps.
- [x] Preserve upload/storage metadata for new downloadable-file uploads so deletion/audit flows do not reconstruct storage paths later. `[in draft PR]`
- [x] Add backend permanent-delete mutation support for downloadable files that deletes the storage object before marking the database node removed.
- [ ] Preserve any additional deletion-specific metadata needed for moderation and audit history.
- [x] Show the destructive action only to authorized users in the existing download edit surface.
- [x] Add a confirmation dialog that clearly says the file is permanently removed. `[in draft PR]`
- [x] Refresh download detail and list views after deletion by filtering permanently removed downloadable files out of discussion queries. `[in draft PR]`
- [ ] Add uploader-facing file management so users can see their downloadable files grouped by linked discussion on profile/library pages and delete them from there when authorized.
- [ ] Add tests for OP allowed, unrelated user rejected, permitted moderator allowed, and moderator without permission rejected across backend and frontend surfaces.

Notes:
- Delete confirmation copy exists for individual downloadable files in the edit form in the current frontend draft slice.
- Backend PR gennit-project/multiforum-backend#118 added `permanentlyDeleteDownloadableFile` on top of the shared storage deletion utility.
- Backend draft PR gennit-project/multiforum-backend#116 and frontend draft PR gennit-project/multiforum-nuxt#266 add verified upload storage metadata for new downloadable files, including `storageObjectName` and `storageUrl`.

### 4. Download filters: review and finish include/exclude semantics `[partial]`

- [ ] Confirm current exclude behavior in the actual download-list query path.
- [ ] Make filter-group create/update/delete operations atomic and validated end-to-end.
- [ ] Ensure deleting a filter group does not leave stale selected filters in URLs or saved settings.
- [ ] Add tests for include-only, exclude-only, combined include/exclude, deleted-group cleanup, and invalid filter-group input.
- [ ] Review UX details: empty-group validation, delete confirmation/reversal, clear "must include" vs "must exclude" labels, and readable/shareable URL state.

Notes:
- Channel admin UI for filter groups already exists.
- Include/exclude modes, ordering, YAML editing, and validation are already present in the frontend.

### 5. Collection ordering `[partial]`

- [ ] Add or confirm the stable ordering model for collection membership.
- [ ] Preserve order correctly when adding and removing items.
- [ ] Define behavior when an item in the stored order no longer exists.
- [ ] Add a reorder mutation with ownership checks.
- [ ] Add reorder tests for success, non-owner rejection, missing-item behavior, and order preservation after add/remove.
- [ ] Add reorder controls in the collection UI.
- [ ] Persist reordering through the new mutation.
- [ ] Keep keyboard-accessible move up/down controls even if drag-and-drop is added later.

Notes:
- Collections already have an `itemOrder` field and add-to-collection mutations push into it.
- No reorder mutation or reorder UI was found.

### 6. Share public collections to a forum discussion `[not started]`

- [ ] Require collection visibility to be public before it can be shared to a discussion.
- [ ] Add mutation input / relationships for attaching a collection to a new or existing discussion.
- [ ] Enforce forum posting permissions plus collection ownership/visibility rules.
- [ ] Add tests for public allowed, private rejected, non-owner rejected, and missing forum permission rejected.
- [ ] Add a `Share to forum` action on public collection detail pages.
- [ ] Let the user choose a forum and create or attach to a discussion.
- [ ] Hide or explain the action for private collections.

### 7. Submission UI for channels that do not allow the current post type `[partial]`

- [ ] Review every channel/forum picker used for discussions, downloads, events, and similar flows.
- [ ] Decide whether unsupported channels should remain visible but disabled, or be filtered with clear explanatory copy.
- [ ] If disabled options are shown, include a reason such as `Does not allow downloads` or `Does not allow events`.
- [ ] If unsupported channels are filtered out, show explicit helper text explaining that some channels were removed because they do not allow the current post type.
- [ ] Add tests for both search results and selection behavior so users are not left guessing why a channel is unavailable.

Notes:
- Existing picker logic already filters channels by required flags in some flows, especially events.
- That filtering currently hides unsupported channels instead of clearly explaining why they are unavailable.

### 8. User profile pinned posts `[not started]`

- [ ] Define eligible pinned content types.
- [ ] Add a profile-level ordered relationship or ordered ID list with a max of four items.
- [ ] Add mutations to pin, unpin, and reorder pinned posts with ownership checks.
- [ ] Add tests for pin limit, owner-only updates, reorder, and deleted/archived content behavior.
- [ ] Render pinned posts on profile pages.
- [ ] Show edit controls only to the profile owner.
- [ ] Add clear empty states and limit messaging.

### 9. Images in multiple albums and fuller image-usage display `[partial]`

- [ ] Change album-image modeling so one image can belong to multiple albums without re-uploading.
- [ ] Preserve uploader/original attribution on the image node anywhere it is reused.
- [ ] Define permissions for adding someone else's image to a collection or album.
- [ ] Add image-detail query support for albums containing the image, grouped into original-poster-owned albums vs other users' albums.
- [ ] Add tests for multi-album membership, attribution preservation, permission enforcement, and grouped album results.
- [ ] Update album add/remove flows to link existing images instead of requiring re-upload.
- [ ] Let users save permitted images from someone else's album to their own library/collection.
- [ ] On image detail pages, show grouped image usage by original poster vs others.

Notes:
- The frontend already shows some cross-album/image-usage behavior.
- The current image detail page still appears centered on a single `Album`, not the full grouped usage model in this roadmap item.

### 10. Permanent media deletion and storage cleanup `[partial]`

- [x] Store backend-verified storage metadata for new image and downloadable-file uploads, including the actual storage URL/object name returned by signed upload creation. `[in draft PR]`
- [x] Add shared backend storage deletion utility for image/downloadable-file objects.
- [x] Add backend permanent-delete mutations for uploaded images and downloadable files.
- [x] Add the first frontend permanent-delete flow for downloadable files in the download edit form. `[in draft PR]`
- [ ] Let authorized users delete album images permanently and remove the backing object from GCP/storage.
- [ ] Let authorized users delete profile images permanently and remove the backing object from GCP/storage.
- [ ] Add permanent delete support for forum banners, including storage cleanup.
- [ ] Make storage cleanup behavior explicit and tested so database deletion and blob deletion stay in sync.
- [ ] Define permissions separately for uploader/owner actions versus moderator/admin actions across these media types.
- [ ] Add tests covering successful delete, unauthorized rejection, missing-file cleanup behavior, and stale-reference cleanup.

Notes:
- The repo has album/image editing and removal-from-local-state flows, but that is not the same as permanent backend deletion plus cloud-storage cleanup.

### 11. Wiki: pinned sidebar pages `[not started]`

- [ ] Add channel-sidebar support for pinned wiki pages.
- [ ] Let channel owners and authorized moderators pin an existing wiki page from channel UI.
- [ ] Add a matching action from wiki detail pages.

### 12. Wiki: lock wiki pages to owners `[not started]`

- [ ] Add a lock state for wiki pages.
- [ ] Restrict editing of locked wiki pages to channel owners per product rules.

### 13. Moderation: sticky comment on discussion or event `[not started]`

- [ ] Let moderators sticky a comment so it appears at the top of a discussion or event comment list.
- [ ] Define ordering, permissions, and unsticky behavior.

### 14. Wiki search: featured wiki pages from server settings `[not started]`

- [ ] Add server-admin configuration for featured wiki pages.
- [ ] Surface featured pages in `/wiki/search`.

### 15. Favorites API optimization `[partial]`

- [ ] Update image and channel list queries to include computed favorite state where missing.
- [ ] Pass `initialIsFavorited` from parent list components consistently.
- [ ] Add an equivalent optimized path for comments instead of relying on a per-item lookup.

Notes:
- Discussions are already optimized.
- Image and channel favorite buttons now accept `initialIsFavorited`.
- Comments still appear to use a separate lookup path.

### 16. Auto-save for server settings and channel admin settings `[not started]`

- [ ] Replace explicit save-button flows where appropriate with autosave behavior.
- [ ] Start with plugins/settings areas called out in the original note.

### 17. Event edit history: title and description revisions `[partial]`

- [ ] Add event version-history schema fields for title and description revisions plus `DescriptionLastEditedBy`.
- [ ] Add backend middleware/hook logic to snapshot prior values on update.
- [ ] Add query support for event revision history.
- [ ] Add frontend activity-feed components similar to discussion edit history.
- [ ] Add moderator redaction/delete support for event description revisions if required.

Notes:
- Discussions already have full version history.
- The roadmap notes indicate events still do not.

### 18. Channel deprecation flow `[not started]`

- [ ] Add a way to deprecate or lock a channel for reasons other than sitewide-rule enforcement.
- [ ] Define moderation/admin permissions and user-facing messaging.

## Removed From This Roadmap As Completed

The following items were removed because they appear complete in this frontend repo:

- Download detail page download counts
- Download share/attribution/support-link UX cleanup
- `textLastEdited` comment-edit timestamp fix
- Comment search by text
- Comment search result permalinks
- Shared permalink utility for comments across supported content types
- Album image/detail share button
- Discussion mobile comment-padding adjustment
