# Accessibility Audit & Remediation Plan — July 2026

Static audit of the Multiforum Nuxt app (488 components + 150 pages) against WCAG 2.1
AA. Findings were gathered by reading components across six areas (interactive controls,
forms/inputs, images/icons, nav/layout, discussion/comments/events, and
pages/features) plus corroborating greps. This is a **planning document**, not a set of
applied changes.

## How to read this

Work is grouped into phases **P0–P4** ordered by _impact × leverage ÷ effort_. Within a
phase, do the **systemic** items first — each is one edit that fixes many call sites.
Severities use WCAG impact language: Critical (blocks a task for AT/keyboard users),
Serious, Moderate, Minor.

Quantitative baseline (from grep):
- **0** skip-to-content links
- **0 / 150** pages with route-change focus management
- **92 / 150** pages share one non-descriptive document title; **104 / 150** render no `<h1>`
- **17** `outline-none` uses with no `focus-visible` replacement (invisible keyboard focus)
- **3** `aria-live` regions and **12** `aria-expanded` in the entire app
- **~40** `<img>` occurrences with no adjacent `alt`

---

## P0 — Systemic, highest leverage (small edits, app-wide reach)

These are the best return on effort: each fixes a primitive used in dozens of places.

1. **Restore visible keyboard focus on the two button primitives.** ✅ **DONE (2026-07-11)**
   `PrimaryButton.vue:51` and `SecondaryButton.vue:23` set `focus:outline-none` +
   `focus:ring-offset-2` + a `focus:ring-{color}` but **omitted the ring-width utility**
   (`focus:ring-2`), so Tailwind painted no ring — focus was invisible. Propagates to
   `CreateButton`, `SaveButton`. Fixed: added `focus:ring-2` to both; regression tests in
   `PrimaryButton.spec.ts` + new `SecondaryButton.spec.ts` assert ring width + color are present.
   - ✅ **Nav sweep DONE (2026-07-11):** added `focus-visible:ring-2` (+ ring color/offset) to
     `nav/ThemeSwitcher.vue` (both buttons), `nav/SearchButton.vue`, `nav/TopNav.vue:185`
     (notification bell), `nav/CreateAnythingButton.vue` (baseClasses variant), and
     `discussion/form/InlineCommentForm.vue` (textarea + submit); also gave the inline
     textarea the missing `aria-label="Add a comment"`. Regression tests added/updated in
     `ThemeSwitcher.spec.ts`, new `SearchButton.spec.ts`, `CreateAnythingButton.spec.ts`,
     and `InlineCommentForm.spec.ts`.
   - **Remaining:** a broader `outline-none`-without-replacement sweep (~18 more sites across
     the app) is still open as a lower-priority follow-up beyond the audit-named components.

2. **`VoteButton.vue` — expose toggle state + announce counts.** ✅ **DONE (2026-07-11)**
   Single primitive behind every upvote / super-upvote / emoji reaction / downvote.
   - Now forwards `aria-pressed="active"` and the (previously dead) `ariaLabel` prop into the
     button via `AuthButton`'s `v-bind` (merged in `mergedButtonProps`). Serious/Moderate.
   - `ButtonContent.vue` count span now has `aria-live="polite"` so tallies are announced;
     also removed its hardcoded `id="count"` (was a duplicate-ID bug across vote buttons —
     verified no references). Moderate.
   - Regression tests added in `VoteButton.spec.ts` (aria-pressed both states, aria-label
     forwarding) and new `ButtonContent.spec.ts` (polite live region). All 11 dependent vote
     specs pass (121 tests).
   - Reaches: `discussion/vote/VoteButtons.vue`, `comments/VoteButtons.vue`, `comments/Votes.vue`,
     `comments/EmojiButtons.vue`, `comments/NewEmojiButton.vue`, `DiscussionVotes.vue`.

