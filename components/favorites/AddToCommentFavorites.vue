<script setup lang="ts">
import { ref, watch } from 'vue';
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
});

const GET_USER_FAVORITE_COMMENT = gql`
  query getUserFavoriteComment($username: String!, $commentId: ID!) {
    users(where: { username: $username }) {
      username
      FavoriteComments(where: { id: $commentId }) {
        id
      }
    }
  }
`;

const isFavorited = ref(false);
const isLoading = ref(false);
const toastStore = useToastStore();
const addToListModalStore = useAddToListModalStore();

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITE_COMMENT,
  () => ({
    username: usernameVar.value,
    commentId: props.commentId,
  }),
  () => ({
    enabled: !!usernameVar.value && !!props.commentId,
  })
);

watch(
  favoritesResult,
  (newResult) => {
    if (newResult?.users?.[0]?.FavoriteComments) {
      isFavorited.value = newResult.users[0].FavoriteComments.some(
        (comment: { id: string }) => comment.id === props.commentId
      );
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
    display-name="comment"
    entity-type="comment"
    :size="size"
    :item-id="commentId"
    @toggle="handleToggleFavorite"
  />
</template>
