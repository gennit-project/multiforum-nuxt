import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ServerTabs from '@/components/admin/ServerTabs.vue';
import type { Channel } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ route: null as unknown }));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

const tabButtonStub = {
  name: 'TabButton',
  props: ['to', 'label', 'isActive', 'vertical', 'showCount'],
  template: '<a>{{ label }}</a>',
};

const mountTabs = (props: Record<string, unknown> = {}) =>
  mount(ServerTabs, {
    props: { serverConfig: {} as unknown as Channel, ...props },
    global: {
      stubs: {
        TabButton: tabButtonStub,
        FlagIcon: true,
        LockClosedIcon: true,
        CogIcon: true,
        IdentificationIcon: true,
        PlugIcon: true,
        InfoIcon: true,
        UserIcon: true,
      },
    },
  });

const tabs = (w: ReturnType<typeof mount>) => w.findAllComponents(tabButtonStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { path: '/admin/issues' };
});

describe('ServerTabs', () => {
  it('renders all admin tabs', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)).toHaveLength(8);
  });

  it('labels the first tab Issues', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('label')).toBe('Issues');
  });

  it('points the issues tab at the admin issues route', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('to')).toBe('/admin/issues');
  });

  it('marks the tab matching the route as active', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('isActive')).toBe(true);
  });

  it('does not mark a non-matching tab active', () => {
    h.route = { path: '/admin/settings' };
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('isActive')).toBe(false);
  });

  it('passes the vertical flag to the tabs', () => {
    const wrapper = mountTabs({ vertical: true });

    expect(tabs(wrapper)[0].props('vertical')).toBe(true);
  });
});
