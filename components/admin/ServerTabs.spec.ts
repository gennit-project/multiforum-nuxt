import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ServerTabs from '@/components/admin/ServerTabs.vue';
import type { Channel } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({
  route: null as unknown,
  mdAndUp: null as unknown,
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('vuetify', () => ({ useDisplay: () => ({ mdAndUp: h.mdAndUp }) }));

const tabButtonStub = {
  name: 'TabButton',
  props: ['to', 'label', 'isActive', 'vertical', 'showCount', 'compact'],
  template: '<a>{{ label }}</a>',
};

const mountTabs = (props: Record<string, unknown> = {}) =>
  mount(ServerTabs, {
    props: { serverConfig: {} as unknown as Channel, ...props },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        Popper: { template: '<div><slot /><slot name="content" /></div>' },
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
        TabButton: tabButtonStub,
        FlagIcon: true,
        LockClosedIcon: true,
        CogIcon: true,
        IdentificationIcon: true,
        PlugIcon: true,
        InfoIcon: true,
        UserIcon: true,
        LayoutDashboard: true,
      },
    },
  });

const tabs = (w: ReturnType<typeof mount>) => w.findAllComponents(tabButtonStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { path: '/admin/issues' };
  h.mdAndUp = ref(true);
});

describe('ServerTabs', () => {
  it('renders all admin tabs', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)).toHaveLength(7);
  });

  it('labels the first tab Dashboard', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('label')).toBe('Dashboard');
  });

  it('points the issues tab at the admin issues route', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[1].props('to')).toBe('/admin/issues');
  });

  it('places Suspensions between Settings and Plugins', () => {
    const wrapper = mountTabs();
    const labels = tabs(wrapper).map((tab) => tab.props('label'));

    expect(labels).toEqual([
      'Dashboard',
      'Issues',
      'Channel Reports',
      'Settings',
      'Suspensions',
      'Plugins',
      'About',
    ]);
  });

  it('marks the tab matching the route as active', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[1].props('isActive')).toBe(true);
  });

  it('does not mark a non-matching tab active', () => {
    h.route = { path: '/admin/settings' };
    const wrapper = mountTabs();

    expect(tabs(wrapper)[1].props('isActive')).toBe(false);
  });

  it('passes the vertical flag to the tabs', () => {
    const wrapper = mountTabs({ vertical: true });

    expect(tabs(wrapper)[0].props('vertical')).toBe(true);
  });

  it('uses the compact tab button variant', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('compact')).toBe(true);
  });

  it('keeps horizontal tabs wrappable at larger breakpoints', () => {
    const wrapper = mountTabs();

    expect(wrapper.get('nav').attributes('class')).not.toContain('sm:flex-nowrap');
  });

  it('renders the active tab label in the mobile dropdown', () => {
    (h.mdAndUp as { value: boolean }).value = false;
    const wrapper = mountTabs();

    expect(wrapper.get('[data-testid="mobile-admin-nav-dropdown"]').text()).toContain(
      'Issues'
    );
  });
});
