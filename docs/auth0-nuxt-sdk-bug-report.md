# Bug report draft — file at https://github.com/auth0/auth0-nuxt/issues

**Title:** `getAccessToken()` / `getSession()` reject a freshly-stored session — refresh token read from wrong location + access token wrongly judged expired (server-side session store)

---

### Describe the problem

With a server-side session store (`sessionStoreFactoryPath`), a successful login
stores a session containing a **fresh** access token (24h TTL) **and** a refresh
token, with the correct audience and `offline_access` scope. Immediately
afterward, on the next request, `useAuth0(event).getSession()` returns
`undefined` and `useAuth0(event).getAccessToken()` throws:

> `The access token has expired and a refresh token was not provided. The user needs to re-authenticate.`

So the SDK cannot read back a session it just wrote correctly. Every
authenticated request fails right after login.

### Environment

- `@auth0/auth0-nuxt`: **1.1.0** (latest)
- `@auth0/auth0-server-js`: **1.6.1** (latest)
- Nuxt: 4.4.8 (Nitro 2.13.4), Node 22 runtime
- App type: Regular Web Application (Authorization Code flow)
- Session store: custom `SessionStore` over Nitro `useStorage()` (in-memory),
  registered via `sessionStoreFactoryPath`
- Module options: `{ mountRoutes: true, sessionStoreFactoryPath: '~/server/utils/session-store-factory.ts' }`
- A dedicated API audience (not the Management API) with **Allow Offline Access ON**;
  the app has **Refresh Token** grant and **User delegated access** to the API.

### What actually gets stored (instrumented in the session store's `set()`)

Logging the `StateData` passed to `SessionStore.set()` right after login:

```
SET <id> stateKeys=user,idToken,refreshToken,tokenSets,domain,internal  topLevelRefresh=true  now=1781828514
  tokenSet[0] keys=audience,accessToken,scope,expiresAt
              audience="https://api.example.app"
              hasRefresh=false                     # <-- no refreshToken INSIDE the token set
              expiresAt=1781914914                 # <-- exactly now + 86400 (24h), i.e. FRESH
              tokenExp=1781914914                  # (matches the JWT `exp` claim, in SECONDS)
              scope="openid profile email offline_access"
```

Key points:
- The **refresh token IS present**, but at the **`StateData` top level**
  (`stateKeys` includes `refreshToken`, `topLevelRefresh=true`), **not inside the
  token set** (`tokenSet[0].refreshToken` is absent → `hasRefresh=false`).
- The access token is **fresh**: `expiresAt` (1781914914) is `now` (1781828514)
  + 86400. It is a **seconds** epoch timestamp.

### On the very next request

The same session store's `get()` returns the data (cache **HIT**), so persistence
is fine. But:

```
getSession() -> undefined           # SDK discards a valid, just-written session
getAccessToken() -> throws "access token has expired and a refresh token was not provided"
```

### Diagnosis (two likely bugs)

1. **Refresh-token location mismatch.** The refresh token is written to
   `StateData.refreshToken` (top level) but `getAccessToken()` appears to look for
   it inside the matched token set, so it reports "a refresh token was not
   provided" even though one exists.

2. **Expiry units mismatch (seconds vs milliseconds).** `expiresAt` is stored as a
   **seconds** epoch (`1781914914`). If the freshness check compares it against
   `Date.now()` (milliseconds), every token looks decades expired
   (`1781914914 < 1781828514000`), which would explain "the access token has
   expired" for a token that is actually 24h from expiry — and would force the
   (mis-located) refresh path, producing this exact error.

### Steps to reproduce

1. Configure a Regular Web App + a dedicated API (Allow Offline Access ON),
   request `audience=<api>` and scope `openid profile email offline_access`.
2. Use a custom `SessionStore` (`sessionStoreFactoryPath`) over any backing store.
3. Log in via `/auth/login`.
4. On the next request call `useAuth0(event).getSession()` →
   it returns `undefined`; `getAccessToken()` throws the error above.
5. Instrument `SessionStore.set()` to log `StateData` — observe the fresh
   `expiresAt` (seconds) and the top-level `refreshToken`.

### Expected

`getSession()` returns the session and `getAccessToken()` returns the still-valid
access token (no refresh needed), or refreshes using the stored refresh token.

### Actual

Both reject the just-stored session; the app is effectively unauthenticated
immediately after a successful login.
