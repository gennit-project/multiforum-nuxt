import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import CommentHeader from '@/components/comments/CommentHeader.vue';
import PageNotFound from '@/components/PageNotFound.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import FeedbackSection from '@/components/comments/FeedbackSection.vue';

const mockState = vi.hoisted(() => ({
  route: {
    params: {
      forumId: 'cats' as unknown,
      discussionId: 'd1' as unknown,
      commentId: 'c1' as unknown,
      feedbackId: undefined as unknown,
    },
    query: {} as Record<string, unknown>,
    name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId' as unknown,
  },
  fetchMore: vi.fn(),
  queryDone: null as null | (() => void),
  mutationDone: null as null | (() => void),
  mutationUpdate: null as null | ((cache: unknown, result: unknown) => void),
  addFeedback: vi.fn(),
  mutationError: null as unknown as { value: unknown },
  mutationLoading: null as unknown as { value: boolean },
}));

mockState.mutationError = ref(null);
mockState.mutationLoading = ref(false);

vi.mock('nuxt/app', () => ({
  useRoute: () => mockState.route,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

const baseComment = {
  id: 'c1',
  text: 'Original comment',
  FeedbackComments: [],
  FeedbackCommentsAggregate: { count: 0 },
};

const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  props: { to: { type: [String, Object], required: true } },
  template: '<a><slot /></a>',
});

const mountWith = async (
  comment: unknown,
  options: { loading?: boolean; error?: unknown; noResult?: boolean } = {}
) => {
  mockedUseQuery.mockReturnValue({
    result: ref(
      options.noResult ? null : { comments: comment ? [comment] : [] }
    ),
    error: ref(options.error ?? null),
    loading: ref(options.loading ?? false),
    fetchMore: mockState.fetchMore,
    onResult: (callback: () => void) => {
      mockState.queryDone = callback;
    },
  });
  mockedUseMutation.mockImplementation(
    (
      _document: unknown,
      options: { update: (cache: unknown, result: unknown) => void }
    ) => {
      mockState.mutationUpdate = options.update;
      return {
        mutate: mockState.addFeedback,
        loading: mockState.mutationLoading,
        error: mockState.mutationError,
        onDone: (callback: () => void) => {
          mockState.mutationDone = callback;
        },
      };
    }
  );
  const Page = (await import('./[commentId].vue')).default;
  return shallowMount(Page, {
    global: { stubs: { 'nuxt-link': NuxtLinkStub } },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockState.route.params = {
    forumId: 'cats',
    discussionId: 'd1',
    commentId: 'c1',
    feedbackId: undefined,
  };
  mockState.route.query = {};
  mockState.route.name =
    'forums-forumId-discussions-commentFeedback-discussionId-commentId';
  mockState.queryDone = null;
  mockState.mutationDone = null;
  mockState.mutationUpdate = null;
  mockState.mutationError.value = null;
  mockState.mutationLoading.value = false;
});

describe('comment feedback page', () => {
  it('renders the comment header when the comment loads', async () => {
    const wrapper = await mountWith(baseComment);
    expect(wrapper.findComponent(CommentHeader).exists()).toBe(true);
  });

  it('shows the not-found page when the comment is missing', async () => {
    const wrapper = await mountWith(null);
    expect(wrapper.findComponent(PageNotFound).exists()).toBe(true);
  });

  it('shows loading before the first query result', async () => {
    const wrapper = await mountWith(null, { loading: true, noResult: true });

    expect(wrapper.text()).toContain('Loading...');
  });

  it('passes query errors to the error banner', async () => {
    const wrapper = await mountWith(null, {
      error: new Error('Feedback unavailable'),
    });

    expect(wrapper.findComponent(ErrorBanner).props('text')).toBe(
      'Feedback unavailable'
    );
  });

  it('links a feedback page back to its original comment', async () => {
    const wrapper = await mountWith(baseComment);
    mockState.queryDone?.();
    await wrapper.vm.$nextTick();

    const contextLink = wrapper
      .findAllComponents(NuxtLinkStub)
      .find((link) => link.text().includes('View original context'));
    expect(contextLink?.props('to')).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: { discussionId: 'd1', commentId: 'c1' },
    });
  });

  it('shows a parent-comment context link', async () => {
    const wrapper = await mountWith({
      ...baseComment,
      ParentComment: { id: 'parent-1' },
    });

    expect(wrapper.text()).toContain('View Context');
  });

  it('reports feedback list state to the section', async () => {
    const feedback = [{ id: 'f1' }, { id: 'f2' }];
    const wrapper = await mountWith({
      ...baseComment,
      FeedbackComments: feedback,
      FeedbackCommentsAggregate: { count: 2 },
    });
    const section = wrapper.findComponent(FeedbackSection);

    expect({
      comments: section.props('feedbackComments'),
      count: section.props('feedbackCommentsAggregate'),
      end: section.props('reachedEndOfResults'),
    }).toEqual({ comments: feedback, count: 2, end: true });
  });

  it('loads and merges the next feedback page', async () => {
    const wrapper = await mountWith({
      ...baseComment,
      FeedbackComments: [{ id: 'f1' }],
      FeedbackCommentsAggregate: { count: 2 },
    });
    wrapper.findComponent(FeedbackSection).props('loadMore')();
    const request = mockState.fetchMore.mock.calls[0]?.[0];
    const previous = {
      comments: [{ id: 'c1', FeedbackComments: [{ id: 'f1' }] }],
    };
    const next = { comments: [{ id: 'c1', FeedbackComments: [{ id: 'f2' }] }] };

    expect({
      variables: request.variables,
      comments: request.updateQuery(previous, { fetchMoreResult: next })
        .comments[0].FeedbackComments,
    }).toEqual({
      variables: { offset: 1 },
      comments: [{ id: 'f1' }, { id: 'f2' }],
    });
  });

  it('keeps prior feedback when fetch-more has no result', async () => {
    const wrapper = await mountWith(baseComment);
    wrapper.findComponent(FeedbackSection).props('loadMore')();
    const updateQuery = mockState.fetchMore.mock.calls[0]?.[0].updateQuery;
    const previous = { comments: [{ id: 'c1', FeedbackComments: [] }] };

    expect(updateQuery(previous, { fetchMoreResult: null })).toBe(previous);
  });

  it('opens and closes the feedback form', async () => {
    const wrapper = await mountWith(baseComment);
    const section = wrapper.findComponent(FeedbackSection);
    section.vm.$emit('open-feedback-form-modal');
    await wrapper.vm.$nextTick();
    const opened = section.props('showFeedbackFormModal');
    section.vm.$emit('close-feedback-form-modal');
    await wrapper.vm.$nextTick();

    expect([opened, section.props('showFeedbackFormModal')]).toEqual([
      true,
      false,
    ]);
  });

  it('submits feedback for the selected nested comment', async () => {
    const wrapper = await mountWith(baseComment);
    const section = wrapper.findComponent(FeedbackSection);
    section.vm.$emit('update-comment-to-give-feedback-on', { id: 'f1' });
    section.vm.$emit('add-feedback-comment-to-comment', { text: 'Helpful' });

    expect(mockState.addFeedback).toHaveBeenCalledWith({ text: 'Helpful' });
  });

  it('closes the form and shows success after the mutation completes', async () => {
    const wrapper = await mountWith(baseComment);
    const section = wrapper.findComponent(FeedbackSection);
    section.vm.$emit('open-feedback-form-modal');
    mockState.mutationDone?.();
    await wrapper.vm.$nextTick();

    expect({
      open: section.props('showFeedbackFormModal'),
      success: section.props('showFeedbackSubmittedSuccessfully'),
    }).toEqual({ open: false, success: true });
  });

  it('updates the cached nested feedback thread', async () => {
    const nested = { id: 'f1', FeedbackComments: [{ id: 'old' }] };
    const wrapper = await mountWith({
      ...baseComment,
      FeedbackComments: [nested, { id: 'f2' }],
    });
    wrapper
      .findComponent(FeedbackSection)
      .vm.$emit('update-comment-to-give-feedback-on', nested);
    const cache = {
      readQuery: vi.fn(() => ({
        comments: [{ FeedbackCommentsAggregate: { count: 1 } }],
      })),
      writeQuery: vi.fn(),
    };

    mockState.mutationUpdate?.(cache, {
      data: { createComments: { comments: [{ id: 'new' }] } },
    });

    const written = cache.writeQuery.mock.calls[0]?.[0].data.comments[0];
    expect(written.FeedbackComments).toEqual([
      { id: 'f2' },
      {
        id: 'f1',
        FeedbackComments: [{ id: 'old' }, { id: 'new' }],
        FeedbackCommentsAggregate: {
          count: 2,
          __typename: 'FeedbackCommentsAggregate',
        },
      },
    ]);
  });
});
