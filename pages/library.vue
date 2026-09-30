<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useHead, useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import type { Collection } from '@/__generated__/graphql';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import BookmarkIcon from '@/components/icons/BookmarkIcon.vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import {
  GET_USER_FAVORITE_COUNTS,
  GET_USER_OWNED_DOWNLOADS_COUNT,
  GET_UPLOADED_DOWNLOADABLE_FILES,
} from '@/graphQLData/user/queries';
import { GET_ALL_USER_COLLECTIONS } from '@/graphQLData/collection/queries';
import { useUsername, useIsAuthenticated } from '@/composables/useAuthState';
import { isAutoSavedDownloadsCollection } from '@/utils/downloadLibraryCollection';

type LibraryFilter =
  'all' | 'favorites' | 'collections' | 'images' | 'downloads';

type SidebarItem = {
  id: string;
  name: string;
  route: string;
  meta: string;
  collectionType: string;
  filterGroup: Exclude<LibraryFilter, 'all'>;
  itemCount: number;
};

const usernameVar = useUsername();
const isAuthenticatedVar = useIsAuthenticated();
const route = useRoute();

useHead({ title: 'Library' });

const activeFilter = ref<LibraryFilter>('all');
const searchTerm = ref('');
const isMobileNavOpen = ref(false);

const filterOptions: Array<{ key: LibraryFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'collections', label: 'Collections' },
  { key: 'images', label: 'Images' },
  { key: 'downloads', label: 'Downloads' },
];

const username = computed(() => usernameVar.value);
const isAuthenticated = computed(() => isAuthenticatedVar.value);
const queryOptions = () => ({
  enabled: Boolean(username.value) && isAuthenticated.value,
  fetchPolicy: 'cache-and-network' as const,
});
const queryVariables = () => ({ username: username.value });

const { result: favoriteCountsResult, refetch: refetchCounts } = useQuery(
  GET_USER_FAVORITE_COUNTS,
  queryVariables,
  queryOptions
);
const { result: ownedDownloadsCountResult, refetch: refetchOwnedDownloads } =
  useQuery(GET_USER_OWNED_DOWNLOADS_COUNT, queryVariables, queryOptions);
const { result: uploadedFilesResult, refetch: refetchUploadedFiles } = useQuery(
  GET_UPLOADED_DOWNLOADABLE_FILES,
  queryVariables,
  queryOptions
);
const { result: customCollectionsResult, refetch: refetchCustomCollections } =
  useQuery(GET_ALL_USER_COLLECTIONS, queryVariables, queryOptions);

watch(
  () => [username.value, isAuthenticated.value],
  ([nextUsername, nextIsAuthenticated]) => {
    if (!nextUsername || !nextIsAuthenticated) return;
    refetchCounts();
    refetchOwnedDownloads();
    refetchUploadedFiles();
    refetchCustomCollections();
  }
);

watch(
  () => route.path,
  () => {
    isMobileNavOpen.value = false;
  }
);

const favoriteCounts = computed(() => {
  const user = favoriteCountsResult.value?.users?.[0];
  return {
    channels: user?.FavoriteChannelsConnection?.totalCount || 0,
    discussions: user?.FavoriteDiscussionsConnection?.totalCount || 0,
    images: user?.FavoriteImagesConnection?.totalCount || 0,
    comments: user?.FavoriteCommentsConnection?.totalCount || 0,
    downloads: user?.FavoriteDownloadsConnection?.totalCount || 0,
  };
});

const favoriteTotal = computed(() =>
  Object.values(favoriteCounts.value).reduce((total, count) => total + count, 0)
);

const customCollections = computed<Collection[]>(
  () => customCollectionsResult.value?.users?.[0]?.Collections || []
);

const autoSavedDownloadsCollection = computed(() =>
  customCollections.value.find((collection) =>
    isAutoSavedDownloadsCollection(collection)
  )
);

const myDownloadsCount = computed(
  () =>
    autoSavedDownloadsCollection.value?.itemCount ??
    ownedDownloadsCountResult.value?.users?.[0]?.OwnedDownloadsAggregate
      ?.count ??
    0
);

const uploadedFilesCount = computed(() =>
  (uploadedFilesResult.value?.getUploadedDownloadableFiles || []).reduce(
    (total: number, group: { files?: unknown[] }) =>
      total + (group.files?.length || 0),
    0
  )
);

