<script setup lang="ts">
import {
  GetUserFavoriteImageDocument as GET_USER_FAVORITE_IMAGE,
  AddFavoriteImageDocument as ADD_FAVORITE_IMAGE,
  RemoveFavoriteImageDocument as REMOVE_FAVORITE_IMAGE,
} from '@/__generated__/operations';
import { computed } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { useFavoriteToggle } from '@/composables/useFavoriteToggle';
import { useFavoritedState } from '@/composables/useFavoritedState';
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
  overlayStyle: {
    type: Boolean,
    default: false,
  },
});

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

// Derived (not copied from a watcher) so SSR and hydration agree; see
// composables/useFavoritedState.ts.
const isFavorited = useFavoritedState({
  provided: () => undefined,
  queried: () =>
    favoritesResult.value?.users?.[0]?.FavoriteImages?.some(
      (image: { id: string }) => image.id === props.imageId
    ),
});

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
  variables: (itemId, username) => ({ imageId: itemId, username }),
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
    :overlay-style="overlayStyle"
    @toggle="handleToggleFavorite"
  />
</template>
