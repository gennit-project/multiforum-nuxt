import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import SiteSidenavLogin from './SiteSidenavLogin.vue';

const { auth } = vi.hoisted(() => ({ auth: { value: true } }));
const logoutSpy = vi.fn();

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => ref(auth.value),
  useUsername: () => ref('alice'),
}));
vi.mock('@/composables/useServerLogout', () => ({
  useServerLogout: () => ({ logout: logoutSpy }),
}));

const mountLogin = () => mountWithDefaults(SiteSidenavLogin);

const link = (wrapper: ReturnType<typeof mountLogin>) =>
  wrapper.find('[data-testid="sign-out-link"]');

beforeEach(() => {
  auth.value = true;
  logoutSpy.mockReset();
});

describe('SiteSidenavLogin', () => {
  it('renders the sign-out link when authenticated', () => {
    expect(link(mountLogin()).text()).toContain('Sign Out');
  });

  it('renders nothing when not authenticated', () => {
    auth.value = false;
    expect(link(mountLogin()).exists()).toBe(false);
  });

  it('logs out when the link is clicked', async () => {
    const wrapper = mountLogin();
    await link(wrapper).trigger('click');
    expect(logoutSpy).toHaveBeenCalled();
  });
});
