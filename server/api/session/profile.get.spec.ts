import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ fetch: vi.fn(), getAccessToken: vi.fn() }));
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
vi.stubGlobal('setResponseHeader', vi.fn());
vi.stubGlobal('useRuntimeConfig', () => ({
  backendGraphqlUrl: 'http://backend:4000/graphql',
  public: { authProvider: 'auth0' },
}));
vi.stubGlobal('useAuth0', () => ({ getAccessToken: h.getAccessToken }));
vi.stubGlobal('$fetch', h.fetch);
const { default: handler } = await import('./profile.get');
const session = {
  isAuthenticated: true,
  username: '',
  email: 'new@example.com',
};
const run = () =>
  handler({
    context: { authSession: session, accessToken: 'api-token' },
  } as never);
beforeEach(() => {
  vi.clearAllMocks();
  h.getAccessToken.mockResolvedValue({ accessToken: 'api-token' });
});
describe('onboarding profile resolution', () => {
  it.each([{ username: null }, { username: '' }])(
    'confirms onboarding for a successful lookup: %s',
    async (getOwnEmail) => {
      h.fetch.mockResolvedValue({ data: { getOwnEmail } });
      await expect(run()).resolves.toEqual({
        ...session,
        needsOnboarding: true,
      });
    }
  );
  it.each([
    {},
    { data: {} },
    { data: { getOwnEmail: null } },
    { errors: [{ message: 'unauthorized' }], data: { getOwnEmail: null } },
  ])(
    'does not infer onboarding from an incomplete or failed response: %s',
    async (response) => {
      h.fetch.mockResolvedValue(response);
      await expect(run()).resolves.toEqual(session);
    }
  );
  it('does not infer onboarding from a network error', async () => {
    h.fetch.mockRejectedValue(new Error('offline'));
    await expect(run()).resolves.toEqual(session);
  });
  it('resolves an existing profile without requesting onboarding', async () => {
    h.fetch.mockResolvedValue({ data: { getOwnEmail: { username: 'alice' } } });
    await expect(run()).resolves.toMatchObject({
      username: 'alice',
      isAuthenticated: true,
    });
  });
  it('returns an anonymous session without looking up a profile', async () => {
    await expect(handler({ context: {} } as never)).resolves.toMatchObject({
      isAuthenticated: false,
    });
  });
});
