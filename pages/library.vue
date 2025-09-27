<script setup lang="ts">
import { computed, ref } from 'vue';
import { useHead } from 'nuxt/app';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';

useHead({
  title: 'Library',
});

// Filter state
const activeFilter = ref('all');

// Filter options
const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'DISCUSSIONS', label: 'Discussions' },
  { key: 'IMAGES', label: 'Images' },
  { key: 'COMMENTS', label: 'Comments' },
  { key: 'DOWNLOADS', label: 'Downloads' },
  { key: 'CHANNELS', label: 'Forums' },
];

// For now, we'll show default favorites collections for each data type
// TODO: Implement GraphQL queries for collections
const defaultCollections = computed(() => [
  {
    id: 'favorite-channels',
    name: 'Favorite Forums',
    description: 'Your favorite forums',
    itemCount: 0,
    visibility: 'PRIVATE',
    collectionType: 'CHANNELS',
  },
  {
    id: 'favorite-discussions',
    name: 'Favorite Discussions',
    description: 'Your favorite discussions and posts',
    itemCount: 0,
    visibility: 'PRIVATE',
    collectionType: 'DISCUSSIONS',
  },
  {
    id: 'favorite-downloads',
    name: 'Favorite Downloads',
    description: 'Your favorite downloads and files',
    itemCount: 0,
    visibility: 'PRIVATE',
    collectionType: 'DOWNLOADS',
  },
  {
    id: 'favorite-images',
    name: 'Favorite Images',
    description: 'Your favorite images',
    itemCount: 0,
    visibility: 'PRIVATE',
    collectionType: 'IMAGES',
  },
  {
    id: 'favorite-comments',
    name: 'Favorite Comments',
    description: 'Your favorite comments',
    itemCount: 0,
    visibility: 'PRIVATE',
    collectionType: 'COMMENTS',
  },
]);

// Filtered collections based on active filter
const filteredCollections = computed(() => {
  if (activeFilter.value === 'all') {
    return defaultCollections.value;
  }
  return defaultCollections.value.filter(
    (collection) => collection.collectionType === activeFilter.value
  );
});
</script>

<template>
  <NuxtLayout>
    <div class="min-h-screen bg-white dark:bg-black dark:text-white">
      <RequireAuth>
        <template #has-auth>
          <div class="flex">
            <div class="max-w-sm px-4 sm:px-6 lg:px-8">
              <div class="py-8">
                <!-- Header -->
                <div class="mb-8">
                  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Library
                  </h1>
                  <p class="mt-2 text-gray-600 dark:text-gray-300">
                    Manage your saved collections of forums, discussions, and
                    more.
                  </p>
                </div>

                <!-- Filter Chips -->
                <div class="mb-6">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="filter in filterOptions"
                      :key="filter.key"
                      type="button"
                      :class="[
                        'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                        activeFilter === filter.key
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
                      ]"
                      @click="activeFilter = filter.key"
                    >
                      {{ filter.label }}
                    </button>
                  </div>
                </div>

                <!-- Default Collections Section -->
                <div class="mb-8">
                  <div class="mb-4 flex items-center justify-between">
                    <h2
                      class="font-semibold text-xl text-gray-900 dark:text-white"
                    >
                      Your Collections
                    </h2>
                    <button
                      type="button"
                      class="font-semibold rounded-md bg-orange-500 px-3 py-2 text-sm text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      New Collection
                    </button>
                  </div>

                  <nav class="space-y-1">
                    <NuxtLink
                      v-for="collection in filteredCollections"
                      :key="collection.id"
                      :to="`/library/${collection.id}`"
                      class="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      active-class="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                    >
                      <div class="flex items-center">
                        <ChannelIcon class="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                        <div>
                          <div class="font-medium">{{ collection.name }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">
                            {{ collection.itemCount }} item{{
                              collection.itemCount !== 1 ? 's' : ''
                            }}
                          </div>
                        </div>
                      </div>
                      <span class="text-xs text-gray-400 capitalize">
                        {{ collection.visibility.toLowerCase() }}
                      </span>
                    </NuxtLink>
                  </nav>
                </div>
              </div>
            </div>
            <div class="flex-1"><NuxtPage /></div>
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
  </NuxtLayout>
</template>
