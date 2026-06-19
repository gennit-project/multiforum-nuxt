// server/middleware/2.auth-session.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 1, server half.
//
// `useAuth0(event)` is a NITRO server auto-import; it is only available in
// server/ handlers, NOT in a Nuxt app plugin (even during SSR). So we read the
// session here, in Nitro, resolve the user's app username, and stash a small
// POJO on `event.context`. The app-side plugin (plugins/auth-session.ts) reads
// it back from `ssrContext.event.context` during SSR and transfers it to the
// client via the Nuxt payload. This is the bridge from the Nitro request
// context into the Vue/SSR render context.
//
// Phase 1 completion — REAL username, server-side:
// The app keys auth UI off the application username (e.g. "cluse"). That value
// is NOT reliably in the Auth0 token (the PostLogin Action sets a claim on the
// access token from request.body.username, which getSession can't read and
// which is absent on session resume). The source of truth is the GraphQL
// backend, keyed by email — exactly what useAuthManager fetches client-side.
// We replicate that fetch here so SSR renders with the correct username and
// ownership-gated UI (e.g. the discussion Edit button) appears on first paint.
//
// Requires NUXT_AUTH0_AUDIENCE to be set to the GraphQL API audience so
// getAccessToken() returns a JWT the API accepts. Without it, the lookup fails
// gracefully and we fall back to the token claim / email (degraded display
// only — auth state is still correct).
//
// Numeric filename prefix controls middleware order (runs after
// 1.cache-control.ts), matching the existing convention in this directory.

type AuthSessionContext = {
  isAuthenticated: boolean;
  username: string;
  email: string;
  modProfileName: string;
  notificationCount: number;
  profilePicURL: string;
};

declare module 'h3' {
  interface H3EventContext {
    authSession?: AuthSessionContext;
  }
}

// Mirror of GET_EMAIL (graphQLData/email/queries.js): everything useAuthManager
// used to fetch client-side via the SPA. Resolving it here (server-side, from
// the session) is what lets the SPA auth manager be removed entirely.
const GET_EMAIL = /* GraphQL */ `
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

// Test-only: in mocked Playwright runs there is no real Auth0 session, so the
// test fixture (tests/playwright/helpers/mockAuth.ts) sets a `mock-auth` cookie
// holding the seeded profile. We honor it ONLY when VITE_E2E_MOCK_MODE is set
// (the frontend dev server flag from playwright.config.ts), so it can never be
// trusted in production. This lets mocked tests exercise the SAME SSR seeding
// path as production (server middleware -> event.context -> auth-session.ts
// payload -> client), instead of a separate client-only auth shim.
const readMockSession = (event: Parameters<typeof getCookie>[0]) => {
  if (process.env.VITE_E2E_MOCK_MODE !== 'true') return null;
  const raw = getCookie(event, 'mock-auth');
  if (!raw) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(raw, 'base64').toString('utf-8')
    ) as Partial<AuthSessionContext>;
    return {
      isAuthenticated: true,
      username: decoded.username || '',
      email: decoded.email || '',
      modProfileName: decoded.modProfileName || '',
      notificationCount: decoded.notificationCount || 0,
      profilePicURL: decoded.profilePicURL || '',
    } satisfies AuthSessionContext;
  } catch {
    return null;
  }
};

export default defineEventHandler(async (event) => {
  // Mocked-test bypass: seed straight from the cookie, no real Auth0 involved.
  const mockSession = readMockSession(event);
  if (mockSession) {
    event.context.authSession = mockSession;
    return;
  }

  try {
    // useAuth0 is auto-imported by @auth0/auth0-nuxt in the Nitro context.
    const auth0 = useAuth0(event);
    const session = await auth0.getSession();
    const user = session?.user;
    if (!user) {
      // No session / not logged in — leave event.context.authSession unset.
      return;
    }

    // Auth0 is only trusted for the (verified) email. The app username is OUR
    // data, not Auth0's — it must be resolved from the email via the backend,
    // never read from an Auth0 token claim (which can't be trusted to know it).
    const email = (user.email as string) || '';
    let username = '';
    let modProfileName = '';
    let notificationCount = 0;
    let profilePicURL = '';

    // Resolve the full app profile from the GraphQL backend by email,
    // authenticated with an API access token from the session. This replaces
    // what the (now-removed) SPA useAuthManager fetched client-side.
    if (email) {
      try {
        const tokenSet = await auth0.getAccessToken();
        const accessToken = tokenSet?.accessToken;
        const graphqlUrl =
          useRuntimeConfig(event).public?.apollo?.clients?.default
            ?.httpEndpoint;

        if (accessToken && graphqlUrl) {
          const res = await $fetch<EmailLookupResponse>(graphqlUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${accessToken}`,
            },
            body: {
              query: GET_EMAIL,
              variables: { emailAddress: email },
            },
          });
          const u = res?.data?.emails?.[0]?.User;
          username = u?.username || '';
          modProfileName = u?.ModerationProfile?.displayName || '';
          notificationCount = u?.NotificationsAggregate?.count || 0;
          profilePicURL = u?.profilePicURL || '';
        }
      } catch {
        // Token/lookup unavailable — leave profile empty. The user is still
        // authenticated (valid session + email); the profile resolves once the
        // API token works (or they create a username). No Auth0-claim fallback.
      }
    }

    // Authenticated as soon as there is a valid session with an email; profile
    // fields may be empty (resolve once the API token works / create-username).
    event.context.authSession = {
      isAuthenticated: true,
      username,
      email,
      modProfileName,
      notificationCount,
      profilePicURL,
    };
  } catch {
    // Never block a request on the auth read.
  }
});
