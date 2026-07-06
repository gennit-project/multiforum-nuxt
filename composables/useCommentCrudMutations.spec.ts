import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useCommentCrudMutations } from './useCommentCrudMutations';
import { CREATE_COMMENT } from '@/graphQLData/comment/mutations';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    query: { sort: 'HOT' },
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ({ value: 'testmod' }),
}));

describe('useCommentCrudMutations', () => {
  const mockMutate = vi.fn();
  let onDoneCallbacks: Map<string, () => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    onDoneCallbacks = new Map();

    (useMutation as any).mockImplementation(() => {
      const callCount = (useMutation as any).mock.calls.length;

      return {
        mutate: mockMutate,
        error: ref(null),
        loading: ref(false),
        onDone: (callback: () => void) => {
          onDoneCallbacks.set(`mutation-${callCount}`, callback);
        },
      };
    });
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

  describe('reply cache update (getCommentReplies)', () => {
    // Runs the CREATE_COMMENT `update` function for a reply and returns the
    // captured getCommentReplies field modifier plus a cache spy. This mirrors
    // the bug where a reply was written with reconstructed query variables that
    // didn't match the active getCommentReplies query, so the reply never
    // appeared until refresh.
    const runReplyUpdate = (parentId = 'parent-1', newId = 'new-1') => {
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });

      const update = (useMutation as any).mock.calls[0][1].update;
      const captured: { getCommentReplies?: any; parentCountFields?: any } = {};
      const cache = {
        modify: vi.fn((opts: any) => {
          if (opts.fields?.getCommentReplies) {
            captured.getCommentReplies = opts.fields.getCommentReplies;
          }
          if (opts.fields?.replyCount) {
            captured.parentCountFields = opts.fields;
          }
        }),
        identify: (o: any) => `${o.__typename}:${o.id}`,
      };

      update(cache, {
        data: {
          createComments: {
            comments: [
              {
                __typename: 'Comment',
                id: newId,
                ParentComment: { id: parentId },
              },
            ],
          },
        },
      });

      return { captured, cache };
    };

    const helpers = (parentId: string) => ({
      storeFieldName: `getCommentReplies({"commentId":"${parentId}","limit":5,"modName":"testmod","offset":0,"sort":"hot"})`,
      toReference: (o: any) => ({ __ref: `${o.__typename}:${o.id}` }),
      readField: (_field: string, ref: any) =>
        ref?.__ref ? ref.__ref.split(':')[1] : undefined,
    });

    const existingReplies = () => ({
      __typename: 'CommentReplies',
      ChildComments: [{ __ref: 'Comment:old-1' }],
      aggregateChildCommentCount: 1,
    });

    it('prepends the new reply to the matching parent getCommentReplies entry', () => {
      const { captured } = runReplyUpdate('parent-1', 'new-1');
      const result = captured.getCommentReplies(
        existingReplies(),
        helpers('parent-1')
      );
      expect(result.ChildComments[0]).toEqual({ __ref: 'Comment:new-1' });
    });

    it('increments aggregateChildCommentCount for the matching parent', () => {
      const { captured } = runReplyUpdate('parent-1', 'new-1');
      const result = captured.getCommentReplies(
        existingReplies(),
        helpers('parent-1')
      );
      expect(result.aggregateChildCommentCount).toBe(2);
    });

    it('leaves getCommentReplies entries for other parents unchanged', () => {
      const { captured } = runReplyUpdate('parent-1', 'new-1');
      const existing = existingReplies();
      const result = captured.getCommentReplies(existing, helpers('other-parent'));
      expect(result).toBe(existing);
    });

    it('does not duplicate a reply that is already present', () => {
      const { captured } = runReplyUpdate('parent-1', 'old-1');
      const existing = existingReplies();
      const result = captured.getCommentReplies(existing, helpers('parent-1'));
      expect(result).toBe(existing);
    });

    it('increments the parent comment replyCount so the replies section renders', () => {
      const { captured } = runReplyUpdate('parent-1', 'new-1');
      expect(captured.parentCountFields.replyCount(0)).toBe(1);
    });

    it('increments the parent comment ChildCommentsAggregate count', () => {
      const { captured } = runReplyUpdate('parent-1', 'new-1');
      expect(captured.parentCountFields.ChildCommentsAggregate({ count: 2 })).toEqual({
        __typename: 'CommentsAggregate',
        count: 3,
      });
    });
  });

  // The created comment is written into the cache for the reply/comment display
  // queries, which read these fields via the CommentFields fragment. If the
  // mutation omits any of them, Apollo writes an incomplete entry ("Missing
  // field ... while writing result") and the new reply fails to render.
  describe('CREATE_COMMENT returns the fields the cache requires', () => {
    const body = CREATE_COMMENT.loc?.source.body || '';

    it.each([
      'textLastEdited',
      'isFavoritedByUser',
      'SubscribedToNotifications',
      'SuperUpvotedByUsers',
      'isBot',
    ])('includes the %s field', (field) => {
      expect(body).toContain(field);
    });
  });

  // Root comments take the `!newCommentParentId` branch of the CREATE update:
  // they prepend to the DiscussionChannel's Comments list and bump the count.
  describe('root comment cache update (CREATE_COMMENT)', () => {
    const runRootUpdate = (onIncrementCommentCount?: (c: unknown) => void) => {
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
        onIncrementCommentCount,
      });

      const update = (useMutation as any).mock.calls[0][1].update;
      const captured: { fields?: any } = {};
      const cache = {
        modify: vi.fn((opts: any) => {
          captured.fields = opts.fields;
        }),
        identify: (o: any) => `${o.__typename}:${o.id}`,
      };
      update(cache, {
        data: {
          createComments: {
            comments: [{ __typename: 'Comment', id: 'root-1', ParentComment: null }],
          },
        },
      });
      return { captured, cache };
    };

    it('prepends the new root comment to the Comments list', () => {
      const { captured } = runRootUpdate();
      expect(
        captured.fields.Comments([{ id: 'old' }])
      ).toEqual([{ __typename: 'Comment', id: 'root-1', ParentComment: null }, { id: 'old' }]);
    });

    it('increments the CommentsAggregate count', () => {
      const { captured } = runRootUpdate();
      expect(captured.fields.CommentsAggregate({ count: 2 })).toEqual({ count: 3 });
    });

    it('defaults the CommentsAggregate count to 1 when none exists', () => {
      const { captured } = runRootUpdate();
      expect(captured.fields.CommentsAggregate(undefined)).toEqual({ count: 1 });
    });

    it('calls onIncrementCommentCount for root comments', () => {
      const onIncrementCommentCount = vi.fn();
      runRootUpdate(onIncrementCommentCount);
      expect(onIncrementCommentCount).toHaveBeenCalled();
    });

    it('logs an error when the reply cache update throws', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(''),
        parentOfCommentToDelete: ref(''),
      });
      const update = (useMutation as any).mock.calls[0][1].update;
      const cache = {
        modify: vi.fn(() => {
          throw new Error('boom');
        }),
        identify: (o: any) => `${o.__typename}:${o.id}`,
      };
      update(cache, {
        data: {
          createComments: {
            comments: [
              { __typename: 'Comment', id: 'reply-1', ParentComment: { id: 'parent-1' } },
            ],
          },
        },
      });
      expect(consoleError).toHaveBeenCalledWith('Error updating cache:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  // The DELETE update evicts the comment, then either filters the parent's
  // ChildComments (reply) or the DiscussionChannel's Comments (root).
  describe('delete cache update (DELETE_COMMENT)', () => {
    const runDeleteUpdate = (opts: {
      commentToDeleteId: string;
      parentOfCommentToDelete: string;
      onDecrementCommentCount?: (c: unknown) => void;
    }) => {
      useCommentCrudMutations({
        discussionId: computed(() => 'discussion-123'),
        commentToDeleteId: ref(opts.commentToDeleteId),
        parentOfCommentToDelete: ref(opts.parentOfCommentToDelete),
        onDecrementCommentCount: opts.onDecrementCommentCount,
      });

      const update = (useMutation as any).mock.calls[2][1].update;
      const captured: { fields?: any } = {};
      const cache = {
        evict: vi.fn(),
        gc: vi.fn(),
        modify: vi.fn((o: any) => {
          captured.fields = o.fields;
        }),
        identify: (o: any) => `${o.__typename}:${o.id}`,
      };
      update(cache);
      return { captured, cache };
    };

    it('evicts the deleted comment from the cache', () => {
      const { cache } = runDeleteUpdate({
        commentToDeleteId: 'c-1',
        parentOfCommentToDelete: '',
      });
      expect(cache.evict).toHaveBeenCalledWith({ id: 'Comment:c-1' });
    });

    it('filters the deleted reply out of the parent ChildComments', () => {
      const { captured } = runDeleteUpdate({
        commentToDeleteId: 'c-1',
        parentOfCommentToDelete: 'parent-1',
      });
      expect(
        captured.fields.ChildComments([{ id: 'c-1' }, { id: 'c-2' }])
      ).toEqual([{ id: 'c-2' }]);
    });

    it('decrements ChildCommentsAggregate but never below zero', () => {
      const { captured } = runDeleteUpdate({
        commentToDeleteId: 'c-1',
        parentOfCommentToDelete: 'parent-1',
      });
      expect(captured.fields.ChildCommentsAggregate({ count: 0 })).toEqual({ count: 0 });
    });

    it('filters the deleted root comment out of the DiscussionChannel Comments', () => {
      const { captured } = runDeleteUpdate({
        commentToDeleteId: 'c-1',
        parentOfCommentToDelete: '',
      });
      expect(
        captured.fields.Comments([{ id: 'c-1' }, { id: 'c-2' }])
      ).toEqual([{ id: 'c-2' }]);
    });

    it('decrements the root CommentsAggregate count', () => {
      const { captured } = runDeleteUpdate({
        commentToDeleteId: 'c-1',
        parentOfCommentToDelete: '',
      });
      expect(captured.fields.CommentsAggregate({ count: 3 })).toEqual({ count: 2 });
    });

    it('runs garbage collection and calls onDecrementCommentCount', () => {
      const onDecrementCommentCount = vi.fn();
      const { cache } = runDeleteUpdate({
        commentToDeleteId: 'c-1',
        parentOfCommentToDelete: '',
        onDecrementCommentCount,
      });
      expect([cache.gc.mock.calls.length, onDecrementCommentCount.mock.calls.length]).toEqual([1, 1]);
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
