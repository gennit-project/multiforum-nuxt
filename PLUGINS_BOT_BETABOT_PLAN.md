# Beta-Bot Plugin — File-Level Implementation Plan

This document tracks the end-to-end work to add `/bot/<name>` mentions, forum-scoped bot users, and the Beta-Bot plugin. Update this as we go.

## Conventions & Decisions (locked)

- Bot usernames use a reserved prefix: `bot-`.
- Humans are blocked from registering usernames starting with `bot-`.
- Bot users are **unique per Channel** and linked via `Channel.Bots`.
- Mention syntax is strict: `/bot/<botName>` or `/bot/<botName>:<profile-id>`.
- Bot list is shown in forum sidebar and used for editor autocomplete.
- Bot users are real Users with `isBot = true` and `isDeprecated` support.

---

## Phase 1 — Schema & Username Guardrails

### Backend (gennit-backend)

- [x] **Schema: User**
  - Add fields: `isBot`, `botProfileId`, `isDeprecated`, `deprecatedReason`
  - Files:
    - `gennit-backend/typeDefs.ts`
    - `gennit-backend/src/generated/graphql.ts` (regen)
    - `gennit-backend/ogm_types.ts` (regen)

- [x] **Schema: Channel**
  - Add relationship: `Bots` (`BOT` edge)
  - Files:
    - `gennit-backend/typeDefs.ts`
    - `gennit-backend/src/generated/graphql.ts` (regen)
    - `gennit-backend/ogm_types.ts` (regen)

- [x] **Username prefix guard**
  - Block `bot-` usernames for non-bot signups
  - Files (candidate):
    - `gennit-backend/customResolvers/mutations/registerUser.ts` (or equivalent)
    - `gennit-backend/services/userService.ts` (if centralized)
    - `gennit-backend/utils/validation.ts`

---

## Phase 2 — Mention Parsing & Comment Events

### Backend (gennit-backend)

- [x] **Strict bot mention parser**
  - Parse `/bot/<botName>` and `/bot/<botName>:<profile-id>`
  - Validate `[a-z0-9-]+` for both segments
  - [x] Only attach mentions for discussion comments (skip events/issues/feedback)
  - Files (candidate):
    - `gennit-backend/utils/mentionParser.ts` (new)
    - `gennit-backend/services/commentService.ts` (wire in)

- [x] **Event payload**
  - Include parsed bot mentions in `comment.created`
  - [x] Gate bot plugin execution to discussion comments only (skip Event/Feedback comments)
  - Files:
    - `gennit-backend/services/pluginRunner.ts`
    - `gennit-backend/customResolvers/mutations/createComment.ts`

---

## Phase 3 — Bot User Provisioning + Plugin Context

### Backend (gennit-backend)

- [x] **Bot user creation/lookup**
  - Find or create bot user for (Channel + bot profile)
  - Enforce `bot-<channel>-<botName>` naming
  - Create `BOT` relationship to Channel
  - Files:
    - `gennit-backend/services/botUserService.ts` (new)
    - `gennit-backend/services/commentService.ts`

- [x] **Pre-provision bots on enable**
  - When the plugin is enabled for a channel, create bot users for the default profile and any configured profiles.
  - When profiles change, reconcile bot users (create missing, mark deprecated if removed).
  - Files:
    - `gennit-backend/customResolvers/mutations/enableServerPlugin.ts`
    - `gennit-backend/customResolvers/mutations/updateChannelPluginPipelines.ts`
    - `gennit-backend/services/botUserService.ts`

- [x] **Plugin context: create comment as bot**
  - Add context method: `createCommentAsBot(...)`
  - Ensure only plugin runner can call this
  - Files:
    - `gennit-backend/services/pluginRunner.ts`

- [ ] **Permissions**
  - Bot accounts cannot log in
  - Bot accounts can create comments only via plugin context
  - Files:
    - `gennit-backend/permissions.ts`
    - `gennit-backend/customResolvers/mutations/login.ts` (or equivalent)

---

## Phase 4 — UI: Bots in Forum Sidebar + Autocomplete

