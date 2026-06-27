import type { Ref } from 'vue';
import type { Reference } from '@apollo/client/core';
import { useMutation } from '@vue/apollo-composable';
import type { Comment as CommentType } from '@/__generated__/graphql';
import {
  CREATE_COMMENT,
  UPDATE_COMMENT,
  DELETE_COMMENT,
  SOFT_DELETE_COMMENT,
} from '@/graphQLData/comment/mutations';

type UseCommentCrudMutationsParams = {
  discussionId: Ref<string | undefined>;
  commentToDeleteId: Ref<string>;
  parentOfCommentToDelete: Ref<string>;
  onCommentDeleted?: () => void;
  onIncrementCommentCount?: (cache: unknown) => void;
  onDecrementCommentCount?: (cache: unknown) => void;
};

/**
 * Composable that handles all comment CRUD mutations with cache updates.
 * Provides create, update, delete, and soft delete mutations for comments.
 *
 * @param params - Object containing:
 *   - discussionId: The discussion channel ID for cache updates
 *   - commentToDeleteId: Ref to the ID of comment being deleted
 *   - parentOfCommentToDelete: Ref to the parent comment ID (for replies)
 *   - onCommentDeleted: Optional callback after comment deletion
 *   - onIncrementCommentCount: Optional callback to emit comment count increment
 *   - onDecrementCommentCount: Optional callback to emit comment count decrement
 * @returns Object with mutation functions, loading states, and errors
 */
export function useCommentCrudMutations(params: UseCommentCrudMutationsParams) {
  const {
    discussionId,
    commentToDeleteId,
    parentOfCommentToDelete,
    onCommentDeleted,
    onIncrementCommentCount,
    onDecrementCommentCount,
  } = params;

  // CREATE COMMENT mutation
  const {
    mutate: createComment,
    error: createCommentError,
    onDone: onDoneCreatingComment,
    onError: onErrorCreatingComment,
  } = useMutation(CREATE_COMMENT, {
    errorPolicy: 'none',
    update: (cache, result) => {
      const newComment: CommentType = result.data?.createComments?.comments?.[0];
      const newCommentParentId = newComment?.ParentComment?.id;

      // Handle root comments
      if (!newCommentParentId) {
        cache.modify({
          id: cache.identify({
            __typename: 'DiscussionChannel',
            id: discussionId.value,
          }),
          fields: {
            Comments(existingComments = []) {
              return [newComment, ...existingComments];
            },
            CommentsAggregate(existing = { count: 0 }) {
              return {
                ...existing,
                count: (existing?.count || 0) + 1,
              };
            },
          },
        });
        onIncrementCommentCount?.(cache);
        return;
      }

      // Handle replies. The replies list is served by the getCommentReplies
      // query field, which is paginated, sorted, and mod-scoped. Reconstructing
      // the exact variables of the active query to writeQuery into is brittle:
      // any mismatch (sort/limit/offset/modName) silently writes to a different
      // cache entry, so the count increments (a "Load more" appears) but the new
      // reply never shows up in the visible list. Instead, modify every cached
      // getCommentReplies entry for this parent comment so the reply appears
      // regardless of the current sort/pagination/mod profile. The created
      // comment is already normalized in the cache from the mutation result, so
      // we reference it by id.
      try {
        const newCommentId = newComment.id;

        cache.modify({
          fields: {
            getCommentReplies(
              existing,
              { storeFieldName, toReference, readField }
            ) {
              if (!existing) return existing;
              // storeFieldName looks like getCommentReplies({"commentId":"...",...})
              if (
                !storeFieldName.includes(`"commentId":"${newCommentParentId}"`)
              ) {
                return existing;
              }
              const existingChildComments = existing.ChildComments || [];
              const alreadyPresent = existingChildComments.some(
                (ref: Reference) => readField('id', ref) === newCommentId
              );
              if (alreadyPresent) return existing;
              return {
                ...existing,
                ChildComments: [
                  toReference({ __typename: 'Comment', id: newCommentId }),
                  ...existingChildComments,
                ],
                aggregateChildCommentCount:
                  (existing.aggregateChildCommentCount || 0) + 1,
              };
            },
          },
        });

        // Update the parent comment's counts so the replies section renders
        // (replyCount > 0) and the "load more" math stays correct.
        cache.modify({
          id: cache.identify({
            __typename: 'Comment',
            id: newCommentParentId,
          }),
          fields: {
            ChildCommentsAggregate(existing = { count: 0 }) {
              return {
                __typename: 'CommentsAggregate',
                count: (existing.count || 0) + 1,
              };
            },
            replyCount(existing = 0) {
              return (existing || 0) + 1;
            },
          },
        });

        onIncrementCommentCount?.(cache);
      } catch (error) {
        console.error('Error updating cache:', error);
      }
    },
  });

  // UPDATE COMMENT mutation
  const {
    mutate: editComment,
    error: editCommentError,
    onDone: onDoneUpdatingComment,
  } = useMutation(UPDATE_COMMENT);

  // DELETE COMMENT mutation
  const {
    mutate: deleteComment,
    onDone: onDoneDeletingComment,
    loading: deleteCommentLoading,
  } = useMutation(DELETE_COMMENT, {
    update: (cache) => {
      // First evict the comment itself
      cache.evict({
        id: cache.identify({
          __typename: 'Comment',
          id: commentToDeleteId.value,
        }),
      });

      if (parentOfCommentToDelete.value) {
        // For replies, update the parent's child comments and count
        cache.modify({
          id: cache.identify({
            __typename: 'Comment',
            id: parentOfCommentToDelete.value,
          }),
          fields: {
            ChildComments(existing = []) {
              return existing.filter(
                (reply: CommentType) => reply.id !== commentToDeleteId.value
              );
            },
            ChildCommentsAggregate(existing = { count: 0 }) {
              return {
                ...existing,
                count: Math.max(0, (existing.count || 0) - 1),
              };
            },
          },
        });
      } else {
        // For root comments, update the DiscussionChannel's comments
        cache.modify({
          id: cache.identify({
            __typename: 'DiscussionChannel',
            id: discussionId.value,
          }),
          fields: {
            Comments(existing = []) {
              return existing.filter(
                (comment: CommentType) => comment.id !== commentToDeleteId.value
              );
            },
            CommentsAggregate(existing = { count: 0 }) {
              return {
                ...existing,
                count: Math.max(0, (existing.count || 0) - 1),
              };
            },
          },
        });
      }

      // Clean up any dangling references
      cache.gc();

      onDecrementCommentCount?.(cache);
    },
  });

  onDoneDeletingComment(() => {
    onCommentDeleted?.();
  });

  // SOFT DELETE COMMENT mutation
  const { mutate: softDeleteComment, onDone: onDoneSoftDeletingComment } =
    useMutation(SOFT_DELETE_COMMENT);

  onDoneSoftDeletingComment(() => {
    onCommentDeleted?.();
  });

  return {
    // Create
    createComment,
    createCommentError,
    onDoneCreatingComment,
    onErrorCreatingComment,

    // Update
    editComment,
    editCommentError,
    onDoneUpdatingComment,

    // Delete
    deleteComment,
    deleteCommentLoading,
    softDeleteComment,
  };
}
