import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { usernameVar } from '@/cache';
import { useBestAnswerMutations } from './useBestAnswerMutations';
import type { Comment } from '@/__generated__/graphql';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@/cache', () => ({
  usernameVar: { value: 'testuser' },
}));

describe('useBestAnswerMutations', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usernameVar.value = 'testuser';
    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
    });
  });

  describe('isDiscussionAuthor', () => {
    it('should return true when user is the discussion author', () => {
      const { isDiscussionAuthor } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      expect(isDiscussionAuthor.value).toBe(true);
    });

    it('should return false when user is not the discussion author', () => {
      const { isDiscussionAuthor } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('otheruser'),
        answers: ref([]),
      });

      expect(isDiscussionAuthor.value).toBe(false);
    });
  });

  describe('isMarkedAsAnswer', () => {
    it('should return true when comment is in answers array', () => {
      const answers = [
        { id: 'comment1' } as Comment,
        { id: 'comment2' } as Comment,
      ];

      const { isMarkedAsAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref(answers),
      });

      expect(isMarkedAsAnswer.value).toBe(true);
    });

    it('should return false when comment is not in answers array', () => {
      const answers = [{ id: 'comment2' } as Comment];

      const { isMarkedAsAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref(answers),
      });

      expect(isMarkedAsAnswer.value).toBe(false);
    });

    it('should return false when answers array is empty', () => {
      const { isMarkedAsAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      expect(isMarkedAsAnswer.value).toBe(false);
    });

    it('should react to changes in answers array', () => {
      const answers = ref<Comment[]>([]);

      const { isMarkedAsAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers,
      });

      // Add the comment to answers
      answers.value = [{ id: 'comment1' } as Comment];

      expect(isMarkedAsAnswer.value).toBe(true);
    });
  });

  describe('handleMarkAsBestAnswer', () => {
    it('should call mutation with correct params', async () => {
      mockMutate.mockResolvedValue({});

      const { handleMarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      await handleMarkAsBestAnswer();

      expect(mockMutate).toHaveBeenCalledWith({
        commentId: 'comment1',
        channelId: 'forum1',
        discussionId: 'discussion1',
      });
    });

    it('should call onMarked callback when marking succeeds', async () => {
      mockMutate.mockResolvedValue({});
      const onMarked = vi.fn();

      const { handleMarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([]),
        onMarked,
      });

      await handleMarkAsBestAnswer();

      expect(onMarked).toHaveBeenCalled();
    });

    it('should not call mutation when discussionId is undefined', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { handleMarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref(undefined),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      await handleMarkAsBestAnswer();

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should log warning when discussionId is undefined', async () => {
      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const { handleMarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref(undefined),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      await handleMarkAsBestAnswer();

      expect(consoleWarn).toHaveBeenCalledWith(
        'No discussion ID found for comment'
      );

      consoleWarn.mockRestore();
    });

    it('should log error when mutation fails', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutate.mockRejectedValue(new Error('Mutation failed'));

      const { handleMarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      await handleMarkAsBestAnswer();

      expect(consoleError).toHaveBeenCalledWith(
        'Error marking comment as best answer:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('handleUnmarkAsBestAnswer', () => {
    it('should call mutation with correct params', async () => {
      mockMutate.mockResolvedValue({});

      const { handleUnmarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([{ id: 'comment1' } as Comment]),
      });

      await handleUnmarkAsBestAnswer();

      expect(mockMutate).toHaveBeenCalledWith({
        commentId: 'comment1',
        channelId: 'forum1',
        discussionId: 'discussion1',
      });
    });

    it('should call onUnmarked callback when unmarking succeeds', async () => {
      mockMutate.mockResolvedValue({});
      const onUnmarked = vi.fn();

      const { handleUnmarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([{ id: 'comment1' } as Comment]),
        onUnmarked,
      });

      await handleUnmarkAsBestAnswer();

      expect(onUnmarked).toHaveBeenCalled();
    });
  });
});
