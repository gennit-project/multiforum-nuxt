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
import { useAddToListModalStore } from '@/stores/addToListModalStore';
import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

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
const isFavorited = ref(props.initialIsFavorited ?? false);
const isLoading = ref(false);
const toastStore = useToastStore();
const addToListModalStore = useAddToListModalStore();

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

// Watch for changes to initialIsFavorited prop (e.g., when parent refetches)
watch(
  () => props.initialIsFavorited,
  (newValue) => {
    if (newValue !== undefined) {
      isFavorited.value = newValue;
    }
  }
);

// Watch query result only when we're fetching
watch(
  favoritesResult,
  (newResult) => {
    if (shouldFetchFavorite.value && newResult?.users?.[0]?.FavoriteImages) {
      isFavorited.value = newResult.users[0].FavoriteImages.some(
        (image: { id: string }) => image.id === props.imageId
      );
    }
  },
  { immediate: true }
);

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_IMAGE);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_IMAGE);

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
        itemId: props.imageId,
        itemType: 'image',
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
        imageId: props.imageId,
        username: usernameVar.value,
      });
      toastStore.showToast(`${props.entityName} removed from favorites.`);
    } else {
      // We're adding to favorites
      await addFavorite({
        imageId: props.imageId,
        username: usernameVar.value,
      });
      showAddedToast();
    }
    // Only refetch if we're managing our own query
    if (shouldFetchFavorite.value) {
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
