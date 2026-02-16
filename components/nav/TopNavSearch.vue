<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'nuxt/app';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import { getChannelLabel } from '@/utils';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/localStorageUtils';

type SearchType =
  | 'discussions'
  | 'comments'
  | 'downloads'
  | 'forums'
  | 'wiki'
  | 'eventsOnline'
  | 'eventsInPerson';
type ModifiedRange = 'all' | 'last7' | 'last30' | 'thisYear' | 'lastYear';

type RecentSearch = {
  query: string;
  type: SearchType;
  modified: ModifiedRange;
  forums: string[];
  timestamp: number;
};

const SEARCH_RECENTS_KEY = 'sitewideSearchRecents';
const MAX_RECENTS = 6;

const props = withDefaults(
  defineProps<{
    iconOnly?: boolean;
  }>(),
  {
    iconOnly: false,
  }
);

const router = useRouter();
const rootRef = ref<HTMLElement | null>(null);
const searchBarRef = ref<{
  focus?: () => void;
  getValue?: () => string;
} | null>(null);

const searchInput = ref('');
const selectedType = ref<SearchType>('discussions');
const selectedModified = ref<ModifiedRange>('all');
const selectedForums = ref<string[]>([]);
const showPopover = ref(false);
const recentSearches = ref<RecentSearch[]>([]);

const typeOptions: Array<{ value: SearchType; label: string }> = [
  { value: 'discussions', label: 'Discussions' },
  { value: 'comments', label: 'Comments' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'forums', label: 'Forums' },
  { value: 'wiki', label: 'Wiki' },
  { value: 'eventsOnline', label: 'Events (Online)' },
  { value: 'eventsInPerson', label: 'Events (In person)' },
];

const modifiedOptions: Array<{ value: ModifiedRange; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
];

const typeLabel = computed(() => {
  const match = typeOptions.find(
    (option) => option.value === selectedType.value
  );
  return match?.label || 'Discussions';
});

const modifiedLabel = computed(() => {
  const match = modifiedOptions.find(
    (option) => option.value === selectedModified.value
  );
  return match?.label || 'All';
});

const forumLabel = computed(() => getChannelLabel(selectedForums.value));

const openPopover = () => {
  showPopover.value = true;
};

const openPopoverAndFocus = () => {
  openPopover();
  nextTick(() => {
    focusSearch();
  });
};

const togglePopoverAndFocus = () => {
  if (showPopover.value) {
    closePopover();
    return;
  }
  openPopoverAndFocus();
};

const closePopover = () => {
  showPopover.value = false;
};

const handleSearchInput = (value: string) => {
  searchInput.value = value;
};

const toggleSelectedForum = (forum: string) => {
  const index = selectedForums.value.indexOf(forum);
  if (index === -1) {
    selectedForums.value.push(forum);
  } else {
    selectedForums.value.splice(index, 1);
  }
};

const buildQuery = () => {
  const trimmedInput = searchInput.value.trim();
  const query: Record<string, string | string[] | undefined> = {
    searchInput: trimmedInput || undefined,
    type: selectedType.value,
    searchOpen: 'true',
    modified:
      selectedModified.value === 'all' ? undefined : selectedModified.value,
    channels: selectedForums.value.length
      ? [...selectedForums.value]
      : undefined,
  };

  return query;
};

const recordRecentSearch = () => {
  if (!searchInput.value.trim()) {
    return;
  }

  const recent: RecentSearch = {
    query: searchInput.value.trim(),
    type: selectedType.value,
    modified: selectedModified.value,
    forums: [...selectedForums.value],
    timestamp: Date.now(),
  };

  const next = [recent, ...recentSearches.value].filter((item, index, self) => {
    const matchIndex = self.findIndex(
      (other) =>
        other.query === item.query &&
        other.type === item.type &&
        other.modified === item.modified &&
        other.forums.join('|') === item.forums.join('|')
    );
    return matchIndex === index;
  });

  recentSearches.value = next.slice(0, MAX_RECENTS);
  setLocalStorageItem(SEARCH_RECENTS_KEY, recentSearches.value);
};

const executeSearch = (value?: string | Event) => {
  if (value && typeof value !== 'string') {
    value = undefined;
  }
  const nextValue =
    typeof value === 'string'
      ? value
      : (searchBarRef.value?.getValue?.() ?? searchInput.value);
  if (typeof nextValue === 'string') {
    searchInput.value = nextValue;
  }
  recordRecentSearch();
  const query = buildQuery();

  const routes: Record<SearchType, string> = {
    discussions: '/discussions',
    comments: '/comments/search',
    downloads: '/downloads',
    forums: '/forums',
    wiki: '/wiki/search',
    eventsOnline: '/events/list/search',
    eventsInPerson: '/map/search',
  };

  router.push({
    path: routes[selectedType.value],
    query,
  });
  closePopover();
};

const runRecentSearch = (recent: RecentSearch) => {
  searchInput.value = recent.query;
  selectedType.value = recent.type;
  selectedModified.value = recent.modified;
  selectedForums.value = [...recent.forums];
  executeSearch(recent.query);
};