const sidebarItems = computed<SidebarItem[]>(() => {
  const fixedItems: SidebarItem[] = [
    {
      id: 'all-favorites',
      name: 'All favorites',
      route: '/library',
      meta: `Mixed · ${favoriteTotal.value} saved`,
      collectionType: 'FAVORITES',
      filterGroup: 'favorites',
      itemCount: favoriteTotal.value,
    },
    {
      id: 'my-downloads',
      name: 'My Downloads',
      route: '/library/my-downloads',
      meta: `Downloads · ${myDownloadsCount.value}`,
      collectionType: 'DOWNLOADS',
      filterGroup: 'downloads',
      itemCount: myDownloadsCount.value,
    },
    {
      id: 'uploaded-files',
      name: 'Uploaded Files',
      route: '/library/uploads',
      meta: `Files · ${uploadedFilesCount.value}`,
      collectionType: 'DOWNLOADS',
      filterGroup: 'downloads',
      itemCount: uploadedFilesCount.value,
    },
  ];

  const collectionItems = customCollections.value
    .filter(
      (collection) => collection.id !== autoSavedDownloadsCollection.value?.id
    )
    .map<SidebarItem>((collection) => ({
      id: collection.id,
      name: collection.name,
      route: `/library/${collection.id}`,
      meta: `${collection.collectionType.toLowerCase()} · ${collection.itemCount || 0} · ${collection.visibility.toLowerCase()}`,
      collectionType: collection.collectionType,
      filterGroup:
        collection.collectionType === 'IMAGES'
          ? 'images'
          : collection.collectionType === 'DOWNLOADS'
            ? 'downloads'
            : 'collections',
      itemCount: collection.itemCount || 0,
    }));

  return [...fixedItems, ...collectionItems];
});

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase());
const filteredSidebarItems = computed(() =>
  sidebarItems.value.filter((item) => {
    if (
      activeFilter.value !== 'all' &&
      item.filterGroup !== activeFilter.value
    ) {
      return false;
    }
    if (!normalizedSearch.value) return true;
    return `${item.name} ${item.meta}`
      .toLowerCase()
      .includes(normalizedSearch.value);
  })
);

const activeItemId = computed(() => {
  if (
    route.path === '/library' ||
    route.path.startsWith('/library/favorite-')
  ) {
    return 'all-favorites';
  }
  if (route.path === '/library/my-downloads') return 'my-downloads';
  if (route.path === '/library/uploads') return 'uploaded-files';
  return typeof route.params.collectionId === 'string'
    ? route.params.collectionId
    : '';
});

const activeItem = computed(
  () =>
    sidebarItems.value.find((item) => item.id === activeItemId.value) || null
);

const isLoading = computed(
  () =>
    isAuthenticated.value &&
    Boolean(username.value) &&
    !favoriteCountsResult.value &&
    !ownedDownloadsCountResult.value &&
    !uploadedFilesResult.value &&
    !customCollectionsResult.value
);

const itemIconLabel = (item: SidebarItem) => {
  if (item.id === 'all-favorites') return '★';
  if (item.collectionType === 'IMAGES') return 'I';
  if (item.collectionType === 'DOWNLOADS') return 'D';
  if (item.collectionType === 'COMMENTS') return 'C';
  if (item.collectionType === 'CHANNELS') return 'F';
  return 'L';
};
</script>

