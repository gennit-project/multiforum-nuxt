import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useCommentPermalink } from './useCommentPermalink';
import type { Comment } from '@/__generated__/graphql';

// Track the mock route params for dynamic testing
const mockRouteParams = {
  discussionId: undefined as string | undefined,
  eventId: undefined as string | undefined,
  issueNumber: undefined as string | undefined,
  forumId: 'route-forum',
};

// Mock nuxt/app
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => ({
    params: mockRouteParams,
    name: 'forums-forumId-discussions-discussionId',
  })),
  useRouter: vi.fn(() => ({
    resolve: vi.fn((route) => ({
      href: `/forums/${route.params?.forumId}/discussions/${route.params?.discussionId}/comments/${route.params?.commentId}`,
    })),
  })),
}));

// Mock routerUtils
vi.mock('@/utils/routerUtils', () => ({
  getFeedbackPermalinkObject: vi.fn((input) => {
    if (input.GivesFeedbackOnDiscussion) {
      return {
        name: 'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId',
        params: {
          forumId: input.forumId,
          discussionId: input.GivesFeedbackOnDiscussion.id,
          feedbackId: input.commentId,
        },
      };
    }
    return null;
  }),
}));

describe('useCommentPermalink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset route params
    mockRouteParams.discussionId = undefined;
    mockRouteParams.eventId = undefined;
    mockRouteParams.issueNumber = undefined;
  });

  const createCommentData = (overrides = {}): Comment =>
    ({
      id: 'comment1',
      isRootComment: true,
      createdAt: '2024-01-01T00:00:00Z',
      DiscussionChannel: {
        id: 'dc1',
        discussionId: 'discussion1',
        channelUniqueName: 'test-forum',
      },
      ...overrides,
    }) as Comment;

  describe('canShowPermalink', () => {
    it('should return true when comment has DiscussionChannel', () => {
      const commentData = ref(createCommentData());
      const forumId = ref('test-forum');

      const { canShowPermalink } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(canShowPermalink.value).toBe(true);
    });

    it('should return false when comment has no context', () => {
      const commentData = ref(
        createCommentData({
          DiscussionChannel: undefined,
          Event: undefined,
          Issue: undefined,
          Channel: undefined,
        })
      );
      const forumId = ref('');

      const { canShowPermalink } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(canShowPermalink.value).toBe(false);
    });
  });

  describe('isFeedbackComment', () => {
    it('should return true for feedback on discussion', () => {
      const feedbackComment = ref(
        createCommentData({
          GivesFeedbackOnDiscussion: { id: 'discussion1' },
        })
      );
      const forumId = ref('test-forum');

      const { isFeedbackComment } = useCommentPermalink({
        commentData: feedbackComment,
        forumId,
      });

      expect(isFeedbackComment.value).toBe(true);
    });

    it('should return false for normal comments', () => {
      const normalComment = ref(createCommentData());
      const forumId = ref('test-forum');

      const { isFeedbackComment } = useCommentPermalink({
        commentData: normalComment,
        forumId,
      });

      expect(isFeedbackComment.value).toBe(false);
    });
  });

  describe('permalinkObject', () => {
    it('should use discussionId from comment DiscussionChannel', () => {
      const commentData = ref(createCommentData());
      const forumId = ref('test-forum');

      const { permalinkObject } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(permalinkObject.value).toEqual({
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          discussionId: 'discussion1',
          commentId: 'comment1',
          forumId: 'test-forum',
        },
      });
    });

    it('should fallback to route discussionId when comment has none', () => {
      mockRouteParams.discussionId = 'route-discussion-id';

      const commentData = ref(
        createCommentData({
          DiscussionChannel: {
            id: 'dc1',
            discussionId: undefined,
            channelUniqueName: 'test-forum',
          },
        })
      );
      const forumId = ref('test-forum');

      const { permalinkObject } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(permalinkObject.value).toEqual({
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          discussionId: 'route-discussion-id',
          commentId: 'comment1',
          forumId: 'test-forum',
        },
      });
    });

    it('should compute event comment permalink', () => {
      const commentData = ref(
        createCommentData({
          DiscussionChannel: undefined,
          Event: { id: 'event1' },
        })
      );
      const forumId = ref('test-forum');

      const { permalinkObject } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(permalinkObject.value).toEqual({
        name: 'forums-forumId-events-eventId-comments-commentId',
        params: {
          eventId: 'event1',
          forumId: 'test-forum',
          commentId: 'comment1',
        },
      });
    });

    it('should compute issue comment permalink', () => {
      const commentData = ref(
        createCommentData({
          DiscussionChannel: undefined,
          Channel: { uniqueName: 'test-forum' },
          Issue: { issueNumber: 42 },
        })
      );
      const forumId = ref('test-forum');

      const { permalinkObject } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(permalinkObject.value).toEqual({
        name: 'forums-forumId-issues-issueNumber-comments-commentId',
        params: {
          issueNumber: 42,
          forumId: 'test-forum',
          commentId: 'comment1',
        },
      });
    });

    it('should return empty object when forumId is missing', () => {
      const commentData = ref(
        createCommentData({
          DiscussionChannel: {
            id: 'dc1',
            discussionId: 'discussion1',
            channelUniqueName: undefined,
          },
          Channel: undefined,
        })
      );
      const forumId = ref('');

      const { permalinkObject } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(permalinkObject.value).toEqual({});
    });

    it('should use Channel.uniqueName from comment data', () => {
      const commentData = ref(
        createCommentData({
          Channel: { uniqueName: 'channel-from-comment' },
          DiscussionChannel: {
            id: 'dc1',
            discussionId: 'discussion1',
            channelUniqueName: undefined,
          },
        })
      );
      const forumId = ref('fallback-forum');

      const { permalinkObject } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(permalinkObject.value).toEqual({
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          discussionId: 'discussion1',
          commentId: 'comment1',
          forumId: 'channel-from-comment',
        },
      });
    });

    it('should prefer Channel.uniqueName over DiscussionChannel.channelUniqueName', () => {
      const commentData = ref(
        createCommentData({
          Channel: { uniqueName: 'channel-unique' },
          DiscussionChannel: {
            id: 'dc1',
            discussionId: 'discussion1',
            channelUniqueName: 'discussion-channel-unique',
          },
        })
      );
      const forumId = ref('fallback-forum');

      const { permalinkObject } = useCommentPermalink({
        commentData,
        forumId,
      });

      expect(permalinkObject.value).toEqual({
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          discussionId: 'discussion1',
          commentId: 'comment1',
          forumId: 'channel-unique',
        },
      });
    });
  });

  describe('copyLink', () => {
    it('should call clipboard writeText', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const commentData = ref(createCommentData());
      const forumId = ref('test-forum');

      const { copyLink } = useCommentPermalink({
        commentData,
        forumId,
      });

      await copyLink();

      expect(writeTextMock).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('should call onCopied callback with true on success', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const commentData = ref(createCommentData());
      const forumId = ref('test-forum');

      const { copyLink } = useCommentPermalink({
        commentData,
        forumId,
      });

      const onCopied = vi.fn();
      await copyLink(onCopied);

      expect(onCopied).toHaveBeenCalledWith(true);

      vi.unstubAllGlobals();
    });

    it('should warn when no permalink is available', async () => {
      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const commentData = ref(
        createCommentData({
          DiscussionChannel: undefined,
          Channel: undefined,
        })
      );
      const forumId = ref('');

      const { copyLink } = useCommentPermalink({
        commentData,
        forumId,
      });

      await copyLink();

      expect(consoleWarn).toHaveBeenCalledWith('No permalink available to copy');

      consoleWarn.mockRestore();
    });
  });
});
