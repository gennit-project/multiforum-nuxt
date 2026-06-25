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
// it from the backend by token and seed the auth state. It mirrors GET_OWN_EMAIL
// (graphQLData/email/queries.js) and the SSR middleware. It is fire-and-forget
// so it never delays app startup; the reactive `username` update lets the
// favorite-status query and ownership-gated UI come to life once it lands.
import { defineNuxtPlugin } from 'nuxt/app';
import { config } from '@/config';
import {
  useIsAuthenticated,
  useUsername,
  useEmail,
  setUsername,
  setModProfileName,
  setProfilePicURL,
  setNotificationCount,
} from '@/composables/useAuthState';

// Self-scoped: getOwnEmail resolves the caller's email from the verified token
// on the backend, so it takes no arguments and can't look up anyone else.
const GET_OWN_EMAIL_QUERY = /* GraphQL */ `
  query getOwnEmail {
    getOwnEmail {
      username
      profilePicURL
      modProfileName
      unreadNotificationCount
    }
  }
`;

type OwnEmailResponse = {
  data?: {
    getOwnEmail?: {
      username?: string | null;
      profilePicURL?: string | null;
      modProfileName?: string | null;
      unreadNotificationCount?: number | null;
    } | null;
  };
};

const resolveUsername = async () => {
  const endpoint = config?.graphqlUrl;
  if (!endpoint) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: GET_OWN_EMAIL_QUERY,
      }),
    });
    if (!res.ok) return;

    const json = (await res.json()) as OwnEmailResponse;
    const ownEmail = json?.data?.getOwnEmail;
    if (!ownEmail?.username) return;

    // Only seed if SSR still hasn't filled it in (avoid clobbering a value that
    // arrived between scheduling and resolving).
    if (!useUsername().value) {
      setUsername(ownEmail.username);
    }
    if (ownEmail.modProfileName) {
      setModProfileName(ownEmail.modProfileName);
    }
    if (ownEmail.profilePicURL) {
      setProfilePicURL(ownEmail.profilePicURL);
    }
    if (typeof ownEmail.unreadNotificationCount === 'number') {
      setNotificationCount(ownEmail.unreadNotificationCount);
    }
  } catch {
    // Ignore — username stays empty and will be retried on the next load.
  }
};

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return;

  const isAuthenticated = useIsAuthenticated();
  const email = useEmail();
  const username = useUsername();

  // Nothing to do when anonymous, when we have no email to look up by, or when
  // SSR already resolved the username.
  if (!isAuthenticated.value || !email.value || username.value) return;

  // Fire-and-forget: never block app startup on this network round-trip. The
  // backend resolves identity from the bearer token; email.value is just the
  // "are we even signed in" gate.
  void resolveUsername();
});
