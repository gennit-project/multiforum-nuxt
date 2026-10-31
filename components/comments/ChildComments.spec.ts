import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { GetCommentWithRepliesDocument } from '@/__generated__/operations';
import { makeReply } from '@/tests/utils/replyFixtures';
import ChildComments from '@/components/comments/ChildComments.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  fetchMore: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args: unknown[]) => {
    h.query(...args);
    return {
      result: h.result,
      error: h.error,
      loading: h.loading,
      fetchMore: h.fetchMore,
    };
  },
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ query: {} }) }));

const replies = (ids: string[], total?: number) => ({
  getCommentReplies: {
    ChildComments: ids.map((id) => makeReply({ id })),
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
        LoadMore: {
          name: 'LoadMore',
          props: ['reachedEndOfResults'],
          emits: ['load-more'],
          template: '<div class="load" />',
        },
        ErrorBanner: {
          name: 'ErrorBanner',
          props: ['text'],
          template: '<div class="err">{{ text }}</div>',
        },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(replies(['r1'], 3));
  h.error = ref(null);
  h.loading = ref(false);
});

describe('typed reply boundary', () => {
  it('uses the generated document with plain reactive variables', async () => {
    const wrapper = mountChild();
    const [document, variables] = h.query.mock.calls[0];
    await wrapper.setProps({ parentCommentId: 'next', modName: 'mod2' });
    expect({
      generatedDocument: document === GetCommentWithRepliesDocument,
      calls: h.query.mock.calls.length,
      variables: variables(),
    }).toEqual({
      generatedDocument: true,
      calls: 1,
      variables: {
        commentId: 'next',
        modName: 'mod2',
        limit: 5,
        offset: 0,
        sort: 'hot',
      },
    });
  });

  it.each([undefined, { getCommentReplies: null }, replies([])])(
    'renders no replies or pagination for %j',
    (result) => {
      h.result = ref(result);
      const wrapper = mountChild();
      expect({
        count: wrapper.find('.count').text(),
        more: wrapper.find('.load').exists(),
      }).toEqual({ count: '0', more: false });
    }
  );

  it('keeps existing replies when the next page is null', async () => {
    const wrapper = mountChild();
    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');
    const { updateQuery, variables } = h.fetchMore.mock.calls[0][0];
    const previous = replies(['r1']);
    expect({
      merged: updateQuery(previous, {
        fetchMoreResult: { getCommentReplies: null },
      }),
      variables,
    }).toEqual({ merged: previous, variables: { offset: 1 } });
  });

  it('accepts a next page after a null previous result', async () => {
    const wrapper = mountChild();
    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');
    const { updateQuery } = h.fetchMore.mock.calls[0][0];
    const next = replies(['r1']);
    expect(
      updateQuery({ getCommentReplies: null }, { fetchMoreResult: next })
    ).toBe(next);
  });
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
    const merged = updateQuery(replies(['r1']), {
      fetchMoreResult: replies(['r2']),
    });

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
