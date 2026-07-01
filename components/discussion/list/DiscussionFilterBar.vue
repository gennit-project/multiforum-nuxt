<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import TagIcon from '@/components/icons/TagIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import SearchableTagList from '@/components/SearchableTagList.vue';
import SortButtons from '@/components/SortButtons.vue';
import { getDiscussionFilterValuesFromParams } from '@/utils/getDiscussionFilterValuesFromParams';
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

const emit = defineEmits(['openAbout']);

defineProps({
  isForumScoped: {
    type: Boolean,
    default: false,
  },
  showAboutButton: {
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
  getFilterValuesFromParams: getDiscussionFilterValuesFromParams,
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
  <div class="pb-3 pt-3">
    <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <h1
        class="font-semibold h-9 px-4 text-xl leading-9 dark:text-white lg:px-0"
      >
        Discuss
      </h1>
      <div class="flex items-center gap-2">
        <button
          v-if="showAboutButton"
          type="button"
          class="hidden items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 md:inline-flex lg:hidden"
          @click="emit('openAbout')"
        >
          About
        </button>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-3">
        <div v-if="!isForumScoped" class="flex items-center">
          <FilterChip
            class="align-middle"
            :data-testid="'forum-filter-button'"
            :label="channelLabel"
            :highlighted="
              filterValues.channels && filterValues.channels.length > 0
            "
          >
            <template #icon>
              <ChannelIcon class="h-4 w-4" />
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
        </div>
        <div
          v-if="!isDownloadPage"
          class="flex overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-slate-600 dark:bg-none dark:bg-slate-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <button
            data-testid="expand-all-button"
            aria-label="Expand all discussions"
            :aria-pressed="isExpanded"
            :class="[
              'flex h-10 w-10 items-center justify-center transition-colors',
              isExpanded
                ? 'bg-gray-900 text-white dark:bg-slate-700 dark:text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800',
            ]"
            title="Expand all discussions"
            @click="expandAll"
          >
            <i class="fa-solid fa-expand text-xs" />
          </button>
          <div class="w-px bg-gray-200 dark:bg-slate-600" />
          <button
            aria-label="Collapse all discussions"
            :aria-pressed="!isExpanded"
            :class="[
              'flex h-10 w-10 items-center justify-center transition-colors',
              !isExpanded
                ? 'bg-gray-900 text-white dark:bg-slate-700 dark:text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800',
            ]"
            title="Collapse all discussions"
            @click="collapseAll"
          >
            <i class="fa-solid fa-compress text-xs" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            data-testid="discussion-filter-button"
            :aria-label="showFilters ? 'Hide filters' : 'Show filters'"
            :title="showFilters ? 'Hide filters' : 'Show filters'"
            :class="
              showFilters
                ? 'border-gray-400 bg-gray-100 text-gray-900 dark:border-slate-500 dark:bg-slate-800 dark:text-white'
                : 'border-gray-200 text-gray-700 dark:border-slate-600 dark:text-gray-300'
            "
            class="flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-b from-white to-gray-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:bg-none dark:bg-slate-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
            @click="
              (event) => {
                event.preventDefault();
                toggleShowFilters();
              }
            "
          >
            <FilterIcon class="h-4 w-4" />
          </button>
          <button
            data-testid="discussion-search-button"
            :aria-label="showSearch ? 'Hide search' : 'Show search'"
            :title="showSearch ? 'Hide search' : 'Show search'"
            :class="
              showSearch
                ? 'border-gray-400 bg-gray-100 text-gray-900 dark:border-slate-500 dark:bg-slate-800 dark:text-white'
                : 'border-gray-200 text-gray-700 dark:border-slate-600 dark:text-gray-300'
            "
            class="flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-b from-white to-gray-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:bg-none dark:bg-slate-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
            @click="
              (event) => {
                event.preventDefault();
                toggleShowSearch();
              }
            "
          >
            <SearchIcon class="h-4 w-4" />
          </button>
        </div>
        <div class="flex items-center">
          <SortButtons />
        </div>
        <div v-if="!isDownloadPage" class="flex items-center">
          <RequireAuth :full-width="false">
            <template #has-auth>
              <PrimaryButton
                class="h-10 rounded-lg border-gray-400 bg-gradient-to-b from-gray-700 to-gray-800 px-4 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:from-gray-600 hover:to-gray-700 dark:border-slate-500 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700"
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
                class="h-10 rounded-lg border-gray-400 bg-gradient-to-b from-gray-700 to-gray-800 px-4 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:from-gray-600 hover:to-gray-700 dark:border-slate-500 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700"
                :label="isDownloadPage ? 'New Upload' : 'New Post'"
              />
            </template>
          </RequireAuth>
        </div>
      </div>
    </div>
    <hr class="mt-3 border-t border-gray-200 dark:border-slate-700" >
    <div
      v-if="showSearch"
      class="mt-3 flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-100/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/80 dark:text-gray-300"
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
      class="mt-3 flex flex-wrap justify-end gap-2 rounded-xl border border-gray-200 bg-gray-100/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/80 dark:text-gray-300"
    >
      <FilterChip
        class="align-middle"
        :data-testid="'tag-filter-button'"
        :label="tagLabel"
        :highlighted="tagLabel !== defaultFilterLabels.tags"
      >
        <template #icon>
          <TagIcon class="h-4 w-4" />
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
