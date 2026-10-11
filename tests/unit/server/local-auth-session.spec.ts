import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  cookie: 'signed-token' as string | undefined,
  fetch: vi.fn(),
  deleteCookie: vi.fn(),
  useAuth0: vi.fn(),
  provider: 'local-dev',
  storageGet: vi.fn(),
  storageSet: vi.fn(),
}));

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
vi.stubGlobal('getCookie', () => h.cookie);
vi.stubGlobal('deleteCookie', h.deleteCookie);
vi.stubGlobal('$fetch', h.fetch);
vi.stubGlobal('useAuth0', h.useAuth0);
vi.stubGlobal('useStorage', () => ({
  getItem: h.storageGet,
  setItem: h.storageSet,
}));
vi.stubGlobal('useRuntimeConfig', () => ({
  backendGraphqlUrl: 'http://backend:4000/graphql',
  public: {
    authProvider: h.provider,
    apollo: {
      clients: { default: { httpEndpoint: 'http://localhost:4000/graphql' } },
    },
  },
}));

const { default: handler } = await import('@/server/middleware/2.auth-session');

const createEvent = (path = '/') => ({ context: {}, path });

beforeEach(() => {
  vi.clearAllMocks();
  h.cookie = 'signed-token';
  h.provider = 'local-dev';
  h.storageGet.mockResolvedValue(null);
  process.env.VITE_E2E_MOCK_MODE = 'false';
  delete process.env.NUXT_AUTH_SLOW_REQUEST_MS;
  h.fetch.mockResolvedValue({
    data: {
      getOwnEmail: {
        address: 'admin@example.test',
        username: 'admin',
        profilePicURL: null,
        modProfileName: 'bootstrap-admin',
        unreadNotificationCount: 2,
      },
    },
  });
});

describe('auth session middleware', () => {
  it('validates the cookie against the self-scoped backend profile query', async () => {
    const event = createEvent();
    await handler(event as never);
    expect(h.fetch).toHaveBeenCalledWith(
      'http://backend:4000/graphql',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer signed-token',
        }),
      })
    );
  });

  it('seeds the same request-scoped profile shape used by Auth0', async () => {
    const event = createEvent();
    await handler(event as never);
    expect(event.context).toEqual({
      accessToken: 'signed-token',
      authSession: {
        isAuthenticated: true,
        username: 'admin',
        email: 'admin@example.test',
        modProfileName: 'bootstrap-admin',
        notificationCount: 2,
        profilePicURL: '',
      },
    });
  });

  it('does not invoke Auth0 while the local provider is active', async () => {
    await handler(createEvent() as never);
    expect(h.useAuth0).not.toHaveBeenCalled();
  });

  it('stays anonymous when no local cookie exists', async () => {
    h.cookie = undefined;
    const event = createEvent();
    await handler(event as never);
    expect(event.context).toEqual({});
  });

  it('clears a token rejected by the backend', async () => {
    h.fetch.mockRejectedValue(new Error('expired'));
    await handler(createEvent() as never);
    expect(h.deleteCookie).toHaveBeenCalledWith(
      expect.anything(),
      'multiforum-local-token',
      { path: '/' }
    );
  });

  it('clears a token that resolves no authenticated profile', async () => {
    h.fetch.mockResolvedValue({ data: { getOwnEmail: null } });
    await handler(createEvent() as never);
    expect(h.deleteCookie).toHaveBeenCalledWith(
      expect.anything(),
      'multiforum-local-token',
      { path: '/' }
    );
  });

  it('passes the guarded mock token through to the request context', async () => {
    process.env.VITE_E2E_MOCK_MODE = 'true';
    h.cookie = Buffer.from(
      JSON.stringify({
        username: 'admin',
        email: 'admin@example.test',
        modProfileName: 'bootstrap-admin',
        accessToken: 'mock-jwt',
      })
    ).toString('base64');
    const event = createEvent();

    await handler(event as never);

    expect(event.context).toEqual({
      accessToken: 'mock-jwt',
      authSession: {
        isAuthenticated: true,
        username: 'admin',
        email: 'admin@example.test',
        modProfileName: 'bootstrap-admin',
        notificationCount: 0,
        profilePicURL: '',
      },
    });
  });

  it('skips session resolution for the browser GraphQL proxy', async () => {
    const event = createEvent('/api/graphql');

    await handler(event as never);

    expect({
      context: event.context,
      profileRequests: h.fetch.mock.calls.length,
      auth0Requests: h.useAuth0.mock.calls.length,
    }).toEqual({ context: {}, profileRequests: 0, auth0Requests: 0 });
  });

  it('logs provider and profile phases for slow authenticated SSR', async () => {
    h.provider = 'auth0';
    process.env.NUXT_AUTH_SLOW_REQUEST_MS = '0';
    h.storageGet.mockResolvedValue({
      username: 'admin',
      modProfileName: 'bootstrap-admin',
      profilePicURL: '',
    });
    h.useAuth0.mockReturnValue({
      getSession: vi.fn().mockResolvedValue({
        user: { email: 'admin@example.test' },
      }),
      getAccessToken: vi.fn().mockResolvedValue({ accessToken: 'auth0-token' }),
    });
    h.fetch.mockResolvedValue({
      data: { getOwnEmail: { unreadNotificationCount: 3 } },
    });
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await handler(createEvent('/forums/vue_devs/issues/2') as never);

    const timing = JSON.parse(
      String(info.mock.calls[0][0]).replace('[auth-session-timing] ', '')
    );
    expect(timing).toEqual(
      expect.objectContaining({
        path: '/forums/vue_devs/issues/2',
        profileCacheHit: true,
        totalMs: expect.any(Number),
        sessionMs: expect.any(Number),
        accessTokenMs: expect.any(Number),
        profileMs: expect.any(Number),
      })
    );
  });
});
