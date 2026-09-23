import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import plugin from '@/plugins/auth-username-fallback.client';

// Hoisted handles so the module mocks can read/assert the same state the test
// configures per-case.
const h = vi.hoisted(() => ({
  isAuthenticated: { value: true } as { value: boolean },
  username: { value: '' } as { value: string },
  setIsAuthenticated: vi.fn(),
  setUsername: vi.fn(),
  setEmail: vi.fn(),
  setModProfileName: vi.fn(),
  setProfilePicURL: vi.fn(),
  setNotificationCount: vi.fn(),
  fetch: vi.fn(),
  appMounted: undefined as undefined | (() => void),
}));

vi.mock('nuxt/app', () => ({
  defineNuxtPlugin: (fn: unknown) => fn,
}));
vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => h.isAuthenticated,
  useUsername: () => h.username,
  setIsAuthenticated: h.setIsAuthenticated,
  setUsername: h.setUsername,
  setEmail: h.setEmail,
  setModProfileName: h.setModProfileName,
  setProfilePicURL: h.setProfilePicURL,
  setNotificationCount: h.setNotificationCount,
}));

const start = (serverRendered = true) => {
  (
    plugin as (nuxtApp: {
      payload: { serverRendered: boolean };
      hook: (name: string, callback: () => void) => void;
    }) => void
  )({
    payload: { serverRendered },
    hook: (name, callback) => {
      if (name === 'app:mounted') h.appMounted = callback;
    },
  });
};

const run = async (serverRendered = true) => {
  start(serverRendered);
  h.appMounted?.();
  await flushPromises();
};

const resolvedUser = (user: Record<string, unknown> | null) => ({
  ok: true,
  json: async () =>
    user
      ? {
          isAuthenticated: true,
          username: user.username,
          email: user.email,
          profilePicURL: user.profilePicURL,
          modProfileName: user.modProfileName,
          notificationCount: user.unreadNotificationCount,
        }
      : {
          isAuthenticated: true,
          username: '',
          profilePicURL: '',
          modProfileName: '',
          notificationCount: 0,
        },
});

const fullUser = {
  username: 'cluse',
  email: 'cluse@example.com',
  profilePicURL: 'https://pics/cluse.png',
  modProfileName: 'mod-cluse',
  unreadNotificationCount: 4,
};

beforeEach(() => {
  vi.clearAllMocks();
  h.appMounted = undefined;
  h.isAuthenticated.value = true;
  h.username.value = '';
  h.fetch.mockResolvedValue(resolvedUser(fullUser));
  global.fetch = h.fetch as unknown as typeof fetch;
});

describe('auth-username-fallback plugin: resolves when authenticated but username is empty', () => {
  it('does not resolve the username before hydration has mounted the app', async () => {
    start();
    await flushPromises();
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('seeds the username from the backend lookup', async () => {
    await run();
    expect(h.setUsername).toHaveBeenCalledWith('cluse');
  });

  it('seeds the moderation profile name', async () => {
    await run();
    expect(h.setModProfileName).toHaveBeenCalledWith('mod-cluse');
  });

  it('seeds the profile picture URL', async () => {
    await run();
    expect(h.setProfilePicURL).toHaveBeenCalledWith('https://pics/cluse.png');
  });

  it('seeds the unread notification count', async () => {
    await run();
    expect(h.setNotificationCount).toHaveBeenCalledWith(4);
  });

  it('looks the user up via the session-backed auth profile endpoint', async () => {
    await run();
    expect(h.fetch.mock.calls[0][0]).toBe('/api/session/profile');
  });
});

describe('auth-username-fallback plugin: bootstraps client-rendered routes', () => {
  beforeEach(() => {
    h.isAuthenticated.value = false;
  });

  it('does not fetch for an anonymous server-rendered route', async () => {
    await run(true);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('loads the session profile for an initially anonymous client-rendered route', async () => {
    await run(false);
    expect(h.fetch).toHaveBeenCalledOnce();
  });

  it('seeds authentication and email from a valid server session', async () => {
    await run(false);
    expect(h.setIsAuthenticated).toHaveBeenCalledWith(true);
    expect(h.setEmail).toHaveBeenCalledWith('cluse@example.com');
  });

  it('seeds the application profile from a valid server session', async () => {
    await run(false);
    expect(h.setUsername).toHaveBeenCalledWith('cluse');
    expect(h.setModProfileName).toHaveBeenCalledWith('mod-cluse');
    expect(h.setProfilePicURL).toHaveBeenCalledWith('https://pics/cluse.png');
    expect(h.setNotificationCount).toHaveBeenCalledWith(4);
  });

  it('keeps the client anonymous when the server has no session', async () => {
    h.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ isAuthenticated: false }),
    });
    await run(false);
    expect(h.setIsAuthenticated).not.toHaveBeenCalled();
    expect(h.setUsername).not.toHaveBeenCalled();
  });
});

describe('auth-username-fallback plugin: skips resolution when not needed', () => {
  it.each([
    ['username is already resolved', () => (h.username.value = 'cluse')],
    [
      'the session is not authenticated',
      () => (h.isAuthenticated.value = false),
    ],
  ])('does not call the backend when %s', async (_label, setup) => {
    setup();
    await run();
    expect(h.fetch).not.toHaveBeenCalled();
  });
});

describe('auth-username-fallback plugin: degrades gracefully', () => {
  it('does not seed a username when the backend has no matching user', async () => {
    h.fetch.mockResolvedValue(resolvedUser(null));
    await run();
    expect(h.setUsername).not.toHaveBeenCalled();
  });

  it('does not seed a username when the lookup request fails', async () => {
    h.fetch.mockRejectedValue(new Error('network'));
    await run();
    expect(h.setUsername).not.toHaveBeenCalled();
  });
});
