import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import {
  GetPermalinkedCommentDocument,
  type GetPermalinkedCommentQuery,
} from '@/__generated__/operations';
import { makePermalinkedComment } from '@/tests/utils/permalinkFixtures';
import PermalinkedComment from './PermalinkedComment.vue';

const mockQuery = vi.hoisted(() => vi.fn());
const mockRoute = reactive<{
  params: Record<string, string | string[] | undefined>;
}>({ params: {} });
const mockResult = ref<GetPermalinkedCommentQuery>();
const mockError = ref<{ message: string } | null>(null);
const mockLoading = ref(false);
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args: unknown[]) => mockQuery(...args),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => mockRoute }));
const mountComment = () =>
  mount(PermalinkedComment, {
    slots: {
      comment: `<template #comment="{ commentData }"><div class="slot">{{ commentData.text }}</div></template>`,
    },
    global: {
      stubs: {
        ErrorBanner: {
          props: ['text'],
          template: '<div class="err">{{ text }}</div>',
        },
        NuxtLink: {
          name: 'NuxtLink',
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  });
beforeEach(() => {
  vi.clearAllMocks();
  mockResult.value = { comments: [makePermalinkedComment()] };
  mockError.value = null;
  mockLoading.value = false;
  mockRoute.params = { commentId: 'c1', forumId: 'cats', discussionId: 'd1' };
  mockQuery.mockReturnValue({
    result: mockResult,
    error: mockError,
    loading: mockLoading,
  });
});
describe('permalink query contract', () => {
  it('uses one generated document with reactive scalar variables', async () => {
    mountComment();
    mockRoute.params.commentId = 'c2';
    await nextTick();
    const [document, variables, options] = mockQuery.mock.calls[0]!;
    expect({
      typed: document === GetPermalinkedCommentDocument,
      calls: mockQuery.mock.calls.length,
      variables: variables(),
      options: options(),
    }).toEqual({
      typed: true,
      calls: 1,
      variables: { id: 'c2' },
      options: { enabled: true, keepPreviousResult: false },
    });
  });
  it.each([undefined, '', '  ', [], ['c1'], ['c1', 'c2']])(
    'disables invalid ID %j without displaying cached data',
    (id) => {
      mockRoute.params.commentId = id;
      const wrapper = mountComment();
      expect({
        enabled: mockQuery.mock.calls[0]![2]().enabled,
        slot: wrapper.find('.slot').exists(),
        context: wrapper.find('a').exists(),
        missing: wrapper.text().includes('does not exist'),
      }).toEqual({
        enabled: false,
        slot: false,
        context: false,
        missing: true,
      });
    }
  );
});
describe('permalink states and navigation', () => {
  it('shows loading instead of stale content', () => {
    mockLoading.value = true;
    const wrapper = mountComment();
    expect({
      loading: wrapper.find('[role="status"]').text(),
      content: wrapper.find('.slot').exists(),
    }).toEqual({ loading: 'Loading...', content: false });
  });
  it('shows the query error instead of stale content', () => {
    mockError.value = { message: 'boom' };
    const wrapper = mountComment();
    expect({
      error: wrapper.find('.err').text(),
      content: wrapper.find('.slot').exists(),
    }).toEqual({ error: 'boom', content: false });
  });
  it.each([undefined, { comments: [] }])('shows not found for %j', (result) => {
    mockResult.value = result;
    expect(mountComment().text()).toContain('does not exist');
  });
  it('passes nullable text/author/parent without inventing context', () => {
    mockResult.value = {
      comments: [
        makePermalinkedComment({
          text: null,
          CommentAuthor: null,
          ParentComment: null,
        }),
      ],
    };
    const wrapper = mountComment();
    expect({
      slot: wrapper.find('.slot').text(),
      link: wrapper.find('a').exists(),
    }).toEqual({ slot: '', link: false });
  });
  it('hides previous comment and context immediately on ID navigation', async () => {
    mockResult.value = {
      comments: [makePermalinkedComment({ ParentComment: { id: 'p1' } })],
    };
    const wrapper = mountComment();
    mockRoute.params.commentId = 'c2';
    await nextTick();
    expect({
      content: wrapper.find('.slot').exists(),
      context: wrapper.find('a').exists(),
    }).toEqual({ content: false, context: false });
  });
  it('renders the new ID after its result arrives', async () => {
    const wrapper = mountComment();
    mockRoute.params.commentId = 'c2';
    mockResult.value = {
      comments: [makePermalinkedComment({ id: 'c2', text: 'New comment' })],
    };
    await nextTick();
    expect(wrapper.find('.slot').text()).toBe('New comment');
  });
  it.each(['discussion', 'event'])(
    'builds the exact %s context link',
    (kind) => {
      mockRoute.params = {
        commentId: 'c1',
        forumId: 'cats',
        [`${kind}Id`]: 'context1',
      };
      mockResult.value = {
        comments: [makePermalinkedComment({ ParentComment: { id: 'p1' } })],
      };
      expect(
        mountComment().findComponent({ name: 'NuxtLink' }).props('to')
      ).toEqual({
        name: `forums-forumId-${kind}s-${kind}Id-comments-commentId`,
        params: { forumId: 'cats', [`${kind}Id`]: 'context1', commentId: 'p1' },
      });
    }
  );
  it.each(['forumId', 'discussionId'])(
    'does not build context with array %s',
    (field) => {
      mockRoute.params[field] = ['invalid'];
      mockResult.value = {
        comments: [makePermalinkedComment({ ParentComment: { id: 'p1' } })],
      };
      expect(mountComment().find('a').exists()).toBe(false);
    }
  );
});
