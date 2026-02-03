<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_COMMENT,
  REMOVE_FAVORITE_COMMENT,
} from '@/graphQLData/user/mutations';
import { usernameVar } from '@/cache';
import { useToastStore } from '@/stores/toastStore';
import { useAddToListModalStore } from '@/stores/addToListModalStore';
import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

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
const isLoading = ref(false);
const toastStore = useToastStore();
const addToListModalStore = useAddToListModalStore();
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

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_COMMENT);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_COMMENT);

const showAddedToast = () => {
  const message = `${props.entityName} added to Favorites.`;

  if (!props.allowAddToList) {
    toastStore.showToast(message);
    return;
  }

  toastStore.showToast(message, 'success', {
    label: 'Organize',
    onClick: () =>
      addToListModalStore.open({
        itemId: props.commentId,
        itemType: 'comment',
        isAlreadyFavorite: true,
      }),
  });
};

const handleToggleFavorite = async () => {
  if (!usernameVar.value) return;

  // Optimistic update - toggle immediately
  isFavorited.value = !isFavorited.value;
  isLoading.value = true;

  try {
    if (!isFavorited.value) {
      // We're removing from favorites
      await removeFavorite({
        commentId: props.commentId,
        username: usernameVar.value,
      });
      toastStore.showToast(`${props.entityName} removed from favorites.`);
    } else {
      // We're adding to favorites
      await addFavorite({
        commentId: props.commentId,
        username: usernameVar.value,
      });
      showAddedToast();
    }
    if (shouldLookupFavorite.value) {
      refetchFavorites();
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    // Revert optimistic update on error
    isFavorited.value = !isFavorited.value;
    toastStore.showToast(
      'Error updating favorites. Please try again.',
      'error'
    );
  } finally {
    isLoading.value = false;
  }
};
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
