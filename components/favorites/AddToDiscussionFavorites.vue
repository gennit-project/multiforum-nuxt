<script setup lang="ts">
import {
  GetUserFavoriteDiscussionDocument as GET_USER_FAVORITE_DISCUSSION,
  AddFavoriteDiscussionDocument as ADD_FAVORITE_DISCUSSION,
  RemoveFavoriteDiscussionDocument as REMOVE_FAVORITE_DISCUSSION,
} from '@/__generated__/operations';
import { computed, type PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { useFavoriteToggle } from '@/composables/useFavoriteToggle';
import { useFavoritedState } from '@/composables/useFavoritedState';
import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

const usernameVar = useUsername();

const props = defineProps({
  discussionId: {
    type: String,
    required: true,
  },
  discussionTitle: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
  },
  entityName: {
    type: String,
    default: 'Discussion',
  },
  entityType: {
    type: String as PropType<'discussion' | 'download'>,
    default: 'discussion',
  },
  allowAddToList: {
    type: Boolean,
    default: true,
  },
  // When provided, skip making a separate API call
  initialIsFavorited: {
    type: Boolean,
    default: undefined,
  },
  // When true, uses transparent hover styles for overlay contexts
  overlayStyle: {
    type: Boolean,
    default: false,
  },
});

// Use initial value if provided, otherwise default to false
// Only fetch if initialIsFavorited was not provided
const shouldFetchFavorite = computed(
  () =>
    props.initialIsFavorited === undefined &&
    !!usernameVar.value &&
    !!props.discussionId
);

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITE_DISCUSSION,
  () => ({
    username: usernameVar.value,
    discussionId: props.discussionId,
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
    return favoritesResult.value?.users?.[0]?.FavoriteDiscussions?.some(
      (discussion: { id: string }) => discussion.id === props.discussionId
    );
  },
});

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_DISCUSSION);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_DISCUSSION);

const { isLoading, handleToggleFavorite } = useFavoriteToggle({
  isFavorited,
  itemId: () => props.discussionId,
  entityType: () => props.entityType,
  allowAddToList: () => props.allowAddToList,
  addedMessage: () => `${props.entityName} added to Favorites.`,
  removedMessage: () => `${props.entityName} removed from favorites.`,
  addFavorite,
  removeFavorite,
  variables: (itemId, username) => ({ discussionId: itemId, username }),
  // Only refetch if we're managing our own query (parent didn't provide isFavorited)
  onAfterToggle: () => {
    if (shouldFetchFavorite.value) {
      refetchFavorites();
    }
  },
});

const displayName = computed(() => {
  return props.discussionTitle ? `"${props.discussionTitle}"` : 'discussion';
});
</script>

<template>
  <AddToFavoritesButton
    :allow-add-to-list="allowAddToList"
    :is-favorited="isFavorited"
    :is-loading="isLoading"
    :display-name="displayName"
    :entity-type="entityType"
    :size="size"
    :item-id="discussionId"
    :overlay-style="overlayStyle"
    @toggle="handleToggleFavorite"
  />
</template>
