import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  provider: 'local-dev',
  cookie: 'signed-token' as string | undefined,
  getAccessToken: vi.fn(),
  fetch: vi.fn(),
}));

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
vi.stubGlobal('setResponseHeader', vi.fn());
vi.stubGlobal('useRuntimeConfig', () => ({
  backendGraphqlUrl: 'http://backend:4000/graphql',
  public: { authProvider: h.provider },
}));
vi.stubGlobal('getCookie', () => h.cookie);
vi.stubGlobal('useAuth0', () => ({ getAccessToken: h.getAccessToken }));
vi.stubGlobal('$fetch', h.fetch);

const { default: handler } = await import('./token.get');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.VITE_E2E_MOCK_MODE = 'false';
  h.provider = 'local-dev';
  h.cookie = 'signed-token';
  h.getAccessToken.mockResolvedValue({ accessToken: 'auth0-token' });
  h.fetch.mockResolvedValue({
    data: { getOwnEmail: { unreadNotificationCount: 7 } },
  });
});

const createEvent = (notificationCount = 0) => ({
  context: {
    authSession: { isAuthenticated: true, notificationCount },
  },
});

describe('session token endpoint', () => {
  it('returns the local cookie token for Apollo synchronization', async () => {
    await expect(handler(createEvent(3) as never)).resolves.toEqual({
      accessToken: 'signed-token',
      notificationCount: 3,
    });
  });

  it('returns null when the local session has expired', async () => {
    h.cookie = undefined;
    await expect(handler(createEvent() as never)).resolves.toEqual({
      accessToken: null,
      notificationCount: 0,
    });
  });

  it('preserves the existing Auth0 token path', async () => {
    h.provider = 'auth0';
    await expect(handler(createEvent() as never)).resolves.toEqual({
      accessToken: 'auth0-token',
      notificationCount: 7,
    });
  });

  it('returns a token resolved by the request middleware', async () => {
    h.cookie = undefined;

    await expect(
      handler({
        context: {
          accessToken: 'mock-jwt',
          authSession: { isAuthenticated: true, notificationCount: 0 },
        },
      } as never)
    ).resolves.toEqual({ accessToken: 'mock-jwt', notificationCount: 0 });
  });

  it('falls back to the SSR count when the deferred lookup fails', async () => {
    h.provider = 'auth0';
    h.fetch.mockRejectedValue(new Error('backend unavailable'));

    await expect(handler(createEvent(2) as never)).resolves.toEqual({
      accessToken: 'auth0-token',
      notificationCount: 2,
    });
  });
});
