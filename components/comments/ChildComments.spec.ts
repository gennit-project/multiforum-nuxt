import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ChildComments from '@/components/comments/ChildComments.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  fetchMore: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
    fetchMore: h.fetchMore,
  }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ query: {} }) }));

const replies = (ids: string[], total?: number) => ({
  getCommentReplies: {
    ChildComments: ids.map((id) => ({ id })),
    aggregateChildCommentCount: total ?? ids.length,
  },
});

const mountChild = () =>
  mount(ChildComments, {
    props: { modName: 'mod1', parentCommentId: 'c1' },
    slots: {
      default: `<template #default="{ comments }"><div class="count">{{ comments.length }}</div></template>`,
    },
    global: {
      stubs: {
        LoadMore: { name: 'LoadMore', props: ['reachedEndOfResults'], emits: ['load-more'], template: '<div class="load" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(replies(['r1'], 3));
  h.error = ref(null);
  h.loading = ref(false);
});

describe('ChildComments states', () => {
  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountChild();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountChild();

    expect(wrapper.text()).toContain('Loading');
  });

  it('exposes the comments to the default slot', () => {
    const wrapper = mountChild();

    expect(wrapper.find('.count').text()).toBe('1');
  });
});

describe('ChildComments load more', () => {
  it('shows Load More when there are more replies', () => {
    const wrapper = mountChild();

    expect(wrapper.findComponent({ name: 'LoadMore' }).exists()).toBe(true);
  });

  it('hides Load More when all replies are loaded', () => {
    h.result = ref(replies(['r1', 'r2', 'r3'], 3));
    const wrapper = mountChild();

    expect(wrapper.findComponent({ name: 'LoadMore' }).exists()).toBe(false);
  });

  it('fetches more on load-more', async () => {
    const wrapper = mountChild();

    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    expect(h.fetchMore).toHaveBeenCalled();
  });

  it('merges fetched pages via updateQuery', async () => {
    const wrapper = mountChild();
    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    const { updateQuery } = h.fetchMore.mock.calls[0][0];
    const merged = updateQuery(replies(['r1']), { fetchMoreResult: replies(['r2']) });

    expect(merged.getCommentReplies.ChildComments).toHaveLength(2);
  });

  it('keeps the previous result when there is no fetchMoreResult', async () => {
    const wrapper = mountChild();
    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    const { updateQuery } = h.fetchMore.mock.calls[0][0];
    const prev = replies(['r1']);

    expect(updateQuery(prev, { fetchMoreResult: null })).toBe(prev);
  });
});
