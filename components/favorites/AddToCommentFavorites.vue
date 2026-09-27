<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_COMMENT,
  REMOVE_FAVORITE_COMMENT,
} from '@/graphQLData/user/mutations';
import { useUsername } from '@/composables/useAuthState';
import { useFavoriteToggle } from '@/composables/useFavoriteToggle';
import { useFavoritedState } from '@/composables/useFavoritedState';
import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

const usernameVar = useUsername();

const props = defineProps({
  allowAddToList: {
    type: Boolean,
    default: false,
  },
  commentId: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'medium',
  },
  entityName: {
    type: String,
    default: 'Comment',
  },
  isFavorited: {
    type: [Boolean, null] as PropType<boolean | null>,
    default: null,
  },
});

const GET_USER_FAVORITE_COMMENT = gql`
  query getUserFavoriteComment($commentId: ID!) {
    getUserFavoriteComment(commentId: $commentId)
  }
`;

const shouldLookupFavorite = computed(() => props.isFavorited === null);

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITE_COMMENT,
  () => ({
    commentId: props.commentId,
  }),
  () => ({
    enabled: shouldLookupFavorite.value && !!props.commentId && !!usernameVar.value,
  })
);

// Derived (not copied from a watcher) so SSR and hydration agree; see
// composables/useFavoritedState.ts. A null prop means "look it up".
const isFavorited = useFavoritedState({
  provided: () => props.isFavorited,
  queried: () => {
    if (!shouldLookupFavorite.value) return undefined;
    const value = favoritesResult.value?.getUserFavoriteComment;
    return typeof value === 'boolean' ? value : undefined;
  },
});

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_COMMENT);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_COMMENT);

const { isLoading, handleToggleFavorite } = useFavoriteToggle({
  isFavorited,
  itemId: () => props.commentId,
  entityType: () => 'comment',
  allowAddToList: () => props.allowAddToList,
  addedMessage: () => `${props.entityName} added to Favorites.`,
  removedMessage: () => `${props.entityName} removed from favorites.`,
  addFavorite,
  removeFavorite,
  mutationItemKey: 'commentId',
  onAfterToggle: () => {
    if (shouldLookupFavorite.value) {
      refetchFavorites();
    }
  },
});
</script>

<template>
  <AddToFavoritesButton
    :allow-add-to-list="allowAddToList"
    :is-favorited="isFavorited"
    :is-loading="isLoading"
    display-name="comment"
    entity-type="comment"
    :size="size"
    :item-id="commentId"
    @toggle="handleToggleFavorite"
  />
</template>
