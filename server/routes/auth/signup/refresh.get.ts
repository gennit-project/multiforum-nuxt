import { isLocalDevAuth } from '@/server/utils/local-auth';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  if (isLocalDevAuth(useRuntimeConfig(event))) {
    return sendRedirect(event, '/login?returnTo=%2Fcreate-username', 302);
  }
  // Force a new token and claims instead of reusing a cached, unverified API
  // identity. The fixed return path cannot be supplied by a caller.
  const url = await useAuth0(event).startInteractiveLogin({
    authorizationParams: { prompt: 'login', max_age: 0 },
    appState: { returnTo: '/create-username' },
  });
  return sendRedirect(event, url.href, 302);
});
