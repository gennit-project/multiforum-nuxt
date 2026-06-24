import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import VerticalIconNav from '@/components/nav/VerticalIconNav.vue';

const h = vi.hoisted(() => ({ route: null as unknown }));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('vuetify', () => ({ useDisplay: () => ({ height: ref(900) }) }));
vi.mock('@/utils/localStorageUtils', () => ({
  getLocalStorageItem: () => [],
  setLocalStorageItem: vi.fn(),
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
});

describe('VerticalIconNav items', () => {
  it.each(['Discuss', 'Downloads', 'Calendars', 'Wikis', 'Forums', 'Library'])(
    'renders the %s nav item',
    (name) => {
      const wrapper = mountNav();

      expect(navLink(wrapper, name).exists()).toBe(true);
    }
  );

  it('renders the admin dashboard item', () => {
    const wrapper = mountNav();

    expect(navLink(wrapper, 'Admin dashboard').exists()).toBe(true);
  });
});

describe('VerticalIconNav active state', () => {
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
