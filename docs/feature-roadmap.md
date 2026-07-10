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

### 3. Downloadable file permanent delete permission flow `[complete]`

- [x] Define the exact moderator permission using the existing moderation permission model.
- [x] Decide whether OP/uploader self-delete is allowed and under what product rules.
- [x] Decide whether deletion hard-deletes the blob, detaches it, marks it deleted, or combines those steps.
- [x] Preserve upload/storage metadata for new downloadable-file uploads so deletion/audit flows do not reconstruct storage paths later. `[in draft PR]`
- [x] Add backend permanent-delete mutation support for downloadable files that deletes the storage object before marking the database node removed.
- [x] Preserve additional deletion-specific metadata needed for moderation and audit history. `[in backend draft PR]`
- [x] Show the destructive action only to authorized users in the existing download edit surface.
- [x] Add a confirmation dialog that clearly says the file is permanently removed. `[in draft PR]`
- [x] Refresh download detail and list views after deletion by filtering permanently removed downloadable files out of discussion queries. `[in draft PR]`
- [x] Add uploader-facing file management so users can see their downloadable files grouped by linked discussion on profile/library pages and delete them from there when authorized. `[in draft PR]`
- [x] Add tests for OP allowed, unrelated user rejected, permitted moderator allowed, and moderator without permission rejected across backend and frontend surfaces. `[in this slice]`

