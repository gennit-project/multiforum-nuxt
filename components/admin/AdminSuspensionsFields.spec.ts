import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import AdminSuspensionsFields from '@/components/admin/AdminSuspensionsFields.vue';

const h = vi.hoisted(() => ({ route: null as unknown, push: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push }),
}));

const routerLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountFields = () =>
  mount(AdminSuspensionsFields, {
    global: {
      stubs: {
        RouterLink: routerLinkStub,
        'router-link': routerLinkStub,
        NuxtPage: { name: 'NuxtPage', template: '<div />' },
        IdentificationIcon: true,
        UserIcon: true,
      },
    },
  });

const dropdownToggle = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().length > 0);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = {
    name: 'admin-suspensions-server-membership',
    path: '/admin/suspensions/server-membership',
  };
});

describe('AdminSuspensionsFields', () => {
  it('redirects the bare suspensions route to server membership', () => {
    h.route = { name: 'admin-suspensions', path: '/admin/suspensions' };
    mountFields();

    expect(h.push).toHaveBeenCalledWith({
      path: '/admin/suspensions/server-membership',
    });
  });

  it('shows the active tab label in the mobile dropdown', () => {
    h.route = {
      name: 'admin-suspensions-suspended-users',
      path: '/admin/suspensions/suspended-users',
    };
    const wrapper = mountFields();

    expect(dropdownToggle(wrapper)?.text()).toContain('Suspended Users');
  });

  it('renders all suspensions sub-tabs', () => {
    const wrapper = mountFields();

    expect(wrapper.text()).toContain('Server Membership');
    expect(wrapper.text()).toContain('Suspended Users');
    expect(wrapper.text()).toContain('Suspended Mods');
  });
});
