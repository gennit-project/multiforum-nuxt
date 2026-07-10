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
vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => ({ value: false }),
  useModProfileName: () => ({ value: '' }),
  useUsername: () => ({ value: '' }),
}));
vi.mock('@/composables/useForumRoleMembership', () => ({
  provideForumRoleMembership: vi.fn(),
}));

const DiscussionCommentsWrapperStub = {
  name: 'DiscussionCommentsWrapper',
  props: ['comments', 'locked', 'reachedEndOfResults'],
  emits: ['load-more'],
  template: '<div class="comments-wrapper-stub" />',
};

// Spies exposed via the FeedbackModalManager stub's template ref, so the
// parent's delegating handlers can be asserted.
const feedbackManagerSpies = {
  handleClickGiveFeedback: vi.fn(),
  handleClickUndoFeedback: vi.fn(),
  handleClickEditFeedback: vi.fn(),
};

const stubs = {
  DiscussionHeader: {
    name: 'DiscussionHeader',
    props: ['relatedIssueLink'],
    emits: [
      'handle-click-edit-body',
      'handle-click-add-album',
      'cancel-edit-discussion-body',
      'handle-click-give-feedback',
    ],
    template: '<div class="discussion-header-stub" />',
  },
  DiscussionCommentsWrapper: DiscussionCommentsWrapperStub,
  DiscussionChannelLinks: { template: '<div />' },
  PageNotFound: { template: '<div class="page-not-found-stub" />' },
  InfoBanner: { props: ['text'], template: '<div class="info-banner-stub">{{ text }}</div>' },
  ErrorBanner: { props: ['text'], template: '<div class="error-banner-stub">{{ text }}</div>' },
  DiscussionBodyEditForm: {
    name: 'DiscussionBodyEditForm',
    emits: ['close-editor'],
    template: '<div class="body-edit-stub" />',
  },
  AlbumEditForm: {
    name: 'AlbumEditForm',
    emits: ['close-editor'],
    template: '<div class="album-edit-stub" />',
  },
  ArchivedDiscussionInfoBanner: { template: '<div class="archived-banner-stub" />' },
  DiscussionLayoutManager: {
    name: 'DiscussionLayoutManager',
    emits: [
      'discussion-refetch',
      'discussion-channel-refetch',
      'handle-click-add-album',
      'edit-album',
      'handle-click-edit-feedback',
      'handle-click-give-feedback',
      'handle-click-undo-feedback',
    ],
    template: '<div class="layout-stub"><slot /></div>',
  },
  FeedbackModalManager: {
    name: 'FeedbackModalManager',
    emits: ['feedback-submitted'],
    template: '<div class="feedback-modal-manager-stub" />',
    methods: feedbackManagerSpies,
  },
};

const makeDiscussion = (overrides: Record<string, unknown> = {}): Discussion =>
  ({
    id: 'd1',
    title: 'Test Discussion',
    body: 'body',
    DiscussionChannels: [
      {
        id: 'dc1',
        channelUniqueName: 'cats',
        archived: false,
        locked: false,
        Answers: [],
        Channel: { feedbackEnabled: true, emojiEnabled: true },
        __typename: 'DiscussionChannel',
      },
    ],
    Author: { username: 'author' },
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
      archived: false,
      locked: false,
      CommentsAggregate: { count: comments.length },
      Channel: { feedbackEnabled: true, emojiEnabled: true },
      __typename: 'DiscussionChannel',
    },
    Comments: comments,
  },
});

