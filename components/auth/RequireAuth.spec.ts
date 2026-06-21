import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import RequireAuth from '@/components/auth/RequireAuth.vue';

// RequireAuth now reads auth state straight from the useAuthState composables,
// which are seeded from the server session (plugins/auth-session.ts) and are
// identical on server and client. No auth-hint cookie shim, no @auth0/auth0-vue,
// no SSR vs client branching — so the test just drives the two reactive refs.
const { mockUsername, mockIsAuthenticated } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ref } = require('vue');
  return { mockUsername: ref(''), mockIsAuthenticated: ref(false) };
});

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
  useIsAuthenticated: () => mockIsAuthenticated,
}));

const slots = {
  'has-auth': '<div data-testid="auth-content">Auth Content</div>',
  'does-not-have-auth':
    '<div data-testid="no-auth-content">No Auth Content</div>',
};

const setAuthState = async ({
  authenticated,
  username,
}: {
  authenticated: boolean;
  username: string;
}) => {
  mockIsAuthenticated.value = authenticated;
  mockUsername.value = username;
};

describe('RequireAuth', () => {
  beforeEach(async () => {
    await setAuthState({ authenticated: false, username: '' });
  });

  describe('auth resolution', () => {
    it.each([
      {
        name: 'not authenticated',
        authenticated: false,
        username: '',
        props: { requireOwnership: false },
        expected: 'unauthenticated',
      },
      {
        name: 'authenticated, no ownership required',
        authenticated: true,
        username: 'testuser',
        props: { requireOwnership: false },
        expected: 'authenticated',
      },
      {
        name: 'authenticated, ownership required, is owner',
        authenticated: true,
        username: 'testowner',
        props: { requireOwnership: true, owners: ['testowner', 'otherowner'] },
        expected: 'authenticated',
      },
      {
        name: 'authenticated, ownership required, not owner',
        authenticated: true,
        username: 'notowner',
        props: { requireOwnership: true, owners: ['testowner'] },
        expected: 'unauthenticated',
      },
      {
        name: 'authenticated, ownership required, no username',
        authenticated: true,
        username: '',
        props: { requireOwnership: true, owners: ['testowner'] },
        expected: 'unauthenticated',
      },
      {
        name: 'authenticated, ownership required, no owners provided',
        authenticated: true,
        username: 'testuser',
        props: { requireOwnership: true, owners: [] },
        expected: 'unauthenticated',
      },
    ])(
      'renders the $expected slot when $name',
      async ({ authenticated, username, props, expected }) => {
        await setAuthState({ authenticated, username });
        const wrapper = mount(RequireAuth, { props, slots });
        expect(wrapper.find('[data-auth-state]').attributes('data-auth-state')).toBe(
          expected
        );
      }
    );
  });

  describe('component styling props', () => {
    it('applies justify-start and w-full when justifyLeft and fullWidth are true', () => {
      const wrapper = mount(RequireAuth, {
        props: { justifyLeft: true, fullWidth: true },
        slots,
      });
      expect(wrapper.find('div').classes()).toEqual(
        expect.arrayContaining(['justify-start', 'w-full'])
      );
    });

    it('applies justify-center and omits w-full when styling props are false', () => {
      const wrapper = mount(RequireAuth, {
        props: { justifyLeft: false, fullWidth: false },
        slots,
      });
      const classes = wrapper.find('div').classes();
      expect(
        classes.includes('justify-center') && !classes.includes('w-full')
      ).toBe(true);
    });
  });
});
