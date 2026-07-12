import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import SiteSidenavLogout from './SiteSidenavLogout.vue';

const { auth } = vi.hoisted(() => ({ auth: { value: true } }));
const logoutSpy = vi.fn();

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => ref(auth.value),
  useUsername: () => ref('alice'),
}));
vi.mock('@/composables/useServerLogout', () => ({
  useServerLogout: () => ({ logout: logoutSpy }),
}));

const mountLogout = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(SiteSidenavLogout, { props });

const link = (wrapper: ReturnType<typeof mountLogout>) =>
  wrapper.find('[data-testid="sign-out-link"]');

beforeEach(() => {
  auth.value = true;
  logoutSpy.mockReset();
});

describe('SiteSidenavLogout', () => {
  it('renders the sign-out link when authenticated', () => {
    expect(link(mountLogout()).exists()).toBe(true);
  });

  it('renders nothing when not authenticated', () => {
    auth.value = false;
    expect(link(mountLogout()).exists()).toBe(false);
  });

  it('shows the icon when showIconOnly is set', () => {
    expect(mountLogout({ showIconOnly: true }).find('svg').exists()).toBe(true);
  });

  it('shows the text label when not icon-only', () => {
    expect(mountLogout({ showIconOnly: false }).text()).toContain('Sign Out');
  });

  it('gives the icon-only link an accessible name', () => {
    expect(
      link(mountLogout({ showIconOnly: true })).attributes('aria-label')
    ).toBe('Sign Out');
  });

  it('logs out when the link is clicked', async () => {
    const wrapper = mountLogout();
    await link(wrapper).trigger('click');
    expect(logoutSpy).toHaveBeenCalled();
  });
});