const setup = (params: {
  discussions?: Discussion[];
  comments?: Comment[];
  hasCommentSection?: boolean;
  discussionChannelOverrides?: Record<string, unknown>;
  issueResult?: Record<string, unknown>;
  commentIssueResult?: Record<string, unknown>;
} = {}) => {
  const {
    discussions = [makeDiscussion()],
    comments = [],
    hasCommentSection = true,
    discussionChannelOverrides = {},
    issueResult = { issues: [] },
    commentIssueResult = { discussionChannels: [] },
  } = params;
  const section = commentSection(comments);
  Object.assign(
    section.getCommentSection.DiscussionChannel,
    discussionChannelOverrides
  );
  // Fire the onResult callbacks the component registers so the
  // lastValidDiscussion / lastValidCommentSection caching paths are exercised.
  const discussionQuery = createQueryMock(
    { discussions },
    { onResult: (cb: (r: unknown) => void) => cb({ data: { discussions } }) }
  );
  const csData = hasCommentSection ? section : { getCommentSection: null };
  const commentSectionQuery = {
    ...createQueryMock(csData, {
      onResult: (cb: (r: unknown) => void) => cb({ data: csData }),
    }),
    fetchMore: vi.fn(),
  } as ReturnType<typeof createQueryMock> & { fetchMore: ReturnType<typeof vi.fn> };
  const commentAggregateQuery = createQueryMock({
    discussionChannels: [{ CommentsAggregate: { count: comments.length } }],
  });
  const rootAggregateQuery = createQueryMock({
    discussionChannels: [{ CommentsAggregate: { count: comments.length } }],
  });
  const issueQuery = createQueryMock(issueResult);
  const commentIssueQuery = createQueryMock(commentIssueResult);
  configureApolloMocks({
    useQuery,
    queries: {
      'getDiscussion(': discussionQuery,
      getCommentSection: commentSectionQuery,
      GetDiscussionChannelCommentAggregate: commentAggregateQuery,
      GetDiscussionChannelRootCommentAggregate: rootAggregateQuery,
      'query getIssue': issueQuery,
      getDiscussionCommentIssue: commentIssueQuery,
    },
    fallbackQuery: createQueryMock({ discussionChannels: [] }),
  });
  const wrapper = mountWithDefaults(DiscussionDetailContent, {
    props: { discussionId: 'd1', channelId: 'cats' },
    global: { stubs },
  });
  return {
    wrapper,
    discussionQuery,
    commentSectionQuery,
    commentAggregateQuery,
    rootAggregateQuery,
    issueQuery,
    commentIssueQuery,
  };
};

