import type { Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import type { Comment as CommentType } from '@/__generated__/graphql';
import {
  CREATE_COMMENT,
  UPDATE_COMMENT,
  DELETE_COMMENT,
  SOFT_DELETE_COMMENT,
} from '@/graphQLData/comment/mutations';
import { GET_COMMENT_REPLIES } from '@/graphQLData/comment/queries';
import { getSortFromQuery } from '@/components/comments/getSortFromQuery';
import { modProfileNameVar } from '@/cache';

type UseCommentCrudMutationsParams = {
  discussionId: Ref<string | undefined>;
  commentToDeleteId: Ref<string>;
  parentOfCommentToDelete: Ref<string>;
  onCommentCreated?: () => void;
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
 *   - onCommentCreated: Optional callback after comment creation
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
    onCommentCreated,
    onCommentDeleted,
    onIncrementCommentCount,
    onDecrementCommentCount,
  } = params;

  const route = useRoute();

  // CREATE COMMENT mutation
  const {
    mutate: createComment,
    error: createCommentError,
    onDone: onDoneCreatingComment,
  } = useMutation(CREATE_COMMENT, {
    errorPolicy: 'all',
    update: (cache, result) => {
      const newComment: CommentType = result.data?.createComments?.comments[0];
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

      // Handle replies - always use GET_COMMENT_REPLIES query
      try {
        const existingData = cache.readQuery({
          query: GET_COMMENT_REPLIES,
          variables: {
            commentId: newCommentParentId,
            modName: modProfileNameVar.value,
            limit: 5,
            offset: 0,
            sort: getSortFromQuery(route.query),
          },
        });

        const existingReplies =
          (
            existingData as {
              getCommentReplies?: {
                ChildComments?: CommentType[];
                aggregateChildCommentCount?: number;
              };
            }
          )?.getCommentReplies?.ChildComments || [];
        const existingCount =
          (
            existingData as {
              getCommentReplies?: {
                ChildComments?: CommentType[];
                aggregateChildCommentCount?: number;
              };
            }
          )?.getCommentReplies?.aggregateChildCommentCount || 0;

        // Write the updated data back to the cache
        cache.writeQuery({
          query: GET_COMMENT_REPLIES,
          variables: {
            commentId: newCommentParentId,
            modName: modProfileNameVar.value,
            limit: 5,
            offset: 0,
            sort: getSortFromQuery(route.query),
          },
          data: {
            getCommentReplies: {
              __typename: 'CommentReplies',
              ChildComments: [newComment, ...existingReplies],
              aggregateChildCommentCount: existingCount + 1,
            },
          },
        });

        // Update the parent comment's counts
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

  onDoneCreatingComment(() => {
    onCommentCreated?.();
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
