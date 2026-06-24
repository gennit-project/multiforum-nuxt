import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import TopNav from '@/components/nav/TopNav.vue';

const h = vi.hoisted(() => ({
  route: null as unknown,
  username: null as unknown,
  notificationCount: null as unknown,
}));

vi.mock('vuetify', () => ({ useDisplay: () => ({ smAndDown: ref(false) }) }));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/cache', () => ({ sideNavIsOpenVar: false }));
vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref(''),
  useUsername: () => h.username,
  useNotificationCount: () => h.notificationCount,
}));

const mountNav = () =>
  mount(TopNav, {
    global: {
      stubs: {
        HamburgerMenuButton: { name: 'HamburgerMenuButton', emits: ['click'], template: '<button class="hamburger" @click="$emit(\'click\')" />' },
        UserProfileDropdownMenu: { name: 'UserProfileDropdownMenu', template: '<div class="profile" />' },
        ThemeSwitcher: true,
        CreateAnythingButton: true,
        AddToChannelFavorites: { name: 'AddToChannelFavorites', template: '<div class="fav" />' },
        TopNavSearch: true,
        LoginButton: true,
        ClientOnly: { template: '<div><slot /></div>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: {}, name: 'home' };
  h.username = ref('');
  h.notificationCount = ref(0);
});

describe('TopNav branding', () => {
  it('shows the logo', () => {
    const wrapper = mountNav();

    expect(wrapper.text()).toContain('Topical');
  });

  it('shows the channel name and favorites when on a forum route', () => {
    h.route = { params: { forumId: 'cats' }, name: 'forums-forumId' };
    const wrapper = mountNav();

    expect(wrapper.find('.fav').exists()).toBe(true);
  });
});

describe('TopNav route label', () => {
  it.each([
    ['discussions', 'discussions'],
    ['downloads', 'downloads'],
    ['events-list-search', 'online events'],
    ['forums', 'forums'],
    ['map-search-something', 'in-person events'],
  ])('labels the %s route', (name, label) => {
    h.route = { params: {}, name };
    const wrapper = mountNav();

    expect(wrapper.text()).toContain(label);
  });

  it('falls back to getLabel for a search preview route', () => {
    h.route = { params: {}, name: 'SitewideSearchDiscussionPreview' };
    const wrapper = mountNav();

    expect(wrapper.text()).toContain('• discussions');
  });

  it('labels admin routes', () => {
    h.route = { params: {}, name: 'admin-dashboard' };
    const wrapper = mountNav();

    expect(wrapper.text()).toContain('• admin dashboard');
  });
});

describe('TopNav actions', () => {
  it('emits toggleDropdown from the hamburger button', async () => {
    const wrapper = mountNav();

    await wrapper.find('.hamburger').trigger('click');

    expect(wrapper.emitted('toggleDropdown')).toBeTruthy();
  });

  it('shows a notification count badge', () => {
    h.notificationCount = ref(5);
    const wrapper = mountNav();

    expect(wrapper.find('[data-testid="notification-bell"]').text()).toContain('5');
  });

  it('shows the profile menu when logged in', () => {
    h.username = ref('alice');
    const wrapper = mountNav();

    expect(wrapper.find('.profile').exists()).toBe(true);
  });

  it('hides the profile menu when logged out', () => {
    const wrapper = mountNav();

    expect(wrapper.find('.profile').exists()).toBe(false);
  });

  it('applies fixed positioning on map pages', () => {
    h.route = { params: {}, name: 'map-search' };
    const wrapper = mountNav();

    expect(wrapper.find('nav').classes()).toContain('fixed');
  });
});
