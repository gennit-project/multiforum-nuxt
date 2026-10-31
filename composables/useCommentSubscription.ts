import { computed, type ComputedRef, type Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { useAutoUnsubscribe } from '@/composables/useAutoUnsubscribe';
import { isCommentSubscribedByUser } from '@/utils/commentDisplay';
import {
  SubscribeToCommentDocument,
  UnsubscribeFromCommentDocument,
  type CommentFieldsFragment,
} from '@/__generated__/operations';
type Comment = Pick<CommentFieldsFragment, 'id' | 'SubscribedToNotifications'>;

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

  // Both responses select Comment.id and the complete subscriber list. Apollo's
  // normalizer replaces that list on the returned entity, even if the renderer
  // has navigated to another comment before the mutation resolves.
  const { mutate: subscribeToComment } = useMutation(
    SubscribeToCommentDocument
  );
  const { mutate: unsubscribeFromComment } = useMutation(
    UnsubscribeFromCommentDocument
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
