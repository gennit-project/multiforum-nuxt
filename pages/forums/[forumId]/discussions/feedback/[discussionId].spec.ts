import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import FeedbackSection from '@/components/comments/FeedbackSection.vue';

const h = vi.hoisted(() => ({
  route: {
    name: 'forums-forumId-discussions-feedback-discussionId',
    params: {
      forumId: 'cats',
      discussionId: 'd1',
      commentId: '',
      feedbackId: '',
    } as Record<string, unknown>,
    query: {},
  },
  discussionResult: null as unknown as { value: unknown },
  commentResult: null as unknown as { value: unknown },
  discussionError: null as unknown as { value: unknown },
  commentError: null as unknown as { value: unknown },
  discussionLoading: null as unknown as { value: boolean },
  commentLoading: null as unknown as { value: boolean },
  fetchMore: vi.fn(),
  mutate: vi.fn(),
  mutationOptions: undefined as
    undefined | { update: (...args: any[]) => void },
  mutationDone: undefined as undefined | (() => void),
}));

vi.mock('nuxt/app', async () => {
  const { reactive: makeReactive } = await import('vue');
  h.route = makeReactive(h.route);
  return { useRoute: () => h.route };
});

vi.mock('@vue/apollo-composable', async () => {
  const { ref: vref } = await import('vue');
  h.discussionResult = vref(null);
  h.commentResult = vref(null);
  h.discussionError = vref(null);
  h.commentError = vref(null);
  h.discussionLoading = vref(false);
  h.commentLoading = vref(false);
  let queryIndex = 0;
  return {
    useQuery: () => {
      const discussionQuery = queryIndex++ % 2 === 0;
      return discussionQuery
        ? {
            result: h.discussionResult,
            error: h.discussionError,
            loading: h.discussionLoading,
            fetchMore: h.fetchMore,
          }
        : {
            result: h.commentResult,
            error: h.commentError,
            loading: h.commentLoading,
          };
    },
    useMutation: (
      _operation: unknown,
      options: { update: (...args: any[]) => void }
    ) => {
      h.mutationOptions = options;
      return {
        mutate: h.mutate,
        loading: vref(false),
        error: vref(null),
        onDone: (callback: () => void) => {
          h.mutationDone = callback;
        },
      };
    },
  };
});

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

const discussion = (overrides: Record<string, unknown> = {}) => ({
  id: 'd1',
  title: 'Hello',
  body: 'Body',
  DownloadableFiles: [],
  Album: { Images: [] },
  FeedbackComments: [],
  FeedbackCommentsAggregate: { count: 0 },
  Author: { username: 'alice' },
  ...overrides,
});

const mountPage = async () => {
  const Page = (await import('./[discussionId].vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        DiscussionBody: { template: '<div><slot name="album-slot" /></div>' },
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.discussionResult.value = { discussions: [discussion()] };
  h.commentResult.value = { comments: [] };
  h.discussionError.value = null;
  h.commentError.value = null;
  h.discussionLoading.value = false;
  h.commentLoading.value = false;
  Object.assign(h.route.params, {
    forumId: 'cats',
    discussionId: 'd1',
    commentId: '',
    feedbackId: '',
  });
});

describe('discussion feedback page', () => {
  it('renders the feedback section when the discussion loads', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findComponent(FeedbackSection).exists()).toBe(true);
  });

  it('recognizes STL downloads as album content', async () => {
    h.discussionResult.value = {
      discussions: [
        discussion({
          DownloadableFiles: [
            { id: 'f1', fileName: 'MODEL.STL', url: 'download' },
            { id: 'f2', fileName: 'model.zip', url: 'https://cdn/model.stl' },
          ],
        }),
      ],
    };
    const wrapper = await mountPage();
    expect(wrapper.html()).toContain('discussion-album-stub');
  });

  it('loads the next feedback page and appends its comments', async () => {
    h.discussionResult.value = {
      discussions: [
        discussion({
          FeedbackComments: [{ id: 'one' }],
          FeedbackCommentsAggregate: { count: 2 },
        }),
      ],
    };
    const wrapper = await mountPage();
    const loadMore = wrapper
      .findComponent(FeedbackSection)
      .props('loadMore') as () => void;
    loadMore();
    const options = h.fetchMore.mock.calls[0][0];
    const updated = options.updateQuery(
      { discussions: [{ FeedbackComments: [{ id: 'one' }] }] },
      {
        fetchMoreResult: {
          discussions: [{ FeedbackComments: [{ id: 'two' }] }],
        },
      }
    );
    expect([
      options.variables,
      updated.discussions[0].FeedbackComments,
    ]).toEqual([{ offset: 1 }, [{ id: 'one' }, { id: 'two' }]]);
  });

  it('keeps the previous page when fetchMore returns nothing', async () => {
    const wrapper = await mountPage();
    (wrapper.findComponent(FeedbackSection).props('loadMore') as () => void)();
    const previous = { discussions: [{ FeedbackComments: [] }] };
    expect(h.fetchMore.mock.calls[0][0].updateQuery(previous, {})).toBe(
      previous
    );
  });

  it('updates the cached nested feedback thread after a reply', async () => {
    h.discussionResult.value = {
      discussions: [
        discussion({
          FeedbackComments: [
            { id: 'parent', FeedbackComments: [] },
            { id: 'other' },
          ],
          FeedbackCommentsAggregate: { count: 2 },
        }),
      ],
    };
    const wrapper = await mountPage();
    const section = wrapper.findComponent(FeedbackSection);
    section.vm.$emit('update-comment-to-give-feedback-on', {
      id: 'parent',
      FeedbackComments: [{ id: 'existing' }],
    });
    const cache = {
      readQuery: vi.fn().mockReturnValue({
        discussions: [{ FeedbackCommentsAggregate: { count: 2 } }],
      }),
      writeQuery: vi.fn(),
    };
    h.mutationOptions?.update(cache, {
      data: { createComments: { comments: [{ id: 'new' }] } },
    });
    expect(
      cache.writeQuery.mock.calls[0][0].data.discussions[0].FeedbackComments
    ).toEqual([
      { id: 'other' },
      {
        id: 'parent',
        FeedbackComments: [{ id: 'existing' }, { id: 'new' }],
        FeedbackCommentsAggregate: {
          count: 3,
          __typename: 'FeedbackCommentsAggregate',
        },
      },
    ]);
  });

  it('closes the form and shows success after feedback is saved', async () => {
    const wrapper = await mountPage();
    const section = wrapper.findComponent(FeedbackSection);
    section.vm.$emit('open-feedback-form-modal');
    h.mutationDone?.();
    await wrapper.vm.$nextTick();
    expect([
      section.props('showFeedbackFormModal'),
      section.props('showFeedbackSubmittedSuccessfully'),
    ]).toEqual([false, true]);
  });

  it('updates route-derived state when route params change', async () => {
    const wrapper = await mountPage();
    h.route.params = {
      forumId: 'dogs',
      discussionId: 'd2',
      commentId: 'c1',
      feedbackId: 'f1',
    };
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'BackLink' }).props('link')).toBe(
      '/forums/dogs/discussions/d1'
    );
  });
});