3. **`MenuButton.vue` — make dropdowns keyboard-reachable.** ✅ **DONE (2026-07-11)**
   The teleported `role="menu"` had no focus-into-menu and no arrow-key roving. Implemented the
   WAI-ARIA menu-button keyboard pattern: focus moves to the first item when the panel mounts
   (via a `floatingRef` watch — race-free vs. counting ticks); ArrowUp opens onto the last item;
   ArrowUp/Down/Home/End rove with wraparound; Escape closes and restores focus to the trigger;
   menu items are now `tabindex="-1"` (programmatically focused, out of the Tab sequence); the
   activator gained an `onKeydown` handler (forwarded to custom slot activators too). Note: the
   focus-on-open watch must NOT be gated on `import.meta.client` (it's false in unit tests and
   the `!el` null-check already covers SSR). 6 keyboard tests added to `MenuButton.spec.ts`;
   all 191 tests across MenuButton + its 18 consumer components pass; type-check clean.
   Affects every comment/discussion/event/share action menu.

4. **`comments/CommentButtons.vue` — real buttons under every comment.** ✅ **DONE (2026-07-11)**
   "Cancel / Save / Permalink / Show N Replies / Hide N Replies" were
   `<span class="cursor-pointer" @click>` — not focusable or keyboard-operable. Converted all to
   `<button type="button">` (Tailwind Preflight keeps bare buttons transparent; added `p-0 border-0`
   resets on the underline-style ones to preserve appearance). Save is now a proper `:disabled`
   button; the show/hide-replies toggles carry `aria-expanded` (`true`/`false`). Also removed a
   dead `:to` binding on the permalink span (and the now-unused `useRoute`). Regression tests
   updated in `CommentButtons.spec.ts` (button-based finder + tag/disabled/aria-expanded asserts);
   105 tests across CommentButtons + comment real-mount specs pass; type-check clean.

   _Also (per user request, same pass):_ added `whitespace-nowrap` to `VoteButton.vue`'s base
   class so the up-arrow icon no longer wraps onto its own line on narrow upvote/vote buttons.

5. **`components/icons/*` (87 icon SVGs) — establish a name/hidden convention.** ✅ **DONE (2026-07-11)**
   Confirmed no call site passes an icon its own `aria-label` (names live on the parent), so
   icons are decorative everywhere. Added `aria-hidden="true"` to the root element of every icon
   (79 `<svg>` roots via codemod, plus `UserCircle.vue`'s wrapping `<span>`; the `<i>`/`<span>`
   Font-Awesome-based icons already had it). `MessageIcon.vue` is a bare `<path>` with no root
   element — left as a pre-existing oddity. Also fixed the icon-only interactive controls this
   surfaced (buttons whose only child is an icon, no accessible name): added `aria-label` +
   `type="button"` to the close buttons in `DownloadSuccessPopover.vue` and
   `LightboxInfoPanel.vue`, and the report button in `UserProfileSidebar.vue`. Added
   `icons/icons.a11y.spec.ts` — mounts **every** icon and asserts its root is `aria-hidden`
   (guards new icons). 86 icon tests + 125 consumer tests pass; type-check clean.

---

## P1 — Critical keyboard blockers & app shell

Specific controls that are completely unusable without a mouse, plus global shell gaps.

### Keyboard-inoperable custom widgets (Critical)
- **`MultiSelect.vue`** — trigger is `<div @click>` (`:311`), dropdown `<div>` has no
  `role="listbox"` (`:400`), options are `<div @click>` with no `role="option"`/`aria-selected`/
  arrow-keys (`:627,698`); the standalone checkbox `@click.stop` blocks its own toggle
  (`:641,712`). Rebuild as button-trigger combobox + roled listbox with arrow-key nav. Used
  by `TagPicker`.
- **`FileTypePicker.vue:65`** — `<div @click>` trigger, mouse-only open; chip-remove `<div>`/`<span>` unfocusable (`:81,88`).
- **`TagComponent.vue:84,100`** — interactive tag is a `<span @click>`; delete icon has no name/keyboard.
- **`collection/AddToListPopover.vue:494,529,686,722`** — list rows are `<div @click.stop>` with `readonly` checkbox; toggle is mouse-only.
- **`plugins/PluginPipeline.vue` & `plugins/ScopedPipelineView.vue`** — ✅ **DONE.** Both collapse
  headers render as a real `<button>` when collapsible (aria-expanded + aria-controls) and the
  chevron is an aria-hidden `<span>`.
