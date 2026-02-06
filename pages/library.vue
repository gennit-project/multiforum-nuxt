<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import {
  GET_USER_FAVORITE_COUNTS,
  GET_USER_FAVORITE_DOWNLOADS_COUNT,
  GET_USER_OWNED_DOWNLOADS_COUNT,
} from '@/graphQLData/user/queries';
import { GET_ALL_USER_COLLECTIONS } from '@/graphQLData/collection/queries';
import { usernameVar, isAuthenticatedVar } from '@/cache';

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

// GraphQL queries for favorite counts
const username = computed(() => usernameVar.value);
const isAuthenticated = computed(() => isAuthenticatedVar.value);

// Use useQuery with computed enabled option for automatic reactive loading
const { result: favoriteCountsResult, refetch: refetchCounts } = useQuery(
  GET_USER_FAVORITE_COUNTS,
  () => ({
    username: username.value,
  }),
  () => ({
    enabled: !!username.value && isAuthenticated.value,
    fetchPolicy: 'cache-and-network',
  })
);

const { result: favoriteDownloadsResult, refetch: refetchDownloads } = useQuery(
  GET_USER_FAVORITE_DOWNLOADS_COUNT,
  () => ({
    username: username.value,
  }),
  () => ({
    enabled: !!username.value && isAuthenticated.value,
    fetchPolicy: 'cache-and-network',
  })
);

const {
  result: ownedDownloadsCountResult,
  refetch: refetchOwnedDownloads,
} = useQuery(
  GET_USER_OWNED_DOWNLOADS_COUNT,
  () => ({
    username: username.value,
  }),
  () => ({
    enabled: !!username.value && isAuthenticated.value,
    fetchPolicy: 'cache-and-network',
  })
);

const { result: customCollectionsResult, refetch: refetchCustomCollections } =
  useQuery(
    GET_ALL_USER_COLLECTIONS,
    () => ({
      username: username.value,
    }),
    () => ({
      enabled: !!username.value && isAuthenticated.value,
      fetchPolicy: 'cache-and-network',
    })
  );

// Refetch data when username becomes available
watch(
  () => [username.value, isAuthenticated.value],
  ([newUsername, newIsAuthenticated]) => {
    if (newUsername && newIsAuthenticated) {
      refetchCounts();
      refetchDownloads();
      refetchOwnedDownloads();
      refetchCustomCollections();
    }
  }
);

// Check if data is still loading
const isLoading = computed(() => {
  return (
    !favoriteCountsResult.value &&
    !favoriteDownloadsResult.value &&
    !ownedDownloadsCountResult.value &&
    !customCollectionsResult.value &&
    isAuthenticated.value &&
    !!username.value
  );
});

// Compute counts from query results
const favoriteCounts = computed(() => {
  const counts = {
    channels: 0,
    discussions: 0,
    downloads: 0,
    images: 0,
    comments: 0,
  };

  if (favoriteCountsResult.value?.users?.[0]) {
    const user = favoriteCountsResult.value.users[0];
    counts.channels = user.FavoriteChannelsAggregate?.count || 0;
    counts.discussions = user.FavoriteDiscussionsAggregate?.count || 0;
    counts.images = user.FavoriteImagesAggregate?.count || 0;
    counts.comments = user.FavoriteCommentsAggregate?.count || 0;
  }

  if (favoriteDownloadsResult.value?.users?.[0]) {
    const user = favoriteDownloadsResult.value.users[0];
    counts.downloads = user.FavoriteDiscussionsAggregate?.count || 0;
  }

  return counts;
});

const ownedDownloadsCount = computed(() => {
  return (
    ownedDownloadsCountResult.value?.users?.[0]?.OwnedDownloadsAggregate
      ?.count || 0
  );
});

