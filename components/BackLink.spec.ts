import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import BackLink from '@/components/BackLink.vue';

const h = vi.hoisted(() => ({ route: null as unknown }));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

const mountLink = (props: Record<string, unknown> = {}) =>
  mount(BackLink, {
    props,
    global: {
      stubs: {
        LeftArrowIcon: true,
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a :href="to"><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: {} };
});

describe('BackLink', () => {
  it('shows the default Back text', () => {
    const wrapper = mountLink();

    expect(wrapper.text()).toBe('Back');
  });

  it('shows custom text', () => {
    const wrapper = mountLink({ text: 'Go back' });

    expect(wrapper.text()).toBe('Go back');
  });

  it('shows "Back to {forum}" when on a forum route', () => {
    h.route = { params: { forumId: 'cats' } };
    const wrapper = mountLink();

    expect(wrapper.text()).toBe('Back to cats');
  });

  it('falls back to the channelId param', () => {
    h.route = { params: { channelId: 'dogs' } };
    const wrapper = mountLink();

    expect(wrapper.text()).toBe('Back to dogs');
  });

  it('links to the provided destination', () => {
    const wrapper = mountLink({ link: '/forums' });

    expect(wrapper.get('a').attributes('href')).toBe('/forums');
  });
});
