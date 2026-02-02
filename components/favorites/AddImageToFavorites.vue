<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_IMAGE,
  REMOVE_FAVORITE_IMAGE,
} from '@/graphQLData/user/mutations';
import { usernameVar } from '@/cache';
import { useToastStore } from '@/stores/toastStore';
import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

const props = defineProps({
  imageId: {
    type: String,
    required: true,
  },
  imageTitle: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
  },
});

const GET_USER_FAVORITE_IMAGE = gql`
  query getUserFavoriteImage($username: String!, $imageId: ID!) {
    users(where: { username: $username }) {
      username
      FavoriteImages(where: { id: $imageId }) {
        id
        url
      }
    }
  }
`;

const isFavorited = ref(false);
const isLoading = ref(false);
const toastStore = useToastStore();

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITE_IMAGE,
  () => ({
    username: usernameVar.value,
    imageId: props.imageId,
  }),
  () => ({
    enabled: !!usernameVar.value && !!props.imageId,
  })
);

watch(
  favoritesResult,
  (newResult) => {
    if (newResult?.users?.[0]?.FavoriteImages) {
      isFavorited.value = newResult.users[0].FavoriteImages.some(
        (image: { id: string }) => image.id === props.imageId
      );
    }
  },
  { immediate: true }
);

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_IMAGE);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_IMAGE);

const handleToggleFavorite = async () => {
  if (!usernameVar.value) return;

  // Optimistic update - toggle immediately
  isFavorited.value = !isFavorited.value;
  isLoading.value = true;

  try {
    if (!isFavorited.value) {
      // We're removing from favorites
      await removeFavorite({
        imageId: props.imageId,
        username: usernameVar.value,
      });
      toastStore.showToast('Image removed from favorites.');
    } else {
      // We're adding to favorites
      await addFavorite({
        imageId: props.imageId,
        username: usernameVar.value,
      });
      toastStore.showToast('Image added to favorites.');
    }
    refetchFavorites();
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

const displayName = computed(() => {
  return props.imageTitle || 'image';
});
</script>

<template>
  <AddToFavoritesButton
    :is-favorited="isFavorited"
    :is-loading="isLoading"
    :display-name="displayName"
    entity-type="image"
    :size="size"
    :item-id="imageId"
    @toggle="handleToggleFavorite"
  />
</template>