// Collections with real counts
const defaultCollections = computed(() => [
  {
    id: 'favorite-channels',
    name: 'Favorite Forums',
    description: 'Your favorite forums',
    itemCount: favoriteCounts.value.channels,
    visibility: 'PRIVATE',
    collectionType: 'CHANNELS',
  },
  {
    id: 'favorite-discussions',
    name: 'Favorite Discussions',
    description: 'Your favorite discussions and posts',
    itemCount: favoriteCounts.value.discussions,
    visibility: 'PRIVATE',
    collectionType: 'DISCUSSIONS',
  },
  {
    id: 'favorite-downloads',
    name: 'Favorite Downloads',
    description: 'Your favorite downloads and files',
    itemCount: favoriteCounts.value.downloads,
    visibility: 'PRIVATE',
    collectionType: 'DOWNLOADS',
  },
  {
    id: 'favorite-images',
    name: 'Favorite Images',
    description: 'Your favorite images',
    itemCount: favoriteCounts.value.images,
    visibility: 'PRIVATE',
    collectionType: 'IMAGES',
  },
  {
    id: 'favorite-comments',
    name: 'Favorite Comments',
    description: 'Your favorite comments',
    itemCount: favoriteCounts.value.comments,
    visibility: 'PRIVATE',
    collectionType: 'COMMENTS',
  },
]);

// Get custom collections from query
const customCollections = computed(() => {
  return customCollectionsResult.value?.users?.[0]?.Collections || [];
});

// Combine favorites and custom collections
const allCollections = computed(() => {
  return [...defaultCollections.value, ...customCollections.value];
});

// Filtered collections based on active filter
const filteredCollections = computed(() => {
  if (activeFilter.value === 'all') {
    return allCollections.value;
  }
  return allCollections.value.filter(
    (collection) => collection.collectionType === activeFilter.value
  );
});

// Split collections into favorites and custom for display
const filteredFavorites = computed(() => {
  return filteredCollections.value.filter((c) => c.id.startsWith('favorite-'));
});

const filteredCustom = computed(() => {
  return filteredCollections.value.filter((c) => !c.id.startsWith('favorite-'));
});

