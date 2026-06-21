// plugins/auth-session.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 1, app half.
//
// Makes SSR auth-aware. The session is read in Nitro
// (server/middleware/2.auth-session.ts), because useAuth0(event) is a
// server-only auto-import; that middleware leaves the resolved profile on
// `event.context.authSession`. Here we seed the request-scoped auth state from
// it during SSR.
//
// The auth state lives in `composables/useAuthState.ts` as `useState` values
// (NOT module-level refs). `useState` is keyed to the current request's Nuxt
// app, so it:
//   1. is isolated per request — one user's auth state can never leak into
//      another user's SSR render (no cross-request pollution), and
//   2. serializes into the Nuxt payload on the server and restores on the
//      client automatically.
//
// Because of (2) this plugin only seeds on the SERVER — the client picks the
// exact same values back out of the payload with no re-seeding, so the first
// hydration render matches the server (no mismatch). For anonymous requests we
// seed the defaults explicitly so an authenticated value can never linger.
import { defineNuxtPlugin } from 'nuxt/app';
import {
  setIsAuthenticated,
  setUsername,
  setEmail,
  setModProfileName,
  setNotificationCount,
  setProfilePicURL,
} from '@/composables/useAuthState';

export default defineNuxtPlugin((nuxtApp) => {
  // Server-only: the client restores these from the payload via useState.
  if (!import.meta.server) return;

  const ctx = nuxtApp.ssrContext?.event?.context?.authSession;
  setIsAuthenticated(!!ctx?.isAuthenticated);
  setUsername(ctx?.username || '');
  setEmail(ctx?.email || '');
  setModProfileName(ctx?.modProfileName || '');
  setNotificationCount(ctx?.notificationCount || 0);
  setProfilePicURL(ctx?.profilePicURL || '');
});
