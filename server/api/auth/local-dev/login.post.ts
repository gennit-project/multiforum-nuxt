import {
  getLocalAuthTokenEndpoint,
  isLocalDevAuth,
  LOCAL_AUTH_COOKIE,
} from '@/server/utils/local-auth';

type TokenResponse = {
  accessToken?: string;
  expiresIn?: number;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');

  const config = useRuntimeConfig(event);
  if (!isLocalDevAuth(config)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const body = await readBody<{ password?: unknown }>(event);
  if (typeof body?.password !== 'string' || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password is required',
    });
  }

  const endpoint = getLocalAuthTokenEndpoint(config);
  if (!endpoint) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Local authentication is not configured',
    });
  }

  let tokenResponse: TokenResponse;
  try {
    tokenResponse = await $fetch<TokenResponse>(endpoint, {
      method: 'POST',
      body: { password: body.password },
    });
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    throw createError({
      statusCode: status === 401 ? 401 : 502,
      statusMessage:
        status === 401
          ? 'Invalid credentials'
          : 'Local authentication service is unavailable',
    });
  }

  if (!tokenResponse.accessToken) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Local authentication returned no token',
    });
  }

  const maxAge = Math.max(1, tokenResponse.expiresIn ?? 15 * 60);
  setCookie(event, LOCAL_AUTH_COOKIE, tokenResponse.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge,
  });

  return { authenticated: true, expiresIn: maxAge };
});