// Get color for collection type
const getCollectionTypeInfo = (collectionType: string) => {
  switch (collectionType) {
    case 'DISCUSSIONS':
      return {
        color:
          'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      };
    case 'IMAGES':
      return {
        color:
          'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
      };
    case 'COMMENTS':
      return {
        color:
          'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      };
    case 'DOWNLOADS':
      return {
        color:
          'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
      };
    case 'CHANNELS':
      return {
        color:
          'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
      };
    default:
      return {
        color:
          'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700',
      };
  }
};
</script>

<template>
  <NuxtLayout>
    <div class="min-h-screen bg-white dark:bg-black dark:text-white">
      <RequireAuth>
        <template #has-auth>
          <div class="flex flex-col px-3 md:flex-row">
            <!-- Sidebar - hidden on mobile when viewing collection detail -->
            <div
              :class="[
                'md:w-100 w-72 md:flex-shrink-0',
                $route.params.collectionId ? 'hidden md:block' : 'block',
              ]"
            >
              <div class="py-8">
                <!-- Header -->
                <h1
                  class="mb-2 text-xl font-bold text-gray-900 dark:text-white"
                >
                  Library
                </h1>

                <!-- Filter Chips -->
                <div class="mb-6">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="filter in filterOptions"
                      :key="filter.key"
                      type="button"
                      :class="[
                        'font-sm rounded-full px-3 py-1 text-sm transition-colors',
                        activeFilter === filter.key
                          ? 'bg-orange-500 text-black shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
                      ]"
                      @click="activeFilter = filter.key"
                    >
                      {{ filter.label }}
                    </button>
                  </div>
                </div>

                <!-- My Downloads Section -->
                <div class="mb-8">
                  <div
                    class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    My Downloads
                  </div>
                  <NuxtLink
                    to="/library/my-downloads"
                    class="block rounded-md py-2 text-sm transition-colors"
                    active-class="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-semibold"
                  >
                    <div class="flex items-center justify-between">
                      <span class="font-medium">My Downloads</span>
                      <span class="text-gray-500 dark:text-gray-400">
                        ({{ ownedDownloadsCount }})
                      </span>
                    </div>
                  </NuxtLink>
                </div>

                <!-- Collections Section -->
                <div class="mb-8">
                  <div class="mb-4 flex items-center justify-between">
                    <h2
                      class="font-semibold text-xl text-gray-900 dark:text-white"
                    >
                      Your Collections
                    </h2>
                  </div>

                  <nav class="space-y-1">
                    <!-- Skeleton loaders when loading -->
                    <template v-if="isLoading">
                      <div
                        v-for="i in 5"
                        :key="`skeleton-${i}`"
                        class="flex items-center justify-between rounded-md px-3 py-2"
                      >
                        <div class="flex items-center">
                          <div
                            class="mr-3 h-5 w-5 animate-pulse rounded bg-gray-300 dark:bg-gray-600"
                          />
                          <div>
                            <div
                              class="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"
                            />
                            <div
                              class="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                            />
                          </div>
                        </div>
                        <div
                          class="h-3 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                        />
                      </div>
                    </template>

                    <!-- Actual collections when loaded -->
                    <template v-else>
                      <!-- Favorites Section -->
                      <div v-if="filteredFavorites.length > 0">
                        <div
                          class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                        >
                          Favorites
                        </div>
                        <NuxtLink
                          v-for="collection in filteredFavorites"
                          :key="collection.id"
                          :to="`/library/${collection.id}`"
                          class="block rounded-md py-2 text-sm transition-colors"
                          active-class="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-semibold"
                        >
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="font-medium">
                              {{ collection.name.replace('Favorite ', '') }}
                              <span class="text-gray-500 dark:text-gray-400"
                                >({{ collection.itemCount }})</span
                              >
                            </span>
                            <span class="text-xs capitalize text-gray-400">
                              · {{ collection.visibility.toLowerCase() }}
                            </span>
                          </div>
                        </NuxtLink>
                      </div>

                      <!-- Custom Collections Section -->
                      <div
                        v-if="filteredCustom.length > 0"
                        :class="{ 'mt-6': filteredFavorites.length > 0 }"
                      >
                        <div
                          class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                        >
                          Custom Collections
                        </div>
                        <NuxtLink
                          v-for="collection in filteredCustom"
                          :key="collection.id"
                          :to="`/library/${collection.id}`"
                          class="block rounded-md py-2 text-sm transition-colors"
                          active-class="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-semibold"
                        >
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="font-medium">
                              {{ collection.name }}
                              <span class="text-gray-500 dark:text-gray-400"
                                >({{ collection.itemCount }})</span
                              >
                            </span>
                            <span
                              :class="[
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                getCollectionTypeInfo(collection.collectionType)
                                  .color,
                              ]"
                            >
                              {{
                                collection.collectionType
                                  .toLowerCase()
                                  .replace('_', ' ')
                              }}
                            </span>
                            <span class="text-xs capitalize text-gray-400">
                              · {{ collection.visibility.toLowerCase() }}
                            </span>
                          </div>
                        </NuxtLink>
                      </div>

                      <!-- Empty state -->
                      <div
                        v-if="
                          filteredFavorites.length === 0 &&
                          filteredCustom.length === 0
                        "
                        class="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No collections yet. Start adding items to create your
                        first collection!
                      </div>
                    </template>
                  </nav>
                </div>
              </div>
            </div>
            <!-- Main content area -->
            <div
              class="w-full flex-1 md:border-l md:border-gray-200 md:dark:border-gray-700"
            >
              <NuxtPage />
            </div>
          </div>
        </template>
        <template #does-not-have-auth>
          <div class="mx-auto max-w-md text-center">
            <h1 class="mt-8 text-2xl font-bold text-gray-900 dark:text-white">
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
