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
// Performance: the STABLE profile fields (username / mod name / avatar) are
// cached per email in the 'authProfileCache' store with a TTL, so we don't
// re-run the full backend join on every authenticated request. Only the
// volatile unread-notification count is fetched fresh each request.
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
    // API access token from the session, used to authenticate SSR Apollo
    // queries (see plugins/apollo-ssr-auth.ts).
    accessToken?: string;
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

// Lightweight, count-only variant used on a profile-cache hit: the stable
// fields come from the cache, so only the volatile unread-notification count
// needs to be fetched fresh per request.
const GET_NOTIFICATION_COUNT = /* GraphQL */ `
  query getNotificationCount($emailAddress: String!) {
    emails(where: { address: $emailAddress }) {
      User {
        NotificationsAggregate(where: { read: false }) {
          count
        }
      }
    }
  }
`;

type NotificationCountResponse = {
  data?: {
    emails?: Array<{
      User?: {
        NotificationsAggregate?: { count?: number | null } | null;
      } | null;
    } | null> | null;
  };
};

// The slice of the profile that is stable enough to cache between requests.
// notificationCount is deliberately excluded — it is always fetched fresh.
type StableProfile = {
  username: string;
  modProfileName: string;
  profilePicURL: string;
};

// How long a resolved stable profile is trusted before re-resolving from the
// backend. Username/mod-name/avatar change rarely, so an hour bounds staleness
// (e.g. an avatar change) without re-querying on every authenticated request.
const PROFILE_CACHE_TTL_SECONDS = 60 * 60;

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

    // Resolve the app profile from the GraphQL backend by email, authenticated
    // with an API access token from the session (replaces the removed SPA
    // useAuthManager fetch). The STABLE fields (username/mod-name/avatar) are
    // cached per email so we don't re-run the full join on every request; only
    // the volatile unread-notification count is fetched fresh each time.
    if (email) {
      try {
        const tokenSet = await auth0.getAccessToken();
        const accessToken = tokenSet?.accessToken;
        // Expose the API access token to the SSR Apollo client (read back in
        // plugins/apollo-ssr-auth.ts via the `apollo:auth` hook) so server-side
        // GraphQL queries run AUTHENTICATED, exactly like the client's queries.
        // Without this the SSR is anonymous (the token lives only in client
        // localStorage), so permission-gated data renders differently on the
        // server than on the client's first hydration render — a hydration
        // mismatch. Safe per-request because forum detail pages are not
        // route-cached (no shared SSR), so one user's token never serves another.
        if (accessToken) {
          event.context.accessToken = accessToken;
        }
        const graphqlUrl =
          useRuntimeConfig(event).public?.apollo?.clients?.default
            ?.httpEndpoint;

        if (accessToken && graphqlUrl) {
          const queryBackend = <T>(query: string) =>
            $fetch<T>(graphqlUrl, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${accessToken}`,
              },
              body: { query, variables: { emailAddress: email } },
            });

          const cache = useStorage<StableProfile>('authProfileCache');
          const cacheKey = `profile:${email}`;
          const cached = await cache.getItem(cacheKey);

          if (cached) {
            // Stable fields from cache; fetch only the fresh count.
            username = cached.username;
            modProfileName = cached.modProfileName;
            profilePicURL = cached.profilePicURL;
            const countRes =
              await queryBackend<NotificationCountResponse>(
                GET_NOTIFICATION_COUNT
              );
            notificationCount =
              countRes?.data?.emails?.[0]?.User?.NotificationsAggregate
                ?.count || 0;
          } else {
            const res = await queryBackend<EmailLookupResponse>(GET_EMAIL);
            const u = res?.data?.emails?.[0]?.User;
            username = u?.username || '';
            modProfileName = u?.ModerationProfile?.displayName || '';
            notificationCount = u?.NotificationsAggregate?.count || 0;
            profilePicURL = u?.profilePicURL || '';

            // Cache only a resolved user. An empty username means "no app
            // account yet" (pre-create-username); leaving it uncached makes the
            // next request pick up the new username immediately after creation
            // instead of waiting out the TTL.
            if (username) {
              await cache.setItem(
                cacheKey,
                { username, modProfileName, profilePicURL },
                { ttl: PROFILE_CACHE_TTL_SECONDS }
              );
            }
          }
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
