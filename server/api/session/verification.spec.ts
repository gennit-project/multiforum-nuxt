import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  getSession: vi.fn(),
  startInteractiveLogin: vi.fn(),
  fetch: vi.fn(),
  config: {
    public: { authProvider: 'auth0' },
    auth0: {
      appBaseUrl: 'https://app.test',
      domain: 'tenant.auth0.com',
      clientId: 'web-client',
    },
    signupEmailVerification: {
      clientId: 'm2m-client',
      clientSecret: 'server-secret',
    },
  },
  stored: null as number | null,
}));
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
vi.stubGlobal('setResponseHeader', vi.fn());
vi.stubGlobal('useRuntimeConfig', () => h.config);
vi.stubGlobal('useAuth0', () => ({
  getSession: h.getSession,
  startInteractiveLogin: h.startInteractiveLogin,
}));
vi.stubGlobal('createError', (error: object) =>
  Object.assign(new Error(), error)
);
vi.stubGlobal('getHeader', (event: { origin: string }) => event.origin);
vi.stubGlobal('sendRedirect', (_event: unknown, url: string) => url);
vi.stubGlobal('$fetch', h.fetch);
vi.stubGlobal('useStorage', () => ({
  getItem: async () => h.stored,
  setItem: async (_key: string, value: number) => {
    h.stored = value;
  },
}));
const { default: get } = await import('./verification.get');
const { default: post } = await import('./verification.post');
const { default: refresh } =
  await import('../../routes/auth/signup/refresh.get');
const event = () =>
  ({
    origin: 'https://app.test',
    context: { authSession: { isAuthenticated: true } },
  }) as never;
beforeEach(() => {
  vi.clearAllMocks();
  h.config.public.authProvider = 'auth0';
  h.config.signupEmailVerification = {
    clientId: 'm2m-client',
    clientSecret: 'server-secret',
  };
  h.stored = null;
  h.getSession.mockResolvedValue({
    user: {
      sub: 'auth0|current-user',
      email: 'current@example.com',
      email_verified: false,
    },
  });
  h.fetch.mockResolvedValue({ access_token: 'management-token' });
  h.startInteractiveLogin.mockResolvedValue(
    new URL('https://tenant.auth0.com/authorize')
  );
});
describe('verification status', () => {
  it.each([
    [true, 'verified'],
    [false, 'unverified'],
    [undefined, 'unknown'],
    ['true', 'unknown'],
  ])('distinguishes %s from lookup failure', async (claim, status) => {
    h.getSession.mockResolvedValue({
      user: {
        sub: 'auth0|user',
        email: 'a@example.com',
        email_verified: claim,
      },
    });
    await expect(get(event())).resolves.toMatchObject({ status });
  });
  it('offers resend for an unverified database login with configured credentials', async () => {
    await expect(get(event())).resolves.toEqual({
      status: 'unverified',
      canResend: true,
    });
  });
  it('does not offer resend for social identities', async () => {
    h.getSession.mockResolvedValue({
      user: {
        sub: 'google-oauth2|user',
        email: 'a@example.com',
        email_verified: false,
      },
    });
    await expect(get(event())).resolves.toEqual({
      status: 'unverified',
      canResend: false,
    });
  });
  it('does not offer resend without credentials', async () => {
    h.config.signupEmailVerification.clientSecret = '';
    await expect(get(event())).resolves.toMatchObject({ canResend: false });
  });
  it('returns unknown on session lookup failure', async () => {
    h.getSession.mockRejectedValue(new Error('unavailable'));
    await expect(get(event())).resolves.toEqual({
      status: 'unknown',
      canResend: false,
    });
  });
  it('does not treat a missing email as verified', async () => {
    h.getSession.mockResolvedValue({
      user: { sub: 'auth0|user', email_verified: true },
    });
    await expect(get(event())).resolves.toEqual({
      status: 'unknown',
      canResend: false,
    });
  });
  it('reports missing sessions', async () => {
    h.getSession.mockResolvedValue(undefined);
    await expect(get(event())).resolves.toMatchObject({ status: 'signed-out' });
  });
  it('reports anonymous requests', async () => {
    await expect(get({ context: {} } as never)).resolves.toMatchObject({
      status: 'signed-out',
    });
  });
  it('supports trusted local authentication', async () => {
    h.config.public.authProvider = 'local-dev';
    await expect(get(event())).resolves.toEqual({
      status: 'verified',
      canResend: false,
    });
  });
});
describe('verification resend', () => {
  it('sends only to the current session identity', async () => {
    await post(event());
    expect(h.fetch.mock.calls[1]).toEqual([
      'https://tenant.auth0.com/api/v2/jobs/verification-email',
      {
        method: 'POST',
        timeout: 10_000,
        headers: { authorization: 'Bearer management-token' },
        body: { user_id: 'auth0|current-user', client_id: 'web-client' },
      },
    ]);
  });
  it('returns success without exposing management credentials', async () => {
    await expect(post(event())).resolves.toEqual({ sent: true });
  });
  it('rejects anonymous requests', async () => {
    await expect(post({ context: {} } as never)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
  it('rejects cross-origin requests', async () => {
    await expect(
      post({
        origin: 'https://other.test',
        context: { authSession: { isAuthenticated: true } },
      } as never)
    ).rejects.toMatchObject({ statusCode: 403 });
  });
  it('rejects already-verified identities', async () => {
    h.getSession.mockResolvedValue({
      user: { sub: 'auth0|user', email: 'a@test', email_verified: true },
    });
    await expect(post(event())).rejects.toMatchObject({ statusCode: 400 });
  });
  it('rejects missing session users', async () => {
    h.getSession.mockResolvedValue(undefined);
    await expect(post(event())).rejects.toMatchObject({ statusCode: 400 });
  });
  it('reports unavailable resend configuration', async () => {
    h.config.signupEmailVerification.clientSecret = '';
    await expect(post(event())).rejects.toMatchObject({ statusCode: 503 });
  });
  it('enforces a per-user resend cooldown', async () => {
    await post(event());
    await expect(post(event())).rejects.toMatchObject({ statusCode: 429 });
  });
  it('sanitizes provider errors', async () => {
    h.fetch.mockRejectedValue(new Error('secret provider details'));
    await expect(post(event())).rejects.toMatchObject({
      statusCode: 503,
      statusMessage:
        'We could not send the email. Please try again in a minute or sign in again.',
    });
  });
});
describe('verification reauthentication', () => {
  it('requests new claims and a new token with a fixed return path', async () => {
    await refresh(event());
    expect(h.startInteractiveLogin).toHaveBeenCalledWith({
      authorizationParams: { prompt: 'login', max_age: 0 },
      appState: { returnTo: '/create-username' },
    });
  });
  it('redirects to Auth0 authorization', async () => {
    await expect(refresh(event())).resolves.toBe(
      'https://tenant.auth0.com/authorize'
    );
  });
  it('supports the local login route', async () => {
    h.config.public.authProvider = 'local-dev';
    await expect(refresh(event())).resolves.toBe(
      '/login?returnTo=%2Fcreate-username'
    );
  });
});
