import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useBestAnswerMutations } from './useBestAnswerMutations';
import type { Comment } from '@/__generated__/graphql';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

const { mockUsername } = vi.hoisted(() => ({
  mockUsername: { value: 'testuser' },
}));
const usernameVar = mockUsername;

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
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

    it('should not call mutation when discussionId is undefined', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { handleUnmarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref(undefined),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      await handleUnmarkAsBestAnswer();

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should log error when unmark mutation fails', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutate.mockRejectedValue(new Error('Mutation failed'));

      const { handleUnmarkAsBestAnswer } = useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([{ id: 'comment1' } as Comment]),
      });

      await handleUnmarkAsBestAnswer();

      expect(consoleError).toHaveBeenCalledWith(
        'Error unmarking comment as best answer:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  // The two mutations share an identical `update` callback that rewrites the
  // matching DiscussionChannel via a fragment. The mock above ignores the
  // options object, so these invoke the captured update fn directly against a
  // fake cache to exercise the writeFragment path.
  describe('cache update callback', () => {
    const updatedChannel = { id: 'dc-1', answered: true, Answers: [] };
    const mutationResult = {
      data: {
        updateDiscussionChannels: { discussionChannels: [updatedChannel] },
      },
    };

    // callIndex 0 = mark mutation, 1 = unmark mutation
    const getUpdateFn = (callIndex: number) =>
      (useMutation as any).mock.calls[callIndex][1].update as (
        cache: unknown,
        payload: unknown
      ) => void;

    const mountAndRunUpdate = (callIndex: number, payload: unknown) => {
      useBestAnswerMutations({
        commentId: ref('comment1'),
        forumId: ref('forum1'),
        discussionId: ref('discussion1'),
        originalPoster: ref('testuser'),
        answers: ref([]),
      });

      let fieldModifier: (
        existing: unknown[],
        helpers: { readField: (f: string, ref: unknown) => unknown }
      ) => unknown[] = () => [];
      const cache = {
        identify: vi.fn((ref: any) => `DiscussionChannel:${ref.__ref}`),
        writeFragment: vi.fn(),
        modify: vi.fn((opts: any) => {
          fieldModifier = opts.fields.discussionChannels;
        }),
      };
      getUpdateFn(callIndex)(cache, payload);
      return { cache, getFieldModifier: () => fieldModifier };
    };

    it.each([
      ['mark', 0],
      ['unmark', 1],
    ])('writes the updated channel fragment for the %s mutation', (_label, idx) => {
      const { cache, getFieldModifier } = mountAndRunUpdate(idx as number, mutationResult);
      const readField = () => 'dc-1'; // channelId matches updatedChannel.id
      getFieldModifier()([{ __ref: 'dc-1' }], { readField });

      expect(cache.writeFragment).toHaveBeenCalledWith(
        expect.objectContaining({ data: updatedChannel })
      );
    });

    it('leaves non-matching channels untouched', () => {
      const { cache, getFieldModifier } = mountAndRunUpdate(0, mutationResult);
      const readField = () => 'other-channel';
      const refs = [{ __ref: 'other-channel' }];
      const result = getFieldModifier()(refs, { readField });

      expect([result, cache.writeFragment.mock.calls.length]).toEqual([refs, 0]);
    });

    it('does nothing when the mutation returns no discussion channel', () => {
      const { cache } = mountAndRunUpdate(0, { data: {} });

      expect(cache.modify).not.toHaveBeenCalled();
    });
  });
});
