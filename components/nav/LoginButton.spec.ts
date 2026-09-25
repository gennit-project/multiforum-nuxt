import { beforeEach, describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute } from '@/tests/utils/mockRouter';

import LoginButton from '@/components/nav/LoginButton.vue';

const route = createMockRoute();
const { mockLogout } = vi.hoisted(() => ({ mockLogout: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRuntimeConfig: () => ({ public: { authProvider: 'auth0' } }),
}));
vi.mock('@/composables/useServerLogout', () => ({
  useServerLogout: () => ({ logout: mockLogout }),
}));

// Stub that renders the unauthenticated slot instead of the harness default.
const unauthStub = {
  template: '<div><slot name="does-not-have-auth" /></div>',
};

describe('LoginButton', () => {
  beforeEach(() => {
    route.fullPath = '/test';
    mockLogout.mockReset();
  });

  it('shows a working log-out button for an authenticated user', async () => {
    const wrapper = mountWithDefaults(LoginButton);
    const logoutButton = wrapper.get('[data-testid="logout-button"]');

    expect(logoutButton.element.tagName).toBe('BUTTON');
    expect(logoutButton.attributes('type')).toBe('button');
    expect(logoutButton.classes()).toContain('cursor-pointer');

    await logoutButton.trigger('click');
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('shows a semantic log-in link that returns to the current page', () => {
    route.fullPath =
      '/forums/sims4_building/downloads/download-id/pipelines?attempt=attempt-id#details';
    const wrapper = mountWithDefaults(LoginButton, {
      global: { stubs: { RequireAuth: unauthStub } },
    });
    const loginLink = wrapper.get('[data-testid="login-button"]');

    expect(loginLink.element.tagName).toBe('A');
    expect(loginLink.attributes('href')).toBe(
      '/auth/login?returnTo=%2Fforums%2Fsims4_building%2Fdownloads%2Fdownload-id%2Fpipelines%3Fattempt%3Dattempt-id'
    );
    expect(loginLink.classes()).toContain('cursor-pointer');
  });

  it('falls back to the home page when no return path is available', () => {
    route.fullPath = '#details';
    const wrapper = mountWithDefaults(LoginButton, {
      global: { stubs: { RequireAuth: unauthStub } },
    });

    expect(wrapper.get('[data-testid="login-button"]').attributes('href')).toBe(
      '/auth/login?returnTo=%2F'
    );
  });
});
