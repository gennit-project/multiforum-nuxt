<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_IMAGE,
  REMOVE_FAVORITE_IMAGE,
} from '@/graphQLData/user/mutations';
import { useUsername } from '@/composables/useAuthState';
import { useFavoriteToggle } from '@/composables/useFavoriteToggle';
import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

const usernameVar = useUsername();

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

const { isLoading, handleToggleFavorite } = useFavoriteToggle({
  isFavorited,
  itemId: () => props.imageId,
  entityType: () => 'image',
  // This variant has no "Organize" affordance, so always show a plain toast.
  allowAddToList: () => false,
  addedMessage: () => 'Image added to favorites.',
  removedMessage: () => 'Image removed from favorites.',
  addFavorite,
  removeFavorite,
  mutationItemKey: 'imageId',
  onAfterToggle: () => {
    refetchFavorites();
  },
});

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
