<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_COMMENT,
  REMOVE_FAVORITE_COMMENT,
} from '@/graphQLData/user/mutations';
import { useUsername } from '@/composables/useAuthState';
import { useFavoriteToggle } from '@/composables/useFavoriteToggle';
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

const isFavorited = ref(props.isFavorited ?? false);
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

watch(
  () => props.isFavorited,
  (newValue) => {
    if (isLoading.value) return;
    if (newValue === null) return;
    isFavorited.value = newValue;
  }
);

watch(
  favoritesResult,
  (newResult) => {
    if (!shouldLookupFavorite.value) return;
    if (typeof newResult?.getUserFavoriteComment === 'boolean') {
      isFavorited.value = newResult.getUserFavoriteComment;
    }
  },
  { immediate: true }
);
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