### Frontend (multiforum-nuxt)

- [x] Block `/bot/...` mentions in non-discussion comment editors
  - Applies to event comments, issue comments, and feedback modals
  - Files:
    - `gennit-nuxt/components/comments/CreateRootCommentForm.vue`
    - `gennit-nuxt/components/comments/CommentButtons.vue`
    - `gennit-nuxt/components/comments/CommentSection.vue`
    - `gennit-nuxt/components/event/detail/EventCommentsWrapper.vue`
    - `gennit-nuxt/components/event/detail/EventRootCommentFormWrapper.vue`
    - `gennit-nuxt/components/mod/IssueDetail.vue`
    - `gennit-nuxt/components/GenericFeedbackFormModal.vue`

- [x] **GraphQL query**
  - Add `Channel.Bots { id username displayName isDeprecated }`
  - Files:
    - `gennit-nuxt/graphQLData/...` (forum query)

- [x] **Sidebar list**
  - Display bots like Admins list
  - Link to bot profile page
  - Show “Inactive” badge for `isDeprecated`
  - Files:
    - `gennit-nuxt/components/channel/ChannelSidebar.vue`

- [x] **Editor autocomplete**
  - Use `Channel.Bots` to suggest `/bot/<name>` entries
  - Disable deprecated bots in list
  - Files:
    - `gennit-nuxt/components/TextEditor.vue`
    - `gennit-nuxt/components/discussion/form/InlineCommentForm.vue`
    - `gennit-nuxt/utils/botMentions.ts`

---

## Phase 5 — Beta-Bot Plugin (Server + Channel Settings)

### Plugins repo (multiforum-plugins)

- [ ] **Plugin manifest**
  - (Replaced by demo plugins below; keep or delete if we still want a dedicated beta-bot.)

- [ ] **Plugin code**
  - (Replaced by demo plugins below; keep or delete if we still want a dedicated beta-bot.)

---

## Phase 5.5 — Demo Plugins (Multiforum Plugins Repo)

### Plugins repo (multiforum-plugins)

- [x] **Generic ChatGPT Bot Profiles**
  - `id: chatgpt-bot-profiles`
  - Configurable profile array + default profile
  - Uses `/bot/<name>` with profile selection
  - Files:
    - `multiforum-plugins/plugins/chatgpt-bot-profiles/plugin.json`
    - `multiforum-plugins/plugins/chatgpt-bot-profiles/index.ts`

- [x] **Creative Writing Beta Reader**
  - `id: beta-reader-bot`
  - Ships with 4 default prompts
  - Same bot reply flow, tuned to writing feedback
  - Files:
    - `multiforum-plugins/plugins/beta-reader-bot/plugin.json`
    - `multiforum-plugins/plugins/beta-reader-bot/index.ts`

---

## Phase 6 — Admin UI for Profiles

### Frontend (multiforum-nuxt)

- [ ] **Server settings**
  - Render profiles array (repeatable fields)
  - Files:
    - `gennit-nuxt/components/plugins/PluginSettingsForm.vue`
    - `gennit-nuxt/components/plugins/fields/*`

- [ ] **Channel settings override**
  - Toggle + profiles editor
  - Files:
    - `gennit-nuxt/pages/forums/[forumId]/edit/plugins.vue`
    - `gennit-nuxt/components/plugins/PluginSettingsForm.vue`

---

## Phase 7 — Deprecation & Safety

### Backend (gennit-backend)

- [ ] Mark bot users as deprecated
- [ ] Prevent posting if deprecated
- Files:
  - `gennit-backend/services/botUserService.ts`
  - `gennit-backend/services/pluginRunner.ts`

### Frontend (multiforum-nuxt)

- [ ] Show inactive badge in sidebar/autocomplete
- Files:
  - `gennit-nuxt/components/channel/ForumSidebar.vue`
  - `gennit-nuxt/components/editor/...`

---

## Notes / Open Questions

- Bots are not listed in any global user directory (none exists).
- Moderation applies to bots the same as humans (bots can be suspended).
- Store `promptUsed` and expose it via a link on bot-authored comments.
