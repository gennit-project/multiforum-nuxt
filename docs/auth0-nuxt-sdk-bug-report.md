# auth0-nuxt Phase 2 — investigation notes (do NOT file as-is)

> ⚠️ An earlier version of this file claimed a specific root cause
> (seconds-vs-ms expiry + refresh-token read from the wrong field). **That was
> wrong** — reading the actual `@auth0/auth0-server-js` source disproved both.
> This file now records what we actually observed. Don't file it as a bug report
> until the root cause is confirmed in an isolated reproduction.

## Versions
- `@auth0/auth0-nuxt` 1.1.0, `@auth0/auth0-server-js` 1.6.1 (both latest)
- Nuxt 4.4.8 / Nitro 2.13.4, Node 22 runtime
- Regular Web App, Authorization Code flow, dedicated API audience with offline
  access, server-side session store (`sessionStoreFactoryPath`) over Nitro
  `useStorage()`.

## What we proved (by instrumenting the installed SDK in node_modules)

1. **The core works when the session cookie is present.** On any request that
   carries the `__a0_session` cookie, `StatefulStateStore.get()` hits the store,
   `getSession()` returns the full session, and `getAccessToken()` finds the
   token set, sees it's fresh, and returns it. Example trace:
   ```
   getCookie __a0_session found=true  allCookieNames=[…,'__a0_session']
   StatefulStore.get sessionId=<id> storeHit=true
   getAccessToken tokenSetFound=true expiresAt=<now+24h> hasTopLevelRefresh=true  → returns token
   ```
2. **Disproven root causes:** expiry is compared correctly (`expiresAt > Date.now()/1e3`, both seconds); the refresh token is read from `stateData.refreshToken` (top level, where it is stored); the client is NOT in resolver mode (`domain` is a string). None of these is the bug.
3. **Not the `secure` flag, not the aggressive delete.** Patching the session
   cookie to `secure:false` (we test over http://localhost) and suppressing the
   "delete cookie on store miss" (server-client `StatefulStateStore.get`) did
   NOT fix it.

## The actual symptom

Some requests to `/api/auth/token` arrive with **zero cookies**
(`allCookieNames=[]` — not even unrelated cookies like `theme`). Those are
server-internal `$fetch`-style calls (no cookie forwarding), so there is no
session and `getAccessToken()` correctly returns nothing. During a page load /
mutation there is a **burst** of these cookieless internal calls interleaved
with the real browser calls that succeed. Net effect in the app: authenticated
GraphQL mutations (e.g. upvote) still fail with "You must be logged in to do
that," even though direct browser requests to `/api/auth/token` succeed.

## Open questions (what to chase next, in isolation)

- **Who issues the cookieless internal `/api/auth/token` requests?** Candidates:
  SSR/Nitro internal `$fetch`, route prefetch, or the `apollo:auth` hook running
  in a server context. The Apollo token hook (`plugins/apollo-auth.client.ts`)
  is client-only by name, so if it runs server-side that itself is suspicious.
- **Why does the client mutation's token attach fail** even though a concurrent
  browser `/api/auth/token` call returns a valid token? Possible race between
  `@nuxtjs/apollo`'s `apollo:auth` hook resolution and the operation, or the
  in-hook token cache returning stale state.
- Reproduce in a **minimal** Nuxt + auth0-nuxt app (no app complexity) to decide
  whether this is an SDK bug or an integration issue (cookie forwarding on
  SSR/internal fetch).

## Status
Phase 2 plumbing is committed and correct; the token round-trip works whenever
the session cookie is present. Landing it fully needs the cookieless-internal-
request question answered first. Recommend an isolated-repro session before
filing anything upstream.
