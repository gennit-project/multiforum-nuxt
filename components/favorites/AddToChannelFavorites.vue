<script setup lang="ts">
import {
  GetUserFavoritesDocument as GET_USER_FAVORITES,
  AddFavoriteChannelDocument as ADD_FAVORITE_CHANNEL,
  RemoveFavoriteChannelDocument as REMOVE_FAVORITE_CHANNEL,
} from '@/__generated__/operations';
import { computed } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
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
  // When provided, skip making a separate API call
  initialIsFavorited: {
    type: Boolean,
    default: undefined,
  },
});

// Only fetch if initialIsFavorited was not provided
const shouldFetchFavorite = computed(
  () =>
    props.initialIsFavorited === undefined &&
    !!usernameVar.value &&
    !!props.channelUniqueName
);

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITES,
  () => ({
    username: usernameVar.value,
    channelUniqueName: props.channelUniqueName,
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
    return favoritesResult.value?.users?.[0]?.FavoriteChannels?.some(
      (channel: { uniqueName: string }) =>
        channel.uniqueName === props.channelUniqueName
    );
  },
});

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_CHANNEL);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_CHANNEL);

const handleFavoriteChange = (nextIsFavorited: boolean) => {
  isFavorited.value = nextIsFavorited;
};

const { isLoading, handleToggleFavorite } = useFavoriteToggle({
  isFavorited,
  itemId: () => props.channelUniqueName,
  entityType: () => 'channel',
  allowAddToList: () => props.allowAddToList,
  addedMessage: () => 'Added to Favorites.',
  removedMessage: () => 'Removed from favorites.',
  addFavorite,
  removeFavorite,
  variables: (itemId, username) => ({ channel: itemId, username }),
  // Only refetch if we're managing our own query
  onAfterToggle: () => {
    if (shouldFetchFavorite.value) {
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
    :display-name="channelDisplayName || channelUniqueName"
    entity-type="channel"
    :size="size"
    :item-id="channelUniqueName"
    @toggle="handleToggleFavorite"
    @favorite-change="handleFavoriteChange"
  />
</template>
