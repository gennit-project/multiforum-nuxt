import type { Reference } from '@apollo/client/core';
import type { Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { AddFeedbackCommentToCommentMutation } from '@/__generated__/operations';
import type { CommentView } from '@/types/Comment';
import { AddFeedbackCommentToCommentDocument as ADD_FEEDBACK_COMMENT_TO_COMMENT } from '@/__generated__/operations';
export type FeedbackCreatedComment =
  AddFeedbackCommentToCommentMutation['createCommentWithOwnedConnections']['comments'][number];

type CacheUpdateParams = {
  cache: unknown;
  commentToAddFeedbackTo: CommentView | null;
  newFeedbackComment: FeedbackCreatedComment;
};

type UseCommentFeedbackMutationParams = {
  parentIdOfCommentToGiveFeedbackOn: Ref<string>;
  commentToGiveFeedbackOn: Ref<CommentView | null>;
  onFeedbackAdded?: () => void;
  onUpdateQueryResult?: (params: CacheUpdateParams) => void;
};

/**
 * Composable that handles the feedback comment mutation with cache updates.
 * Allows moderators to add feedback comments to existing comments.
 *
 * @param params - Object containing:
 *   - parentIdOfCommentToGiveFeedbackOn: The parent comment ID (for cache updates)
 *   - commentToGiveFeedbackOn: The comment receiving feedback
 *   - onFeedbackAdded: Optional callback when feedback is successfully added
 *   - onUpdateQueryResult: Optional callback to emit cache updates to parent
 * @returns Object with mutation function, loading state, and error
 */
export function useCommentFeedbackMutation(
  params: UseCommentFeedbackMutationParams
) {
  const {
    parentIdOfCommentToGiveFeedbackOn,
    commentToGiveFeedbackOn,
    onFeedbackAdded,
    onUpdateQueryResult,
  } = params;

  const {
    mutate: addFeedbackCommentToComment,
    loading: addFeedbackLoading,
    error: addFeedbackError,
    onDone: onAddFeedbackDone,
  } = useMutation(ADD_FEEDBACK_COMMENT_TO_COMMENT, () => {
    const parentId = parentIdOfCommentToGiveFeedbackOn.value;
    const commentWeGaveFeedbackOn = commentToGiveFeedbackOn.value;
    return {
      update: (cache, result) => {
        const newFeedbackComment =
          result.data?.createCommentWithOwnedConnections.comments[0];
        if (!newFeedbackComment) return;

        if (parentId && commentWeGaveFeedbackOn) {
          // Modify the comment to add feedback
          cache.modify({
            id: cache.identify({
              __typename: 'Comment',
              id: commentWeGaveFeedbackOn.id,
            }),
            fields: {
              FeedbackComments(existing = [], { readField, toReference }) {
                if (
                  existing.some(
                    (item: Reference) =>
                      readField('id', item) === newFeedbackComment.id
                  )
                )
                  return existing;
                return [
                  ...existing,
                  toReference({
                    __typename: 'Comment',
                    id: newFeedbackComment.id,
                  }),
                ];
              },
            },
          });
        } else if (onUpdateQueryResult) {
          onUpdateQueryResult({
            cache,
            commentToAddFeedbackTo: commentWeGaveFeedbackOn,
            newFeedbackComment,
          });
        }
      },
    };
  });

  onAddFeedbackDone(() => {
    onFeedbackAdded?.();
  });

  return {
    addFeedbackCommentToComment,
    addFeedbackLoading,
    addFeedbackError,
  };
}
