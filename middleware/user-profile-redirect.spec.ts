import { describe, expect, it, vi } from 'vitest';

import userProfileRedirect from './user-profile-redirect';

const navigateTo = vi.fn((target) => target);

vi.mock('nuxt/app', () => ({
  defineNuxtRouteMiddleware: (middleware: unknown) => middleware,
  navigateTo: (target: unknown) => navigateTo(target),
}));

describe('user-profile-redirect middleware', () => {
  it('redirects the base user profile route to the comments tab', () => {
    const result = userProfileRedirect({
      name: 'u-username',
      params: { username: 'alice' },
      query: {},
    });

    expect(navigateTo).toHaveBeenCalledWith({
      name: 'u-username-comments',
      params: { username: 'alice' },
      query: {},
    });
    expect(result).toEqual({
      name: 'u-username-comments',
      params: { username: 'alice' },
      query: {},
    });
  });

  it('preserves query params during the redirect', () => {
    userProfileRedirect({
      name: 'u-username',
      params: { username: 'alice' },
      query: { channels: ['cats', 'dogs'] },
    });

    expect(navigateTo).toHaveBeenLastCalledWith({
      name: 'u-username-comments',
      params: { username: 'alice' },
      query: { channels: ['cats', 'dogs'] },
    });
  });

  it('does not redirect child profile routes', () => {
    const result = userProfileRedirect({
      name: 'u-username-comments',
      params: { username: 'alice' },
      query: {},
    });

    expect(result).toBeUndefined();
  });
});