const focusSearch = () => {
  if (searchBarRef.value?.focus) {
    searchBarRef.value.focus();
  }
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' || tagName === 'textarea' || target.isContentEditable
  );
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    if (isTypingTarget(event.target)) {
      return;
    }
    event.preventDefault();
    openPopoverAndFocus();
  }

  if (event.key === 'Escape') {
    closePopover();
  }
};

const handleDocumentClick = (event: MouseEvent) => {
  if (!rootRef.value) return;
  const target = event.target as HTMLElement | null;
  if (target && target.closest('.popper')) {
    return;
  }
  if (!rootRef.value.contains(event.target as Node)) {
    closePopover();
  }
};

onMounted(() => {
  recentSearches.value = getLocalStorageItem<RecentSearch[]>(
    SEARCH_RECENTS_KEY,
    []
  );
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('mousedown', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('mousedown', handleDocumentClick);
});
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
    :class="props.iconOnly ? 'w-auto' : 'w-full max-w-xl'"
  >
    <button
      v-if="props.iconOnly"
      type="button"
      data-testid="mobile-top-nav-search-button"
      aria-label="Open search"
      class="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-gray-300 dark:hover:text-white"
      @click="togglePopoverAndFocus"
    >
      <SearchIcon class="h-5 w-5" />
    </button>
    <div
      v-else
      class="w-full"
      @click="openPopover"
      @focusin="openPopover"
    >
      <SearchBar
        ref="searchBarRef"
        :auto-focus="false"
        :initial-value="searchInput"
        :search-placeholder="'Search ( / )'"
        :small="true"
        :test-id="'top-nav-search-input'"
        :debounce-ms="0"
        @update-search-input="handleSearchInput"
        @submit="executeSearch"
      />
    </div>
    <div
      v-if="showPopover"
      class="z-30 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
      :class="
        props.iconOnly
          ? 'fixed left-2 right-2 top-[3.75rem]'
          : 'absolute left-0 right-0 mt-2 min-w-[20rem] md:min-w-[28rem]'
      "
    >
      <div v-if="props.iconOnly" class="border-b border-gray-200 p-3 dark:border-gray-700">
        <SearchBar
          ref="searchBarRef"
          :auto-focus="false"
          :initial-value="searchInput"
          :search-placeholder="'Search ( / )'"
          :small="true"
          :test-id="'top-nav-search-input-mobile'"
          :debounce-ms="0"
          @update-search-input="handleSearchInput"
          @submit="executeSearch"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2 p-3">
        <FilterChip :label="`Type: ${typeLabel}`">
          <template #content>
            <div class="min-w-[220px]">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                :class="[
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                  selectedType === option.value
                    ? 'bg-orange-50 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100'
                    : 'text-gray-700 dark:text-gray-200',
                ]"
                @click="selectedType = option.value"
              >
                <span>{{ option.label }}</span>
                <i
                  v-if="selectedType === option.value"
                  class="fa-solid fa-check text-xs text-orange-500"
                />
              </button>
            </div>
          </template>
        </FilterChip>
        <FilterChip :label="`Date: ${modifiedLabel}`">
          <template #content>
            <div class="min-w-[220px]">
              <button
                v-for="option in modifiedOptions"
                :key="option.value"
                type="button"
                :class="[
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                  selectedModified === option.value
                    ? 'bg-orange-50 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100'
                    : 'text-gray-700 dark:text-gray-200',
                ]"
                @click="selectedModified = option.value"
              >
                <span>{{ option.label }}</span>
                <i
                  v-if="selectedModified === option.value"
                  class="fa-solid fa-check text-xs text-orange-500"
                />
              </button>
            </div>
          </template>
        </FilterChip>
        <FilterChip :label="forumLabel">
          <template #icon>
            <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
          </template>
          <template #content>
            <div class="relative w-96">
              <SearchableForumList
                :selected-channels="selectedForums"
                @toggle-selection="toggleSelectedForum"
              />
            </div>
          </template>
        </FilterChip>
        <button
          type="button"
          class="ml-auto rounded-md bg-orange-500 px-3 py-1.5 text-sm font-bold text-black hover:bg-orange-600"
          @click="executeSearch"
        >
          Search
        </button>
      </div>
      <div class="border-t border-gray-200 dark:border-gray-700">
        <div
          class="px-3 py-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          Recent searches
        </div>
        <div
          v-if="recentSearches.length === 0"
          class="px-3 pb-3 text-sm text-gray-500 dark:text-gray-400"
        >
          No recent searches yet.
        </div>
        <ul
          v-else
          class="max-h-56 overflow-y-auto pb-2"
          tabindex="0"
          aria-label="Recent searches"
        >
          <li
            v-for="recent in recentSearches"
            :key="recent.timestamp"
            class="px-3 py-2"
          >
            <button
              type="button"
              class="w-full text-left text-sm hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-gray-800"
              @click="runRecentSearch(recent)"
            >
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ recent.query }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{
                  typeOptions.find((o) => o.value === recent.type)?.label || ''
                }}
                •
                {{
                  modifiedOptions.find((o) => o.value === recent.modified)
                    ?.label || 'All'
                }}
                •
                {{
                  recent.forums.length
                    ? `Forums (${recent.forums.length})`
                    : 'All forums'
                }}
              </div>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
