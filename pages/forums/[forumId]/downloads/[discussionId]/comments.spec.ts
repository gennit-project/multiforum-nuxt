import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, ref, nextTick } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import DiscussionCommentsWrapper from '@/components/discussion/detail/DiscussionCommentsWrapper.vue';
import DiscussionRootCommentFormWrapper from '@/components/discussion/form/DiscussionRootCommentFormWrapper.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import InfoBanner from '@/components/InfoBanner.vue';

const hState = vi.hoisted(() => ({
  route: {
    params: { forumId: 'cats', discussionId: 'd1' },
    query: {},
  },
  fetchMore: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => hState.route,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
  useUsername: () => ref('alice'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const stubs = {
  DiscussionCommentsWrapper: defineComponent({
    name: 'DiscussionCommentsWrapper',
    props: ['comments', 'locked', 'reachedEndOfResults'],
    emits: ['load-more'],
    template:
      '<div><button data-testid="load-more" @click="$emit(\'load-more\')">more</button><slot /></div>',
  }),
  DiscussionRootCommentFormWrapper: {
    name: 'DiscussionRootCommentFormWrapper',
    props: ['discussionChannel'],
    template: '<div data-testid="root-form" />',
  },
  LoadingSpinner: {
    name: 'LoadingSpinner',
    props: ['loadingText'],
    template: '<div data-testid="loading-spinner" />',
  },
  ErrorBanner: {
    name: 'ErrorBanner',
    props: ['text'],
    template: '<div data-testid="error-banner" />',
  },
  InfoBanner: {
    name: 'InfoBanner',
    props: ['text'],
    template: '<div data-testid="info-banner" />',
  },
};

const mountPage = async (opts: {
  discussion?: unknown;
  comments?: unknown[];
  loading?: boolean;
  error?: unknown;
  channel?: Record<string, unknown>;
  commentCount?: number;
  rootCount?: number;
} = {}) => {
  const {
    discussion = {
      id: 'd1',
      title: 'Download',
      Author: { username: 'alice' },
      DiscussionChannels: [
        {
          id: 'dc1',
          channelUniqueName: 'cats',
          archived: false,
          locked: false,
          CommentsAggregate: { count: 2 },
        },
      ],
    },
    comments = [{ id: 'c1', ParentComment: null }, { id: 'c2', ParentComment: null }],
    loading = false,
    error = null,
    commentCount = 2,
    rootCount = 2,
  } = opts;

  let callIndex = 0;
  mockedUseQuery.mockImplementation(() => {
    if (callIndex === 0) {
      callIndex += 1;
      return {
        result: ref({ discussions: [discussion] }),
      };
    }
    if (callIndex === 1) {
      callIndex += 1;
      return {
        result: ref({
          getCommentSection: { Comments: comments },
        }),
        error: ref(error),
        loading: ref(loading),
        fetchMore: hState.fetchMore,
        refetch: hState.refetch,
      };
    }
    if (callIndex === 2) {
      callIndex += 1;
      return {
        result: ref({
          discussionChannels: [{ CommentsAggregate: { count: commentCount } }],
        }),
      };
    }
    callIndex += 1;
    return {
      result: ref({
        discussionChannels: [{ CommentsAggregate: { count: rootCount } }],
      }),
    };
  });

  const Page = (await import('./comments.vue')).default;
  return shallowMount(Page, {
    props: {
      discussion,
    },
    global: { stubs },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  hState.route = {
    params: { forumId: 'cats', discussionId: 'd1' },
    query: {},
  };
});

describe('download comments page', () => {
  it('shows the loading spinner while comments load', async () => {
    const wrapper = await mountPage({ loading: true, comments: [] });
    expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true);
  });

  it('shows the locked banner when the discussion channel is locked', async () => {
    const wrapper = await mountPage({
      discussion: {
        id: 'd1',
        title: 'Download',
        Author: { username: 'alice' },
        DiscussionChannels: [
          {
            id: 'dc1',
            channelUniqueName: 'cats',
            archived: false,
            locked: true,
            CommentsAggregate: { count: 0 },
          },
        ],
      },
      comments: [],
    });

    expect(wrapper.findComponent(InfoBanner).exists()).toBe(true);
    expect(wrapper.findComponent(DiscussionRootCommentFormWrapper).exists()).toBe(
      false
    );
  });

  it('renders the comments wrapper and root form when the discussion is open', async () => {
    const wrapper = await mountPage();

    expect(wrapper.findComponent(DiscussionCommentsWrapper).exists()).toBe(true);
    expect(wrapper.findComponent(DiscussionRootCommentFormWrapper).exists()).toBe(
      true
    );
  });

  it('loads more comments from the current offset', async () => {
    const wrapper = await mountPage({
      comments: [{ id: 'c1', ParentComment: null }, { id: 'c2', ParentComment: null }],
      commentCount: 3,
      rootCount: 3,
    });

    await wrapper.get('[data-testid="load-more"]').trigger('click');
    await nextTick();

    expect(hState.fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          offset: 2,
        },
      })
    );
  });
});