- **`charts/GithubContributionChart.vue`** — ✅ **DONE (2026-07).** Day cells are now
  `role="button"` with a roving tabindex (one tabbable cell), arrow-key + Home/End
  navigation, Enter/Space to toggle day details, descriptive per-cell `aria-label`,
  `aria-pressed` for the selected day, and a visible focus-visible outline. Tests added.
- **`user/DiscussionItemInProfile.vue`, `user/EventItemInProfile.vue`** — ✅ **DONE.** Titles are
  real `<nuxt-link>`s and the `<li>` no longer carries `@click`.
  **`event/list/EventListItem.vue:215`** — title is already a real `<router-link>` (keyboard path
  exists); the residual whole-card `@click` is a multi-mode mouse convenience (select/preview/
  navigate) left in place.

### App shell (global, one edit each)
- **Skip-to-content link** — none exists. Add a visually-hidden-until-focused link as the first focusable element in `layouts/default.vue`, targeting the main content id. Serious.
- **`<main>` landmark mis-scoped** — `layouts/default.vue:73` wraps header + both `<nav>`s + slot + footer inside a single `<main>`, so banner/nav/contentinfo nest inside main. Move `<main>` to wrap only the page slot. Serious.
- **Mobile drawers have no dialog semantics** — `nav/SiteSidenav.vue:199-457` and `nav/RecentForumsDrawer.vue:68-98`: no focus trap, no focus move/restore, no `role="dialog"`/`aria-modal`, no Escape. Serious.
- **`nav/HamburgerMenuButton.vue:11` — `aria-expanded`/`aria-controls` hardcoded** and point at a non-existent `#mobile-menu`. Bind real state + correct id. Serious.
- **Route-change focus management** — no `router.afterEach` focus handling anywhere; SPA nav leaves focus on the clicked link. Add a global handler moving focus to the new page's `<main>`/`<h1>` (`tabindex="-1"` + `.focus()`). Moderate.

### Global search unnamed (Serious)
- **`SearchBar.vue:116,145`** — `<label for="search">` targets an id the `<input>` doesn't have (it only has `name="search"`); with the default empty placeholder the field has no accessible name. Used by the top-nav search and ForumFinder. Add `id="search"` (unique per instance).

---

## P2 — Page structure: titles, headings, landmarks

Systemic and mostly sweepable; large screen-reader-orientation impact.

