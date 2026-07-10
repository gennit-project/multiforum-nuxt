import { computed, type ComputedRef, type Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Comment } from '@/__generated__/graphql';
import { useUsername } from '@/composables/useAuthState';
import { useAutoUnsubscribe } from '@/composables/useAutoUnsubscribe';
import { isCommentSubscribedByUser } from '@/utils/commentDisplay';
import {
  SUBSCRIBE_TO_COMMENT,
  UNSUBSCRIBE_FROM_COMMENT,
} from '@/graphQLData/comment/mutations';

/**
 * Reply-notification subscription for a single comment: the subscribe /
 * unsubscribe mutations (each writing the fresh SubscribedToNotifications list
 * back into the cache), the derived `isSubscribed` flag, and the one-click
 * `?action=unsubscribe` handler. Extracted from Comment.vue so this logic can be
 * read and unit-tested on its own.
 */
export function useCommentSubscription(
  commentData: Ref<Comment> | ComputedRef<Comment>
) {
  const usernameVar = useUsername();
  const commentId = computed(() => commentData.value.id);

  const { mutate: subscribeToComment } = useMutation(SUBSCRIBE_TO_COMMENT, {
    update: (cache, result) => {
      if (result.data?.subscribeToComment) {
        cache.modify({
          id: cache.identify({
            __typename: 'Comment',
            id: commentData.value.id,
          }),
          fields: {
            SubscribedToNotifications(_) {
              return result.data.subscribeToComment.SubscribedToNotifications;
            },
          },
        });
      }
    },
  });

  const { mutate: unsubscribeFromComment } = useMutation(
    UNSUBSCRIBE_FROM_COMMENT,
    {
      update: (cache, result) => {
        if (result.data?.unsubscribeFromComment) {
          cache.modify({
            id: cache.identify({
              __typename: 'Comment',
              id: commentData.value.id,
            }),
            fields: {
              SubscribedToNotifications(_) {
                return result.data.unsubscribeFromComment
                  .SubscribedToNotifications;
              },
            },
          });
        }
      },
    }
  );

  const isSubscribed = computed(() =>
    isCommentSubscribedByUser(commentData.value, usernameVar.value)
  );

  useAutoUnsubscribe({
    entityId: commentId,
    unsubscribeFn: async (id: string) => {
      await unsubscribeFromComment({ commentId: id });
    },
    entityType: 'comment',
    isSubscribed,
  });

  const watchReplies = () =>
    subscribeToComment({ commentId: commentData.value.id });
  const unwatchReplies = () =>
    unsubscribeFromComment({ commentId: commentData.value.id });

  return { isSubscribed, watchReplies, unwatchReplies };
}
