// plugins/auth-username-fallback.client.ts
//
// Client-side fallback for the app username.
//
// The app identity username (e.g. "cluse") is resolved server-side during SSR
// in server/middleware/2.auth-session.ts (Auth0 email -> backend getOwnEmail ->
// username) and travels to the client through the Nuxt payload. There is no
// client-side resolver anymore — the SPA `useAuthManager` was removed when the
// server-session migration landed.
//
// That makes username resolution single-point-of-failure: if the SSR lookup
// doesn't produce a username for a render (e.g. the server-side getAccessToken
// or profile $fetch fails at render time), the client is left authenticated but
// with an EMPTY username for the whole session. Everything keyed off username
// then silently breaks — most visibly "Add to favorites" does nothing, because
// the toggle handlers bail on `if (!usernameVar.value) return` and the favorite
// mutations require the username.
//
// This plugin restores a minimal client fallback: when the session is
// authenticated (we have a verified email) but username is still empty, resolve
// it from the server session and seed the auth state. Using a same-origin Nitro
// endpoint avoids depending on browser token storage, which is brittle in some
// embedded browser environments.
import { defineNuxtPlugin } from 'nuxt/app';
import {
  useIsAuthenticated,
  useUsername,
  setUsername,
  setModProfileName,
  setProfilePicURL,
  setNotificationCount,
} from '@/composables/useAuthState';

type AuthProfileResponse = {
  isAuthenticated?: boolean;
  username?: string | null;
  profilePicURL?: string | null;
  modProfileName?: string | null;
  notificationCount?: number | null;
};

const resolveUsername = async () => {
  try {
    const res = await fetch('/api/session/profile', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return;

    const profile = (await res.json()) as AuthProfileResponse;
    if (!profile?.username) return;

    // Only seed if SSR still hasn't filled it in (avoid clobbering a value that
    // arrived between scheduling and resolving).
    if (!useUsername().value) {
      setUsername(profile.username);
    }
    if (profile.modProfileName) {
      setModProfileName(profile.modProfileName);
    }
    if (profile.profilePicURL) {
      setProfilePicURL(profile.profilePicURL);
    }
    if (typeof profile.notificationCount === 'number') {
      setNotificationCount(profile.notificationCount);
    }
  } catch {
    // Ignore — username stays empty and will be retried on the next load.
  }
};

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return;

  const isAuthenticated = useIsAuthenticated();
  const username = useUsername();

  // Nothing to do when anonymous or when SSR already resolved the username.
  if (!isAuthenticated.value || username.value) return;

  // Fire-and-forget: never block app startup on this network round-trip. The
  // server session resolves identity server-side.
  void resolveUsername();
});
