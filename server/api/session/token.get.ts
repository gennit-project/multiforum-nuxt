// server/api/session/token.get.ts
//
// Alias for the session access token endpoint. Some embedded browsers are more
// aggressive about blocking `/api/auth/*` paths, so the browser fallback uses
// this neutral path instead.
import { isLocalDevAuth, LOCAL_AUTH_COOKIE } from '@/server/utils/local-auth';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');

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
