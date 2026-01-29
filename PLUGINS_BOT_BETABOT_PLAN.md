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

- **Schema: User**
  - Add fields: `isBot`, `botProfileId`, `isDeprecated`, `deprecatedReason`
  - Files:
    - `gennit-backend/typeDefs.ts`
    - `gennit-backend/src/generated/graphql.ts` (regen)
    - `gennit-backend/ogm_types.ts` (regen)

- **Schema: Channel**
  - Add relationship: `Bots` (`BOT` edge)
  - Files:
    - `gennit-backend/typeDefs.ts`
    - `gennit-backend/src/generated/graphql.ts` (regen)
    - `gennit-backend/ogm_types.ts` (regen)

- **Username prefix guard**
  - Block `bot-` usernames for non-bot signups
  - Files (candidate):
    - `gennit-backend/customResolvers/mutations/registerUser.ts` (or equivalent)
    - `gennit-backend/services/userService.ts` (if centralized)
    - `gennit-backend/utils/validation.ts`

---

## Phase 2 — Mention Parsing & Comment Events

### Backend (gennit-backend)

- **Strict bot mention parser**
  - Parse `/bot/<botName>` and `/bot/<botName>:<profile-id>`
  - Validate `[a-z0-9-]+` for both segments
  - Files (candidate):
    - `gennit-backend/utils/mentionParser.ts` (new)
    - `gennit-backend/services/commentService.ts` (wire in)

- **Event payload**
  - Include parsed bot mentions in `comment.created`
  - Files:
    - `gennit-backend/services/pluginRunner.ts`
    - `gennit-backend/customResolvers/mutations/createComment.ts`

---

## Phase 3 — Bot User Provisioning + Plugin Context

### Backend (gennit-backend)

- **Bot user creation/lookup**
  - Find or create bot user for (Channel + bot profile)
  - Enforce `bot-<channel>-<botName>` naming
  - Create `BOT` relationship to Channel
  - Files:
    - `gennit-backend/services/botUserService.ts` (new)
    - `gennit-backend/services/commentService.ts`

- **Plugin context: create comment as bot**
  - Add context method: `createCommentAsBot(...)`
  - Ensure only plugin runner can call this
  - Files:
    - `gennit-backend/services/pluginContext.ts`
    - `gennit-backend/services/pluginRunner.ts`

- **Permissions**
  - Bot accounts cannot log in
  - Bot accounts can create comments only via plugin context
  - Files:
    - `gennit-backend/permissions.ts`
    - `gennit-backend/customResolvers/mutations/login.ts` (or equivalent)

---

## Phase 4 — UI: Bots in Forum Sidebar + Autocomplete

### Frontend (multiforum-nuxt)

- **GraphQL query**
  - Add `Channel.Bots { id username displayName isDeprecated }`
  - Files:
    - `gennit-nuxt/graphQLData/...` (forum query)

- **Sidebar list**
  - Display bots like Admins list
  - Link to bot profile page
  - Show “Inactive” badge for `isDeprecated`
  - Files:
    - `gennit-nuxt/components/channel/DownloadSidebar.vue` (or forum sidebar component)
    - `gennit-nuxt/components/channel/ForumSidebar.vue` (if exists)

- **Editor autocomplete**
  - Use `Channel.Bots` to suggest `/bot/<name>` entries
  - Disable deprecated bots in list
  - Files:
    - `gennit-nuxt/components/editor/...` (Text editor component)
    - `gennit-nuxt/composables/...` (mention/autocomplete logic)

---

## Phase 5 — Beta-Bot Plugin (Server + Channel Settings)

### Plugins repo (multiforum-plugins)

- **Plugin manifest**
  - `id: beta-bot`
  - `secrets`: `OPENAI_API_KEY` (server scope)
  - `settingsDefaults.server`: `model`, `temperature`, `profiles[]`, `defaultProfileId`
  - `settingsDefaults.channel`: `overrideProfiles`, `profiles[]`, `defaultProfileId`
  - Files:
    - `multiforum-plugins/plugins/beta-bot/plugin.json`

- **Plugin code**
  - On `comment.created`: detect `/bot/betabot`
  - Resolve profile via settings (channel override > server)
  - Call OpenAI, post reply as bot user
  - Files:
    - `multiforum-plugins/plugins/beta-bot/src/index.ts`

---

## Phase 6 — Admin UI for Profiles

### Frontend (multiforum-nuxt)

- **Server settings**
  - Render profiles array (repeatable fields)
  - Files:
    - `gennit-nuxt/components/plugins/PluginSettingsForm.vue`
    - `gennit-nuxt/components/plugins/fields/*`

- **Channel settings override**
  - Toggle + profiles editor
  - Files:
    - `gennit-nuxt/pages/forums/[forumId]/edit/plugins.vue`
    - `gennit-nuxt/components/plugins/PluginSettingsForm.vue`

---

## Phase 7 — Deprecation & Safety

### Backend (gennit-backend)

- Mark bot users as deprecated
- Prevent posting if deprecated
- Files:
  - `gennit-backend/services/botUserService.ts`
  - `gennit-backend/services/pluginRunner.ts`

### Frontend (multiforum-nuxt)

- Show inactive badge in sidebar/autocomplete
- Files:
  - `gennit-nuxt/components/channel/ForumSidebar.vue`
  - `gennit-nuxt/components/editor/...`

---

## Notes / Open Questions

- Bots are not listed in any global user directory (none exists).
- Moderation applies to bots the same as humans (bots can be suspended).
- Store `promptUsed` and expose it via a link on bot-authored comments.
