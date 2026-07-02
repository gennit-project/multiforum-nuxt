<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useHead, useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import {
  GET_USER_FAVORITE_COUNTS,
  GET_USER_FAVORITE_DOWNLOADS_COUNT,
  GET_USER_OWNED_DOWNLOADS_COUNT,
} from '@/graphQLData/user/queries';
import { GET_ALL_USER_COLLECTIONS } from '@/graphQLData/collection/queries';
import { useUsername, useIsAuthenticated } from '@/composables/useAuthState';

const usernameVar = useUsername();
const isAuthenticatedVar = useIsAuthenticated();
const route = useRoute();

useHead({
  title: 'Library',
});

// Filter state
const activeFilter = ref('all');
const searchTerm = ref('');

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

const activeLibraryItemId = computed(() => {
  if (route.path === '/library/my-downloads') {
    return 'my-downloads';
  }

  const matchingDefaultCollection = defaultCollections.value.find(
    (collection) => route.path === `/library/${collection.id}`
  );

  if (matchingDefaultCollection) {
    return matchingDefaultCollection.id;
  }

  return typeof route.params.collectionId === 'string'
    ? route.params.collectionId
    : '';
});

const normalizedSearchTerm = computed(() => searchTerm.value.trim().toLowerCase());

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
  let collections = allCollections.value;

  if (activeFilter.value !== 'all') {
    collections = collections.filter(
      (collection) => collection.collectionType === activeFilter.value
    );
  }

  if (!normalizedSearchTerm.value) {
    return collections;
  }

  return collections.filter((collection) =>
    [
      collection.name,
      collection.description,
      collection.collectionType,
      collection.visibility,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearchTerm.value)
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
const getCollectionTypeInfo = (collectionType: string, isActive = false) => {
  if (isActive) {
    return {
      color:
        'border border-orange-300/80 bg-orange-50/90 text-orange-950 dark:border-white/15 dark:bg-white/10 dark:text-white',
    };
  }

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

const getSidebarItemClasses = (isActive: boolean) =>
  isActive
    ? 'border-orange-300 bg-orange-100 text-gray-900 shadow-[0_18px_40px_-32px_rgba(249,115,22,0.45)] ring-1 ring-orange-200 dark:border-orange-800/80 dark:bg-orange-950/75 dark:text-white dark:ring-orange-800/70'
    : 'border-gray-200/90 bg-white/92 text-gray-700 hover:border-gray-300 hover:bg-white hover:text-gray-950 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white';

const isMyDownloadsActive = computed(
  () => activeLibraryItemId.value === 'my-downloads'
);
</script>

<template>
  <NuxtLayout>
    <div class="min-h-screen bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-white">
      <RequireAuth>
        <template #has-auth>
          <div class="flex flex-col gap-4 px-3 py-4 md:flex-row md:gap-6 md:px-4">
            <!-- Sidebar - hidden on mobile when viewing collection detail -->
            <div
              :class="[
                'w-72 md:w-[24rem] md:flex-shrink-0',
                activeLibraryItemId ? 'hidden md:block' : 'block',
              ]"
            >
              <div class="rounded-[2rem] border border-gray-200/80 bg-white/95 p-5 shadow-[0_25px_70px_-38px_rgba(38,38,38,0.22)] backdrop-blur dark:border-gray-700 dark:bg-gray-900 dark:shadow-[0_32px_80px_-45px_rgba(0,0,0,0.78)]">
                <!-- Header -->
                <h1
                  class="text-2xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-gray-50"
                >
                  Library
                </h1>
                <div class="relative mt-4">
                  <span
                    class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500"
                  >
                    <i class="fa-solid fa-magnifying-glass text-sm" />
                  </span>
                  <input
                    v-model="searchTerm"
                    type="search"
                    placeholder="Search collections"
                    aria-label="Search library collections"
                    class="w-full rounded-2xl border border-gray-200 bg-gray-50/90 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-orange-400 dark:focus:bg-gray-800 dark:focus:ring-orange-500/20"
                  >
                </div>

                <!-- Filter Chips -->
                <div class="mb-6 mt-5">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="filter in filterOptions"
                      :key="filter.key"
                      type="button"
                      :class="[
                        'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        activeFilter === filter.key
                          ? 'bg-gray-900 text-white ring-1 ring-inset ring-gray-800 dark:bg-gray-700 dark:text-gray-50 dark:ring-gray-600'
                          : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-white',
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
                    class="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500"
                  >
                    My Downloads
                  </div>
                  <NuxtLink
                    to="/library/my-downloads"
                    :class="[
                      'block rounded-2xl border px-4 py-3 text-sm transition-all',
                      getSidebarItemClasses(isMyDownloadsActive),
                    ]"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p
                          :class="
                            isMyDownloadsActive
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'font-semibold'
                          "
                        >
                          My Downloads
                        </p>
                        <p
                          :class="
                            isMyDownloadsActive
                              ? 'mt-1 text-xs text-gray-700 dark:text-white'
                              : 'mt-1 text-xs text-gray-500 dark:text-gray-400'
                          "
                        >
                          Files you uploaded across the site
                        </p>
                      </div>
                      <span
                        :class="
                          isMyDownloadsActive
                            ? 'text-gray-700 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        "
                      >
                        ({{ ownedDownloadsCount }})
                      </span>
                    </div>
                  </NuxtLink>
                </div>

                <!-- Collections Section -->
                <div class="mb-8">
                  <div class="mb-4 flex items-center justify-between">
                    <h2
                      class="text-lg font-semibold tracking-[-0.03em] text-gray-900 dark:text-gray-100"
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
                          class="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500"
                        >
                          Favorites
                        </div>
                        <NuxtLink
                          v-for="collection in filteredFavorites"
                          :key="collection.id"
                          :to="`/library/${collection.id}`"
                          :class="[
                            'mb-2 block rounded-2xl border px-4 py-3 text-sm transition-all',
                            getSidebarItemClasses(activeLibraryItemId === collection.id),
                          ]"
                        >
                          <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                              <p class="font-semibold">
                                {{ collection.name.replace('Favorite ', '') }}
                                <span
                                  :class="
                                    activeLibraryItemId === collection.id
                                      ? 'text-gray-700 dark:text-white'
                                      : 'text-gray-500 dark:text-gray-400'
                                  "
                                >
                                  ({{ collection.itemCount }})</span
                                >
                              </p>
                              <p
                                :class="
                                  activeLibraryItemId === collection.id
                                    ? 'mt-1 text-xs capitalize text-gray-700 dark:text-white'
                                    : 'mt-1 text-xs capitalize text-gray-500 dark:text-gray-400'
                                "
                              >
                                {{ collection.visibility.toLowerCase() }}
                              </p>
                            </div>
                            <span
                              :class="
                                activeLibraryItemId === collection.id
                                  ? 'text-xs font-medium uppercase tracking-[0.18em] text-gray-700 dark:text-white'
                                  : 'text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500'
                              "
                            >
                              Fav
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
                          class="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500"
                        >
                          Custom Collections
                        </div>
                        <NuxtLink
                          v-for="collection in filteredCustom"
                          :key="collection.id"
                          :to="`/library/${collection.id}`"
                          :class="[
                            'mb-2 block rounded-2xl border px-4 py-3 text-sm transition-all',
                            getSidebarItemClasses(activeLibraryItemId === collection.id),
                          ]"
                        >
                          <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                              <p class="font-semibold">
                                {{ collection.name }}
                                <span
                                  :class="
                                    activeLibraryItemId === collection.id
                                      ? 'text-gray-700 dark:text-white'
                                      : 'text-gray-500 dark:text-gray-400'
                                  "
                                >
                                  ({{ collection.itemCount }})</span
                                >
                              </p>
                              <div class="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  :class="[
                                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                                    getCollectionTypeInfo(
                                      collection.collectionType,
                                      activeLibraryItemId === collection.id
                                    ).color,
                                  ]"
                                >
                                  {{
                                    collection.collectionType
                                      .toLowerCase()
                                      .replace('_', ' ')
                                  }}
                                </span>
                                <span
                                  :class="
                                    activeLibraryItemId === collection.id
                                      ? 'text-xs capitalize text-gray-700 dark:text-white'
                                      : 'text-xs capitalize text-gray-500 dark:text-gray-400'
                                  "
                                >
                                  {{ collection.visibility.toLowerCase() }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </NuxtLink>
                      </div>

                      <!-- Empty state -->
                      <div
                        v-if="
                          filteredFavorites.length === 0 &&
                          filteredCustom.length === 0
                        "
                        class="rounded-2xl border border-dashed border-gray-300/80 px-3 py-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400"
                      >
                        {{
                          searchTerm
                            ? `No collections match "${searchTerm}".`
                            : 'No collections yet. Start adding items to create your first collection!'
                        }}
                      </div>
                    </template>
                  </nav>
                </div>
              </div>
            </div>
            <!-- Main content area -->
            <div
              class="w-full flex-1 overflow-hidden rounded-[2rem] border border-gray-300/80 bg-white shadow-[0_30px_90px_-50px_rgba(38,38,38,0.26)] backdrop-blur dark:border-gray-700 dark:bg-gray-900 dark:shadow-[0_36px_100px_-56px_rgba(0,0,0,0.78)]"
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
