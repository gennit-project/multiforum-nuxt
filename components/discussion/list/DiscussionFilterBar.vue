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
  import FilterIcon from "@/components/icons/FilterIcon.vue";
  import CreateAnythingButton from "@/components/nav/CreateAnythingButton.vue";
  import SearchIcon from "@/components/icons/SearchIcon.vue";
  import { useUIStore } from "@/stores/uiStore";
  import { storeToRefs } from "pinia";

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
    showMap: {
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
  const channelLabel = computed(() => getChannelLabel(filterValues.value.channels || []));
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

  const showFilters = ref(false);
  const showSearch = ref(false);

  // Get UI store for expand/collapse functionality
  const uiStore = useUIStore();
  const { expandChannelDiscussions, expandSitewideDiscussions } = storeToRefs(uiStore);

  const toggleShowFilters = () => {
    showFilters.value = !showFilters.value;
  };

  const toggleShowSearch = () => {
    showSearch.value = !showSearch.value;
  };

  const expandAll = () => {
    // Pass true for expand and the appropriate isChannelView flag
    uiStore.toggleExpandDiscussions(true, !!channelId.value);
  };

  const collapseAll = () => {
    // Pass false for collapse and the appropriate isChannelView flag
    uiStore.toggleExpandDiscussions(false, !!channelId.value);
  };
</script>

<template>
  <div class="pb-2 pt-2">
    <div>
      <div class="flex flex-wrap items-center justify-end space-x-2">
        <FilterChip
          v-if="!isForumScoped"
          class="align-middle"
          :data-testid="'forum-filter-button'"
          :highlighted="filterValues.channels && filterValues.channels.length > 0"
          :label="channelLabel"
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
        <!-- Expand/Collapse Button Group -->
        <div class="flex overflow-hidden rounded-md border border-gray-800 dark:border-gray-600">
          <!-- Expand All Button -->
          <button
            aria-label="Expand all discussions"
            :class="[
              'flex h-9 items-center px-2 text-gray-800 dark:text-gray-300',
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200',
              (channelId ? expandChannelDiscussions : expandSitewideDiscussions)
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'bg-gray-100 dark:bg-gray-800',
            ]"
            data-testid="expand-all-button"
            title="Expand all discussions"
            @click="expandAll"
          >
            <i class="fa-solid fa-expand text-xs" />
          </button>
          <!-- Collapse All Button -->
          <button
            aria-label="Collapse all discussions"
            :class="[
              'flex h-9 items-center border-l border-gray-800 px-2 text-gray-800 dark:border-gray-600 dark:text-gray-300',
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200',
              !(channelId ? expandChannelDiscussions : expandSitewideDiscussions)
                ? 'bg-blue-50 dark:bg-blue-900'
                : 'dark:bg-gray-800',
            ]"
            data-testid="collapse-all-button"
            title="Collapse all discussions"
            @click="collapseAll"
          >
            <i class="fa-solid fa-compress text-xs" />
          </button>
        </div>
        <button
          class="flex h-9 items-center gap-1 rounded-md border px-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          :class="
            showFilters
              ? 'border-blue-500'
              : 'border-gray-800 text-gray-800 dark:border-gray-600 dark:text-gray-300'
          "
          data-testid="discussion-filter-button"
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
          class="flex h-9 items-center gap-1 rounded-md border px-1.5 text-gray-800 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          :class="
            showSearch
              ? 'border-blue-500'
              : 'border-gray-800 text-gray-800 dark:border-gray-600 dark:text-gray-300'
          "
          data-testid="discussion-search-button"
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
        <CreateAnythingButton
          class="mx-2"
          :use-primary-button="true"
        />
      </div>
    </div>
    <hr class="mt-2 border border-t-gray-500 dark:border-t-gray-600" />
    <div
      v-if="showSearch"
      class="flex flex-col gap-2 bg-gray-100 py-2 dark:bg-gray-700 dark:text-gray-300"
    >
      <SearchBar
        :auto-focus="true"
        data-testid="discussion-filter-search-bar"
        :initial-value="filterValues.searchInput"
        :left-side-is-rounded="false"
        :right-side-is-rounded="false"
        :search-placeholder="'Search'"
        :small="true"
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
        :highlighted="tagLabel !== defaultFilterLabels.tags"
        :label="tagLabel"
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
          :checked="filterValues.showArchived"
          class="align-middle"
          data-testid="show-archived-discussions"
          @input="updateShowArchived"
        />
        Show archived discussions
      </div>
    </div>
  </div>
</template>
