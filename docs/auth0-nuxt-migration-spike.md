# Spike: migrate Auth0 to the server-session SDK (`@auth0/auth0-nuxt`)

**Status:** Phase 0/1 scaffold. Not wired into the live auth flow yet. Cannot be
end-to-end verified without Auth0 dashboard config + secrets (see below).

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
# Optional: API audience — the access token Apollo will eventually send (Phase 2).
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
- `plugins/auth-session.ts`: **Phase 1 core.** Universal plugin that reads
  `useAuth0(event).getSession()` on the server, transfers the result through
  `useState('auth-session')`, and seeds `usernameVar`/`isAuthenticatedVar` on
  both sides so SSR and the first client render agree.
- Required env vars: listed under "Local setup" above.

The existing `@auth0/auth0-vue` flow is left fully intact — the mounted routes
only need config when hit, so `npm run dev` still boots without the envs.

---

## Remaining work (tracked in the migration issue)

- **Phase 2 — Apollo auth (highest risk):** replace the `localStorage.token` +
  `__auth0_getToken` logic in `nuxt.config.ts` with a token sourced from the
  server session (audience access token). Either expose it via a server route
  the client link reads, or proxy GraphQL through a Nitro route that attaches
  the token server-side (preferred; keeps the token off the client). The
  `errorLink` 401-refresh path is replaced by the SDK's server-side refresh.
- **Phase 3 — flows:** `RequireAuth.vue` login → navigate to
  `/auth/login?returnTo=…`; drop `useSSRAuth`, the cookie hints, and the
  `isMounted` dance. `pages/logout.vue` → redirect to `/auth/logout`.
- **Phase 4 — tests + cleanup:** rework `installMockAuth()` and
  `plugins/test-auth.client.ts` to mint a mock server session instead of
  seeding `localStorage` (touches many Playwright specs). Then delete
  `plugins/auth0.server.ts`, `plugins/username-cache.client.ts`,
  `composables/useSSRAuth.ts`, and remove `@auth0/auth0-vue`.

## Files that get retired at the end

`plugins/auth0.client.ts` · `plugins/auth0.server.ts` ·
`plugins/username-cache.client.ts` · `composables/useSSRAuth.ts` ·
(most of) `components/auth/RequireAuth.vue` auth logic.