- **Per-route document titles** — ✅ DONE (PR #361). `app.vue` sets a `titleTemplate` that
  suffixes each page's title with the server name (dedupe guard for title-less pages), and every
  primary route sets its own `useHead({ title })`. Top-level dynamic detail parents (forum, user,
  mod, discussion, download, event list) already had titles and cover their nested children;
  `admin/*` and `server/issues/*` inherit their parent wrapper's baseline title. Collection detail
  uses a dynamic title from the collection name. Only the event-detail route intentionally keeps its
  parent forum-name title (a dynamic event title can follow the discussion-detail SEO-head pattern
  later). Serious (WCAG 2.4.2). Gotcha: `NuxtRouteAnnouncer` now renders each title into a
  `role="status"` span, so any e2e `getByText('<TitleWord>')` on a titled route can hit a
  strict-mode double-match — assert by heading role instead.
- **Exactly one `<h1>` per page** — 104/150 pages render none; several start at `<h2>`
  (`pages/settings.vue:18`, `pages/account_settings.vue`, forum downloads/events index, user
  images index). Meanwhile header/sidebar components each emit their own `<h1>`
  (`channel/LargeChannelHeader.vue`, `channel/ChannelHeaderMobile.vue:43,53`,
  `user/UserProfileSidebar.vue`, `mod/ModProfileSidebar.vue`, `notifications/NotificationTabs.vue:268`,
  `auth/CreateUsernameForm.vue`, `dashboard/ChannelHealthDetailView.vue`,
  `mod/ModerationWizard.vue:311,318,629`, `mod/OriginalPosterActions.vue:176,182,285`,
  `mod/ModProfileSidebar.vue:60`, `admin/ServerRolesPanel.vue:37`,
  `admin/ServerMembershipPanel.vue:39`), risking multiple h1s when composed. Decide the
  rule: page shell owns the single `<h1>`, embedded sections/sidebars use `<h2>+`. Serious
  (WCAG 1.3.1 / 2.4.6).
- **`mod/BrokenRulesModal.vue:718`** — `<h2>` used to render the modal body message (not a heading); use `<p>` so the heading outline isn't polluted. Minor.
- **Logo `<h1>` on every page** — `nav/TopNav.vue:98` wraps the site name in `<h1>`, competing with page h1s. Demote to a plain link. Moderate.
- **Event detail heading** — `event/detail/EventDetail.vue:464` titles the page with `<h2>`, no `<h1>`. Promote. Moderate.
- **`text-gray-900` headings without `dark:` variant** render dark-on-dark: `pages/settings.vue:18`, `pages/library.vue`, `pages/forums/[forumId].vue`, wiki/edit pages, etc. Sweep-add `dark:text-gray-100`. Moderate.

---

## P3 — Announcements, status & error semantics

Pervasive: async loading/error/validation states swap silently (near-zero `aria-live` in the app).

- **Toasts** — `ToastNotification.vue:9` container is not a live region. Add `aria-live="polite"`/`role="status"` (assertive for errors). Moderate.
- **Form errors** — `ErrorBanner.vue:11`, `ErrorMessage.vue:8` lack `role="alert"`; inputs aren't tied to errors via `aria-describedby` + `aria-invalid`. Moderate.
- **Loading / empty / error text** without `role="status"`/`aria-live`/`aria-busy`. ✅ **Shared
  helper + first rollout DONE (2026-07):** added `components/StatusMessage.vue` (a persistent
  live-region wrapper: role status/alert, aria-live, aria-busy) and rolled it out to
  `user/NotificationList.vue`, `notifications/NotificationTabs.vue`,
  `channel/SearchableForumList.vue`, `channel/DownloadList.vue` (skeleton grid), and
  `plugins/PluginPipeline.vue` (loading/error). **Remaining:** `auth/CreateUsernameForm.vue:262`,
  `user/UserProfileSidebar.vue:171`, `settings/EditAccountSettingsFields.vue:182`,
  `dashboard/ChannelHealthDetailView.vue:336`, `plugins/ScopedPipelineView.vue`,
  `plugins/PipelineVisualEditor.vue`, `plugins/PipelineYamlEditor.vue`, plus ~45 mod/admin
  components (`admin/ImageReportsList.vue`, `admin/ServerSuspendedModList.vue:37`,
  `mod/IssueRelatedChannel.vue:112`, etc.) — wrap each with `<StatusMessage>`. Moderate.
- **`CharCounter.vue:34`** count and **`LoadingSpinner.vue`** state are silent. Add `aria-live` / `role="status"` + sr-only label. Minor.
- **`settings/SaveStatus.vue`** — ✅ **DONE.** The polite live region now lives on the persistent
  outer wrapper (with `aria-atomic`); saving/saved text swaps inside it. Error keeps `role="alert"`
  (alert-on-insert is correct). Minor.

---

## P4 — Remaining widgets, media, forms & polish

### Custom-widget ARIA
- `SortDropdown.vue` — ⚠️ **Dead component** (not imported anywhere; placeholder `<a href="#">`
  items). Flagged for deletion rather than ARIA-fixing; rebuild with `MenuButton.vue` if sort UI is
  needed later.
- `FilterChip.vue` — ✅ **DONE.** Trigger (and SSR fallback) now have `aria-haspopup` +
  `:aria-expanded` bound to `isOpen`.
- `nav/SiteSidenav.vue:237` search-type dropdown & `nav/CreateAnythingButton.vue:187` menu — add listbox/menu ARIA + arrow-key nav / focus-into-menu.
- `notifications/NotificationTabs.vue` & `channel/ChannelTabs.vue` — ✅ **DONE.** NotificationTabs
  (in-page) got the full `role="tablist"/"tab"/"tabpanel"` pattern with `aria-selected`, roving
  tabindex, and arrow-key switching; ChannelTabs (route nav via `TabButton`) got
  `aria-current="page"` on the active link.
- `TextEditor.vue` autocomplete — expose combobox/listbox ARIA (`aria-expanded`/`aria-controls`/`aria-activedescendant`) for `BotSuggestionsPopover`/`ModSuggestionsPopover`.
- `GenericButton.vue:33` (+ `GenericSmallButton:18`, `SaveButton:27`, `CancelButton:13`) — `@keydown.enter.prevent` cancels native Enter activation. Remove `.prevent`.

### Form labels & fields
- `filter/FilterOptionManager.vue` (~6×) & `filter/FilterGroupManager.vue` — `<label>` with no `for`, inputs no `id`. Associate them.
- `plugins/PipelineVisualEditor.vue:173,201` — unassociated `<select>` labels; remove-step (`:242`) title-only. Also provide keyboard reorder (drag-only today, `:147`).
- `auth/CreateUsernameForm.vue:177,235` — username/birthday label/id mismatch.
- `FormRow.vue` — ✅ **Partially DONE.** The label now uses a valid generated id (was the
  section-title text, spaces and all) and exposes it to the content slot as `field-id`. Full
  association still requires each consumer to bind `field-id` to its input.
- `RadioButtons.vue:25,34` — `<fieldset>` has no `<legend>`; hardcoded `name` breaks two instances per page.
- `TextInput.vue:63` — name falls back to placeholder; no `required`/`aria-required`.
- `text-editor/TextEditorToolbar.vue` — ✅ **DONE.** Buttons now carry full-word aria-labels
  (Bold/Italic/Heading 1/…/Toggle fullscreen) while keeping the visible glyph.
- `RulesEditor.vue` — ✅ **DONE** (both buttons have `type="button"`).
- **Placeholder-only inputs (no label/aria-label):** `admin/ServerMembershipEditor.vue:181,274` (admin/mod invite), `admin/plugins/PluginSecretsSection.vue:123` (secret value). Serious.
- `mod/BrokenRulesModal.vue:704` — "Suspend user for" `<label>` not associated with its `<select>` (`:708` has no `id`). Moderate.

### Media / charts text alternatives
- `charts/ContributionLineChart.vue:131` (+ `ChannelContributionChart.vue`) — `<canvas>` chart with no `role="img"`/`aria-label`/data-table alternative. Serious.
- `ModelViewer.vue:29` — hardcoded `alt="3D Model Preview"`; accept + forward a real `alt` from `image/ImageListItem.vue:52`. Fullscreen/close buttons rely on `title` only (`:14,60`).
- `LinkPreview.vue` — ✅ **DONE.** Image alt falls back to "Link preview image" when title is empty.
- `revision/RevisionDiffContent.vue` & `Table.vue` — ✅ **DONE.** Both diff tables have an sr-only
  `<caption>`; the generic `Table.vue` gained an optional `caption` prop rendering an sr-only caption.

### Icon-only buttons relying on `title` (add `aria-label`)
- `plugins/PluginLogsModal.vue:123` (close), `plugins/PipelineVisualEditor.vue:242` (remove),
  `plugins/ScopedPipelineView.vue:123` / `PluginPipeline.vue:81` (collapse chevron, also add `aria-expanded`),
  `plugins/fields/PluginSecretField.vue:153` (show/hide, add `aria-pressed`),
  `user/UserProfileSidebar.vue:96` (report), `nav/SiteSidenavLogout.vue:30` (icon-only logout link),
  `filter/FilterOptionManager.vue:655` (↑/↓ reorder).

### Contrast (light-mode small text below 4.5:1)
- `text-gray-400` hints: `plugins/fields/PluginNumberField.vue:114`, `PluginSecretField.vue:210`, `nav/SiteSidenav.vue:317`.
- `text-orange-500` badge: `user/UserProfileSidebar.vue` — ✅ **DONE** (role badges bumped to `text-orange-700` in light mode, `dark:text-orange-500`).
- `text-gray-400 dark:text-gray-500` fails both modes: `admin/ImageReportsList.vue` — ✅ **DONE** (flipped to `text-gray-500 dark:text-gray-400`).
- Typo `dak:text-white` → `dark:text-white` in `user/NotificationList.vue` — ✅ **DONE**.

### Tables / lists (mod & admin)
- `admin/ChannelHealthTable.vue` — ✅ **DONE** (`scope="col"` added to header cells).
- `admin/ServerSuspendedModList.vue:53` & `admin/ServerSuspendedUserList.vue` — `<div v-for>` lists losing semantics → `<ul role="list">`/`<li>`.
- `admin/ServerTabs.vue:166` — decorative chevron `<i>` needs `aria-hidden="true"`.

### Minor polish
- `nav/SiteLogo.vue:9` — placeholder `alt="Workflow"` (Tailwind template leftover) → real site name.
- `nav/Breadcrumbs.vue:56` — add `aria-current="page"`.
- `layout/SiteFooter.vue:47` — external link missing `rel="noopener noreferrer"` + new-window hint.
- `BackLink.vue:40` / `TextButtonDropdown.vue:40` — latent icon-only-with-no-name when text/label is empty; add fallback `aria-label`.
- `Tooltip.vue` / `common/IconTooltip.vue` — add Escape-to-dismiss (WCAG 1.4.13) and wire `aria-describedby`.
- `PlaceholderAvatar.vue:25` — decorative icon needs `aria-hidden`.
- `favorites/AddToFavoritesButton.vue:258` — optional `:aria-pressed`.

---

## Suggested execution order

| Phase | Theme | Rough effort | Why first |
|------|-------|--------------|-----------|
| P0 | 5 primitive fixes (focus ring, VoteButton, MenuButton, CommentButtons, icons) | ~1–2 days | One edit each → hundreds of call sites |
| P1 | Keyboard blockers + app shell (skip link, main, drawers, MultiSelect) | ~2–3 days | Removes total mouse-only barriers |
| P2 | Titles / headings / landmarks sweep | ~1–2 days | Orientation for every SR user; mechanical |
| P3 | Live-region/status helper + rollout | ~1 day | Silent async states everywhere |
| P4 | Widget ARIA, media alts, form labels, contrast, polish | ~2–3 days | Long tail |

### Guardrails to add alongside
- Add `eslint-plugin-vuejs-accessibility` (or `axe` in Playwright) to CI so regressions are caught. Recommend enabling it in `P0` so new code doesn't reintroduce these patterns.
- Add an axe pass to a few existing Playwright mocked specs (home, discussion detail, a form page) as smoke coverage.

_Per CLAUDE.md: implement incrementally, one file at a time, with unit/Playwright coverage per change._

---

## P5 — Lower-priority follow-ups (backlog)

Not called out by the original audit's high-leverage list; pick up after P0–P4.

- **Broad `focus:outline-none`-without-replacement sweep.** ✅ **Interactive controls DONE
  (2026-07):** added the focus-visible ring convention to the real focus targets —
  `IconButtonDropdown.vue` (both triggers), `TextButtonDropdown.vue` (both triggers),
  `nav/RecentForumsDrawer.vue` (Cancel button), `FileTypePicker.vue` (focus-within ring on the
  combobox pill), and `channel/DownloadNowButton.vue` (was missing the ring *width* so no ring
  painted — the P0 bug pattern). **Remaining (intentionally left):** non-focusable dropdown
  *panels* (`SelectComponent`, `IconButtonDropdown`/`TextButtonDropdown` menu containers,
  `event/detail/EventNotificationsMenu`, `nav/CreateAnythingButton` menu) and programmatically-
  focused page containers (`pages/admin.vue`, `pages/forums/[forumId].vue`, `pages/server/issues.vue`,
  the discussion/download detail panels, `pages/settings.vue`, `pages/create-username.vue`) — these
  are not keyboard focus targets. If any later gains a real `tabindex`, sweep it the same way:
  add `focus-visible:ring-2` + a ring color/offset (use `focus-visible:` for icon/toggle/input
  controls, `focus:ring-2` where the file already uses `focus:ring-*`). Find the current list with:
  ```
  grep -rn "outline-none" --include="*.vue" components pages \
    | grep -vi "focus-visible:ring\|focus:ring-[0-9]\|focus:ring-\(red\|green\|blue\|gray\|orange\|white\)\|focus:border"
  ```
  Add a class-presence regression test per component, as done for the P0/P1 fixes.
