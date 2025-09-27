<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import { useHead } from 'nuxt/app';
import { usernameVar } from '@/cache';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import ImageListItem from '@/components/image/ImageListItem.vue';
import { relativeTime } from '@/utils';

useHead({
  title: 'Favorite Images - Library',
});

const GET_USER_FAVORITE_IMAGES = gql`
  query getUserFavoriteImages($username: String!) {
    users(where: { username: $username }) {
      username
      FavoriteImages(options: { sort: { createdAt: DESC } }) {
        id
        url
        alt
        caption
        copyright
        longDescription
        hasSensitiveContent
        hasSpoiler
        createdAt
        Uploader {
          username
          displayName
          profilePicURL
        }
      }
    }
  }
`;

const { result, loading, error } = useQuery(
  GET_USER_FAVORITE_IMAGES,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const favoriteImages = computed(() => {
  return result.value?.users?.[0]?.FavoriteImages || [];
});

const user = computed(() => {
  return result.value?.users?.[0] || null;
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="py-8">
            <!-- Header with back button -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Favorite Images
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite images and media files.
              </p>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your favorite images...
              </p>
            </div>

            <!-- Error state -->
            <div
              v-else-if="error"
              class="bg-red-50 rounded-lg p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading favorite images: {{ error.message }}
              </p>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="favoriteImages.length === 0"
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3
                class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                No favorite images yet
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start adding images to your favorites to see them here.
              </p>
              <div class="mt-6">
                <NuxtLink
                  to="/"
                  class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
                >
                  Browse Content
                </NuxtLink>
              </div>
            </div>

            <!-- Images grid -->
            <div v-else class="space-y-6">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <ImageListItem
                  v-for="image in favoriteImages"
                  :key="image.id"
                  :image="image"
                  :username="user?.username || ''"
                  :show-favorite-button="true"
                />
              </div>
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
            Please sign in to view your favorite images.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
