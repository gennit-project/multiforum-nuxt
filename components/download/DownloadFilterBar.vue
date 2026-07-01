<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import TagIcon from '@/components/icons/TagIcon.vue';
import SearchableTagList from '@/components/SearchableTagList.vue';
import SortButtons from '@/components/SortButtons.vue';
import { getTagLabel } from '@/utils';
import { getDiscussionFilterValuesFromParams } from '@/utils/getDiscussionFilterValuesFromParams';
import type { SearchDiscussionValues } from '@/types/Discussion';
import type { FilterGroup } from '@/__generated__/graphql';
import { updateFilters } from '@/utils/routerUtils';
import { useRoute, useRouter } from 'nuxt/app';
import FilterIcon from '@/components/icons/FilterIcon.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import DownloadFilters from './DownloadFilters.vue';
import CheckBox from '@/components/CheckBox.vue';

const props = defineProps({
  filterGroups: {
    type: Array as () => FilterGroup[],
    default: () => [],
  },
});

// Nuxt route and router
const route = useRoute();
const router = useRouter();

// Computed property for channelId from route params
const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

// Local reactive state for filter values
const filterValues = ref<SearchDiscussionValues>(
  getDiscussionFilterValuesFromParams({
    route,
    channelId: channelId.value,
  })
);

// Computed properties for labels
const tagLabel = computed(() => getTagLabel(filterValues.value.tags || []));

// Watch for route query changes to update filter values
watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getDiscussionFilterValuesFromParams({
        route,
        channelId: channelId.value,
      });
    }
  }
);

const setSelectedTags = (tags: string[]) => {
  updateFilters({
    router,
    route,
    params: { tags },
  });
};

const updateSearchInput = (searchInput: string) => {
  updateFilters({
    router,
    route,
    params: { searchInput },
  });
};

const toggleSelectedTag = (tag: string) => {
  if (!filterValues.value.tags) {
    filterValues.value.tags = [];
  }
  const index = filterValues.value.tags.indexOf(tag);
  if (index === -1) {
    filterValues.value.tags.push(tag);
  } else {
    filterValues.value.tags.splice(index, 1);
  }
  setSelectedTags(filterValues.value.tags);
};

const updateShowArchived = (event: Event) => {
  const checkbox = event.target as HTMLInputElement;
  updateFilters({
    router,
    route,
    params: { showArchived: checkbox.checked },
  });
};

const showFilters = ref(false);
const showSearch = ref(false);

const toggleShowFilters = () => {
  showFilters.value = !showFilters.value;
};

const toggleShowSearch = () => {
  showSearch.value = !showSearch.value;
};

// Count active download filters
const getActiveDownloadFilterCount = computed(() => {
  let count = 0;
  props.filterGroups.forEach((group) => {
    const queryValue = route.query[`filter_${group.key}`];
    if (typeof queryValue === 'string' && queryValue.length > 0) {
      count += queryValue.split(',').length;
    } else if (Array.isArray(queryValue)) {
      count += queryValue.length;
    }
  });
  return count;
});

const hasActiveDownloadFilters = computed(() => {
  return getActiveDownloadFilterCount.value > 0;
});
</script>

