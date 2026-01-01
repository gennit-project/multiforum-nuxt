import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';

// Mock composables
vi.mock('@/composables/useSSRAuth', () => ({
  useSSRAuth: vi.fn(),
}));

vi.mock('@/cache', () => ({
  usernameVar: ref(''),
  isAuthenticatedVar: ref(false),
  setIsLoadingAuth: vi.fn(),
  setIsAuthenticated: vi.fn(),
}));

vi.mock('@auth0/auth0-vue', () => ({
  useAuth0: vi.fn(() => ({
    loginWithPopup: vi.fn(),
    loginWithRedirect: vi.fn(),
    isAuthenticated: ref(false),
    isLoading: ref(false),
    idTokenClaims: ref(null),
    user: ref(null),
    getAccessTokenSilently: vi.fn(),
  })),
}));

// Mock import.meta.env
const mockImportMeta = {
  env: { SSR: false },
};

vi.stubGlobal('import.meta', mockImportMeta);

describe('RequireAuth', () => {
  let mockSSRAuthReturn: any;
  let mockUseSSRAuth: any;
  let mockUsernameVar: any;
  let mockIsAuthenticatedVar: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocks from mocked modules
    const { useSSRAuth } = await vi.importMock('@/composables/useSSRAuth');
    const { usernameVar, isAuthenticatedVar } = await vi.importMock('@/cache');

    mockUseSSRAuth = useSSRAuth;
    mockUsernameVar = usernameVar;
    mockIsAuthenticatedVar = isAuthenticatedVar;

    // Reset reactive vars
    mockUsernameVar.value = '';
    mockIsAuthenticatedVar.value = false;

    // Default mock return for useSSRAuth
    mockSSRAuthReturn = {
      hasAuthHint: ref(false),
      usernameHint: ref(''),
      setAuthHint: vi.fn(),
      setUsernameHint: vi.fn(),
      clearAuthHints: vi.fn(),
    };

    mockUseSSRAuth.mockReturnValue(mockSSRAuthReturn);
  });

  describe('SSR behavior', () => {
    beforeEach(() => {
      // Set SSR mode
      mockImportMeta.env.SSR = true;
    });

    it('should show auth content when auth hint is present and no ownership required', () => {
      mockSSRAuthReturn.hasAuthHint.value = true;

      const wrapper = mount(RequireAuth, {
        props: { requireOwnership: false },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        false
      );
    });

    it('should show no-auth content when auth hint is absent', () => {
      mockSSRAuthReturn.hasAuthHint.value = false;

      const wrapper = mount(RequireAuth, {
        props: { requireOwnership: false },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });

    it('should show auth content when ownership required and username hint matches owner', () => {
      mockSSRAuthReturn.hasAuthHint.value = true;
      mockSSRAuthReturn.usernameHint.value = 'testowner';

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: ['testowner', 'otherowner'],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        false
      );
    });

    it('should show no-auth content when ownership required but username hint does not match', () => {
      mockSSRAuthReturn.hasAuthHint.value = true;
      mockSSRAuthReturn.usernameHint.value = 'notowner';

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: ['testowner', 'otherowner'],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });

    it('should show no-auth content when ownership required but no username hint', () => {
      mockSSRAuthReturn.hasAuthHint.value = true;
      mockSSRAuthReturn.usernameHint.value = '';

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: ['testowner'],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });

    it('should show no-auth content when ownership required but no owners provided', () => {
      mockSSRAuthReturn.hasAuthHint.value = true;
      mockSSRAuthReturn.usernameHint.value = 'testuser';

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: [],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });
  });

  describe('Client-side initial hydration behavior', () => {
    beforeEach(() => {
      // Set client-side mode
      mockImportMeta.env.SSR = false;
    });

    it('should match SSR output during initial hydration with auth hint', () => {
      mockSSRAuthReturn.hasAuthHint.value = true;

      const wrapper = mount(RequireAuth, {
        props: { requireOwnership: false },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      // Should show auth content based on hint, not actual auth state
      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        false
      );
    });

    it('should match SSR output during initial hydration without auth hint', () => {
      mockSSRAuthReturn.hasAuthHint.value = false;

      const wrapper = mount(RequireAuth, {
        props: { requireOwnership: false },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      // Should show no-auth content based on hint, not actual auth state
      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });

    it('should match SSR output for ownership checks during initial hydration', () => {
      mockSSRAuthReturn.hasAuthHint.value = true;
      mockSSRAuthReturn.usernameHint.value = 'testowner';

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: ['testowner'],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      // Should show auth content based on username hint, not actual auth state
      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        false
      );
    });
  });

  describe('Client-side post-mount behavior', () => {
    beforeEach(() => {
      // Set client-side mode
      mockImportMeta.env.SSR = false;
    });

    it('should show auth content when user is authenticated with username', async () => {
      mockUsernameVar.value = 'testuser';
      mockIsAuthenticatedVar.value = true;

      const wrapper = mount(RequireAuth, {
        props: { requireOwnership: false },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      // Simulate component mounted
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        false
      );
    });

    it('should show auth content when authenticated but no username and no ownership required', async () => {
      mockUsernameVar.value = '';
      mockIsAuthenticatedVar.value = true;

      const wrapper = mount(RequireAuth, {
        props: { requireOwnership: false },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        false
      );
    });

    it('should show no-auth content when authenticated but no username and ownership required', async () => {
      mockUsernameVar.value = '';
      mockIsAuthenticatedVar.value = true;

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: ['testowner'],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });

    it('should show auth content when user is owner', async () => {
      mockUsernameVar.value = 'testowner';
      mockIsAuthenticatedVar.value = true;

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: ['testowner', 'otherowner'],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        false
      );
    });

    it('should show no-auth content when user is not owner', async () => {
      mockUsernameVar.value = 'notowner';
      mockIsAuthenticatedVar.value = true;

      const wrapper = mount(RequireAuth, {
        props: {
          requireOwnership: true,
          owners: ['testowner', 'otherowner'],
        },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });

    it('should show no-auth content when not authenticated', async () => {
      mockUsernameVar.value = '';
      mockIsAuthenticatedVar.value = false;

      const wrapper = mount(RequireAuth, {
        props: { requireOwnership: false },
        slots: {
          'has-auth': '<div data-testid="auth-content">Auth Content</div>',
          'does-not-have-auth':
            '<div data-testid="no-auth-content">No Auth Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="no-auth-content"]').exists()).toBe(
        true
      );
    });
  });

  describe('Component styling props', () => {
    it('should apply correct CSS classes based on props', () => {
      const wrapper = mount(RequireAuth, {
        props: {
          justifyLeft: true,
          fullWidth: true,
        },
        slots: {
          'has-auth': '<div>Auth Content</div>',
          'does-not-have-auth': '<div>No Auth Content</div>',
        },
      });

      const rootDiv = wrapper.find('div');
      expect(rootDiv.classes()).toContain('justify-start');
      expect(rootDiv.classes()).toContain('w-full');
    });

    it('should apply default CSS classes when styling props are false', () => {
      const wrapper = mount(RequireAuth, {
        props: {
          justifyLeft: false,
          fullWidth: false,
        },
        slots: {
          'has-auth': '<div>Auth Content</div>',
          'does-not-have-auth': '<div>No Auth Content</div>',
        },
      });

      const rootDiv = wrapper.find('div');
      expect(rootDiv.classes()).toContain('justify-center');
      expect(rootDiv.classes()).not.toContain('w-full');
    });
  });
});