<template>
  <NuxtLayout>
    <div
      class="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-white"
    >
      <RequireAuth>
        <template #has-auth>
          <div class="mx-auto flex w-full max-w-[106rem] flex-col md:flex-row">
            <aside
              class="border-b border-gray-200 bg-white md:min-h-[calc(100vh-4rem)] md:w-[21rem] md:shrink-0 md:border-r md:border-b-0 dark:border-gray-800 dark:bg-gray-950"
            >
              <div class="p-4 md:sticky md:top-0 md:p-5">
                <div class="flex items-center justify-between gap-3">
                  <h1
                    class="text-2xl font-bold tracking-[-0.04em] text-gray-950 dark:text-white"
                  >
                    Your Library
                  </h1>
                  <BookmarkIcon class="text-brand-500 h-6 w-6" />
                </div>

                <div
                  class="scrollbar-hidden mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap"
                  aria-label="Filter library collections"
                >
                  <button
                    v-for="filter in filterOptions"
                    :key="filter.key"
                    type="button"
                    class="focus:ring-brand-500/30 shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium focus:ring-2 focus:outline-none"
                    :class="
                      activeFilter === filter.key
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-950'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    "
                    :aria-pressed="activeFilter === filter.key"
                    @click="activeFilter = filter.key"
                  >
                    {{ filter.label }}
                  </button>
                </div>

                <div class="mt-4 flex items-center gap-2">
                  <label class="relative min-w-0 flex-1">
                    <span class="sr-only">Search library collections</span>
                    <SearchIcon
                      class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="searchTerm"
                      type="search"
                      placeholder="Search your library"
                      aria-label="Search library collections"
                      class="focus:border-brand-500 focus:ring-brand-500/20 h-11 w-full rounded-xl border border-gray-300 bg-gray-50 pr-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </label>
                  <button
                    type="button"
                    class="focus:ring-brand-500/30 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 focus:ring-2 focus:outline-none md:hidden dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    :aria-expanded="isMobileNavOpen"
                    aria-controls="mobile-library-list"
                    aria-label="Toggle library list"
                    data-testid="mobile-library-nav-dropdown"
                    @click="isMobileNavOpen = !isMobileNavOpen"
                  >
                    <svg
                      class="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                  </button>
                </div>

                <ClientOnly>
                  <nav
                    id="mobile-library-list"
                    class="mt-3 space-y-1 md:block"
                    :class="isMobileNavOpen ? 'block' : 'hidden'"
                    aria-label="Your library"
                  >
                    <template v-if="isLoading">
                      <div
                        v-for="index in 6"
                        :key="index"
                        class="flex animate-pulse items-center gap-3 rounded-lg px-2 py-2"
                        aria-hidden="true"
                      >
                        <div
                          class="h-11 w-11 rounded-lg bg-gray-200 dark:bg-gray-800"
                        />
                        <div class="flex-1 space-y-2">
                          <div
                            class="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800"
                          />
                          <div
                            class="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800/70"
                          />
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <NuxtLink
                        v-for="item in filteredSidebarItems"
                        :key="item.id"
                        :to="item.route"
                        :data-testid="`library-item-${item.id}`"
                        class="focus:ring-brand-500/30 flex items-center gap-3 rounded-xl border px-2 py-2 text-left transition focus:ring-2 focus:outline-none"
                        :class="
                          activeItemId === item.id
                            ? 'border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/35 text-gray-950 dark:text-white'
                            : 'border-transparent text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-900'
                        "
                      >
                        <span
                          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-300"
                          :class="
                            item.id === 'all-favorites'
                              ? 'text-brand-600 dark:text-brand-300'
                              : ''
                          "
                          aria-hidden="true"
                        >
                          {{ itemIconLabel(item) }}
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-semibold">
                            {{ item.name }}
                          </span>
                          <span
                            class="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400"
                            aria-live="polite"
                          >
                            {{ item.meta }}
                          </span>
                        </span>
                      </NuxtLink>

                      <p
                        v-if="filteredSidebarItems.length === 0"
                        class="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
                      >
                        No library items match “{{ searchTerm }}”.
                      </p>
                    </template>
                  </nav>

                  <p
                    v-if="activeItem"
                    class="mt-3 truncate text-xs text-gray-500 md:hidden dark:text-gray-400"
                  >
                    Viewing {{ activeItem.name }}
                  </p>

                  <template #fallback>
                    <div
                      class="mt-3 space-y-1"
                      role="status"
                      aria-label="Loading library items"
                    >
                      <span class="sr-only">Loading library items…</span>
                      <div
                        v-for="index in 6"
                        :key="index"
                        class="flex animate-pulse items-center gap-3 rounded-lg px-2 py-2"
                        aria-hidden="true"
                      >
                        <div
                          class="h-11 w-11 rounded-lg bg-gray-200 dark:bg-gray-800"
                        />
                        <div class="flex-1 space-y-2">
                          <div
                            class="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800"
                          />
                          <div
                            class="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800/70"
                          />
                        </div>
                      </div>
                    </div>
                  </template>
                </ClientOnly>
              </div>
            </aside>

            <main
              id="main-content"
              class="min-w-0 flex-1 bg-white dark:bg-gray-950"
            >
              <NuxtPage />
            </main>
          </div>
        </template>

        <template #does-not-have-auth>
          <div class="mx-auto max-w-md px-4 py-16 text-center">
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
