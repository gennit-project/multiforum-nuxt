import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute } from '@/tests/utils/mockRouter';

import LoginButton from '@/components/nav/LoginButton.vue';

const route = createMockRoute();

vi.mock('nuxt/app', () => ({ useRoute: () => route }));
// Logout now goes through useServerLogout -> /auth/logout; no SPA SDK to mock.

// Stub that renders the unauthenticated slot instead of the harness default.
const unauthStub = {
  template: '<div><slot name="does-not-have-auth" /></div>',
};

describe('LoginButton', () => {
  it('shows the log-out button for an authenticated user', () => {
    const wrapper = mountWithDefaults(LoginButton);
    expect(wrapper.find('[data-testid="logout-button"]').exists()).toBe(true);
  });

  it('shows the log-in button for an unauthenticated visitor', () => {
    const wrapper = mountWithDefaults(LoginButton, {
      global: { stubs: { RequireAuth: unauthStub } },
    });
    expect(wrapper.find('[data-testid="login-button"]').exists()).toBe(true);
  });
});