describe('DiscussionDetailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(useQuery).mockReset();
  });

  it('renders the discussion header for a loaded discussion', () => {
    const { wrapper } = setup();
    expect(wrapper.find('.discussion-header-stub').exists()).toBe(true);
  });

  it('does not show page-not-found for a loaded discussion', () => {
    const { wrapper } = setup();
    expect(wrapper.find('.page-not-found-stub').exists()).toBe(false);
  });

  it('shows page-not-found when the discussion and channel are absent', () => {
    const { wrapper } = setup({ discussions: [], hasCommentSection: false });
    expect(wrapper.find('.page-not-found-stub').exists()).toBe(true);
  });

  it('passes the comment-section comments through in order', () => {
    const { wrapper } = setup({ comments: [makeComment('a'), makeComment('b')] });
    const passed = wrapper
      .findComponent(DiscussionCommentsWrapperStub)
      .props('comments') as Comment[];
    expect(passed.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('enters and exits discussion body edit mode from child events', async () => {
    const { wrapper } = setup();

    await wrapper.findComponent({ name: 'DiscussionHeader' }).vm.$emit('handle-click-edit-body');
    expect(wrapper.find('.body-edit-stub').exists()).toBe(true);

    await wrapper.findComponent({ name: 'DiscussionBodyEditForm' }).vm.$emit('close-editor');
    expect(wrapper.find('.body-edit-stub').exists()).toBe(false);
  });

  it('enters and exits album edit mode when image uploads are enabled', async () => {
    const { wrapper } = setup();

    await wrapper.findComponent({ name: 'DiscussionHeader' }).vm.$emit('handle-click-add-album');
    expect(wrapper.find('.album-edit-stub').exists()).toBe(true);

    await wrapper.findComponent({ name: 'AlbumEditForm' }).vm.$emit('close-editor');
    expect(wrapper.find('.album-edit-stub').exists()).toBe(false);
  });

  it('does not enter album edit mode when image uploads are disabled', async () => {
    const { wrapper } = setup({
      discussionChannelOverrides: {
        Channel: { imageUploadsEnabled: false },
      },
    });

    await wrapper.findComponent({ name: 'DiscussionHeader' }).vm.$emit('handle-click-add-album');

    expect(wrapper.find('.album-edit-stub').exists()).toBe(false);
  });

  it('shows the archived banner before the locked banner', () => {
    const { wrapper } = setup({
      discussions: [
        makeDiscussion({
          DiscussionChannels: [
            {
              id: 'dc1',
              channelUniqueName: 'cats',
              archived: true,
              locked: true,
              Answers: [],
              Channel: {},
            },
          ],
        } as unknown as Record<string, unknown>),
      ],
    });

    expect({
      archived: wrapper.find('.archived-banner-stub').exists(),
      lockedText: wrapper.text(),
    }).toEqual({
      archived: true,
      lockedText: expect.not.stringContaining('This discussion is locked'),
    });
  });

  it('loads more comments from the current comment count', async () => {
    const { wrapper, commentSectionQuery } = setup({
      comments: [makeComment('a'), makeComment('b')],
    });

    await wrapper.findComponent(DiscussionCommentsWrapperStub).vm.$emit('load-more');

    expect(commentSectionQuery.fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { offset: 2 },
      })
    );
  });

  it('passes a related issue link from a direct discussion issue', () => {
    const { wrapper } = setup({
      issueResult: { issues: [{ issueNumber: 42 }] },
    });

    const header = wrapper.findComponent({ name: 'DiscussionHeader' });

    expect(header.props('relatedIssueLink')).toEqual({
      name: 'forums-forumId-issues-issueNumber',
      params: { forumId: 'cats', issueNumber: 42 },
    });
  });

  it('refetches discussion data from layout and feedback events', async () => {
    const { wrapper, discussionQuery, commentSectionQuery } = setup();
    const layout = wrapper.findComponent({ name: 'DiscussionLayoutManager' });

    await layout.vm.$emit('discussion-refetch');
    await layout.vm.$emit('discussion-channel-refetch');
    await wrapper.findComponent({ name: 'FeedbackModalManager' }).vm.$emit('feedback-submitted');

    expect({
      discussionRefetches: discussionQuery.refetch.mock.calls.length,
      channelRefetches: commentSectionQuery.refetch.mock.calls.length,
    }).toEqual({
      discussionRefetches: 2,
      channelRefetches: 1,
    });
  });

  describe('feedback delegation to the modal manager', () => {
    it.each([
      ['handle-click-give-feedback', 'handleClickGiveFeedback'],
      ['handle-click-undo-feedback', 'handleClickUndoFeedback'],
      ['handle-click-edit-feedback', 'handleClickEditFeedback'],
    ] as const)('forwards %s to the feedback modal manager', async (event, method) => {
      const { wrapper } = setup();
      await wrapper
        .findComponent({ name: 'DiscussionLayoutManager' })
        .vm.$emit(event);

      expect(feedbackManagerSpies[method]).toHaveBeenCalled();
    });
  });

  it('enters album edit mode from the layout edit-album event', async () => {
    const { wrapper } = setup();
    await wrapper.findComponent({ name: 'DiscussionLayoutManager' }).vm.$emit('edit-album');

    expect(wrapper.find('.album-edit-stub').exists()).toBe(true);
  });

  it('does not enter album edit mode from edit-album when uploads are disabled', async () => {
    const { wrapper } = setup({
      discussionChannelOverrides: { Channel: { imageUploadsEnabled: false } },
    });
    await wrapper.findComponent({ name: 'DiscussionLayoutManager' }).vm.$emit('edit-album');

    expect(wrapper.find('.album-edit-stub').exists()).toBe(false);
  });

  it('merges the fetched page of comments in loadMore updateQuery', async () => {
    const { wrapper, commentSectionQuery } = setup({
      comments: [makeComment('a')],
    });
    await wrapper.findComponent(DiscussionCommentsWrapperStub).vm.$emit('load-more');

    const { updateQuery } = commentSectionQuery.fetchMore.mock.calls[0]![0];
    const merged = updateQuery(
      { getCommentSection: { Comments: [makeComment('a')] } },
      { fetchMoreResult: { getCommentSection: { Comments: [makeComment('b')] } } }
    );

    expect(merged.getCommentSection.Comments.map((c: Comment) => c.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('returns the previous result when loadMore has no more comments', async () => {
    const { wrapper, commentSectionQuery } = setup({ comments: [makeComment('a')] });
    await wrapper.findComponent(DiscussionCommentsWrapperStub).vm.$emit('load-more');

    const { updateQuery } = commentSectionQuery.fetchMore.mock.calls[0]![0];
    const previous = { getCommentSection: { Comments: [makeComment('a')] } };

    expect(updateQuery(previous, { fetchMoreResult: null })).toBe(previous);
  });

  it('falls back to a related issue linked from a comment', () => {
    const { wrapper } = setup({
      issueResult: { issues: [] },
      commentIssueResult: {
        discussionChannels: [
          { Comments: [{ RelatedIssues: [{ issueNumber: 7 }] }] },
        ],
      },
    });

    expect(
      wrapper.findComponent({ name: 'DiscussionHeader' }).props('relatedIssueLink')
    ).toEqual({
      name: 'forums-forumId-issues-issueNumber',
      params: { forumId: 'cats', issueNumber: 7 },
    });
  });

  it('passes a null related issue link when there is no issue', () => {
    const { wrapper } = setup();

    expect(
      wrapper.findComponent({ name: 'DiscussionHeader' }).props('relatedIssueLink')
    ).toBeNull();
  });
});
