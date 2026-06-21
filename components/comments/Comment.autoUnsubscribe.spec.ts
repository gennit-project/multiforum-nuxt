import { describe, expect, it, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import Comment from './Comment.vue';

const { mockUseAutoUnsubscribe } = vi.hoisted(() => ({
  mockUseAutoUnsubscribe: vi.fn(),
}));

vi.mock('@/composables/useAutoUnsubscribe', () => ({
  useAutoUnsubscribe: mockUseAutoUnsubscribe,
}));

vi.mock('./CommentHeader.vue', () => ({
  default: {
    name: 'CommentHeader',
    template: '<div />',
  },
}));

vi.mock('./CommentButtons.vue', () => ({
  default: {
    name: 'CommentButtons',
    template: '<div />',
  },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      forumId: 'test-forum',
      discussionId: 'discussion-1',
      commentId: 'comment-123',
    },
    query: { action: 'unsubscribe' },
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));

vi.mock('@/composables/useCommentPermissions', () => ({
  useCommentPermissions: () => ({
    userPermissions: { value: {} },
  }),
}));

vi.mock('@/composables/useBestAnswerMutations', () => ({
  useBestAnswerMutations: () => ({
    isDiscussionAuthor: { value: false },
    isMarkedAsAnswer: { value: false },
    handleMarkAsBestAnswer: vi.fn(),
    handleUnmarkAsBestAnswer: vi.fn(),
  }),
}));

vi.mock('@/composables/useCommentPermalink', () => ({
  useCommentPermalink: () => ({
    canShowPermalink: { value: true },
    permalinkObject: { value: {} },
    copyLink: vi.fn(),
  }),
}));

vi.mock('@/composables/useForumRoleMembership', () => ({
  useForumRoleMembership: () => ({
    forumAdminUsernames: { value: [] },
    forumModUsernames: { value: [] },
    forumModProfileNames: { value: [] },
  }),
}));

describe('Comment auto unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wires comment subscriptions to useAutoUnsubscribe', () => {
    shallowMount(Comment, {
      props: {
        commentData: {
          id: 'comment-123',
          text: 'A comment',
          archived: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: null,
          CommentAuthor: {
            __typename: 'User',
            username: 'bob',
          },
          Channel: { uniqueName: 'test-forum' },
          DiscussionChannel: {
            discussionId: 'discussion-1',
            channelUniqueName: 'test-forum',
          },
          ChildCommentsAggregate: { count: 0 },
          FeedbackComments: [],
          SubscribedToNotifications: [{ username: 'alice' }],
        },
        depth: 1,
        originalPoster: 'bob',
        editFormOpenAtCommentID: '',
        replyFormOpenAtCommentID: '',
      },
      global: {
        stubs: {
          ClientOnly: true,
          CommentButtons: true,
          CommentHeader: true,
          MenuButton: true,
          NuxtLink: true,
          RouterLink: true,
        },
      },
    });

    const params = mockUseAutoUnsubscribe.mock.calls[0]?.[0];
    expect(params.entityType).toBe('comment');
    expect(params.entityId.value).toBe('comment-123');
    expect(params.isSubscribed.value).toBe(true);
    expect(params.unsubscribeFn).toEqual(expect.any(Function));
  });
});