<template>
  <div class="pb-3 pt-3">
    <div>
      <div class="flex flex-wrap items-center justify-end gap-3">
        <!-- Download Filters Button (mobile only) -->
        <button
          v-if="filterGroups.length > 0"
          data-testid="download-filter-button"
          :aria-label="showFilters ? 'Hide filters' : 'Show filters'"
          :title="showFilters ? 'Hide filters' : 'Show filters'"
          :class="[
            'flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border bg-gradient-to-b from-white to-gray-50 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors hover:border-gray-300 hover:bg-gray-100 dark:bg-none dark:bg-slate-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 lg:hidden',
            hasActiveDownloadFilters || showFilters
              ? 'border-gray-400 bg-gray-100 text-gray-900 dark:border-slate-500 dark:bg-slate-800 dark:text-white'
              : 'border-gray-200 text-gray-700 dark:border-slate-600 dark:text-gray-300',
          ]"
          @click="toggleShowFilters"
        >
          <FilterIcon class="h-4 w-4" />
          <span v-if="hasActiveDownloadFilters" class="text-xs font-medium">
            {{ getActiveDownloadFilterCount }}
          </span>
        </button>

        <button
          data-testid="download-search-button"
          :aria-label="showSearch ? 'Hide search' : 'Show search'"
          :title="showSearch ? 'Hide search' : 'Show search'"
          :class="
            showSearch
              ? 'border-gray-400 bg-gray-100 text-gray-900 dark:border-slate-500 dark:bg-slate-800 dark:text-white'
              : 'border-gray-200 text-gray-700 dark:border-slate-600 dark:text-gray-300'
          "
          class="flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-b from-white to-gray-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:bg-none dark:bg-slate-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
          @click="toggleShowSearch"
        >
          <SearchIcon class="h-4 w-4" />
        </button>
        <SortButtons />
        <RequireAuth :full-width="false">
          <template #has-auth>
            <PrimaryButton
              class="h-10 rounded-lg border-gray-400 bg-gradient-to-b from-gray-700 to-gray-800 px-4 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:from-gray-600 hover:to-gray-700 dark:border-slate-500 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700"
              label="New Upload"
              @click="$router.push(`/forums/${channelId}/downloads/create`)"
            />
          </template>
          <template #does-not-have-auth>
            <PrimaryButton
              class="h-10 rounded-lg border-gray-400 bg-gradient-to-b from-gray-700 to-gray-800 px-4 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:from-gray-600 hover:to-gray-700 dark:border-slate-500 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700"
              label="New Upload"
            />
          </template>
        </RequireAuth>
      </div>
    </div>
    <hr class="mt-3 border-t border-gray-200 dark:border-slate-700" >

    <!-- Search Panel -->
    <div
      v-if="showSearch"
      class="mt-3 flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-100/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/80 dark:text-gray-300"
    >
      <SearchBar
        data-testid="download-filter-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search downloads'"
        :auto-focus="true"
        :small="true"
        :left-side-is-rounded="false"
        :right-side-is-rounded="false"
        @update-search-input="updateSearchInput"
      />
    </div>

    <!-- Mobile Filter Panel -->
    <div
      v-if="showFilters && filterGroups.length > 0"
      class="mt-3 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-100/80 px-3 py-4 dark:border-slate-700 dark:bg-slate-900/80 dark:text-gray-300 lg:hidden"
    >
      <DownloadFilters :filter-groups="filterGroups" />

      <!-- Tags and Archived for mobile -->
      <div class="space-y-4 border-t border-gray-300 pt-4 dark:border-gray-600">
        <FilterChip
          class="w-full"
          :data-testid="'tag-filter-button'"
          :label="tagLabel"
          :highlighted="tagLabel !== 'Tags'"
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

        <div class="text-sm">
          <CheckBox
            data-testid="show-archived-downloads"
            :checked="filterValues.showArchived"
            :label="'Show archived downloads'"
            @input="updateShowArchived"
          />
        </div>
      </div>
    </div>

    <!-- Desktop Filter Panel (for tags/archived only) -->
    <div
      v-if="showFilters && !filterGroups.length"
      class="mt-3 hidden flex-wrap justify-end gap-2 rounded-xl border border-gray-200 bg-gray-100/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/80 dark:text-gray-300 lg:flex"
    >
      <FilterChip
        class="align-middle"
        :data-testid="'tag-filter-button'"
        :label="tagLabel"
        :highlighted="tagLabel !== 'Tags'"
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
      <div class="pr-2 text-sm">
        <CheckBox
          data-testid="show-archived-downloads"
          :checked="filterValues.showArchived"
          :label="'Show archived downloads'"
          @input="updateShowArchived"
        />
      </div>
    </div>
  </div>
</template>
