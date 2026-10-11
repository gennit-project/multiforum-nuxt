import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import plugin from '@/plugins/apollo-auth.client';

const h = vi.hoisted(() => ({
  clearPersistedAuth: vi.fn(),
  setNotificationCount: vi.fn(),
  fetch: vi.fn(),
  setItem: vi.fn(),
  appMounted: undefined as undefined | (() => void),
  get localStorage() {
    return {
      getItem: vi.fn(),
      removeItem: vi.fn(),
      setItem: h.setItem,
    };
  },
}));

vi.mock('nuxt/app', () => ({
  defineNuxtPlugin: (fn: unknown) => fn,
}));

vi.mock('@/utils/authUtils', () => ({
  clearPersistedAuth: h.clearPersistedAuth,
}));
vi.mock('@/composables/useAuthState', () => ({
  setNotificationCount: h.setNotificationCount,
}));

const run = async () => {
  (
    plugin as (nuxtApp: {
      hook: (name: string, callback: () => void) => void;
    }) => void
  )({
    hook: (name, callback) => {
      if (name === 'app:mounted') h.appMounted = callback;
    },
  });
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  h.appMounted = undefined;
  h.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ accessToken: 'fresh-token', notificationCount: 4 }),
  });
  vi.stubGlobal('fetch', h.fetch);
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: h.localStorage,
  });
});

describe('apollo-auth client plugin', () => {
  it('looks up the session-backed token on load', async () => {
    await run();
    expect(h.fetch.mock.calls[0][0]).toBe('/api/session/token');
  });

  it('requests the token with session credentials and no-store cache', async () => {
    await run();
    expect(h.fetch.mock.calls[0][1]).toEqual({
      credentials: 'include',
      cache: 'no-store',
    });
  });

  it('writes the access token into localStorage when the session is active', async () => {
    await run();
    expect(h.setItem).toHaveBeenCalledWith('token', 'fresh-token');
  });

  it('does not publish the notification count before hydration completes', async () => {
    await run();
    expect(h.setNotificationCount).not.toHaveBeenCalled();
  });

  it('publishes the notification count after hydration completes', async () => {
    await run();
    h.appMounted?.();
    await flushPromises();
    expect(h.setNotificationCount).toHaveBeenCalledWith(4);
  });

  it('hydrates the count when localStorage is unavailable', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage blocked');
      },
    });
    await run();
    h.appMounted?.();
    await flushPromises();
    expect(h.setNotificationCount).toHaveBeenCalledWith(4);
  });

  it('clears persisted auth when the session endpoint returns no token', async () => {
    h.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: null }),
    });
    await run();
    expect(h.clearPersistedAuth).toHaveBeenCalled();
  });

  it('does not clear persisted auth when the session token is present', async () => {
    await run();
    expect(h.clearPersistedAuth).not.toHaveBeenCalled();
  });

  it('does not schedule background polling', async () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    await run();
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('does not add a focus listener for token syncing', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    await run();
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'focus',
      expect.any(Function)
    );
  });
});
