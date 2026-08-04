import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  provider: 'local-dev',
  cookie: 'signed-token' as string | undefined,
  getAccessToken: vi.fn(),
}));

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
vi.stubGlobal('setResponseHeader', vi.fn());
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { authProvider: h.provider },
}));
vi.stubGlobal('getCookie', () => h.cookie);
vi.stubGlobal('useAuth0', () => ({ getAccessToken: h.getAccessToken }));

const { default: handler } = await import('./token.get');

beforeEach(() => {
  vi.clearAllMocks();
  h.provider = 'local-dev';
  h.cookie = 'signed-token';
  h.getAccessToken.mockResolvedValue({ accessToken: 'auth0-token' });
});

describe('session token endpoint', () => {
  it('returns the local cookie token for Apollo synchronization', async () => {
    await expect(handler({} as never)).resolves.toEqual({
      accessToken: 'signed-token',
    });
  });

  it('returns null when the local session has expired', async () => {
    h.cookie = undefined;
    await expect(handler({} as never)).resolves.toEqual({ accessToken: null });
  });

  it('preserves the existing Auth0 token path', async () => {
    h.provider = 'auth0';
    await expect(handler({} as never)).resolves.toEqual({
      accessToken: 'auth0-token',
    });
  });
});
