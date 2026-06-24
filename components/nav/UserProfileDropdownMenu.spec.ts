import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import UserProfileDropdownMenu from '@/components/nav/UserProfileDropdownMenu.vue';

const h = vi.hoisted(() => ({
  username: null as unknown,
  result: null as unknown,
  push: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));
vi.mock('@vue/apollo-composable', () => ({ useQuery: () => ({ result: h.result }) }));
vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock('@/composables/useServerLogout', () => ({ useServerLogout: () => ({ logout: h.logout }) }));

const dropdownStub = {
  name: 'IconButtonDropdown',
  props: ['items', 'ariaLabel'],
  emits: ['go-to-mod-profile', 'go-to-user-profile', 'logout'],
  template: '<div><slot /></div>',
};

const mountMenu = (props: Record<string, unknown> = {}) =>
  mount(UserProfileDropdownMenu, {
    props: { username: 'alice', ...props },
    global: {
      stubs: {
        IconButtonDropdown: dropdownStub,
        AvatarComponent: { name: 'AvatarComponent', props: ['src', 'text'], template: '<div class="avatar" />' },
      },
    },
  });

const dropdown = (w: ReturnType<typeof mount>) => w.getComponent(dropdownStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.username = ref('alice');
  h.result = ref({ users: [{ profilePicURL: 'https://x/pic.png' }] });
});

describe('UserProfileDropdownMenu', () => {
  it('passes the menu items to the dropdown', () => {
    const wrapper = mountMenu();

    const labels = dropdown(wrapper).props('items').map((i: { label: string }) => i.label);
    expect(labels).toEqual(['My Profile', 'Account Settings', 'Sign out']);
  });

  it('passes the profile picture to the avatar', () => {
    const wrapper = mountMenu();

    expect(wrapper.getComponent({ name: 'AvatarComponent' }).props('src')).toBe(
      'https://x/pic.png'
    );
  });

  it('falls back to an empty avatar src without a user', () => {
    h.result = ref({ users: [] });
    const wrapper = mountMenu();

    expect(wrapper.getComponent({ name: 'AvatarComponent' }).props('src')).toBe('');
  });

  it('logs out on the logout event', async () => {
    const wrapper = mountMenu();

    await dropdown(wrapper).vm.$emit('logout');

    expect(h.logout).toHaveBeenCalled();
  });

  it('navigates to the mod profile', async () => {
    const wrapper = mountMenu({ modName: 'mod1' });

    await dropdown(wrapper).vm.$emit('go-to-mod-profile');

    expect(h.push).toHaveBeenCalledWith('/mod/mod1');
  });

  it('navigates to the user profile', async () => {
    const wrapper = mountMenu();

    await dropdown(wrapper).vm.$emit('go-to-user-profile');

    expect(h.push).toHaveBeenCalledWith('/u/alice/comments');
  });
});
