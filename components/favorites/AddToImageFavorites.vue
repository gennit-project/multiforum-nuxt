<script setup lang="ts">
import { computed } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_IMAGE,
  REMOVE_FAVORITE_IMAGE,
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
  imageId: {
    type: String,
    required: true,
  },
  imageCaption: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
  },
  entityName: {
    type: String,
    default: 'Image',
  },
  // When provided, skip making a separate API call
  initialIsFavorited: {
    type: Boolean,
    default: undefined,
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

// Use initial value if provided, otherwise default to false
// Only fetch if initialIsFavorited was not provided
const shouldFetchFavorite = computed(() =>
  props.initialIsFavorited === undefined && !!usernameVar.value && !!props.imageId
);

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITE_IMAGE,
  () => ({
    username: usernameVar.value,
    imageId: props.imageId,
  }),
  () => ({
    enabled: shouldFetchFavorite.value,
  })
);

// Derived (not copied from a watcher) so SSR and hydration agree; see
// composables/useFavoritedState.ts.
const isFavorited = useFavoritedState({
  provided: () => props.initialIsFavorited,
  queried: () => {
    if (!shouldFetchFavorite.value) return undefined;
    return favoritesResult.value?.users?.[0]?.FavoriteImages?.some(
      (image: { id: string }) => image.id === props.imageId
    );
  },
});

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_IMAGE);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_IMAGE);

const { isLoading, handleToggleFavorite } = useFavoriteToggle({
  isFavorited,
  itemId: () => props.imageId,
  entityType: () => 'image',
  allowAddToList: () => props.allowAddToList,
  addedMessage: () => `${props.entityName} added to Favorites.`,
  removedMessage: () => `${props.entityName} removed from favorites.`,
  addFavorite,
  removeFavorite,
  mutationItemKey: 'imageId',
  // Only refetch if we're managing our own query
  onAfterToggle: () => {
    if (shouldFetchFavorite.value) {
      refetchFavorites();
    }
  },
});

const displayName = computed(() => {
  return props.imageCaption ? `"${props.imageCaption}"` : 'image';
});
</script>

<template>
  <AddToFavoritesButton
    :allow-add-to-list="allowAddToList"
    :is-favorited="isFavorited"
    :is-loading="isLoading"
    :display-name="displayName"
    entity-type="image"
    :size="size"
    :item-id="imageId"
    @toggle="handleToggleFavorite"
  />
</template>
