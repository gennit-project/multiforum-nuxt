import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import VerticalIconNav from '@/components/nav/VerticalIconNav.vue';

const h = vi.hoisted(() => ({
  route: null as unknown,
  isAuthenticated: false,
  username: '',
  serverAdminUsernames: [] as string[],
  serverModUsernames: [] as string[],
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useDisplay', () => ({ useDisplay: () => ({ height: ref(900) }) }));
vi.mock('@/utils/localStorageUtils', () => ({
  getLocalStorageItem: () => [],
  setLocalStorageItem: vi.fn(),
}));
vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => ref(h.isAuthenticated),
  useUsername: () => ref(h.username),
}));
vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: ref(h.serverAdminUsernames),
    serverModUsernames: ref(h.serverModUsernames),
  }),
}));

const mountNav = () =>
  mount(VerticalIconNav, {
    global: {
      stubs: {
        IconTooltip: { name: 'IconTooltip', props: ['text'], template: '<div><slot /></div>' },
        NuxtLink: { props: ['to', 'ariaLabel'], template: '<a :class="$attrs.class" :aria-label="ariaLabel"><slot /></a>' },
        'nuxt-link': { props: ['to', 'ariaLabel'], template: '<a :class="$attrs.class" :aria-label="ariaLabel"><slot /></a>' },
        ClientOnly: { template: '<div><slot /></div>' },
        AvatarComponent: true,
        CreateAnythingButton: true,
        RecentForumsDrawer: { name: 'RecentForumsDrawer', props: ['forums', 'isOpen'], template: '<div class="drawer" />' },
        DiscussionIcon: true,
        DownloadIcon: true,
        CalendarIcon: true,
        BookIcon: true,
        ChannelIcon: true,
        BookmarkIcon: true,
        AdminIcon: true,
        LoginIcon: true,
        MoreIcon: true,
      },
    },
  });

const navLink = (w: ReturnType<typeof mount>, label: string) =>
  w.find(`a[aria-label="${label}"]`);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: {}, name: 'home' };
  h.isAuthenticated = false;
  h.username = '';
  h.serverAdminUsernames = [];
  h.serverModUsernames = [];
});

describe('VerticalIconNav items', () => {
  it.each(['Discuss', 'Downloads', 'Calendars', 'Wikis', 'Forums', 'Library'])(
    'renders the %s nav item',
    (name) => {
      const wrapper = mountNav();

      expect(navLink(wrapper, name).exists()).toBe(true);
    }
  );

  it('shows the admin dashboard item to a logged-in server admin', () => {
    h.isAuthenticated = true;
    h.username = 'alice';
    h.serverAdminUsernames = ['alice'];
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Admin dashboard').exists()).toBe(true);
  });

  it('shows the admin dashboard item to a logged-in server mod', () => {
    h.isAuthenticated = true;
    h.username = 'bob';
    h.serverModUsernames = ['bob'];
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Admin dashboard').exists()).toBe(true);
  });

  it('hides the admin dashboard item from a logged-out visitor', () => {
    h.serverAdminUsernames = ['alice'];
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Admin dashboard').exists()).toBe(false);
  });

  it('hides the admin dashboard item from a logged-in non-mod user', () => {
    h.isAuthenticated = true;
    h.username = 'carol';
    h.serverAdminUsernames = ['alice'];
    h.serverModUsernames = ['bob'];
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Admin dashboard').exists()).toBe(false);
  });
});

describe('VerticalIconNav active state', () => {
  it('uses a full-row hover target for navigation items', () => {
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Discuss').classes()).toEqual(
      expect.arrayContaining(['w-full', 'rounded-xl', 'hover:bg-gray-200'])
    );
    expect(navLink(wrapper, 'Discuss').classes()).not.toContain('rounded-full');
  });

  it('highlights the active nav item', () => {
    h.route = { params: {}, name: 'forums' };
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Forums').classes().join(' ')).toContain('ring-1');
  });

  it('does not highlight an inactive nav item', () => {
    h.route = { params: {}, name: 'forums' };
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Discuss').classes().join(' ')).not.toContain('ring-1');
  });

  it('highlights the admin item on admin routes', () => {
    h.route = { params: {}, name: 'admin-issues' };
    h.isAuthenticated = true;
    h.username = 'alice';
    h.serverAdminUsernames = ['alice'];
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Admin dashboard').classes().join(' ')).toContain('ring-1');
  });
});

describe('VerticalIconNav drawer', () => {
  it('renders the recent forums drawer closed', () => {
    const wrapper = mountNav();

    expect(wrapper.getComponent({ name: 'RecentForumsDrawer' }).props('isOpen')).toBe(
      false
    );
  });
});
