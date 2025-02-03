<script setup lang="ts">
import { ref, computed, watch } from "vue";
import SearchBar from "@/components/SearchBar.vue";
import FilterChip from "@/components/FilterChip.vue";
import ChannelIcon from "@/components/icons/ChannelIcon.vue";
import TagIcon from "@/components/icons/TagIcon.vue";
import SearchableForumList from "@/components/channel/SearchableForumList.vue";
import SearchableTagList from "@/components/SearchableTagList.vue";
import SortButtons from "@/components/SortButtons.vue";
import { getTagLabel, getChannelLabel } from "@/utils";
import { getFilterValuesFromParams } from "./getDiscussionFilterValuesFromParams";
import type { SearchDiscussionValues } from "@/types/Discussion";
import { updateFilters } from "@/utils/routerUtils";
import { useRoute, useRouter } from "nuxt/app";

defineProps({
  showMap: {
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
  isForumScoped: {
    type: Boolean,
    default: false,
  },
});

// Nuxt route and router
const route = useRoute();
const router = useRouter();

// Default filter labels
const defaultFilterLabels = {
  channels: "All Forums",
  tags: "Tags",
};

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
const channelLabel = computed(() =>
  getChannelLabel(filterValues.value.channels || [])
);
const tagLabel = computed(() => getTagLabel(filterValues.value.tags || []));

// Watch for route query changes to update filter values
watch(
  () => route.query,
  () => {
    if (route.query) {
      console.log('route.query', route.query);
      filterValues.value = getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      });
    }
  }
);

const setSelectedChannels = (channels: string[]) => {
  updateFilters({
    router,
    route,
    params: { channels },
  });
};

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

const toggleSelectedChannel = (channel: string) => {
  if (!filterValues.value.channels) {
    filterValues.value.channels = [];
  }
  const index = filterValues.value.channels.indexOf(channel);
  if (index === -1) {
    filterValues.value.channels.push(channel);
  } else {
    filterValues.value.channels.splice(index, 1);
  }
  setSelectedChannels(filterValues.value.channels);
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
</script>

<template>
  <div>
    <div>
      <div class="flex flex-wrap items-center space-x-2 py-2">
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
        <SearchBar
          class="hidden md:block"
          data-testid="discussion-filter-search-bar"
          :initial-value="filterValues.searchInput"
          :search-placeholder="'Search'"
          :auto-focus="false"
          :small="true"
          :left-side-is-rounded="false"
          :right-side-is-rounded="false"
          @update-search-input="updateSearchInput"
        />
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
        <SortButtons />
      </div>
      <SearchBar
        class="block md:hidden"
        data-testid="discussion-filter-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search'"
        :auto-focus="false"
        :small="true"
        :left-side-is-rounded="false"
        :right-side-is-rounded="false"
        @update-search-input="updateSearchInput"
      />
    </div>

    <div class="flex items-center justify-end gap-2 py-2 dark:text-gray-300">
      <CheckBox
        data-testid="show-archived-discussions"
        class="align-middle"
        :checked="filterValues.showArchived"
        @input="updateShowArchived"
      />
      Show archived discussions
    </div>
  </div>
</template>
