<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_DISCUSSION,
  REMOVE_FAVORITE_DISCUSSION,
} from '@/graphQLData/user/mutations';
import { usernameVar } from '@/cache';
import { useToastStore } from '@/stores/toastStore';
import { useAddToListModalStore, type AllowedItemType } from '@/stores/addToListModalStore';
import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

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
    type: String,
    default: 'discussion',
  },
  allowAddToList: {
    type: Boolean,
    default: true,
  },
  // When provided from parent query, skip making a separate API call
  // undefined = field not in response, need to fetch
  // null = field in response but user not logged in, don't fetch
  // true/false = field in response with value, don't fetch
  initialIsFavorited: {
    type: [Boolean, null] as unknown as () => boolean | null | undefined,
    default: undefined,
  },
});

const GET_USER_FAVORITE_DISCUSSION = gql`
  query getUserFavoriteDiscussion($username: String!, $discussionId: ID!) {
    users(where: { username: $username }) {
      username
      FavoriteDiscussions(where: { id: $discussionId }) {
        id
        title
      }
    }
  }
`;

// Treat null (user not logged in) and false the same way
const isFavorited = ref(props.initialIsFavorited === true);
const isLoading = ref(false);
const toastStore = useToastStore();
const addToListModalStore = useAddToListModalStore();

// Only query if initialIsFavorited was not provided (undefined means field not in response)
// null means the field was returned but user is not logged in - don't fetch
const shouldFetchFavorite = computed(() =>
  props.initialIsFavorited === undefined && !!usernameVar.value && !!props.discussionId
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

// Watch for changes to initialIsFavorited prop (e.g., when parent refetches)
watch(
  () => props.initialIsFavorited,
  (newValue) => {
    // Update when we get a definitive value from parent
    // null means user not logged in, treat as false
    if (newValue !== undefined) {
      isFavorited.value = newValue === true;
    }
  }
);

// Watch query result only when we're fetching
watch(
  favoritesResult,
  (newResult) => {
    if (shouldFetchFavorite.value && newResult?.users?.[0]?.FavoriteDiscussions) {
      isFavorited.value = newResult.users[0].FavoriteDiscussions.some(
        (discussion: { id: string }) => discussion.id === props.discussionId
      );
    }
  },
  { immediate: true }
);

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_DISCUSSION);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_DISCUSSION);

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
        itemId: props.discussionId,
        itemType: props.entityType as AllowedItemType,
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
        discussionId: props.discussionId,
        username: usernameVar.value,
      });
      toastStore.showToast(`${props.entityName} removed from favorites.`);
    } else {
      // We're adding to favorites
      await addFavorite({
        discussionId: props.discussionId,
        username: usernameVar.value,
      });
      showAddedToast();
    }
    // Only refetch if we're managing our own query (parent didn't provide isFavorited)
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
    @toggle="handleToggleFavorite"
  />
</template>
