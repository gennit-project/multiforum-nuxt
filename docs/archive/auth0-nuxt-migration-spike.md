# Spike: migrate Auth0 to the server-session SDK (`@auth0/auth0-nuxt`)

**Status: COMPLETE.** All phases (0–4) are done and verified. The app resolves
auth on the server, renders authenticated on first paint (nav + ownership-gated
UI), authenticates GraphQL from the server session, and the SPA SDK
(`@auth0/auth0-vue`) plus all its shims have been removed. Production sessions
are backed by Upstash Redis. The backend audience-token change is in
[multiforum-backend#15](https://github.com/gennit-project/multiforum-backend/pull/15).

> **Note on the "Phase 2 blocker" recorded below.** An earlier revision of this
> doc diagnosed an upstream `@auth0/auth0-server-js` bug (a seconds-vs-ms expiry
> comparison and a misread refresh-token location). **That diagnosis was wrong**
> — a minimal repro proved the SDK works in isolation. The real cause was the
> `/api/**` Nitro route cache stripping cookies from `/api/auth/token`. The
> full, correct resolution is in [`auth0-nuxt-sdk-bug-report.md`](./auth0-nuxt-sdk-bug-report.md)
> (titled "RESOLVED"). The original Phase 2 narrative is kept below only as a
> record of the investigation; do not treat its SDK-bug claims as accurate.

## Phase 2 — Apollo token from the server session (RESOLVED)

**Goal:** Apollo authenticates GraphQL from the server session instead of a
localStorage token written by the SPA SDK. **Outcome:** working end-to-end; see
the resolution doc linked above for the actual fix (the `/api/auth/**` route
must opt out of the route cache).

What was built (all correct and verified):
- `server/api/auth/token.get.ts`: returns the session's access token to the
  authenticated browser (same-origin + session cookie).
- `plugins/apollo-auth.client.ts`: feeds that token to Apollo via @nuxtjs/apollo's
  `apollo:auth` hook. (The `apolloLink` option in nuxt.config is NOT consumed by
  @nuxtjs/apollo v5-alpha — the module builds its own link and resolves the token
  via this hook or `tokenStorage`. This cost real debugging; don't edit
  `apolloLink` expecting it to run.)
- `server/middleware/2.auth-session.ts`: also resolves the app username from the
  GraphQL backend by email (Auth0 is trusted ONLY for the verified email; the
  username is our data, never an Auth0 claim).
- `server/utils/session-store-factory.ts` + `sessionStoreFactoryPath` in
  nuxt.config: a **server-side** session store. Required because the SDK's default
  **stateless** store serializes the whole session (id+access+refresh tokens) into
  the cookie, which overflows the ~4KB browser limit once a refresh token exists,
  so the cookie is dropped and `getSession()` returns nothing.
- `server/middleware/1.cache-control.ts`: excludes `/api/auth/` from the blanket
  API caching (it authenticates via cookie, not an Authorization header, so the
  generic rule would cache one user's token).

Backend (separate repo `gennit-backend`): `setUserDataOnContext` only recognized
two token audiences (the SPA client id and the Management API). Added a branch for
`process.env.AUTH0_AUDIENCE` (set to `https://api.c0nduit.app`) that resolves the
email via `/userinfo`, so the backend accepts the new dedicated-API token.

### Auth0 setup this required (for the record)
- A **dedicated API** (`https://api.c0nduit.app`) — NOT the Management API, which
  can't issue refresh tokens and forces a consent prompt every login.
- API → **Allow Offline Access ON**.
- The Regular Web App → **User delegated access** authorized for that API (the
  "Client is not authorized to access resource server" error means this is
  missing; Client/M2M access is NOT needed).
- App grant types include **Refresh Token** (default).

### ✅ The actual resolution (NOT an SDK bug)
The symptom — `getAccessToken()` returning null and mutations failing with "You
must be logged in to do that" — was **not** an SDK bug. A minimal reproduction
proved `@auth0/auth0-nuxt` / `@auth0/auth0-server-js` work correctly in
isolation. The root cause was in this app's config: the `'/api/**': { cache }`
route rule wrapped `/api/auth/token` in Nitro's route cache, whose responses are
**cookie-independent and shared**, so the token handler ran without the session
cookie and returned null. Fix: a more specific `'/api/auth/**': { cache: false }`
rule (Nitro: most specific wins). See
[`auth0-nuxt-sdk-bug-report.md`](./auth0-nuxt-sdk-bug-report.md) for the full
chain of integration fixes (route cache, persistent store, dev cookie `secure`,
client-side token sync, backend audience). Verified: an upvote went 2→3 with no
auth error.

> The earlier "seconds-vs-ms expiry" and "refresh token read from the wrong
> place" claims were a misdiagnosis from reading symptoms before reading the
> SDK source; both were disproven. No upstream issue was filed.

## Phase 3 results (verified locally)

Login via `/auth/login`, logout via the nav, and hard-refresh all behave
correctly: the nav shows authenticated and the discussion Edit button renders on
first paint, with no auth-driven hydration mismatch.

What Phase 3 changed:
- `RequireAuth` decides auth from the SSR-seeded `isAuthenticatedVar` /
  `usernameVar` (server session is the source of truth). Removed the `isMounted`
  dance and the `useSSRAuth` auth-hint cookie dependency. Login →
  `/auth/login?returnTo=…`.
- New `composables/useServerLogout.ts`: clears the SPA token + hint cookies, then
  redirects to `/auth/logout` (server session + federated Auth0 logout). The 4
  nav components use it and no longer import the SPA `useAuth0()`.
- **Anti-clobber:** both `useAuthManager` and `RequireAuth` watched the SPA's
  `isAuthenticated` and called `setIsAuthenticated(newValue)` — which set `false`
  on mount for a server-session user (the SPA reports not-authenticated), wiping
  the seeded session. Both now only ever UPGRADE; logout clears state explicitly.
- **Deleted `plugins/auth0.server.ts`** — it ran after the new `auth-session`
  plugin (alphabetical order) and reset `isAuthenticated` to `false` on the
  server, clobbering the seeded session during SSR.
- **Deleted `plugins/username-cache.client.ts`** — the synchronous localStorage
  username restore is obsolete now that the server session seeds `usernameVar`,
  and it conflicted with that seeding.

### Known remaining mismatch (PRE-EXISTING, not auth-related)

Comment headers can still log a hydration mismatch on the forum-mod badge
("Forum Mod"/"Forum Admin"). It is driven by `forumRoleBadge`, computed from the
channel's mod/admin lists (`GET_MODS_BY_CHANNEL` via `useForumRoleMembership`) —
entirely viewer-independent, so unrelated to the auth migration. Root cause is an
Apollo cache-normalization issue: multiple queries write `Channel.Moderators`
(`ModerationProfile`, keyed by `displayName`) with different sub-selections,
producing the long-standing "cache data may be lost when replacing the Moderators
field" warning, so the client reads the mod list differently than SSR rendered
it. Fix is a cache `merge`/typePolicy for `Channel.Moderators` (or aligning the
query selections) — tracked separately.

## Spike results (verified locally)

Logged in via `/auth/login` against the `gennit.us.auth0.com` tenant, then
loaded a discussion detail page:

- ✅ **`Hydration completed but contains mismatches` is gone.** The core reason
  for the migration is validated: a server-resolved session removes this class
  of mismatch.
- ✅ SSR is genuinely auth-aware — proven when seeding the authenticated state
  made the logged-in nav render server-side and surface a separate bug (below).
- ⚠️ **Not authenticated on first paint yet**, for two expected reasons while
  both auth systems coexist:
  1. ~~**Username is wrong server-side**~~ ✅ **FIXED (Phase 1 complete).** The
     real username lives in the GraphQL backend keyed by email; it is NOT
     reliably in the Auth0 token (the PostLogin Action sets it on the *access*
     token from `event.request.body.username`, which `getSession()` can't read
     and which is absent on session resume). The Nitro middleware now resolves
     it server-side: `getAccessToken()` mints an API token from the session
     (using the refresh token + `NUXT_AUTH0_AUDIENCE` — no re-login needed),
     and it queries the backend by email (the GET_EMAIL query `useAuthManager`
     uses). Verified: `catherine.luse@gmail.com → resolvedUsername=cluse`
     server-side, so the Edit button's ownership check passes during SSR and it
     renders on first paint. Falls back to the token claim / email if the token
     or lookup is unavailable (display-only degradation; auth state stays
     correct). **Requires `NUXT_AUTH0_AUDIENCE`** = the GraphQL API audience.
  2. **Nav still keys off the old `auth-hint` cookie.** `RequireAuth` decides
     SSR auth from the `auth-hint` cookie set by the SPA login flow, which the
     new `/auth/login` never sets — so the nav renders logged-out until the SPA
     auth resolves client-side. **Fix:** move `RequireAuth` onto the SSR-seeded
     state (Phase 3).

### Coexistence finding: SPA `useAuth0()` in the SSR path

Flipping SSR to authenticated makes auth-gated components render server-side,
where `@auth0/auth0-vue`'s **client-only** `useAuth0()` is `undefined`. The
consumers are 9 files; 3 nav components rendered unguarded and crashed SSR
(`UserProfileDropdownMenu`, `SiteSidenavLogout`, `SiteSidenavLogin`). They were
guarded with `import.meta.env.SSR === false` (the pattern `LoginButton` /
`RequireAuth` already use). Phase 3 replaces these SPA logout calls with
`/auth/logout` navigation and removes the SPA SDK entirely.

---

## Original goal & remaining setup

Cannot be re-run from a clean machine without Auth0 dashboard config + secrets
(see below).

**Why:** SSR is currently always logged-out for real users. The app uses
`@auth0/auth0-vue` (a SPA SDK) with the token in `localStorage`, which the
server cannot read. Everything downstream — the `auth-hint`/`username-hint`
cookie shim, the `username-cache.client.ts` plugin, the `isMounted` "pretend
logged-out then flip" dance in `RequireAuth.vue` — exists to work around that
blindness, and it produces hydration mismatches (the page-reload flash fixed in
PR #98 was one symptom).

`@auth0/auth0-nuxt` (GA, v1.1.0) stores auth in an **encrypted server-side
session cookie**, so the server resolves auth *before* render and the client
hydrates from the same truth. This eliminates the mismatch class and lets us
delete the workaround stack.

---

## ⚠️ The big implication: app type changes (SPA → Regular Web App)

The new SDK requires a `clientSecret` and uses a confidential, server-side flow.
The current SPA application in Auth0 has **no** client secret and uses PKCE.

**You must create (or reconfigure to) a "Regular Web Application" in Auth0.** Do
not reuse the SPA app's settings blindly. Recommended: create a *new* Auth0
application so the existing SPA login keeps working during migration, and switch
over per-environment.

### Auth0 dashboard steps (you, not the agent — needs tenant access)

1. **Create app:** Applications → Create Application → *Regular Web Application*.
2. **Allowed Callback URLs:** add `/auth/callback` for each env:
   - `http://localhost:3000/auth/callback`
   - `https://www.topical.space/auth/callback`
   - Vercel previews are dynamic — either add a wildcard pattern Auth0 accepts
     or use a stable preview alias. (Track as a sub-task.)
3. **Allowed Logout URLs:** add the app base URL for each env
   (`http://localhost:3000`, `https://www.topical.space`).
4. **Grant types:** ensure *Authorization Code* is enabled.
5. **Username claim:** the app keys UI off the application `username`. Confirm
   the Auth0 Action / Rule that adds it (e.g. a custom claim
   `https://multiforum/username`) fires for this app, and update the claim name
   read in `plugins/auth-session.ts` to match.
6. Copy **Client ID** and **Client Secret** into your env (below).

---

## Local setup (once you have the dashboard config)

Add these to your local `.env` (all `.env*` files are gitignored). They map to
`runtimeConfig.auth0` in `nuxt.config.ts` via Nuxt's `NUXT_` env convention:

```bash
# Auth0 tenant domain, e.g. your-tenant.us.auth0.com
NUXT_AUTH0_DOMAIN=
# Client ID + Secret of the REGULAR WEB APPLICATION (confidential) — NOT the SPA.
NUXT_AUTH0_CLIENT_ID=
NUXT_AUTH0_CLIENT_SECRET=
# Encrypts the server-side session cookie. Generate with: openssl rand -hex 64
NUXT_AUTH0_SESSION_SECRET=
# Public base URL of THIS app. Local: http://localhost:3000 | Prod: https://www.topical.space
NUXT_AUTH0_APP_BASE_URL=http://localhost:3000
# GraphQL API audience — same value as VITE_AUTH0_AUDIENCE. REQUIRED for Phase 1
# server-side username resolution (getAccessToken() needs it to mint an API
# token); also what Apollo will send in Phase 2.
NUXT_AUTH0_AUDIENCE=
```

```bash
openssl rand -hex 64   # -> NUXT_AUTH0_SESSION_SECRET
npm run dev
```

Then visit `/auth/login`, complete login, and confirm:
- the server log shows a session (no `[auth-session] getSession failed`),
- a discussion detail page renders the authenticated header **on first paint**
  (view-source shows the Edit button / action menu), and
- the console shows **no** `Hydration completed but contains mismatches`.

---

## What this scaffold already contains

- `@auth0/auth0-nuxt@^1.1.0` added to dependencies.
- `nuxt.config.ts`: module registered with `mountRoutes: true`
  (mounts `/auth/login`, `/auth/logout`, `/auth/callback`,
  `/auth/backchannel-logout`) + a private `runtimeConfig.auth0` block fed by
  `NUXT_AUTH0_*` envs.
- **Phase 1 core (two files, because `useAuth0(event)` is a Nitro-only
  auto-import — not callable from a Nuxt app plugin):**
  - `server/middleware/2.auth-session.ts`: reads
    `useAuth0(event).getSession()` in the Nitro context and stashes
    `{ isAuthenticated, username }` on `event.context.authSession`.
  - `plugins/auth-session.ts`: universal app plugin that reads that context
    during SSR, transfers it through `useState('auth-session')`, and seeds
    `usernameVar`/`isAuthenticatedVar` on both sides so SSR and the first
    client render agree.
- Required env vars: listed under "Local setup" above.

The existing `@auth0/auth0-vue` flow is left fully intact — the mounted routes
only need config when hit, so `npm run dev` still boots without the envs.

---

## Remaining work

All migration phases are done. What's left is operational / follow-up:

- **Manual real-auth sanity pass** against the live backend (login → upvote →
  edit-own-post → logout) — not in CI.
- **Per-request lookup optimization:** the auth-session middleware runs
  `getAccessToken()` + a GraphQL `GET_EMAIL` on every authenticated request.
  The stable fields (username / modProfileName / profilePicURL) could be cached
  in the session; the volatile `notificationCount` should still be fetched
  fresh. Not done yet (a design decision, not a blocker).
- **Vercel env:** set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (and
  the `NUXT_AUTH0_*` vars) in the project; a preview deploy is the definitive
  test of the Upstash-backed session store.
- **Pre-existing forum-mod-badge hydration mismatch** (see Phase 3 note above) —
  unrelated to auth; tracked separately.

## Completed cleanup (Phase 4)

Retired: `plugins/auth0.client.ts` · `plugins/auth0.server.ts` ·
`plugins/username-cache.client.ts` · `composables/useSSRAuth.ts` ·
`composables/useAuthManager.ts` · `composables/useTestAuth.ts` · the
`auth-hint`/`username-hint` cookie shim · `@auth0/auth0-vue`. `RequireAuth.vue`
is now purely presentational off the SSR-seeded auth vars; mocked tests seed a
server session via a `mock-auth` cookie (gated on `VITE_E2E_MOCK_MODE`).
