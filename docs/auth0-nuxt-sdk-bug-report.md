# auth0-nuxt Phase 2 — investigation log (current state)

The SDK is **not** the blocker — a minimal repro (`/Users/catherineluse/gennit/
auth0-nuxt-repro`) shows `@auth0/auth0-nuxt` 1.1.0 + a server-side session store
+ a protected client fetch working flawlessly against the same Auth0 setup. The
problems are all integration-side in this app.

## Fixed
1. **SSR cookieless token hook.** `@nuxtjs/apollo`'s `apollo:auth` hook runs during
   SSR; our relative `fetch('/api/auth/token')` there was an internal Nitro call
   with no cookies. `plugins/apollo-auth.client.ts` no longer uses the hook — it
   syncs the token into `localStorage['token']` (client-only) and lets the
   module's native `tokenStorage: 'localStorage'` attach it.
2. **Persistent session store.** `nitro.storage.auth0Sessions` is now a filesystem
   driver (dev) instead of in-memory, so sessions survive server restarts. Verified:
   the session file persists across restarts (and overnight). Prod (read-only FS on
   Vercel) must use a shared driver — Vercel KV / Upstash Redis.
3. **Non-Secure session cookie in dev.** `runtimeConfig.auth0.sessionConfiguration
   .cookie.secure` is `false` in dev (Secure cookies are unreliable over
   http://localhost), `true` in production.

## Open: the session cookie is not sent back in THIS app (works in the repro)
After a fresh login the server **stores the session correctly** (a session file is
written to `.auth0-sessions/`), but on the next request the browser does **not**
send the `__a0_session` cookie (`getSession()` → false, `getAccessToken()` throws
"expired / no refresh token"). Non-Secure cookies (`theme`, `i18n_redirected`) ARE
sent on the same requests, and `secure:false` did not change it. The identical code
works in the bare repro — so it is something this app's environment does to the
cookie.

### Leading suspects (not yet confirmed)
- **Stale cookie state.** This app used the SDK's default *stateless* store early
  on, which writes chunked `__a0_session.0` / `__a0_session.1` cookies. Those (and
  old `__a0_session` values from ~20 logins across store-wiping restarts) may be
  confusing the browser's cookie jar. The repro never used the stateless store.
- **ISR / cache-control.** `nitro.routeRules` ISR-caches discussion pages and a
  cache-control middleware runs on every request; cookie handling through a cached
  redirect target is worth ruling out.
- **SPA coexistence** still writing its own cookies/token.

### Decisive next step (30 seconds, needs a human at the browser)
Open **Chrome DevTools → Application → Cookies → http://localhost:3000** and look at
`__a0_session`:
- Is it present at all after login? What are its `Secure` / `SameSite` / `Expires`
  / `Path` attributes? Is `Max-Age` 0 / already expired?
- Are there stale `__a0_session.0` / `__a0_session.1` entries?

Then **"Clear site data"** for localhost:3000, do **one** fresh login, and retest.
A clean cookie jar is the most likely fix; the DevTools view will show definitively
whether the cookie is missing, expired, or mis-attributed. (The headless tooling
used here can't read httpOnly cookies or Set-Cookie headers, which is why this last
step needs the browser UI.)

## Status
- SDK: works (proven). Auth0 config: correct.
- Plumbing + SSR hook + persistent store + dev cookie: done.
- Blocker: `__a0_session` not returned by the browser in this app specifically.
  Start with the DevTools cookie inspection + "clear site data" + one fresh login.
