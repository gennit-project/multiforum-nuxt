<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import TagIcon from '@/components/icons/TagIcon.vue';
import SearchableTagList from '@/components/SearchableTagList.vue';
import SortButtons from '@/components/SortButtons.vue';
import { getTagLabel } from '@/utils';
import { getFilterValuesFromParams } from '../discussion/list/getDiscussionFilterValuesFromParams';
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
  getFilterValuesFromParams({
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
      filterValues.value = getFilterValuesFromParams({
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
  <div class="pb-2 pt-2">
    <div>
      <div class="flex flex-wrap items-center justify-end space-x-2">
        <!-- Download Filters Button (mobile only) -->
        <button
          v-if="filterGroups.length > 0"
          data-testid="download-filter-button"
          :aria-label="showFilters ? 'Hide filters' : 'Show filters'"
          :title="showFilters ? 'Hide filters' : 'Show filters'"
          :class="[
            'flex h-9 items-center gap-1 rounded-md border px-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden',
            hasActiveDownloadFilters || showFilters
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-gray-800 text-gray-800 dark:border-gray-600 dark:text-gray-300',
          ]"
          @click="toggleShowFilters"
        >
          <FilterIcon />
          <span v-if="hasActiveDownloadFilters" class="ml-1 text-xs">
            {{ getActiveDownloadFilterCount }}
          </span>
        </button>

        <button
          data-testid="download-search-button"
          :aria-label="showSearch ? 'Hide search' : 'Show search'"
          :title="showSearch ? 'Hide search' : 'Show search'"
          :class="
            showSearch
              ? 'border-orange-500'
              : 'border-gray-800 text-gray-800 dark:border-gray-600 dark:text-gray-300'
          "
          class="flex h-9 items-center gap-1 rounded-md border px-1.5 text-gray-800 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          @click="toggleShowSearch"
        >
          <SearchIcon />
        </button>
        <SortButtons />
        <RequireAuth :full-width="false">
          <template #has-auth>
            <PrimaryButton
              class="mx-2"
              label="New Upload"
              @click="$router.push(`/forums/${channelId}/downloads/create`)"
            />
          </template>
          <template #does-not-have-auth>
            <PrimaryButton class="mx-2" label="New Upload" />
          </template>
        </RequireAuth>
      </div>
    </div>
    <hr class="mt-2 border border-t-gray-500 dark:border-t-gray-600" >

    <!-- Search Panel -->
    <div
      v-if="showSearch"
      class="flex flex-col gap-2 bg-gray-100 py-2 dark:bg-gray-700 dark:text-gray-300"
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
      class="flex flex-col gap-4 bg-gray-100 px-2 py-4 dark:bg-gray-800 dark:text-gray-300 lg:hidden"
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
      class="hidden justify-end gap-2 bg-gray-100 py-2 dark:bg-gray-700 dark:text-gray-300 lg:flex"
    >
      <FilterChip
        class="align-middle"
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
