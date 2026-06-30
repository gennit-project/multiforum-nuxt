<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { useUsername } from '@/composables/useAuthState';
import { GET_USER_FAVORITE_CHANNELS } from '@/graphQLData/user/queries';
import RequireAuth from '@/components/auth/RequireAuth.vue';

const usernameVar = useUsername();

useHead({
  title: 'Favorite Forums - Library',
});

const { result, loading, error } = useQuery(
  GET_USER_FAVORITE_CHANNELS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const favoriteChannels = computed(() => {
  return result.value?.users?.[0]?.FavoriteChannels || [];
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="py-8">
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Favorite Forums
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite forums and communities.
              </p>
            </div>

            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your favorite forums...
              </p>
            </div>

            <div
              v-else-if="error"
              class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading favorite forums: {{ error.message }}
              </p>
            </div>

            <div
              v-else-if="favoriteChannels.length === 0"
              class="py-12 text-center"
            >
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <h3
                class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                No favorite forums yet
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start adding forums to your favorites to see them here.
              </p>
              <div class="mt-6">
                <NuxtLink
                  to="/forums"
                  class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
                >
                  Browse Forums
                </NuxtLink>
              </div>
            </div>

            <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <LibraryChannelCard
                v-for="channel in favoriteChannels"
                :key="channel.uniqueName"
                :channel="channel"
                :show-favorite-button="true"
                :is-favorited="true"
              />
            </div>
          </div>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="mx-auto max-w-md py-12 text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In Required
          </h1>
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Please sign in to view your favorite forums.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
