// server/api/auth/token.get.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 2.
//
// Exposes the access token for the CURRENT server session to the authenticated
// browser, so the client Apollo link can authenticate GraphQL requests from the
// server session instead of from a localStorage token written by the SPA SDK.
//
// useAuth0(event).getAccessToken() reads the encrypted session cookie and, if
// needed, refreshes the token server-side using the refresh token — so the
// browser never has to talk to Auth0 directly, and there is no SPA dependency.
//
// Same-origin + session-cookie means only the session owner can read their own
// token. (A stricter end-state — Phase 2b — proxies GraphQL through a Nitro
// route so the token never reaches the client at all; see the spike doc.)
// KNOWN BLOCKER (alpha SDK): getAccessToken() currently throws "access token
// has expired and a refresh token was not provided" even when the session was
// just written with a FRESH access token (24h) AND a refresh token. The session
// is stored correctly (verified) but the SDK misreads it on the way back
// (refresh token stored at the StateData top level, but read from inside the
// token set; and the fresh token is judged expired — likely a seconds-vs-ms
// expiry comparison). Tracked as an upstream @auth0/auth0-nuxt bug. Until it is
// fixed, this endpoint returns null and Apollo falls back to no token.
export default defineEventHandler(async (event) => {
  // Per-session + sensitive: never cache (defense in depth alongside the
  // cache-control middleware's /api/auth/ exclusion).
  setResponseHeader(event, 'Cache-Control', 'no-store');
  try {
    const tokenSet = await useAuth0(event).getAccessToken();
    return { accessToken: tokenSet?.accessToken ?? null };
  } catch {
    return { accessToken: null };
  }
});

