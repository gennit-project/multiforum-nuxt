// server/api/session/token.get.ts
//
// Alias for the session access token endpoint. Some embedded browsers are more
// aggressive about blocking `/api/auth/*` paths, so the client uses this
// neutral path instead.

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');

  try {
    const tokenSet = await useAuth0(event).getAccessToken();
    return { accessToken: tokenSet?.accessToken ?? null };
  } catch {
    return { accessToken: null };
  }
});
