# auth0-nuxt Phase 2 — investigation log (final)

The SDK is NOT the blocker. A minimal reproduction (`/Users/catherineluse/gennit/
auth0-nuxt-repro`, or rebuild from the spike) shows `@auth0/auth0-nuxt` 1.1.0 +
a server-side session store + a protected client fetch working **flawlessly**
against the same Auth0 setup. The failures are integration issues in this app.

## Two distinct integration problems were found

### 1. The `apollo:auth` hook ran during SSR → cookieless token fetches (FIXED)
`@nuxtjs/apollo` invokes the `apollo:auth` hook during SSR too. Our hook did
`fetch('/api/auth/token')` — a *relative* URL, which on the server is an internal
Nitro call with **no cookies**, so it could never read the session. Proven by
tagging the URL (`?src=apolloHook`) and seeing cookieless, null-header requests.

**Fix applied:** `plugins/apollo-auth.client.ts` no longer uses the hook. It syncs
the server-session token into `localStorage['token']` (a real browser fetch that
carries the cookie), and `@nuxtjs/apollo`'s native `tokenStorage: 'localStorage'`
(client-only, `import.meta.client`-guarded) attaches it. SSR stays anonymous; no
cookieless requests.

### 2. The session is intermittently destroyed (OPEN — the real remaining blocker)
Even with a real cookie-bearing client fetch, `/api/auth/token` returns a token on
one call and `null` on the next. Instrumentation showed `getSession()` returning
`false` intermittently, then permanently. Root cause:

- `StatefulStateStore.get()` (in `@auth0/auth0-server-js`) **deletes the session
  cookie on ANY store miss**. So a single transient miss permanently logs the user
  out for the rest of the session.
- Misses are induced by this app's environment (the repro has none of it):
  - **in-memory session store** wiped on every dev restart → the browser keeps a
    stale `__a0_session` cookie whose id is no longer in the store → miss → delete;
  - the **auth-session middleware calls `getAccessToken()` on every request**
    (extra load + refresh/rotation risk) alongside the route handler's call;
  - **many concurrent requests** (Apollo) racing the same session;
  - **SPA coexistence** still writing its own token/cookies.

## Go-forward plan (to finish Phase 2)
1. **Use a persistent session store** (filesystem in dev, Redis/KV in prod) instead
   of in-memory — eliminates the restart→stale-cookie→miss→delete cascade. Biggest
   single win; most of the "intermittent" failures are an artifact of in-memory +
   restarts during testing.
2. **Stop calling `getAccessToken()` in the auth-session middleware on every
   request** — resolve the username once and cache it (e.g. in the session/user),
   not per request.
3. **Reduce concurrent token fetches** — the localStorage sync already does this
   (periodic, not per-operation); make sure nothing else hammers `/api/auth/token`.
4. **Worth raising upstream:** `StatefulStateStore.get()` deleting the cookie on a
   single (possibly transient/concurrent) store miss is fragile. A bare repro that
   forces one miss and shows the session is then permanently gone would make a
   clean, legitimate issue — distinct from the (incorrect) earlier theory.
5. Complete **Phase 4** (remove the SPA) to end the coexistence races.

## Status
- SDK: works (proven). Auth0 config: correct.
- Phase 2 plumbing: correct; SSR cookieless-hook bug fixed.
- Blocker: intermittent session loss from in-memory store + delete-on-miss under
  the app's concurrency. Start with a persistent store (item 1) — likely resolves
  the bulk of it.