Notes:
- Delete confirmation copy exists for individual downloadable files in the edit form in the current frontend draft slice.
- Backend PR gennit-project/multiforum-backend#118 added `permanentlyDeleteDownloadableFile` on top of the shared storage deletion utility.
- The current draft slice adds an owner-scoped backend query and `/library/uploads` management page for uploaded downloadable files.
- This slice adds scalar permanent-removal audit fields and focused authorization/storage-failure tests for downloadable-file deletion.
- Backend draft PR gennit-project/multiforum-backend#116 and frontend draft PR gennit-project/multiforum-nuxt#266 add verified upload storage metadata for new downloadable files, including `storageObjectName` and `storageUrl`.
- Status reconciled to `[complete]`: the referenced draft PRs have merged. Backend `main` exposes `permanentlyDeleteDownloadableFile` (and the storage-deletion hardening from multiforum-backend#121); no related PRs remain open.

### 4. Download filters: review and finish include/exclude semantics `[complete]`

- [x] Confirm current exclude behavior in the actual download-list query path.
- [x] Make filter-group create/update/delete operations atomic and validated end-to-end.
- [x] Ensure deleting a filter group does not leave stale selected filters in URLs or saved settings.
- [x] Add remaining tests for filter-group mutation validation, including invalid filter-group input.
- [x] Review UX details: empty-group validation, delete confirmation/reversal, clear "must include" vs "must exclude" labels, and readable/shareable URL state.

Notes:
- Channel admin UI for filter groups already exists.
- Include/exclude modes, ordering, YAML editing, and validation are already present in the frontend.
- This slice fixes channel download-list query semantics so `INCLUDE` groups require selected labels and `EXCLUDE` groups reject selected labels.
- This slice also ignores stale/deleted filter groups in download queries and removes stale `filter_*` URL params after the channel filter groups load.
- Focused tests now cover include/exclude query semantics, stale filter cleanup, mutation validation, and settings payload persistence.
- This slice fixes the channel settings save payload so existing filter groups/options are updated, new groups/options are created, and removed groups/options are deleted in the generated channel update mutation.
- Backend validation middleware now rejects invalid generated filter-group mutation payloads before writes run, including invalid keys/modes, empty new groups, duplicate group keys, and duplicate option values.
- Frontend form/YAML validation now catches invalid or duplicate filter configuration earlier and uses explicit "must include" / "must exclude" copy with remove confirmations.

### 5. Collection ordering `[done]`

- [x] Add or confirm the stable ordering model for collection membership.
- [x] Preserve order correctly when adding and removing items.
- [x] Define behavior when an item in the stored order no longer exists.
- [x] Add a reorder mutation with ownership checks.
- [x] Add reorder tests for success, non-owner rejection, missing-item behavior, and order preservation after add/remove.
- [x] Add reorder controls in the collection UI.
- [x] Persist reordering through the new mutation.
- [x] Keep keyboard-accessible move up/down controls.

Notes:
- Collections already have an `itemOrder` field and add-to-collection mutations push into it.
- Custom add/remove/reorder mutations now keep `itemOrder` deduplicated, prune removed items, normalize stale stored IDs, and append items missing from stored order.

### 6. Share public collections to a forum discussion `[done]`

- [x] Require collection visibility to be public before it can be shared to a discussion.
- [x] Add mutation input / relationships for attaching a collection to a new or existing discussion.
- [x] Enforce forum posting permissions plus collection ownership/visibility rules.
- [x] Add tests for public allowed, private rejected, non-owner rejected, and missing forum permission rejected.
- [x] Add a `Share to forum` action on public collection detail pages.
- [x] Let the user choose a forum and create or attach to a discussion.
- [x] Hide or explain the action for private collections.

Notes:
- This slice implements `shareCollectionAsDiscussion`, creating a normal forum discussion with the public collection embedded.
- The frontend uses the existing forum picker and renders shared collections with an embedded-card treatment similar to crossposts.

### 7. Submission UI for channels that do not allow the current post type `[complete]`

- [x] Review every channel/forum picker used for discussions, events, downloads, and similar flows.
- [x] On sitewide create flows that actually support forum choice and have a channel capability flag, keep unsupported forums visible in search results but disabled with a clear reason.
- [x] Prefer short reason copy such as `Does not allow events`.
- [x] Do not flood the default picker view with unavailable forums; show eligible forums first and surface unavailable forums in search results.
- [x] On forum-scoped create flows such as `/forums/[forumId]/.../create`, lock the forum control to the current forum instead of presenting a broad picker.
- [x] If a forum-scoped flow needs helper copy, explain that posting is limited to the current forum context.
- [x] Keep downloads forum-context-specific for now and do not add a sitewide create-download entry point in this slice.
- [x] Keep favorites and collection-based picker sections consistent with the same availability rules and reason text.
- [x] Add unit tests for picker search results, disabled-option rendering, blocked selection behavior, and disabled-safe bulk actions.

Notes:
- Events are the only current sitewide create flow with a channel capability flag. The event picker hides forums with events disabled from the default view, but shows them as disabled search results with `Does not allow events`.
- Forum-scoped discussion and event create pages lock the forum control to the current forum instead of offering cross-forum selection.
- Downloads remain intentionally forum-specific and exempt from this sitewide picker feature, because download creation depends on forum-specific labels/filter groups and ownership context.
- Discussion/channel owners cannot disable discussion submissions, so there is intentionally no `Does not allow discussions` flag or picker gating for discussion-sharing flows.
- Unit coverage now includes event eligibility in normal search results, favorite forums, collection-based bulk selection, disabled-option rendering, blocked selection behavior, and locked forum mode.

### 8. Images in multiple albums and fuller image-usage display `[complete]`

- [x] Change album-image modeling so one image can belong to multiple albums without re-uploading. `[in backend PR]`
- [x] Preserve uploader/original attribution on the image node anywhere it is reused by linking the same image node instead of creating a copy. `[in backend/frontend PRs]`
- [x] Define permissions for adding someone else's image to a collection or album: album owner may link active images into their own albums; existing collection ownership rules apply for image collections. `[in this slice]`
- [x] Add image-detail query support for albums containing the image, grouped into original-poster-owned albums vs other users' albums. `[in backend PR]`
- [x] Add tests for plural album membership during upload creation and grouped album results. `[in backend/frontend PRs]`
- [x] Add tests for permission enforcement and existing-image add/remove flows. `[in this slice]`
- [x] Add backend album add/remove flows that link existing images instead of requiring re-upload. `[in this slice]`
- [x] Let users save permitted images from image detail to their own album or image collection. `[in this slice]`
- [x] Add existing-image picker/search to album editor flows. `[in this slice]`
- [x] On image detail pages, show grouped image usage by original poster vs others. `[in frontend PR]`

Notes:
- Album editor flows now include a reusable-image picker for the user's uploads, favorites, and image collections.

### 9. Permanent media deletion and storage cleanup `[complete]`

- [x] Let authorized users delete album images permanently and remove the backing object from GCP/storage. `[in this PR]`
- [x] Store backend-verified storage metadata for new image and downloadable-file uploads, including the actual storage URL/object name returned by signed upload creation. `[in draft PR]`
- [x] Add shared backend storage deletion utility for image/downloadable-file objects.
- [x] Add backend permanent-delete mutations for uploaded images and downloadable files.
- [x] Add the first frontend permanent-delete flow for downloadable files in the download edit form. `[in draft PR]`
- [x] Add an owner-facing uploaded downloadable-file management page with storage-backed permanent delete. `[in draft PR]`
- [x] Let authorized users delete profile images permanently and remove the backing object from GCP/storage. `[in this slice]`
- [x] Add permanent delete support for forum banners, including storage cleanup. `[in this slice]`
- [x] Make storage cleanup behavior explicit and tested so database deletion and blob deletion stay in sync. `[in this slice]`
- [x] Define permissions separately for uploader/owner actions versus moderator/admin actions across these media types. `[in this slice]`
- [x] Add tests covering successful delete, unauthorized rejection, missing-file cleanup behavior, and stale-reference cleanup. `[in this slice]`

Notes:
- Album edit deletion now confirms and calls the backend permanent-delete mutation before removing the image from the album UI.
- This slice adds storage-backed permanent delete for URL-backed profile images and forum banners by resolving active URLs through upload audit metadata before clearing the owning profile/forum field.
- Status reconciled to `[complete]`: the referenced draft PRs have merged. Backend `main` exposes `permanentlyDeleteImage`, `permanentlyDeleteProfileImage`, and `permanentlyDeleteChannelBanner` (plus the profile/banner storage-cleanup work from multiforum-backend#124); no related PRs remain open.

### 10. Wiki: pinned sidebar pages `[complete]`

- [x] Add channel-sidebar support for pinned wiki pages.
- [x] Let users with the effective `canUpdateChannel` role permission pin and unpin existing wiki pages.
- [x] Add a matching action from wiki detail pages.

Notes:
- The backend exposes dedicated `pinWikiPageToChannel` and `unpinWikiPageFromChannel` mutations so pinning uses the same channel/default-role permission path as wiki editing instead of a frontend owner-status shortcut.
- The frontend refetches channel data after pin changes and renders pinned wiki pages in the forum sidebar.

### 11. Wiki: lock wiki pages to owners `[complete]`

- [x] Add a lock state for wiki pages. `[in backend/frontend PRs]`
- [x] Restrict editing of locked wiki pages to users with the effective wiki moderation permission. `[in backend/frontend PRs]`

Notes:
- Wiki pages now expose `locked`, `lockedAt`, `lockReason`, and `lockedByUsername` metadata.
- The backend rejects direct generated lock-field updates and requires the custom `lockWikiPage` / `unlockWikiPage` mutations for lock state changes.
- Locked wiki-page edits are blocked for ordinary wiki editors; users with the effective `canDeleteWiki` moderation permission can lock, unlock, and edit locked pages.
- The frontend shows locked-page banners, hides edit affordances for users without lock permission, and exposes lock/unlock controls on wiki detail pages.

### 12. Moderation: sticky comment on discussion or event `[complete]`

- [x] Let moderators sticky a comment so it appears at the top of a discussion or event comment list.
- [x] Define ordering, permissions, and unsticky behavior.

Notes:
- Sticky comments use the existing `canHideComment` moderation permission and are limited to root, active, non-feedback comments.
- Discussion and event comment queries return sticky metadata and sort sticky comments above the selected normal sort order.
- The frontend shows a `Stickied` badge and exposes sticky/unsticky actions from the comment menu for users with comment-hide permission.

### 13. Wiki search: featured wiki pages from server settings `[complete]`

- [x] Add server-admin configuration for featured wiki pages. `[in backend/frontend PRs]`
- [x] Surface featured pages in `/wiki/search`. `[in backend/frontend PRs]`

Notes:
- Server settings now store an ordered list of featured wiki page IDs through a dedicated backend mutation.
- The admin Wiki Settings tab provides a searchable picker with explicit up/down ordering.
- `/wiki/search` renders featured wiki pages above normal results and removes duplicates from the regular result list.

### 14. Favorites API optimization `[complete]`

- [x] Update image and channel list queries to include computed favorite state where missing. `[in backend/frontend PRs]`
- [x] Pass `initialIsFavorited` from parent list components consistently. `[in frontend PR]`
- [x] Add an equivalent optimized path for comments instead of relying on a per-item lookup.

Notes:
- Discussions are already optimized.
- Images and channels now expose computed favorite state for generated reads, and sorted channel results include authenticated favorite state.
- Image grids and channel header/sidebar surfaces pass the computed state into favorite buttons so those buttons skip their fallback lookup.
- Comment list/reply/event-comment payloads already include `isFavoritedByUser`, and `CommentButtons` passes it into `AddToCommentFavorites`; the per-item lookup remains only as a fallback for callers that do not provide state.

### 15. Auto-save for server settings and channel admin settings `[complete]`

- [x] Replace explicit save-button flows where appropriate with autosave behavior.
- [x] Start with plugins/settings areas called out in the original note.

Notes:
- Added a shared `useSettingAutosave` composable (per-field debounced save with
  visible Saving/Saved/error state, no-op skipping, coalescing, and no
  overlapping saves) plus a `SaveStatus` indicator (`aria-live` / `role=alert`).
  `FormComponent` gained an opt-in `showSaveButton` prop.
- Converted the settings tabs whose fields are simple, non-destructive scalars —
  each sends a SCOPED partial update, and the shared Save button is replaced by
  the status indicator on those tabs:
  - Server: Basic (`serverDescription`), Calendar (`enableEvents`).
  - Channel: Events (`eventsEnabled`), Images (`imageUploadsEnabled`,
    `markdownImagesEnabled`), Emoji (`emojiEnabled`), Feedback (`feedbackEnabled`).
- **Intentionally kept on explicit Save** (autosave is not appropriate — the
  "where appropriate" boundary): roles & permissions, plugins & secrets, rules
  editors, server/channel download **filter groups** and allowed file types,
  mods/owners management, suspensions, banner/icon upload & delete, and any
  drag-to-reorder flow (batched). These involve destructive, secret, permission,
  or complex nested-CRUD changes that should be deliberate.
- Mixed tabs (e.g. channel Basic: name/description alongside tags/banner) remain
  on explicit Save to avoid a half-autosaving form; converting just their scalar
  text fields is a possible future refinement, not required for this item.
- Backend needed no changes: `updateServerConfigs`/`updateChannels` already apply
  the update input as a partial update, so scoped single-field saves are safe.
- Frontend PRs gennit-project/multiforum-nuxt#323 (pattern + server tabs) and the
  channel-rollout PR stacked on it.

### 16. Event edit history: title and description revisions `[complete]`

- [x] Add event version-history schema fields for title and description revisions plus `DescriptionLastEditedBy`.
- [x] Add backend middleware/hook logic to snapshot prior values on update.
- [x] Add query support for event revision history.
- [x] Add frontend activity-feed components similar to discussion edit history.
- [x] Add moderator redaction/delete support for event description revisions if required.

Notes:
- Mirrors the discussion version-history pattern. The `Event` type now exposes
  `PastTitleVersions`, `PastDescriptionVersions`, and `DescriptionLastEditedBy`
  (reusing `TextVersion`); an `eventVersionHistoryHook` snapshots the prior
  title/description on update, wired via `eventVersionHistoryMiddleware`
  (generated `updateEvents`) and the custom `updateEventWithChannelConnections`
  resolver.
- Description revisions are redactable via `deleteEventDescriptionRevision`
  (the shared `redactTextVersionRevision`, `canEditEvents` permission). Titles
  are non-redactable, consistent with discussions.
- The frontend `GET_EVENT` query fetches the revision fields; `EventTitleVersions`
  renders the title feed and `EventDescriptionEditsDropdown` renders description
  edits, both reusing the shared `RevisionDiffModal`/`RevisionDiffContent`.
- Series edits (`updateEventInSeries`) are intentionally out of scope; single-event
  edits are covered. Extending history to series edits is a possible follow-up.
- Backend PR gennit-project/multiforum-backend#145; frontend PR stacked on top.

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
