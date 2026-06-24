import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import UserProfileTabs from '@/components/user/UserProfileTabs.vue';
import type { User } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ route: null as unknown }));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

const tabButtonStub = {
  name: 'TabButton',
  props: ['to', 'label', 'isActive', 'count', 'showCount'],
  template: '<a>{{ label }}</a>',
};

const user = (overrides: Record<string, unknown> = {}) =>
  ({ CommentsAggregate: { count: 4 }, ...overrides }) as unknown as User;

const mountTabs = (props: Record<string, unknown> = {}) =>
  mount(UserProfileTabs, {
    props: { user: user(), ...props },
    global: { stubs: { TabButton: tabButtonStub } },
  });

const tabs = (w: ReturnType<typeof mount>) => w.findAllComponents(tabButtonStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { username: 'alice' }, path: '/u/alice/comments', query: {} };
});

describe('UserProfileTabs', () => {
  it('renders all profile tabs', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)).toHaveLength(10);
  });

  it('labels the first tab Comments', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('label')).toBe('Comments');
  });

  it('passes the comment count to the comments tab', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('count')).toBe(4);
  });

  it('marks the tab matching the route as active', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('isActive')).toBe(true);
  });

  it('treats a nested route as active', () => {
    h.route = { params: { username: 'alice' }, path: '/u/alice/comments/123', query: {} };
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('isActive')).toBe(true);
  });

  it('hides counts unless showCounts is set', () => {
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('showCount')).toBe(false);
  });

  it('shows the count when showCounts is enabled and a count exists', () => {
    const wrapper = mountTabs({ showCounts: true });

    expect(tabs(wrapper)[0].props('showCount')).toBe(true);
  });

  it('carries the channels query into the tab links', () => {
    h.route = { params: { username: 'alice' }, path: '/u/alice/comments', query: { channels: 'cats' } };
    const wrapper = mountTabs();

    expect(tabs(wrapper)[0].props('to')).toEqual({
      path: '/u/alice/comments',
      query: { channels: ['cats'] },
    });
  });
});
