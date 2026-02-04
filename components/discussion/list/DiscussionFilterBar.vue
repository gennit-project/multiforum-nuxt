<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import TagIcon from '@/components/icons/TagIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import SearchableTagList from '@/components/SearchableTagList.vue';
import SortButtons from '@/components/SortButtons.vue';
import { getFilterValuesFromParams } from './getDiscussionFilterValuesFromParams';
import type { SearchDiscussionValues } from '@/types/Discussion';
import FilterIcon from '@/components/icons/FilterIcon.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import {
  useFilterBar,
  DEFAULT_FILTER_LABELS,
} from '@/composables/useFilterBar';
import { updateFilters } from '@/utils/routerUtils';

defineProps({
  isForumScoped: {
    type: Boolean,
    default: false,
  },
  loadedEventCount: {
    type: Number,
    default: 0,
  },
  resultCount: {
    type: Number,
    default: 0,
  },
});

// Use shared filter bar composable
const {
  route,
  router,
  channelId,
  filterValues,
  channelLabel,
  tagLabel,
  updateSearchInput,
  updateShowArchived,
  toggleSelectedChannel,
  toggleSelectedTag,
  updateFilter,
} = useFilterBar<SearchDiscussionValues>({
  getFilterValuesFromParams,
});

// Default filter labels (use shared constant)
const defaultFilterLabels = DEFAULT_FILTER_LABELS;

const shouldOpenSearch = () => {
  const hasSearchOpen = route.query.searchOpen === 'true';
  const hasSearchInput =
    typeof route.query.searchInput === 'string' &&
    route.query.searchInput.trim().length > 0;
  return hasSearchOpen || hasSearchInput;
};

const showFilters = ref(false);
const showSearch = ref(shouldOpenSearch());

// Watch for route query changes to update search visibility
watch(
  () => route.query,
  () => {
    if (shouldOpenSearch()) {
      showSearch.value = true;
    }
  }
);

// Check if we're on the downloads page
const isDownloadPage = computed(() => {
  return route.name && route.name.toString().includes('downloads');
});

const updateShowUnanswered = (event: Event) => {
  const checkbox = event.target as HTMLInputElement;
  updateFilter('showUnanswered', checkbox.checked);
};

// Get UI store for expand/collapse functionality
const uiStore = useUIStore();
const { expandChannelDiscussions, expandSitewideDiscussions } =
  storeToRefs(uiStore);

const toggleShowFilters = () => {
  showFilters.value = !showFilters.value;
};

const toggleShowSearch = () => {
  showSearch.value = !showSearch.value;
  updateFilters({
    router,
    route,
    params: { searchOpen: showSearch.value ? 'true' : undefined },
  });
};

const expandAll = () => {
  // Pass true for expand and the appropriate isChannelView flag
  uiStore.toggleExpandDiscussions(true, !!channelId.value);
};

const collapseAll = () => {
  // Pass false for collapse and the appropriate isChannelView flag
  uiStore.toggleExpandDiscussions(false, !!channelId.value);
};

const isExpanded = computed(() => {
  if (channelId.value) {
    return expandChannelDiscussions.value;
  }
  return expandSitewideDiscussions.value;
});
</script>

