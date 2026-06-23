import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import SiteSidenav from '@/components/nav/SiteSidenav.vue';

const h = vi.hoisted(() => ({
  push: null as unknown,
  setSideNavIsOpenVar: null as unknown,
  username: null as unknown,
  isAuth: null as unknown,
  getUserResult: null as unknown,
}));

vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.getUserResult }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
  useIsAuthenticated: () => h.isAuth,
}));
vi.mock('@/cache', () => ({
  setSideNavIsOpenVar: (...a: unknown[]) =>
    (h.setSideNavIsOpenVar as (...x: unknown[]) => unknown)(...a),
}));
vi.mock('@/utils/localStorageUtils', () => ({ getLocalStorageItem: () => [] }));

const mountNav = (props: Record<string, unknown> = {}) =>
  mount(SiteSidenav, {
    props: { showDropdown: true, ...props },
    global: {
      directives: { 'click-outside': {} },
      stubs: {
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
        RequireAuth: {
          template: '<div><slot name="does-not-have-auth" /></div>',
        },
        SiteSidenavLogout: { template: '<div />' },
        AvatarComponent: { template: '<div />' },
      },
    },
  });

beforeEach(() => {
  h.push = vi.fn().mockResolvedValue(undefined);
  h.setSideNavIsOpenVar = vi.fn();
  h.username = ref('alice');
  h.isAuth = ref(true);
  h.getUserResult = ref({ users: [{ profilePicURL: 'pic.png' }] });
});

describe('SiteSidenav visibility', () => {
  it('renders nothing when the dropdown is closed', () => {
    const wrapper = mountNav({ showDropdown: false });

    expect(wrapper.text().trim()).toBe('');
  });

  it('renders the panel when the dropdown is open', () => {
    const wrapper = mountNav();

    expect(wrapper.text()).toContain('Search');
  });
});

describe('SiteSidenav navigation', () => {
  it('navigates and closes the nav when a primary link is clicked', async () => {
    const wrapper = mountNav();

    await wrapper.get('[data-testid="nav-link-Discussions"]').trigger('click');

    expect(h.push).toHaveBeenCalledWith({ name: 'discussions' });
  });

  it('closes the side nav after navigating', async () => {
    const wrapper = mountNav();

    await wrapper.get('[data-testid="nav-link-Discussions"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(h.setSideNavIsOpenVar).toHaveBeenCalledWith(false);
  });

  it('emits close when the close button is pressed', async () => {
    const wrapper = mountNav();

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

describe('SiteSidenav search', () => {
  const searchButton = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('button').find((b) => b.text() === 'Search');

  it('searches discussions by default', async () => {
    const wrapper = mountNav();
    await wrapper.get('input[type="text"]').setValue('hello');

    await searchButton(wrapper)!.trigger('click');

    expect(h.push).toHaveBeenCalledWith({
      path: '/discussions',
      query: { searchInput: 'hello', type: 'discussions', searchOpen: 'true' },
    });
  });

  it('runs the search on Enter', async () => {
    const wrapper = mountNav();
    const input = wrapper.get('input[type="text"]');
    await input.setValue('q');

    await input.trigger('keydown.enter');

    expect(h.push).toHaveBeenCalled();
  });

  it('omits searchInput from the query when the box is empty', async () => {
    const wrapper = mountNav();

    await searchButton(wrapper)!.trigger('click');

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ searchInput: undefined }) })
    );
  });

  it('switches the search type and routes accordingly', async () => {
    const wrapper = mountNav();
    // open the type dropdown (the button showing the current label)
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Discussions')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Comments')!
      .trigger('click');

    await searchButton(wrapper)!.trigger('click');

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/comments/search' })
    );
  });
});

describe('SiteSidenav auth links', () => {
  it('shows profile and account links when authenticated', () => {
    const wrapper = mountNav();

    expect(wrapper.text()).toContain('My Profile');
  });

  it('hides profile links when unauthenticated', () => {
    (h.isAuth as { value: boolean }).value = false;
    (h.username as { value: string }).value = '';
    const wrapper = mountNav();

    expect(wrapper.text()).not.toContain('My Profile');
  });

  it('shows the Log In button when unauthenticated', () => {
    (h.isAuth as { value: boolean }).value = false;
    (h.username as { value: string }).value = '';
    const wrapper = mountNav();

    expect(wrapper.text()).toContain('Log In');
  });

  it('always shows the Admin Dashboard link', () => {
    const wrapper = mountNav();

    expect(wrapper.text()).toContain('Admin Dashboard');
  });
});
