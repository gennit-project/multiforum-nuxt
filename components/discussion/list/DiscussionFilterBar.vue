<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import TagIcon from '@/components/icons/TagIcon.vue';
import SortButtons from '@/components/SortButtons.vue';
import ListIcon from '@/components/icons/ListIcon.vue';
import { getDiscussionFilterValuesFromParams } from '@/utils/getDiscussionFilterValuesFromParams';
import type { SearchDiscussionValues } from '@/types/Discussion';
import ExpandRowsIcon from '@/components/icons/ExpandRowsIcon.vue';
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

const SearchableForumList = defineAsyncComponent(
  () => import('@/components/channel/SearchableForumList.vue')
);
const SearchableTagList = defineAsyncComponent(
  () => import('@/components/SearchableTagList.vue')
);

const emit = defineEmits(['openAbout']);

const props = defineProps({
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

const newPostButton = PrimaryButton;
// Shared styling for the icon toggle buttons (filter, search) so every control in
// the bar has the same height, text size/weight, and border weight/color.
const barButtonBase =
  'flex h-9 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-200';
const barButtonInactive =
  'border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-300';
const barButtonActive =
  'border-gray-500 bg-gray-100 text-gray-900 dark:border-gray-400 dark:bg-gray-800 dark:text-white';

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
const showSearch = ref(!props.isForumScoped || shouldOpenSearch());

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
  <div class="py-3">
    <div
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="min-w-fit px-4 lg:px-0">
        <h1 class="text-xl leading-7 font-semibold dark:text-white">
          {{ isForumScoped ? 'Discuss' : 'Discussions' }}
        </h1>
        <p
          v-if="!isForumScoped"
          class="text-sm text-gray-600 dark:text-gray-400"
        >
          One topic. Different conversations.
        </p>
      </div>
      <div
        class="flex w-full flex-wrap items-center gap-1 px-4 lg:w-auto lg:flex-1 lg:justify-end lg:px-0"
      >
        <SearchBar
          v-if="!isForumScoped"
          class="mb-1 min-w-56 basis-full sm:mr-1 sm:mb-0 sm:basis-72 lg:max-w-80 lg:flex-1"
          data-testid="discussion-filter-search-bar"
          :initial-value="filterValues.searchInput"
          search-placeholder="Search discussions"
          :auto-focus="false"
          :small="true"
          @update-search-input="updateSearchInput"
        />
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
            <ChannelIcon class="mr-2 -ml-0.5 h-4 w-4" />
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
          class="flex h-9 overflow-hidden rounded-md border border-gray-300 dark:border-gray-600"
        >
          <button
            data-testid="expand-all-button"
            aria-label="Expand all discussions"
            :aria-pressed="isExpanded"
            :class="[
              // layout
              'flex h-full items-center border-l px-2 transition-colors first:border-none',
              // selected state gets a light tint; unselected stays low-emphasis
              isExpanded
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                : 'bg-transparent text-gray-400 dark:text-gray-500',
              // hover
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200',
            ]"
            title="Expand all discussions"
            @click="expandAll"
          >
            <ExpandRowsIcon class="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Collapse all discussions"
            :aria-pressed="!isExpanded"
            :class="[
              'flex h-full items-center border-l px-2 transition-colors',
              !isExpanded
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                : 'bg-transparent text-gray-400 dark:text-gray-500',
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200',
            ]"
            title="Collapse all discussions"
            @click="collapseAll"
          >
            <ListIcon class="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          data-testid="discussion-filter-button"
          :aria-label="showFilters ? 'Hide filters' : 'Show filters'"
          :title="showFilters ? 'Hide filters' : 'Show filters'"
          :class="[
            barButtonBase,
            showFilters ? barButtonActive : barButtonInactive,
          ]"
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
          v-if="isForumScoped"
          data-testid="discussion-search-button"
          :aria-label="showSearch ? 'Hide search' : 'Show search'"
          :title="showSearch ? 'Hide search' : 'Show search'"
          :class="[
            barButtonBase,
            showSearch ? barButtonActive : barButtonInactive,
          ]"
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
        <div class="flex items-center gap-2">
          <button
            v-if="showAboutButton"
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 md:inline-flex dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            @click="emit('openAbout')"
          >
            About
          </button>
        </div>

        <div v-if="!isDownloadPage">
          <RequireAuth :full-width="false">
            <template #has-auth>
              <component
                :is="newPostButton"
                size="sm"
                :background-color="isForumScoped ? 'orange' : 'brand'"
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
              <component
                :is="newPostButton"
                size="sm"
                :background-color="isForumScoped ? 'orange' : 'brand'"
                :label="isDownloadPage ? 'New Upload' : 'New Post'"
              />
            </template>
          </RequireAuth>
        </div>
      </div>
    </div>
    <div
      v-if="isForumScoped && showSearch"
      class="mt-3 flex flex-col gap-2 border-t border-gray-200 bg-gray-100 pt-3 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
    >
      <SearchBar
        data-testid="discussion-filter-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search discussions'"
        :auto-focus="isForumScoped"
        :small="true"
        :left-side-is-rounded="!isForumScoped"
        :right-side-is-rounded="!isForumScoped"
        @update-search-input="updateSearchInput"
      />
    </div>
    <div
      v-if="showFilters"
      class="flex justify-end gap-2 bg-gray-100 py-2 dark:bg-gray-900 dark:text-gray-300"
    >
      <FilterChip
        class="align-middle"
        :data-testid="'tag-filter-button'"
        :label="tagLabel"
        :highlighted="tagLabel !== defaultFilterLabels.tags"
      >
        <template #icon>
          <TagIcon class="mr-2 -ml-0.5 h-4 w-4" />
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
