import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useCommentFeedbackMutation } from './useCommentFeedbackMutation';
import type { Comment } from '@/__generated__/graphql';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

describe('useCommentFeedbackMutation', () => {
  const mockMutate = vi.fn();
  let mockOnDone: ((callback: () => void) => void) | undefined;
  let onDoneCallback: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    onDoneCallback = undefined;

    mockOnDone = (callback: () => void) => {
      onDoneCallback = callback;
    };

    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
      loading: ref(false),
      error: ref(null),
      onDone: mockOnDone,
    });
  });

  describe('initialization', () => {
    it('should return mutation function', () => {
      const { addFeedbackCommentToComment } = useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
      });

      expect(addFeedbackCommentToComment).toBe(mockMutate);
    });

    it('should return loading ref', () => {
      const { addFeedbackLoading } = useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
      });

      expect(addFeedbackLoading.value).toBe(false);
    });

    it('should return error ref', () => {
      const { addFeedbackError } = useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
      });

      expect(addFeedbackError.value).toBe(null);
    });
  });

  describe('onFeedbackAdded callback', () => {
    it('should call onFeedbackAdded when mutation completes', () => {
      const onFeedbackAdded = vi.fn();

      useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
        onFeedbackAdded,
      });

      // Simulate mutation completion
      if (onDoneCallback) {
        onDoneCallback();
      }

      expect(onFeedbackAdded).toHaveBeenCalled();
    });

    it('should not throw if onFeedbackAdded is not provided', () => {
      useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
      });

      // Should not throw when callback is triggered
      expect(() => {
        if (onDoneCallback) {
          onDoneCallback();
        }
      }).not.toThrow();
    });
  });

  describe('useMutation configuration', () => {
    it('should call useMutation with ADD_FEEDBACK_COMMENT_TO_COMMENT', () => {
      useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
      });

      expect(useMutation).toHaveBeenCalled();
    });

    it('should configure cache update function', () => {
      useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref('parent-123'),
        commentToGiveFeedbackOn: ref({ id: 'comment-123' } as Comment),
      });

      // Verify useMutation was called with an options object containing update
      const callArgs = (useMutation as any).mock.calls[0];
      expect(callArgs[1]).toHaveProperty('update');
    });
  });

  describe('loading state', () => {
    it('should reflect loading state from mutation', () => {
      (useMutation as any).mockReturnValue({
        mutate: mockMutate,
        loading: ref(true),
        error: ref(null),
        onDone: mockOnDone,
      });

      const { addFeedbackLoading } = useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
      });

      expect(addFeedbackLoading.value).toBe(true);
    });
  });

  describe('error state', () => {
    it('should reflect error state from mutation', () => {
      const mockError = new Error('Test error');
      (useMutation as any).mockReturnValue({
        mutate: mockMutate,
        loading: ref(false),
        error: ref(mockError),
        onDone: mockOnDone,
      });

      const { addFeedbackError } = useCommentFeedbackMutation({
        parentIdOfCommentToGiveFeedbackOn: ref(''),
        commentToGiveFeedbackOn: ref(null),
      });

      expect(addFeedbackError.value).toBe(mockError);
    });
  });
});
