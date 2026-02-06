import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useCommentCrudMutations } from './useCommentCrudMutations';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    query: { sort: 'HOT' },
  }),
}));

vi.mock('@/cache', () => ({
  modProfileNameVar: { value: 'testmod' },
}));

describe('useCommentCrudMutations', () => {
  const mockMutate = vi.fn();
  let onDoneCallbacks: Map<string, () => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    onDoneCallbacks = new Map();

    (useMutation as any).mockImplementation(() => ({
      mutate: mockMutate,
      error: ref(null),
      loading: ref(false),
      onDone: (callback: () => void) => {
        // Store callback for the most recent mutation type
        const callCount = (useMutation as any).mock.calls.length;
        onDoneCallbacks.set(`mutation-${callCount}`, callback);
      },
    }));
  });

  describe('initialization', () => {
    it('should return createComment mutation function', () => {
      const { createComment } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(createComment).toBe(mockMutate);
    });

    it('should return editComment mutation function', () => {
      const { editComment } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(editComment).toBe(mockMutate);
    });

    it('should return deleteComment mutation function', () => {
      const { deleteComment } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(deleteComment).toBe(mockMutate);
    });

    it('should return softDeleteComment mutation function', () => {
      const { softDeleteComment } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(softDeleteComment).toBe(mockMutate);
    });
  });

  describe('error refs', () => {
    it('should return createCommentError ref', () => {
      const { createCommentError } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(createCommentError.value).toBe(null);
    });

    it('should return editCommentError ref', () => {
      const { editCommentError } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(editCommentError.value).toBe(null);
    });
  });

  describe('loading refs', () => {
    it('should return deleteCommentLoading ref', () => {
      const { deleteCommentLoading } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(deleteCommentLoading.value).toBe(false);
    });
  });

  describe('onDoneUpdatingComment callback', () => {
    it('should return onDoneUpdatingComment function', () => {
      const { onDoneUpdatingComment } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      expect(typeof onDoneUpdatingComment).toBe('function');
    });
  });

  describe('callbacks', () => {
    it('should call onDoneCreatingComment callback when comment is created', () => {
      const onCommentCreated = vi.fn();

      const { onDoneCreatingComment } = useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      onDoneCreatingComment(onCommentCreated);

      // Trigger the first onDone callback (CREATE_COMMENT)
      const createCallback = onDoneCallbacks.get('mutation-1');
      if (createCallback) {
        createCallback();
      }

      expect(onCommentCreated).toHaveBeenCalled();
    });

    it('should call onCommentDeleted when comment is deleted', () => {
      const onCommentDeleted = vi.fn();

      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
        onCommentDeleted,
      });

      // Trigger the third onDone callback (DELETE_COMMENT)
      const deleteCallback = onDoneCallbacks.get('mutation-3');
      if (deleteCallback) {
        deleteCallback();
      }

      expect(onCommentDeleted).toHaveBeenCalled();
    });

    it('should call onCommentDeleted when comment is soft deleted', () => {
      const onCommentDeleted = vi.fn();

      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
        onCommentDeleted,
      });

      // Trigger the fourth onDone callback (SOFT_DELETE_COMMENT)
      const softDeleteCallback = onDoneCallbacks.get('mutation-4');
      if (softDeleteCallback) {
        softDeleteCallback();
      }

      expect(onCommentDeleted).toHaveBeenCalled();
    });
  });

  describe('useMutation calls', () => {
    it('should call useMutation four times for all mutations', () => {
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      // CREATE, UPDATE, DELETE, SOFT_DELETE
      expect(useMutation).toHaveBeenCalledTimes(4);
    });

    it('should configure CREATE_COMMENT with errorPolicy none', () => {
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      const createMutationCall = (useMutation as any).mock.calls[0];
      expect(createMutationCall[1]).toHaveProperty('errorPolicy', 'none');
    });

    it('should configure CREATE_COMMENT with update function', () => {
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      const createMutationCall = (useMutation as any).mock.calls[0];
      expect(createMutationCall[1]).toHaveProperty('update');
    });

    it('should configure DELETE_COMMENT with update function', () => {
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      const deleteMutationCall = (useMutation as any).mock.calls[2];
      expect(deleteMutationCall[1]).toHaveProperty('update');
    });
  });

  describe('no callbacks provided', () => {
    it('should not throw when callbacks are not provided', () => {
      expect(() => {
        useCommentCrudMutations({
          discussionId: computed(() => 'discussion-123'),
          commentToDeleteId: ref(''),
          parentOfCommentToDelete: ref(''),
        });

        // Trigger all callbacks
        onDoneCallbacks.forEach((callback) => callback());
      }).not.toThrow();
    });
  });
});
