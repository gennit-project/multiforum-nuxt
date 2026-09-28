import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import AccessDeniedMessage from './AccessDeniedMessage.vue';

const mockIsAuthenticated = ref(false);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    fullPath: '/forums/cats/downloads/edit/d1?tab=files#images',
  }),
  useRuntimeConfig: () => ({ public: { authProvider: 'auth0' } }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => mockIsAuthenticated,
}));

const mountMessage = (props: Record<string, unknown> = {}) =>
  mount(AccessDeniedMessage, { props });

describe('AccessDeniedMessage', () => {
  beforeEach(() => {
    mockIsAuthenticated.value = false;
  });

  describe('when signed out', () => {
    it('asks the visitor to sign in to do the action', () => {
      expect(
        mountMessage({ action: 'edit this download' })
          .get('[data-testid="access-denied-sign-in"]')
          .text()
      ).toContain('Sign in to edit this download');
    });

    it('links to login and returns to the current page without the hash', () => {
      expect(mountMessage().get('a').attributes('href')).toBe(
        `/auth/login?returnTo=${encodeURIComponent('/forums/cats/downloads/edit/d1?tab=files')}`
      );
    });

    it('does not claim the visitor lacks permission', () => {
      expect(mountMessage().text()).not.toContain('permission');
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      mockIsAuthenticated.value = true;
    });

    it('shows the permission message', () => {
      expect(mountMessage().text()).toBe(
        "You don't have permission to see this page."
      );
    });

    it('does not offer a sign-in link', () => {
      expect(mountMessage().find('a').exists()).toBe(false);
    });

    it('accepts a custom permission message', () => {
      expect(
        mountMessage({ message: 'Only the author can edit this.' }).text()
      ).toBe('Only the author can edit this.');
    });
  });
});
