import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  cookie: 'signed-token' as string | undefined,
  fetch: vi.fn(),
  deleteCookie: vi.fn(),
  useAuth0: vi.fn(),
}));

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
vi.stubGlobal('getCookie', () => h.cookie);
vi.stubGlobal('deleteCookie', h.deleteCookie);
vi.stubGlobal('$fetch', h.fetch);
vi.stubGlobal('useAuth0', h.useAuth0);
vi.stubGlobal('useRuntimeConfig', () => ({
  backendGraphqlUrl: 'http://backend:4000/graphql',
  public: {
    authProvider: 'local-dev',
    apollo: {
      clients: { default: { httpEndpoint: 'http://localhost:4000/graphql' } },
    },
  },
}));

const { default: handler } = await import('@/server/middleware/2.auth-session');

const createEvent = () => ({ context: {} });

beforeEach(() => {
  vi.clearAllMocks();
  h.cookie = 'signed-token';
  process.env.VITE_E2E_MOCK_MODE = 'false';
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

describe('local auth session middleware', () => {
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
});
