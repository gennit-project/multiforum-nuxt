import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ModProfileTabs from '@/components/mod/ModProfileTabs.vue';
import type { ModerationProfile } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ route: null as unknown }));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

const tabButtonStub = {
  name: 'TabButton',
  props: ['to', 'label', 'count', 'showCount'],
  template: '<a>{{ label }}</a>',
};

const mod = (overrides: Record<string, unknown> = {}) =>
  ({ AuthoredCommentsAggregate: { count: 4 }, ...overrides }) as unknown as ModerationProfile;

const mountTabs = (props: Record<string, unknown> = {}) =>
  mount(ModProfileTabs, {
    props: { mod: mod(), ...props },
    global: { stubs: { TabButton: tabButtonStub } },
  });

const tabs = (w: ReturnType<typeof mount>) => w.findAllComponents(tabButtonStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { modId: 'mod1' } };
});

describe('ModProfileTabs', () => {
  it('renders the three mod tabs', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)).toHaveLength(3);
  });

  it('labels the first tab Comments', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('label')).toBe('Comments');
  });

  it('passes the comment count to the comments tab', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('count')).toBe(4);
  });

  it('hides counts unless showCounts is set', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('showCount')).toBe(false);
  });

  it('shows the count when enabled and present', () => {
    const wrapper = mountTabs({ showCounts: true });

    expect(tabs(wrapper)[0].props('showCount')).toBe(true);
  });

  it('builds the tab links from the mod id', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('to')).toBe('/mod/mod1/comments');
  });
});
