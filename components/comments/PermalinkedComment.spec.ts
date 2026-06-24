import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import PermalinkedComment from '@/components/comments/PermalinkedComment.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  route: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, error: h.error, loading: h.loading }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

const comment = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  text: 'A comment',
  ParentComment: null,
  ...overrides,
});

const mountComment = () =>
  mount(PermalinkedComment, {
    slots: {
      comment: `<template #comment="{ commentData }"><div class="slot">{{ commentData.text }}</div></template>`,
    },
    global: {
      stubs: {
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ comments: [comment()] });
  h.error = ref(null);
  h.loading = ref(false);
  h.route = { params: { commentId: 'c1', forumId: 'cats', discussionId: 'd1' } };
});

describe('PermalinkedComment states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountComment();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountComment();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows a not-found message when the comment is missing', () => {
    h.result = ref({ comments: [] });
    const wrapper = mountComment();

    expect(wrapper.text()).toContain('does not exist');
  });
});

describe('PermalinkedComment content', () => {
  it('passes the comment to the slot', () => {
    const wrapper = mountComment();

    expect(wrapper.find('.slot').text()).toBe('A comment');
  });

  it('hides the context link without a parent comment', () => {
    const wrapper = mountComment();

    expect(wrapper.text()).not.toContain('View Context');
  });

  it('shows a context link for a discussion reply', () => {
    h.result = ref({ comments: [comment({ ParentComment: { id: 'p1' } })] });
    const wrapper = mountComment();

    expect(wrapper.text()).toContain('View Context');
  });

  it('shows a context link for an event reply', () => {
    h.route = { params: { commentId: 'c1', forumId: 'cats', eventId: 'e1' } };
    h.result = ref({ comments: [comment({ ParentComment: { id: 'p1' } })] });
    const wrapper = mountComment();

    expect(wrapper.text()).toContain('View Context');
  });
});
