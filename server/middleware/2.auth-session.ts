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
};

declare module 'h3' {
  interface H3EventContext {
    authSession?: AuthSessionContext;
  }
}

// Minimal version of GET_EMAIL (graphQLData/email/queries.js) — only the
// username is needed to seed SSR auth state.
const GET_USERNAME_BY_EMAIL = /* GraphQL */ `
  query getUsernameByEmail($emailAddress: String!) {
    emails(where: { address: $emailAddress }) {
      User {
        username
      }
    }
  }
`;

type EmailLookupResponse = {
  data?: {
    emails?: Array<{ User?: { username?: string | null } | null } | null> | null;
  };
};

export default defineEventHandler(async (event) => {
  try {
    // useAuth0 is auto-imported by @auth0/auth0-nuxt in the Nitro context.
    const auth0 = useAuth0(event);
    const session = await auth0.getSession();
    const user = session?.user;
    if (!user) {
      // No session / not logged in — leave event.context.authSession unset.
      return;
    }

    const email = (user.email as string) || '';
    let username = '';

    // Preferred: resolve the real app username from the GraphQL backend by
    // email, authenticated with an API access token from the session.
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
              query: GET_USERNAME_BY_EMAIL,
              variables: { emailAddress: email },
            },
          });
          username = res?.data?.emails?.[0]?.User?.username || '';
        }
      } catch {
        // Token unavailable (e.g. NUXT_AUTH0_AUDIENCE unset) or lookup failed —
        // fall back below. Never block the request on the username lookup.
      }
    }

    // Fallback: token claim, then nickname, then email. Display-only degradation
    // — isAuthenticated is still correct even if the username is approximate.
    if (!username) {
      username =
        (user['https://gennit.net/username'] as string) ||
        (user.nickname as string) ||
        email ||
        '';
    }

    event.context.authSession = { isAuthenticated: true, username };
  } catch {
    // Never block a request on the auth read.
  }
});
