<script lang="ts" setup>
import { computed, ref } from "vue";
import type { LocationQueryValue } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import ChannelList from "@/components/channel/ChannelList.vue";
import { GET_CHANNELS } from "@/graphQLData/channel/queries";
import TagIcon from "@/components/icons/TagIcon.vue";
import FilterChip from "@/components/FilterChip.vue";
import SearchBar from "@/components/SearchBar.vue";
import { getTagLabel } from "@/utils";

const route = useRoute();
const router = useRouter();

const selectedTags = ref<Array<string>>(
  route.query.tag && typeof route.query.tag === "string"
    ? [route.query.tag]
    : []
);
const searchInput = ref<string>("");

const setSearchInput = (input: string) => {
  searchInput.value = input;
};

const setSelectedTags = (tag: string) => {
  // Check if the tag is already selected
  if (selectedTags.value.includes(tag)) {
    // If it is, remove it (deselect)
    selectedTags.value = selectedTags.value.filter((t) => t !== tag);
  } else {
    // If it's not, add it (select)
    selectedTags.value.push(tag);
  }

  // Update query params in URL to reflect selected tags
  router.push({
    query: {
      tag: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    },
  });
};

// update the selected tags whenever query params change in the URL
watchEffect(() => {
  if (route.query.tag) {
    if (typeof route.query.tag === "string") {
      selectedTags.value = [route.query.tag];
    } else {
      selectedTags.value = route.query.tag.map((tag: LocationQueryValue) => {
        // convert to string
        return tag?.toString() || "";
      });
    }
  } else {
    selectedTags.value = [];
  }
});

// Construct the query conditionally based on tags and search input
const channelWhere = computed(() => {
  if (selectedTags.value.length === 0 && searchInput.value === "") {
    return {};
  }

  const tagSearch = {
    Tags: {
      OR: selectedTags.value.map((tag: string) => {
        return { text_CONTAINS: tag };
      }),
    },
  };

  const textSearch = {
    OR: [
      { uniqueName_MATCHES: `(?i).*${searchInput.value}.*` },
      { description_MATCHES: `(?i).*${searchInput.value}.*` },
    ],
  };

  if (selectedTags.value.length === 0) {
    return { OR: [textSearch] };
  }

  if (searchInput.value === "") {
    return { OR: [tagSearch] };
  }

  return { AND: [tagSearch, textSearch] };
});

// Get current date-time for filtering events
const now = new Date().toISOString();

// Fetch channels using Apollo query
const {
  result: channelResult,
  loading: channelLoading,
  fetchMore,
  error: channelError,
} = useQuery(GET_CHANNELS, {
  channelWhere: channelWhere,
  eventChannelWhere: {
    Event: {
      startTime_GT: now,
      canceled: false,
    },
  },
  limit: 25,
  offset: 0,
  sort: {
    createdAt: "ASC",
  },
});

// Function to load more channels
const loadMore = () => {
  fetchMore({
    variables: {
      offset: channelResult.value.channels.length,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        ...previousResult,
        channels: [...previousResult.channels, ...fetchMoreResult.channels],
      };
    },
  });
};

// Get the tag label
const tagLabel = computed(() => getTagLabel(selectedTags.value));

const defaultLabels = {
  tags: "Tags",
};
</script>

<template>
  <NuxtLayout>
    <div class="bg-gray-200 dark:bg-black">
      <div class="py-6">
        <div
          class="mx-auto flex max-w-3xl items-center justify-between px-4 py-2"
        >
          <SearchBar
            class="mr-2 w-full align-middle"
            :search-placeholder="'Search forums'"
            @update-search-input="setSearchInput"
          />

          <FilterChip
            class="align-middle"
            data-testid="tag-filter-button"
            :label="tagLabel"
            :highlighted="tagLabel !== defaultLabels.tags"
          >
            <template #icon>
              <TagIcon class="-ml-0.5 mr-2 h-4 w-4" />
            </template>
            <template #content>
              <div class="relative w-96">
                <SearchableTagList
                  :selected-tags="selectedTags"
                  @toggle-selection="setSelectedTags"
                />
              </div>
            </template>
          </FilterChip>
        </div>
        <ErrorBanner
          v-if="channelError"
          class="mx-auto max-w-5xl"
          :text="channelError.message"
        />
        <ChannelList
          v-if="channelResult && channelResult.channels"
          class="mx-auto max-w-3xl flex-1 rounded-lg bg-gray-100 md:p-6 dark:bg-gray-900"
          :channels="channelResult.channels"
          :result-count="channelResult.channelsAggregate?.count || 0"
          :search-input="searchInput"
          :selected-tags="selectedTags"
          @filter-by-tag="setSelectedTags"
          @load-more="loadMore"
        />
        <div v-if="channelLoading" class="mx-auto max-w-5xl flex-1">
          Loading...
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
