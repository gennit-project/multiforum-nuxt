# auth0-nuxt Phase 2 — RESOLVED ✅

Phase 2 (Apollo authenticated from the server session) **works end-to-end**:
log in → persistent server session → `/api/auth/token` returns the access token
(refreshed via the refresh token when expired) → synced to `localStorage` →
`@nuxtjs/apollo` attaches it → authenticated GraphQL mutations succeed (verified:
upvote went 2→3 with no "You must be logged in" error).

The SDK was never the problem — a minimal repro proved it works in isolation. The
blocker was a chain of integration issues in this app, each of which had to be
fixed:

## The fixes (all committed on this branch)

1. **`/api/auth/**` excluded from the Nitro route cache** — THE root cause.
   `nuxt.config.ts` had `'/api/**': { cache: {...} }`, which wrapped
   `/api/auth/token` in Nitro's route cache. Route-cached responses are shared and
   **cookie-independent**, so the auth endpoint's handler received requests with NO
   cookies → no session → null token → "You must be logged in." Fix: a more
   specific `'/api/auth/**': { cache: false }` rule (Nitro: most specific wins).

2. **Persistent (filesystem) session store** — `nitro.storage.auth0Sessions`.
   In-memory was wiped on every server restart, orphaning the browser's session
   cookie; the SDK then deleted the cookie on the resulting store miss. (Prod =
   read-only FS on Vercel → use Vercel KV / Upstash Redis instead.)

3. **Non-Secure session cookie in dev** —
   `runtimeConfig.auth0.sessionConfiguration.cookie.secure = false` in dev (Secure
   cookies are unreliable over http://localhost), `true` in production.

4. **Token sourced client-side, not via the SSR hook** —
   `plugins/apollo-auth.client.ts` syncs the token into `localStorage` rather than
   using `@nuxtjs/apollo`'s `apollo:auth` hook, which also fires during SSR where a
   relative `/api/auth/token` fetch is cookieless.

5. **Backend recognizes the dedicated API audience** (`gennit-backend`):
   `setUserDataOnContext` accepts `AUTH0_AUDIENCE` (= `https://api.c0nduit.app`)
   and resolves the email via `/userinfo`.

## Auth0 setup this depends on (one-time, done)
- A **Regular Web Application** + a **dedicated API** (`https://api.c0nduit.app`),
  NOT the Management API.
- API: **Allow Offline Access** ON; the web app authorized for it via **User
  delegated access**. App grant types include **Refresh Token**.
- Callback `http://localhost:3000/auth/callback`, logout `http://localhost:3000`.

## Remaining (Phase 4 cleanup, not blockers)
- Production session store (Vercel KV / Redis) + production cookie/secure config.
- Resolve username once and cache it instead of `getAccessToken()` per request in
  the auth-session middleware.
- Harden vote error handling so auth errors surface as a banner, not an uncaught
  rejection (pre-existing app fragility).
- Remove the SPA (`@auth0/auth0-vue`) and the remaining shims.
