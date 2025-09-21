<script setup lang="ts">
import { useTitle } from '@unhead/vue';
import { computed } from 'vue';
import { usernameVar, isAuthenticatedVar } from '@/cache';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';

useTitle('Library - Multiforum');

const user = computed(() => {
  return {
    username: usernameVar.value,
  };
});

// For now, we'll show a placeholder for forum collections
// TODO: Implement GraphQL queries for collections
const forumCollections = computed(() => [
  {
    id: '1',
    name: 'My Favorite Forums',
    description: 'Forums I visit regularly',
    itemCount: 5,
    visibility: 'PRIVATE',
    collectionType: 'CHANNELS',
  },
  {
    id: '2',
    name: 'Game Development',
    description: 'Forums related to game development',
    itemCount: 3,
    visibility: 'PUBLIC',
    collectionType: 'CHANNELS',
  },
]);
</script>

<template>
  <div>
    <RequireAuth>
      <template #has-auth>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="py-8">
            <!-- Header -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Library
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Manage your saved collections of forums, discussions, and more.
              </p>
            </div>

            <!-- Forum Collections Section -->
            <div class="mb-8">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  Forum Collections
                </h2>
                <button
                  type="button"
                  class="rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  New Collection
                </button>
              </div>

              <div
                v-if="forumCollections.length === 0"
                class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800"
              >
                <ChannelIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No forum collections yet
                </h3>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  Start collecting your favorite forums to organize them better.
                </p>
                <button
                  type="button"
                  class="mt-4 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                >
                  Create Your First Collection
                </button>
              </div>

              <div
                v-else
                class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                <div
                  v-for="collection in forumCollections"
                  :key="collection.id"
                  class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ collection.name }}
                      </h3>
                      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {{ collection.description }}
                      </p>
                      <div class="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <ChannelIcon class="mr-1 h-4 w-4" />
                        {{ collection.itemCount }} forum{{ collection.itemCount !== 1 ? 's' : '' }}
                        <span class="mx-2">•</span>
                        <span class="capitalize">{{ collection.visibility.toLowerCase() }}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <span class="sr-only">Options</span>
                      <!-- Three dots icon -->
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Other Collection Types (placeholder for future) -->
            <div class="space-y-8">
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Coming Soon
                </h2>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  Discussion collections, image galleries, and download libraries will be available soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="mx-auto max-w-md text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In Required
          </h1>
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Please sign in to access your library and collections.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>