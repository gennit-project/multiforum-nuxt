// plugins/apollo-auth.client.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 2.
//
// Feed the access token from the server session into Apollo. We do NOT use
// @nuxtjs/apollo's `apollo:auth` hook: that hook runs during SSR too, where a
// relative fetch('/api/session/token') is an internal Nitro call with NO cookies,
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
import { setNotificationCount } from '@/composables/useAuthState';
import { clearPersistedAuth } from '@/utils/authUtils';

export default defineNuxtPlugin((nuxtApp) => {
  // Client-only by file name, but guard anyway — never touch localStorage / make
  // a relative (cookieless) fetch on the server.
  if (typeof window === 'undefined') {
    return;
  }

  const TOKEN_KEY = 'token'; // matches @nuxtjs/apollo `tokenName`
  const canUseLocalStorage = () => {
    try {
      return typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  };

  const syncToken = async () => {
    try {
      const res = await fetch('/api/session/token', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const { accessToken, notificationCount } = (await res.json()) as {
        accessToken: string | null;
        notificationCount?: number;
      };
      if (accessToken) {
        if (canUseLocalStorage()) {
          localStorage.setItem(TOKEN_KEY, accessToken);
        }
        return notificationCount;
      }

      // An explicit null token means the server session is gone. Clear both the
      // token and the persisted username so the UI cannot restore a ghost login.
      if (canUseLocalStorage()) {
        clearPersistedAuth();
      }
    } catch {
      // ignore — Apollo falls back to whatever is in localStorage
    }

    return undefined;
  };

  // Sync once on load so the browser-local Apollo token matches the current
  // server session without introducing ongoing background polling for normal
  // browser sessions. The same response carries the volatile unread count, but
  // publish it only after Vue adopts the server-rendered tree so an early
  // response cannot create a hydration mismatch in the navigation badge.
  const tokenSync = syncToken();
  nuxtApp.hook('app:mounted', () => {
    void tokenSync.then((notificationCount) => {
      if (typeof notificationCount === 'number') {
        setNotificationCount(notificationCount);
      }
    });
  });
});
