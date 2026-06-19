// plugins/apollo-auth.client.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 2.
//
// Feed the access token from the server session into Apollo. We do NOT use
// @nuxtjs/apollo's `apollo:auth` hook: that hook runs during SSR too, where a
// relative fetch('/api/auth/token') is an internal Nitro call with NO cookies,
// so it can never read the session — every SSR token fetch comes back null and
// authenticated requests fail. (This was the actual root cause of "You must be
// logged in to do that": the token fetch was happening cookieless on the
// server, never effectively on the client.)
//
// Instead we use the module's NATIVE token source: `tokenStorage: 'localStorage'`
// (configured in nuxt.config). @nuxtjs/apollo reads `localStorage['token']` only
// on the CLIENT (it is `import.meta.client`-guarded), so SSR stays anonymous and
// there are no cookieless requests. We keep that key in sync with the server
// session here — a real browser fetch that carries the session cookie.
import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin(() => {
  // Client-only by file name, but guard anyway — never touch localStorage / make
  // a relative (cookieless) fetch on the server.
  if (typeof window === 'undefined') {
    return;
  }

  const TOKEN_KEY = 'token'; // matches @nuxtjs/apollo `tokenName`

  const syncToken = async () => {
    try {
      const res = await fetch('/api/auth/token', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const { accessToken } = (await res.json()) as {
        accessToken: string | null;
      };
      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
      }
      // Note: we intentionally do NOT remove the token when null, to avoid
      // clobbering the SPA-written token during coexistence (Phase 4 removes the
      // SPA path and this becomes the sole writer).
    } catch {
      // ignore — Apollo falls back to whatever is in localStorage
    }
  };

  // Sync once on load, on tab focus, and periodically. Access tokens are
  // long-lived (24h) and the server refreshes them, so a 10-minute cadence is
  // plenty to keep localStorage fresh ahead of any request.
  syncToken();
  window.addEventListener('focus', syncToken);
  setInterval(syncToken, 10 * 60 * 1000);
});
