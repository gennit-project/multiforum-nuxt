import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createError } from 'h3';

const h = vi.hoisted(() => ({
  body: { password: 'local-password' } as { password?: unknown },
  config: {
    localAuthTokenEndpoint: 'http://backend:4000/auth/local-dev/token',
    public: { authProvider: 'local-dev' },
  },
  fetch: vi.fn(),
  setCookie: vi.fn(),
  setResponseHeader: vi.fn(),
}));

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
vi.stubGlobal('setResponseHeader', h.setResponseHeader);
vi.stubGlobal('useRuntimeConfig', () => h.config);
vi.stubGlobal('readBody', async () => h.body);
vi.stubGlobal('$fetch', h.fetch);
vi.stubGlobal('setCookie', h.setCookie);
vi.stubGlobal('createError', createError);

const { default: handler } = await import('./login.post');

beforeEach(() => {
  vi.clearAllMocks();
  h.body = { password: 'local-password' };
  h.config.localAuthTokenEndpoint = 'http://backend:4000/auth/local-dev/token';
  h.config.public.authProvider = 'local-dev';
  h.fetch.mockResolvedValue({
    accessToken: 'signed-token',
    expiresIn: 900,
  });
});

describe('local development login endpoint', () => {
  it('forwards only the password to the configured backend endpoint', async () => {
    await handler({} as never);
    expect(h.fetch).toHaveBeenCalledWith(
      'http://backend:4000/auth/local-dev/token',
      { method: 'POST', body: { password: 'local-password' } }
    );
  });

  it('stores the bearer token in an HTTP-only cookie', async () => {
    await handler({} as never);
    expect(h.setCookie).toHaveBeenCalledWith(
      expect.anything(),
      'multiforum-local-token',
      'signed-token',
      expect.objectContaining({ httpOnly: true, maxAge: 900, path: '/' })
    );
  });

  it('does not expose the bearer token in its response', async () => {
    const result = await handler({} as never);
    expect(result).toEqual({ authenticated: true, expiresIn: 900 });
  });

  it('is unavailable unless local auth is explicitly enabled', async () => {
    h.config.public.authProvider = 'auth0';
    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('rejects an empty password before contacting the backend', async () => {
    h.body = { password: '' };
    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('maps backend credential failures without echoing the password', async () => {
    h.fetch.mockRejectedValue({ response: { status: 401 } });
    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    });
  });

  it('fails closed when the backend returns no token', async () => {
    h.fetch.mockResolvedValue({ expiresIn: 900 });
    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});