<template>
  <div class="pb-2 pt-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1
        class="font-semibold h-9 px-4 text-xl leading-9 dark:text-white lg:px-0"
      >
        Discuss
      </h1>
      <div class="flex flex-wrap items-center justify-end gap-1">
        <FilterChip
          v-if="!isForumScoped"
          class="align-middle"
          :data-testid="'forum-filter-button'"
          :label="channelLabel"
          :highlighted="
            filterValues.channels && filterValues.channels.length > 0
          "
        >
          <template #icon>
            <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
          </template>
          <template #content>
            <div class="relative w-96">
              <SearchableForumList
                :selected-channels="filterValues.channels"
                @toggle-selection="toggleSelectedChannel"
              />
            </div>
          </template>
        </FilterChip>
        <!-- Expand/Collapse Button Group (hidden in download mode) -->
        <div
          v-if="!isDownloadPage"
          class="flex overflow-hidden rounded-md border border-gray-300 dark:border-gray-600"
        >
          <button
            data-testid="expand-all-button"
            aria-label="Expand all discussions"
            :aria-pressed="isExpanded"
            :class="[
              // layout
              'flex h-9 items-center border-l px-2 transition-colors first:border-none',
              // base (non‑active) colours
              !isExpanded
                ? 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-white',
              // hover shade (one step darker) – always present
              'hover:bg-orange-200 hover:text-orange-900 dark:hover:bg-orange-600 dark:hover:text-white',
            ]"
            title="Expand all discussions"
            @click="expandAll"
          >
            <i class="fa-solid fa-expand text-xs" />
          </button>
          <button
            aria-label="Collapse all discussions"
            :aria-pressed="!isExpanded"
            :class="[
              'flex h-9 items-center border-l px-2 transition-colors',
              isExpanded
                ? 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-white',
              'hover:bg-orange-200 hover:text-orange-900 dark:hover:bg-orange-600 dark:hover:text-white',
            ]"
            title="Collapse all discussions"
            @click="collapseAll"
          >
            <i class="fa-solid fa-compress text-xs" />
          </button>
        </div>
        <button
          data-testid="discussion-filter-button"
          :aria-label="showFilters ? 'Hide filters' : 'Show filters'"
          :title="showFilters ? 'Hide filters' : 'Show filters'"
          :class="
            showFilters
              ? 'border-orange-500'
              : 'border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-300'
          "
          class="flex h-9 items-center gap-1 rounded-md border px-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          @click="
            (event) => {
              event.preventDefault();
              toggleShowFilters();
            }
          "
        >
          <FilterIcon />
        </button>
        <button
          data-testid="discussion-search-button"
          :aria-label="showSearch ? 'Hide search' : 'Show search'"
          :title="showSearch ? 'Hide search' : 'Show search'"
          :class="
            showSearch
              ? 'border-orange-500'
              : 'border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-300'
          "
          class="flex h-9 items-center gap-1 rounded-md border px-1.5 text-gray-800 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          @click="
            (event) => {
              event.preventDefault();
              toggleShowSearch();
            }
          "
        >
          <SearchIcon />
        </button>
        <SortButtons />
        <div v-if="!isDownloadPage">
          <RequireAuth :full-width="false">
            <template #has-auth>
              <PrimaryButton
                :label="isDownloadPage ? 'New Upload' : 'New Post'"
                @click="
                  $router.push(
                    isForumScoped
                      ? isDownloadPage
                        ? `/forums/${channelId}/downloads/create`
                        : `/forums/${channelId}/discussions/create`
                      : '/discussions/create'
                  )
                "
              />
            </template>
            <template #does-not-have-auth>
              <PrimaryButton
                :label="isDownloadPage ? 'New Upload' : 'New Post'"
              />
            </template>
          </RequireAuth>
        </div>
      </div>
    </div>
    <hr class="mt-2 border border-t-gray-500 dark:border-t-gray-600" >
    <div
      v-if="showSearch"
      class="flex flex-col gap-2 bg-gray-100 py-2 dark:bg-gray-700 dark:text-gray-300"
    >
      <SearchBar
        data-testid="discussion-filter-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search'"
        :auto-focus="true"
        :small="true"
        :left-side-is-rounded="false"
        :right-side-is-rounded="false"
        @update-search-input="updateSearchInput"
      />
    </div>
    <div
      v-if="showFilters"
      class="flex justify-end gap-2 bg-gray-100 py-2 dark:bg-gray-700 dark:text-gray-300"
    >
      <FilterChip
        class="align-middle"
        :data-testid="'tag-filter-button'"
        :label="tagLabel"
        :highlighted="tagLabel !== defaultFilterLabels.tags"
      >
        <template #icon>
          <TagIcon class="-ml-0.5 mr-2 h-4 w-4" />
        </template>
        <template #content>
          <div class="relative w-96">
            <SearchableTagList
              :selected-tags="filterValues.tags"
              @toggle-selection="toggleSelectedTag"
            />
          </div>
        </template>
      </FilterChip>
      <div v-if="isForumScoped" class="pr-2 text-sm">
        <CheckBox
          data-testid="show-archived-discussions"
          :checked="filterValues.showArchived"
          :label="
            isDownloadPage
              ? 'Show archived downloads'
              : 'Show archived discussions'
          "
          @input="updateShowArchived"
        />
      </div>
      <div v-if="isForumScoped && !isDownloadPage" class="pr-2 text-sm">
        <CheckBox
          data-testid="show-unanswered-discussions"
          :checked="filterValues.showUnanswered"
          :label="'Show unanswered discussions'"
          @input="updateShowUnanswered"
        />
      </div>
    </div>
  </div>
</template>
