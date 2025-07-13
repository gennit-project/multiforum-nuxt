<script setup lang="ts">
import { ref, computed, watch } from "vue";
import SearchBar from "@/components/SearchBar.vue";
import FilterChip from "@/components/FilterChip.vue";
import TagIcon from "@/components/icons/TagIcon.vue";
import SearchableTagList from "@/components/SearchableTagList.vue";
import SortButtons from "@/components/SortButtons.vue";
import { getTagLabel } from "@/utils";
import { getFilterValuesFromParams } from "../discussion/list/getDiscussionFilterValuesFromParams";
import type { SearchDiscussionValues } from "@/types/Discussion";
import type { FilterGroup } from "@/__generated__/graphql";
import { updateFilters } from "@/utils/routerUtils";
import { useRoute, useRouter } from "nuxt/app";
import FilterIcon from "@/components/icons/FilterIcon.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";
import DownloadFilters from "./DownloadFilters.vue";
import CheckBox from "@/components/CheckBox.vue";

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
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
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
  props.filterGroups.forEach(group => {
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
          :class="[
            'lg:hidden border flex px-1.5 h-9 rounded-md items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700',
            hasActiveDownloadFilters
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'text-gray-800 border-gray-800 dark:border-gray-600 dark:text-gray-300'
          ]"
          @click="toggleShowFilters"
        >
          <FilterIcon />
          <span v-if="hasActiveDownloadFilters" class="text-xs ml-1">
            {{ getActiveDownloadFilterCount }}
          </span>
        </button>
        
        <button
          data-testid="download-search-button"
          :class="
            showSearch
              ? 'border-orange-500'
              : 'text-gray-800 border-gray-800 dark:border-gray-600 dark:text-gray-300'
          "
          class="border flex px-1.5 h-9 rounded-md items-center gap-1 text-gray-800 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 dark:hover:bg-gray-700 hover:bg-gray-100 dark:bg-gray-900"
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
            <PrimaryButton
              class="mx-2"
              label="New Upload"
            />
          </template>
        </RequireAuth>
      </div>
    </div>
    <hr class="mt-2 border border-t-gray-500 dark:border-t-gray-600" />
    
    <!-- Search Panel -->
    <div
      v-if="showSearch"
      class="flex flex-col gap-2 py-2 dark:text-gray-300 dark:bg-gray-700 bg-gray-100"
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
      class="lg:hidden flex flex-col gap-4 py-4 px-2 dark:text-gray-300 dark:bg-gray-700 bg-gray-100"
    >
      <DownloadFilters :filter-groups="filterGroups" />
      
      <!-- Tags and Archived for mobile -->
      <div class="border-t border-gray-300 dark:border-gray-600 pt-4 space-y-4">
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
        
        <div class="flex items-center gap-2 text-sm">
          <CheckBox
            data-testid="show-archived-downloads"
            :checked="filterValues.showArchived"
            @input="updateShowArchived"
          />
          <label class="cursor-pointer" @click="updateShowArchived">
            Show archived downloads
          </label>
        </div>
      </div>
    </div>
    
    <!-- Desktop Filter Panel (for tags/archived only) -->
    <div
      v-if="showFilters && !filterGroups.length"
      class="hidden lg:flex justify-end gap-2 py-2 dark:text-gray-300 dark:bg-gray-700 bg-gray-100"
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
      <div class="flex items-center gap-2 pr-2 text-sm">
        <CheckBox
          data-testid="show-archived-downloads"
          :checked="filterValues.showArchived"
          @input="updateShowArchived"
        />
        Show archived downloads
      </div>
    </div>
  </div>
</template>