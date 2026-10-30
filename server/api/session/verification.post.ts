import { isLocalDevAuth } from '@/server/utils/local-auth';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const config = useRuntimeConfig(event);
  // Do not accept a user ID or email from the browser. The recipient comes
  // exclusively from the current Auth0 session.
  if (!event.context.authSession?.isAuthenticated || isLocalDevAuth(config)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in again to continue.',
    });
  }
  if (getHeader(event, 'origin') !== new URL(config.auth0.appBaseUrl).origin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid request origin.',
    });
  }
  const session = await useAuth0(event).getSession();
  const user = session?.user;
  if (
    !user?.sub ||
    !user.email ||
    user.email_verified !== false ||
    !user.sub.startsWith('auth0|')
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sign in again to check your email verification.',
    });
  }
  const { clientId, clientSecret } = config.signupEmailVerification;
  if (!clientId || !clientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Verification email is unavailable. Please try signing in again.',
    });
  }
  const storage = useStorage('auth0Sessions');
  const key = `verification-email:${user.sub}`;
  const previous = await storage.getItem<number>(key);
  if (previous && Date.now() - previous < 60_000) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Please wait a minute before requesting another email.',
    });
  }
  await storage.setItem(key, Date.now(), { ttl: 60 });
  try {
    const base = `https://${config.auth0.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
    const token = await $fetch<{ access_token: string }>(
      `${base}/oauth/token`,
      {
        method: 'POST',
        timeout: 10_000,
        body: {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          audience: `${base}/api/v2/`,
        },
      }
    );
    await $fetch(`${base}/api/v2/jobs/verification-email`, {
      method: 'POST',
      timeout: 10_000,
      headers: { authorization: `Bearer ${token.access_token}` },
      body: { user_id: user.sub, client_id: config.auth0.clientId },
    });
    return { sent: true };
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage:
        'We could not send the email. Please try again in a minute or sign in again.',
    });
  }
});
