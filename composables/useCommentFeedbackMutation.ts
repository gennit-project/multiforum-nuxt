import type { Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Comment } from '@/__generated__/graphql';
import { ADD_FEEDBACK_COMMENT_TO_COMMENT } from '@/graphQLData/comment/mutations';

type CacheUpdateParams = {
  cache: unknown;
  commentToAddFeedbackTo: Comment | null;
  newFeedbackComment: Comment;
};

type UseCommentFeedbackMutationParams = {
  parentIdOfCommentToGiveFeedbackOn: Ref<string>;
  commentToGiveFeedbackOn: Ref<Comment | null>;
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
  } = useMutation(ADD_FEEDBACK_COMMENT_TO_COMMENT, {
    update: (cache, result) => {
      const parentId = JSON.parse(
        JSON.stringify(parentIdOfCommentToGiveFeedbackOn.value)
      );
      const newFeedbackComment = result.data.createComments.comments[0];
      const commentWeGaveFeedbackOn = commentToGiveFeedbackOn.value;

      if (parentId && commentWeGaveFeedbackOn) {
        // Modify the comment to add feedback
        cache.modify({
          id: cache.identify({
            __typename: 'Comment',
            id: commentWeGaveFeedbackOn.id,
          }),
          fields: {
            FeedbackComments(existing = []) {
              return [...existing, newFeedbackComment];
            },
          },
        });
      } else if (onUpdateQueryResult) {
        onUpdateQueryResult({
          cache,
          commentToAddFeedbackTo: commentToGiveFeedbackOn.value,
          newFeedbackComment,
        });
      }
    },
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
