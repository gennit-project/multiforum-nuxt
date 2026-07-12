import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import plugin from '@/plugins/auth-username-fallback.client';

// Hoisted handles so the module mocks can read/assert the same state the test
// configures per-case.
const h = vi.hoisted(() => ({
  isAuthenticated: { value: true } as { value: boolean },
  username: { value: '' } as { value: string },
  setUsername: vi.fn(),
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
  setUsername: h.setUsername,
  setModProfileName: h.setModProfileName,
  setProfilePicURL: h.setProfilePicURL,
  setNotificationCount: h.setNotificationCount,
}));

const start = () => {
  (plugin as (nuxtApp: { hook: (name: string, callback: () => void) => void }) => void)({
    hook: (name, callback) => {
      if (name === 'app:mounted') h.appMounted = callback;
    },
  });
};

const run = async () => {
  start();
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

describe('auth-username-fallback plugin: skips resolution when not needed', () => {
  it.each([
    ['username is already resolved', () => (h.username.value = 'cluse')],
    ['the session is not authenticated', () => (h.isAuthenticated.value = false)],
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
