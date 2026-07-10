import type { ComputedRef, Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { ApolloCache, NormalizedCacheObject } from '@apollo/client/core';
import type { Comment } from '@/__generated__/graphql';
import {
  STICKY_COMMENT,
  UNSTICKY_COMMENT,
} from '@/graphQLData/comment/mutations';

type StickyCommentFields = Comment & {
  isSticky?: boolean | null;
  stickyAt?: string | null;
  stickyByUsername?: string | null;
};

/**
 * Sticky / unsticky mutations for a single comment. Each writes the sticky
 * fields into the cache so the pin state updates without a refetch. Extracted
 * from Comment.vue so this logic can be read and unit-tested on its own.
 */
export function useCommentStickyMutations(
  commentData: Ref<Comment> | ComputedRef<Comment>
) {
  const updateStickyCache = (
    cache: ApolloCache<NormalizedCacheObject>,
    comment: StickyCommentFields | null | undefined
  ) => {
    if (!comment?.id) {
      return;
    }

    cache.modify({
      id: cache.identify({
        __typename: 'Comment',
        id: comment.id,
      }),
      fields: {
        isSticky() {
          return !!comment.isSticky;
        },
        stickyAt() {
          return comment.stickyAt ?? null;
        },
        stickyByUsername() {
          return comment.stickyByUsername ?? null;
        },
      },
    });
  };

  const { mutate: stickyComment } = useMutation(STICKY_COMMENT, {
    update: (cache, result) => {
      updateStickyCache(cache, result.data?.stickyComment);
    },
  });

  const { mutate: unstickyComment } = useMutation(UNSTICKY_COMMENT, {
    update: (cache, result) => {
      updateStickyCache(cache, result.data?.unstickyComment);
    },
  });

  const stickyCurrentComment = () =>
    stickyComment({ commentId: commentData.value.id });
  const unstickyCurrentComment = () =>
    unstickyComment({ commentId: commentData.value.id });

  return { stickyCurrentComment, unstickyCurrentComment };
}
