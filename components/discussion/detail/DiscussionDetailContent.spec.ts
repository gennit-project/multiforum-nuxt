import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createQueryMock,
  configureApolloMocks,
} from '@/tests/utils/mockApollo';
import type { Comment, Discussion } from '@/__generated__/graphql';

import { useQuery } from '@vue/apollo-composable';

import DiscussionDetailContent from '@/components/discussion/detail/DiscussionDetailContent.vue';

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));
vi.mock('nuxt/app', () => ({ useRoute: vi.fn(() => ({ params: {}, query: {} })) }));
vi.mock('@/cache', () => ({
  isAuthenticatedVar: { value: false },
  modProfileNameVar: { value: '' },
  usernameVar: { value: '' },
}));
vi.mock('@/composables/useForumRoleMembership', () => ({
  provideForumRoleMembership: vi.fn(),
}));

const DiscussionCommentsWrapperStub = {
  name: 'DiscussionCommentsWrapper',
  props: ['comments'],
  template: '<div class="comments-wrapper-stub" />',
};

const stubs = {
  DiscussionHeader: { template: '<div class="discussion-header-stub" />' },
  DiscussionCommentsWrapper: DiscussionCommentsWrapperStub,
  DiscussionChannelLinks: { template: '<div />' },
  PageNotFound: { template: '<div class="page-not-found-stub" />' },
  InfoBanner: { template: '<div />' },
  ErrorBanner: { template: '<div />' },
  DiscussionBodyEditForm: { template: '<div />' },
  AlbumEditForm: { template: '<div />' },
  ArchivedDiscussionInfoBanner: { template: '<div />' },
  DiscussionLayoutManager: { template: '<div class="layout-stub"><slot /></div>' },
  FeedbackModalManager: { template: '<div />' },
};

const makeDiscussion = (overrides: Record<string, unknown> = {}): Discussion =>
  ({
    id: 'd1',
    title: 'Test Discussion',
    body: 'body',
    DiscussionChannels: [
      { channelUniqueName: 'cats', __typename: 'DiscussionChannel' },
    ],
    __typename: 'Discussion',
    ...overrides,
  }) as unknown as Discussion;

const makeComment = (id: string): Comment =>
  ({ id, __typename: 'Comment' }) as unknown as Comment;

const commentSection = (comments: Comment[]) => ({
  getCommentSection: {
    DiscussionChannel: {
      id: 'dc1',
      channelUniqueName: 'cats',
      Answers: [],
      __typename: 'DiscussionChannel',
    },
    Comments: comments,
  },
});

const setup = (params: {
  discussions?: Discussion[];
  comments?: Comment[];
  hasCommentSection?: boolean;
} = {}) => {
  const { discussions = [makeDiscussion()], comments = [], hasCommentSection = true } = params;
  configureApolloMocks({
    useQuery,
    queries: {
      'getDiscussion(': createQueryMock({ discussions }),
      getCommentSection: {
        ...createQueryMock(hasCommentSection ? commentSection(comments) : { getCommentSection: null }),
        fetchMore: vi.fn(),
      } as ReturnType<typeof createQueryMock>,
    },
    // Both comment-aggregate queries read result.discussionChannels[0].
    fallbackQuery: createQueryMock({ discussionChannels: [] }),
  });
  return mountWithDefaults(DiscussionDetailContent, {
    props: { discussionId: 'd1', channelId: 'cats' },
    global: { stubs },
  });
};

describe('DiscussionDetailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(useQuery).mockReset();
  });

  it('renders the discussion header for a loaded discussion', () => {
    const wrapper = setup();
    expect(wrapper.find('.discussion-header-stub').exists()).toBe(true);
  });

  it('does not show page-not-found for a loaded discussion', () => {
    const wrapper = setup();
    expect(wrapper.find('.page-not-found-stub').exists()).toBe(false);
  });

  it('shows page-not-found when the discussion and channel are absent', () => {
    const wrapper = setup({ discussions: [], hasCommentSection: false });
    expect(wrapper.find('.page-not-found-stub').exists()).toBe(true);
  });

  it('passes the comment-section comments through in order', () => {
    const wrapper = setup({ comments: [makeComment('a'), makeComment('b')] });
    const passed = wrapper
      .findComponent(DiscussionCommentsWrapperStub)
      .props('comments') as Comment[];
    expect(passed.map((c) => c.id)).toEqual(['a', 'b']);
  });
});
