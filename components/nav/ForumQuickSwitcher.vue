<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue';
import { useRouter } from 'nuxt/app';
import SearchBar from '@/components/SearchBar.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import ForumQuickSwitcherOption from '@/components/nav/ForumQuickSwitcherOption.vue';
import {
  GET_CHANNEL_NAMES,
  GET_USER_FAVORITE_CHANNELS,
} from '@/graphQLData/channel/queries';
import { GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS } from '@/graphQLData/collection/queries';
import { useUsername } from '@/composables/useAuthState';
import { createCaseInsensitivePattern } from '@/utils/searchUtils';
import { getLocalStorageItem } from '@/utils/localStorageUtils';
import type { ForumItem } from '@/types/forum';

type ForumOption = {
  uniqueName: string;
  displayName: string;
  channelIconURL: string;
};

type ForumSource = {
  uniqueName: string;
  displayName?: string | null;
  channelIconURL?: string | null;
};

type ForumCollection = {
  id: string;
  name: string;
  Channels?: ForumSource[] | null;
};

defineProps<{
  currentForumId: string;
}>();

const router = useRouter();
const username = useUsername();
const isOpen = ref(false);
const searchInput = ref('');
const recentForums = ref<ForumOption[]>([]);
const expandedCollectionIds = ref<Set<string>>(new Set());
const triggerRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);
const searchBarRef = ref<InstanceType<typeof SearchBar> | null>(null);

const { floatingStyles } = useFloating(triggerRef, floatingRef, {
  placement: 'bottom-start',
  strategy: 'fixed',
  middleware: [offset(6), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
});

const queryEnabled = computed(() => isOpen.value);
const authenticatedQueryEnabled = computed(
  () => isOpen.value && Boolean(username.value)
);

const { result: channelsResult, loading: channelsLoading } = useQuery(
  GET_CHANNEL_NAMES,
  computed(() => ({
    channelWhere: {
      uniqueName_MATCHES:
        createCaseInsensitivePattern(searchInput.value) || '.*',
    },
  })),
  {
    enabled: queryEnabled,
    fetchPolicy: 'cache-first',
  }
);

const { result: favoritesResult } = useQuery(
  GET_USER_FAVORITE_CHANNELS,
  computed(() => ({ username: username.value })),
  {
    enabled: authenticatedQueryEnabled,
    fetchPolicy: 'cache-first',
  }
);

const { result: collectionsResult } = useQuery(
  GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS,
  computed(() => ({ username: username.value })),
  {
    enabled: authenticatedQueryEnabled,
    fetchPolicy: 'cache-first',
  }
);

const normalizeForum = (forum: ForumSource): ForumOption => ({
  uniqueName: forum.uniqueName,
  displayName: forum.displayName || forum.uniqueName,
  channelIconURL: forum.channelIconURL || '',
});

const normalizedSearch = computed(() => searchInput.value.trim().toLowerCase());

const forumMatchesSearch = (forum: ForumOption) => {
  if (!normalizedSearch.value) return true;
  return (
    forum.uniqueName.toLowerCase().includes(normalizedSearch.value) ||
    forum.displayName.toLowerCase().includes(normalizedSearch.value)
  );
};

const visibleRecentForums = computed(() =>
  recentForums.value.filter(forumMatchesSearch)
);

const favoriteForums = computed<ForumOption[]>(() => {
  const favorites: ForumSource[] =
    favoritesResult.value?.users?.[0]?.FavoriteChannels || [];
  return favorites.map(normalizeForum).filter(forumMatchesSearch);
});

const forumCollections = computed(() => {
  const collections: ForumCollection[] =
    collectionsResult.value?.users?.[0]?.Collections || [];

  return collections
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      forums: (collection.Channels || [])
        .map(normalizeForum)
        .filter(forumMatchesSearch),
    }))
    .filter((collection) => collection.forums.length > 0);
});

const allForums = computed<ForumOption[]>(() => {
  const forums: ForumSource[] = channelsResult.value?.channels || [];
  return forums.map(normalizeForum);
});

const loadRecentForums = () => {
  const storedForums = getLocalStorageItem<ForumItem[]>('recentForums', []);
  recentForums.value = [...storedForums]
    .filter((forum) => forum && typeof forum.uniqueName === 'string')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(normalizeForum);
};

const close = () => {
  isOpen.value = false;
  searchInput.value = '';
  expandedCollectionIds.value = new Set();
};

const toggle = async () => {
  if (isOpen.value) {
    close();
    return;
  }

  // This only runs after a user interaction, so browser-persisted recents can
  // never change the server-rendered or initial hydration markup.
  loadRecentForums();
  isOpen.value = true;
  await nextTick();
  searchBarRef.value?.focus();
};

const goToForum = async (uniqueName: string) => {
  close();
  await router.push({
    name: 'forums-forumId-discussions',
    params: { forumId: uniqueName },
  });
};

