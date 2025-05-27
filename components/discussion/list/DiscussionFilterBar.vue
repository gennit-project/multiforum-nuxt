<script setup lang="ts">
<<<<<<< HEAD
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
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import SearchIcon from "@/components/icons/SearchIcon.vue";
  import { useUIStore } from "@/stores/uiStore";
  import { storeToRefs } from "pinia";
=======
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)

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
const channelLabel = computed(() =>
  getChannelLabel(filterValues.value.channels || [])
);
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

<<<<<<< HEAD
  // Check if we're on the downloads page
  const isDownloadPage = computed(() => {
    return route.name && route.name.toString().includes("downloads");
  });

  // Local reactive state for filter values
  const filterValues = ref<SearchDiscussionValues>(
    getFilterValuesFromParams({
      route,
      channelId: channelId.value,
    })
  );
=======
const updateSearchInput = (searchInput: string) => {
  updateFilters({
    router,
    route,
    params: { searchInput },
  });
};
>>>>>>> parent of 666ae3d (Use automated formatting tools)

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
<<<<<<< HEAD
  <div class="pb-2 pt-2">
=======
  <div class="pt-2 pb-2 px-2 lg:px-4 2xl:px-0">
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    <div>
      <div class="flex flex-wrap items-center justify-end space-x-2">
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
<<<<<<< HEAD
        <!-- Expand/Collapse Button Group (hidden in download mode) -->
        <div
          v-if="!isDownloadPage"
          class="flex overflow-hidden rounded-md border border-gray-300 dark:border-gray-600"
        >
          <!-- Expand All Button -->
          <button
            aria-label="Expand all discussions"
            :class="[
              'flex h-9 items-center px-2 text-gray-800 dark:text-gray-300',
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200',
              (channelId ? expandChannelDiscussions : expandSitewideDiscussions)
                ? 'bg-orange-100 dark:bg-orange-900'
                : 'bg-gray-100 dark:bg-gray-800',
            ]"
=======
        <!-- Expand/Collapse Button Group -->
        <div class="flex border border-gray-800 dark:border-gray-600 rounded-md overflow-hidden">
          <!-- Expand All Button -->
          <button
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            data-testid="expand-all-button"
            :class="[
              'flex px-2 h-9 items-center text-gray-800 dark:text-gray-300',
              'hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
              (channelId ? expandChannelDiscussions : expandSitewideDiscussions) ? 'bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-800'
            ]"
            aria-label="Expand all discussions"
            title="Expand all discussions"
            @click="expandAll"
          >
            <i class="fa-solid fa-expand text-xs"/>
          </button>
          <!-- Collapse All Button -->
          <button
<<<<<<< HEAD
            aria-label="Collapse all discussions"
            :class="[
              'flex h-9 items-center border-l border-gray-300 px-2 text-gray-800 dark:border-gray-600 dark:text-gray-300',
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200',
              !(channelId ? expandChannelDiscussions : expandSitewideDiscussions)
                ? 'bg-orange-100 dark:bg-orange-900'
                : 'bg-gray-100 dark:bg-gray-800',
            ]"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            data-testid="collapse-all-button"
            :class="[
              'flex px-2 h-9 items-center text-gray-800 dark:text-gray-300 border-l border-gray-800 dark:border-gray-600',
              'hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
              !(channelId ? expandChannelDiscussions : expandSitewideDiscussions) ? 'bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-800'
            ]"
            aria-label="Collapse all discussions"
            title="Collapse all discussions"
            @click="collapseAll"
          >
            <i class="fa-solid fa-compress text-xs"/>
          </button>
        </div>
        <button
          data-testid="discussion-filter-button"
          :class="
            showFilters
<<<<<<< HEAD
              ? 'border-orange-500'
              : 'border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-300'
=======
              ? 'border-blue-500'
              : 'text-gray-800 border-gray-800 dark:border-gray-600 dark:text-gray-300'
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          "
          class="border flex px-1.5 h-9 rounded-md items-center gap-1 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 dark:hover:bg-gray-700 hover:bg-gray-100 dark:bg-gray-900"
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
          :class="
            showSearch
<<<<<<< HEAD
              ? 'border-orange-500'
              : 'border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-300'
=======
              ? 'border-blue-500'
              : 'text-gray-800 border-gray-800 dark:border-gray-600 dark:text-gray-300'
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          "
          class="border flex px-1.5 h-9 rounded-md items-center gap-1 text-gray-800 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 dark:hover:bg-gray-700 hover:bg-gray-100 dark:bg-gray-900"
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
<<<<<<< HEAD
        <RequireAuth :full-width="false">
          <template #has-auth>
            <PrimaryButton
              class="mx-2"
              :label="isDownloadPage ? 'New Upload' : 'New Discussion'"
              @click="$router.push(`/forums/${channelId}/discussions/create`)"
            />
          </template>
          <template #does-not-have-auth>
            <PrimaryButton
              class="mx-2"
              :label="isDownloadPage ? 'New Upload' : 'New Discussion'"
            />
          </template>
        </RequireAuth>
      </div>
    </div>
    <hr class="mt-2 border border-t-gray-500 dark:border-t-gray-600" >
=======
        <CreateAnythingButton class="mx-2" :use-primary-button="true" />
      </div>
    </div>
     <hr class="mt-2 border border-t-gray-500 dark:border-t-gray-600" >
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    <div
      v-if="showSearch"
      class="flex flex-col gap-2 py-2 dark:text-gray-300 dark:bg-gray-700 bg-gray-100"
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
      class="flex justify-end gap-2 py-2 dark:text-gray-300 dark:bg-gray-700 bg-gray-100"
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
<<<<<<< HEAD
      <div
        v-if="isForumScoped"
        class="flex items-center gap-2 pr-2 text-sm"
      >
=======
      <div class="flex items-center gap-2 text-sm pr-2">
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        <CheckBox
          data-testid="show-archived-discussions"
          class="align-middle"
          :checked="filterValues.showArchived"
          @input="updateShowArchived"
        />
        {{ isDownloadPage ? "Show archived downloads" : "Show archived discussions" }}
      </div>
    </div>
  </div>
</template>
