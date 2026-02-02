<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_CHANNEL,
  REMOVE_FAVORITE_CHANNEL,
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
  channelUniqueName: {
    type: String,
    required: true,
  },
  channelDisplayName: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
  },
});

const GET_USER_FAVORITES = gql`
  query getUserFavorites($username: String!, $channelUniqueName: String!) {
    users(where: { username: $username }) {
      username
      FavoriteChannels(where: { uniqueName: $channelUniqueName }) {
        uniqueName
      }
    }
  }
`;

const isFavorited = ref(false);
const isLoading = ref(false);
const toastStore = useToastStore();
const addToListModalStore = useAddToListModalStore();

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITES,
  () => ({
    username: usernameVar.value,
    channelUniqueName: props.channelUniqueName,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

watch(
  favoritesResult,
  (newResult) => {
    if (newResult?.users?.[0]?.FavoriteChannels) {
      isFavorited.value = newResult.users[0].FavoriteChannels.some(
        (channel: { uniqueName: string }) => channel.uniqueName === props.channelUniqueName
      );
    }
  },
  { immediate: true }
);

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_CHANNEL);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_CHANNEL);

const showAddedToast = () => {
  const message = 'Added to Favorites.';

  if (!props.allowAddToList) {
    toastStore.showToast(message);
    return;
  }

  toastStore.showToast(message, 'success', {
    label: 'Organize',
    onClick: () =>
      addToListModalStore.open({
        itemId: props.channelUniqueName,
        itemType: 'channel',
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
        channel: props.channelUniqueName,
        username: usernameVar.value,
      });
      toastStore.showToast('Removed from favorites.');
    } else {
      // We're adding to favorites
      await addFavorite({
        channel: props.channelUniqueName,
        username: usernameVar.value,
      });
      showAddedToast();
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
</script>

<template>
  <AddToFavoritesButton
    :allow-add-to-list="allowAddToList"
    :is-favorited="isFavorited"
    :is-loading="isLoading"
    :display-name="channelDisplayName || channelUniqueName"
    entity-type="channel"
    :size="size"
    :item-id="channelUniqueName"
    @toggle="handleToggleFavorite"
  />
</template>
