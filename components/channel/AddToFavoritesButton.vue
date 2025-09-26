<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import {
  ADD_FAVORITE_CHANNEL,
  REMOVE_FAVORITE_CHANNEL,
} from '@/graphQLData/user/mutations';
import { usernameVar } from '@/cache';

const props = defineProps({
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
  query getUserFavorites($username: String!) {
    users(where: { username: $username }) {
      username
      FavoriteChannels {
        uniqueName
      }
    }
  }
`;

const isFavorited = ref(false);
const isAnimating = ref(false);

const { result: favoritesResult, refetch: refetchFavorites } = useQuery(
  GET_USER_FAVORITES,
  () => ({
    username: usernameVar.value,
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
        (channel: any) => channel.uniqueName === props.channelUniqueName
      );
    }
  },
  { immediate: true }
);

const { mutate: addFavorite } = useMutation(ADD_FAVORITE_CHANNEL);
const { mutate: removeFavorite } = useMutation(REMOVE_FAVORITE_CHANNEL);

const handleToggleFavorite = async () => {
  if (!usernameVar.value) return;

  try {
    if (isFavorited.value) {
      await removeFavorite({
        channel: props.channelUniqueName,
        username: usernameVar.value,
      });
      isFavorited.value = false;
    } else {
      await addFavorite({
        channel: props.channelUniqueName,
        username: usernameVar.value,
      });
      isFavorited.value = true;
      isAnimating.value = true;
      setTimeout(() => {
        isAnimating.value = false;
      }, 300);
    }
    refetchFavorites();
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'h-4 w-4';
    case 'large':
      return 'h-6 w-6';
    default:
      return 'h-5 w-5';
  }
});

const buttonLabel = computed(() => {
  const channelName = props.channelDisplayName || props.channelUniqueName;
  return isFavorited.value
    ? `Remove ${channelName} from favorites`
    : `Add ${channelName} to favorites`;
});
</script>

<template>
  <button
    type="button"
    :aria-label="buttonLabel"
    class="add-to-favorites-button rounded-full transition-all duration-200"
    :class="{
      'text-gray-400 hover:bg-gray-100 hover:text-orange-500 dark:hover:bg-gray-800 dark:hover:text-orange-400':
        !isFavorited,
      'bg-white text-green-500 hover:bg-green-600': isFavorited,
      'animate-pulse-once': isAnimating,
    }"
    @click="handleToggleFavorite"
  >
    <svg
      v-if="!isFavorited"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      :class="sizeClasses"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      :class="sizeClasses"
    >
      <path
        fill-rule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
</template>

<style scoped>
@keyframes pulse-once {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.animate-pulse-once {
  animation: pulse-once 0.3s ease-in-out;
}
</style>
