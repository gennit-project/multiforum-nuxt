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
// The route's commentId is a shortId, resolved to the global id by a lookup.
const mockResolvedId = ref('c1');
const mockResolving = ref(false);
const mockNotFound = ref(false);
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args: unknown[]) => mockQuery(...args),
}));
vi.mock('@/composables/useRouteContentIds', () => ({
  useResolvedCommentId: () => ({
    id: mockResolvedId,
    loading: mockResolving,
    notFound: mockNotFound,
  }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => mockRoute }));
const SHORT_ID = 'replyshort01';
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
  mockResolvedId.value = 'c1';
  mockResolving.value = false;
  mockNotFound.value = false;
  mockRoute.params = {
    commentId: SHORT_ID,
    forumId: 'cats',
    discussionId: '1-trail-conditions',
  };
  mockQuery.mockReturnValue({
    result: mockResult,
    error: mockError,
    loading: mockLoading,
  });
});
describe('permalink query contract', () => {
  it('uses one generated document with reactive scalar variables', async () => {
    mountComment();
    mockResolvedId.value = 'c2';
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
      mockResolvedId.value = '';
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
describe('shortId resolution', () => {
  it('queries the resolved global id, not the route shortId', () => {
    mockResolvedId.value = 'global-1';
    mountComment();
    expect(mockQuery.mock.calls[0]![1]()).toEqual({ id: 'global-1' });
  });
  it('shows loading while the shortId lookup is in flight', () => {
    mockResolvedId.value = '';
    mockResolving.value = true;
    expect(mountComment().find('[role="status"]').text()).toBe('Loading...');
  });
  it('does not query anything until the lookup resolves', () => {
    mockResolvedId.value = '';
    mockResolving.value = true;
    mountComment();
    expect(mockQuery.mock.calls[0]![2]().enabled).toBe(false);
  });
  it('tries the route param as a raw id when the lookup finds nothing', () => {
    mockResolvedId.value = '';
    mockNotFound.value = true;
    mockRoute.params.commentId = 'c1';
    mountComment();
    expect(mockQuery.mock.calls[0]![1]()).toEqual({ id: 'c1' });
  });
  it('renders the comment whose shortId matches the route', () => {
    expect(mountComment().find('.slot').text()).toBe('A comment');
  });
  it('does not render a comment whose shortId differs from the route', () => {
    mockRoute.params.commentId = 'someothershort';
    expect(mountComment().find('.slot').exists()).toBe(false);
  });
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
      comments: [
        makePermalinkedComment({
          ParentComment: { id: 'p1', shortId: 'p1short' },
        }),
      ],
    };
    const wrapper = mountComment();
    mockRoute.params.commentId = 'c2short';
    await nextTick();
    expect({
      content: wrapper.find('.slot').exists(),
      context: wrapper.find('a').exists(),
    }).toEqual({ content: false, context: false });
  });
  it('renders the new ID after its result arrives', async () => {
    const wrapper = mountComment();
    mockRoute.params.commentId = 'c2short';
    mockResolvedId.value = 'c2';
    mockResult.value = {
      comments: [
        makePermalinkedComment({
          id: 'c2',
          shortId: 'c2short',
          text: 'New comment',
        }),
      ],
    };
    await nextTick();
    expect(wrapper.find('.slot').text()).toBe('New comment');
  });
  it.each(['discussion', 'event'])(
    'builds the exact %s context link',
    (kind) => {
      mockRoute.params = {
        commentId: SHORT_ID,
        forumId: 'cats',
        [`${kind}Id`]: '7-context-title',
      };
      mockResult.value = {
        comments: [
          makePermalinkedComment({
            ParentComment: { id: 'p1', shortId: 'p1short' },
          }),
        ],
      };
      expect(
        mountComment().findComponent({ name: 'NuxtLink' }).props('to')
      ).toEqual({
        name: `forums-forumId-${kind}s-${kind}Id-comments-commentId`,
        params: {
          forumId: 'cats',
          [`${kind}Id`]: '7-context-title',
          commentId: 'p1short',
        },
      });
    }
  );
  it.each(['forumId', 'discussionId'])(
    'does not build context with array %s',
    (field) => {
      mockRoute.params[field] = ['invalid'];
      mockResult.value = {
        comments: [
          makePermalinkedComment({
            ParentComment: { id: 'p1', shortId: 'p1short' },
          }),
        ],
      };
      expect(mountComment().find('a').exists()).toBe(false);
    }
  );
  it('falls back to the raw parent id when the parent has no shortId', () => {
    mockResult.value = {
      comments: [
        makePermalinkedComment({
          ParentComment: { id: 'p1', shortId: null },
        }),
      ],
    };
    expect(
      mountComment().findComponent({ name: 'NuxtLink' }).props('to')
    ).toMatchObject({ params: { commentId: 'p1' } });
  });
});
