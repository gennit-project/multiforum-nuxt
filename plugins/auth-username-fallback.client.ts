// plugins/auth-username-fallback.client.ts
//
// Client-side fallback for the app username.
//
// The app identity username (e.g. "cluse") is resolved server-side during SSR
// in server/middleware/2.auth-session.ts (Auth0 email -> backend GET_EMAIL ->
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
// it from the backend by email and seed the auth state. It mirrors GET_EMAIL
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

const GET_EMAIL_QUERY = /* GraphQL */ `
  query getEmail($emailAddress: String!) {
    emails(where: { address: $emailAddress }) {
      User {
        username
        profilePicURL
        ModerationProfile {
          displayName
        }
        NotificationsAggregate(where: { read: false }) {
          count
        }
      }
    }
  }
`;

type EmailLookupResponse = {
  data?: {
    emails?: Array<{
      User?: {
        username?: string | null;
        profilePicURL?: string | null;
        ModerationProfile?: { displayName?: string | null } | null;
        NotificationsAggregate?: { count?: number | null } | null;
      } | null;
    } | null> | null;
  };
};

const resolveUsername = async (emailAddress: string) => {
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
        query: GET_EMAIL_QUERY,
        variables: { emailAddress },
      }),
    });
    if (!res.ok) return;

    const json = (await res.json()) as EmailLookupResponse;
    const user = json?.data?.emails?.[0]?.User;
    if (!user?.username) return;

    // Only seed if SSR still hasn't filled it in (avoid clobbering a value that
    // arrived between scheduling and resolving).
    if (!useUsername().value) {
      setUsername(user.username);
    }
    if (user.ModerationProfile?.displayName) {
      setModProfileName(user.ModerationProfile.displayName);
    }
    if (user.profilePicURL) {
      setProfilePicURL(user.profilePicURL);
    }
    if (typeof user.NotificationsAggregate?.count === 'number') {
      setNotificationCount(user.NotificationsAggregate.count);
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

  // Fire-and-forget: never block app startup on this network round-trip.
  void resolveUsername(email.value);
});
