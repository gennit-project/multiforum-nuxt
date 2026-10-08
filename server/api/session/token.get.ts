// server/api/session/token.get.ts
//
// Alias for the session access token endpoint. Some embedded browsers are more
// aggressive about blocking `/api/auth/*` paths, so the browser fallback uses
// this neutral path instead.
import { isLocalDevAuth, LOCAL_AUTH_COOKIE } from '@/server/utils/local-auth';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');

  // The auth-session middleware has already resolved the request's token. In
  // mocked E2E runs this is sourced from the guarded mock-auth cookie; in real
  // sessions it avoids doing the same provider lookup twice.
  if (event.context?.accessToken) {
    return { accessToken: event.context.accessToken };
  }

  if (isLocalDevAuth(useRuntimeConfig(event))) {
    return { accessToken: getCookie(event, LOCAL_AUTH_COOKIE) ?? null };
  }

  try {
    const tokenSet = await useAuth0(event).getAccessToken();
    return { accessToken: tokenSet?.accessToken ?? null };
  } catch {
    return { accessToken: null };
  }
});