const toggleCollection = (collectionId: string) => {
  const nextIds = new Set(expandedCollectionIds.value);
  if (nextIds.has(collectionId)) {
    nextIds.delete(collectionId);
  } else {
    nextIds.add(collectionId);
  }
  expandedCollectionIds.value = nextIds;
};

const collectionIsExpanded = (collectionId: string) =>
  Boolean(normalizedSearch.value) ||
  expandedCollectionIds.value.has(collectionId);

const handleSearch = (value: string) => {
  searchInput.value = value;
};

const onDocumentPointerDown = (event: PointerEvent) => {
  const target = event.target as Node;
  if (
    triggerRef.value?.contains(target) ||
    floatingRef.value?.contains(target)
  ) {
    return;
  }
  close();
};

const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close();
    triggerRef.value?.focus();
  }
};

watch(isOpen, (open) => {
  if (!import.meta.client) return;
  if (open) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    document.addEventListener('keydown', onDocumentKeydown);
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<template>
  <div class="min-w-0">
    <button
      ref="triggerRef"
      type="button"
      data-testid="forum-quick-switcher-trigger"
      class="hover:text-gray-950 flex min-w-0 max-w-[9.5rem] items-center gap-1 rounded-md px-1 py-1 text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white sm:max-w-[13.5rem] lg:max-w-[17.5rem]"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      aria-label="Switch forum"
      @click="toggle"
    >
      <span class="truncate">{{ currentForumId }}</span>
      <ChevronDownIcon
        class="h-3.5 w-3.5 shrink-0 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        aria-hidden="true"
      />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="floatingRef"
        :style="floatingStyles"
        class="z-[10000] w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        role="dialog"
        aria-label="Switch forum"
        data-testid="forum-quick-switcher"
      >
        <div class="border-b border-gray-200 p-3 dark:border-gray-700">
          <SearchBar
            ref="searchBarRef"
            :initial-value="searchInput"
            search-placeholder="Search forums"
            test-id="forum-quick-switcher-search"
            :debounce-ms="200"
            @update-search-input="handleSearch"
            @submit="handleSearch"
          />
        </div>

        <div class="max-h-[min(32rem,calc(100vh-6rem))] overflow-y-auto p-2">
          <section v-if="visibleRecentForums.length > 0" class="mb-2">
            <h2
              class="font-semibold px-2 py-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Recent forums
            </h2>
            <ForumQuickSwitcherOption
              v-for="forum in visibleRecentForums"
              :key="`recent-${forum.uniqueName}`"
              :forum="forum"
              :active="forum.uniqueName === currentForumId"
              @select="goToForum"
            />
          </section>

          <section v-if="favoriteForums.length > 0" class="mb-2">
            <h2
              class="font-semibold px-2 py-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Favorite forums
            </h2>
            <ForumQuickSwitcherOption
              v-for="forum in favoriteForums"
              :key="`favorite-${forum.uniqueName}`"
              :forum="forum"
              :active="forum.uniqueName === currentForumId"
              @select="goToForum"
            />
          </section>

          <section v-if="forumCollections.length > 0" class="mb-2">
            <h2
              class="font-semibold px-2 py-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Forum lists
            </h2>
            <div v-for="collection in forumCollections" :key="collection.id">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                :aria-expanded="collectionIsExpanded(collection.id)"
                @click="toggleCollection(collection.id)"
              >
                <span class="truncate">{{ collection.name }}</span>
                <span
                  class="ml-2 flex shrink-0 items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ collection.forums.length }}
                  <ChevronDownIcon
                    class="h-3 w-3 transition-transform"
                    :class="{
                      'rotate-180': collectionIsExpanded(collection.id),
                    }"
                    aria-hidden="true"
                  />
                </span>
              </button>
              <div
                v-if="collectionIsExpanded(collection.id)"
                class="ml-3 border-l border-gray-200 pl-1 dark:border-gray-700"
              >
                <ForumQuickSwitcherOption
                  v-for="forum in collection.forums"
                  :key="`${collection.id}-${forum.uniqueName}`"
                  :forum="forum"
                  :active="forum.uniqueName === currentForumId"
                  compact
                  @select="goToForum"
                />
              </div>
            </div>
          </section>

          <section>
            <h2
              class="font-semibold px-2 py-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              {{ normalizedSearch ? 'Search results' : 'Top forums' }}
            </h2>
            <div
              v-if="channelsLoading && allForums.length === 0"
              class="px-2 py-3 text-sm text-gray-500 dark:text-gray-400"
            >
              Loading forums...
            </div>
            <div
              v-else-if="allForums.length === 0"
              class="px-2 py-3 text-sm text-gray-500 dark:text-gray-400"
            >
              No forums found
            </div>
            <ForumQuickSwitcherOption
              v-for="forum in allForums"
              :key="`all-${forum.uniqueName}`"
              :forum="forum"
              :active="forum.uniqueName === currentForumId"
              @select="goToForum"
            />
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
