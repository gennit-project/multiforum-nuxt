<script lang="ts" setup>
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import ChannelList from "@/components/channel/ChannelList.vue";
import { GET_CHANNELS } from "@/graphQLData/channel/queries";
import TagIcon from "@/components/icons/TagIcon.vue";
import FilterChip from "@/components/FilterChip.vue";
import SearchBar from "@/components/SearchBar.vue";
import { getTagLabel } from "@/utils";
import type { LocationQueryValue } from "vue-router";

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

const {
  result: channelResult,
  loading: channelLoading,
  fetchMore,
  error: channelError,
} = useQuery(
  GET_CHANNELS,
  {
    limit: 25,
    offset: 0,
    tags: selectedTags,
    searchInput: searchInput,
  },
  {
    fetchPolicy: "cache-first",
  }
);

// Function to load more channels
const loadMore = () => {
  fetchMore({
    variables: {
      offset: channelResult.value.getSortedChannels?.channels?.length || 0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        ...previousResult,
        getSortedChannels: {
          channels: [
            ...previousResult.getSortedChannels?.channels || [], 
            ...fetchMoreResult.getSortedChannels?.channels || [],
          ],
          aggregateChannelCount: fetchMoreResult.getSortedChannels?.aggregateChannelCount || 0,
        }
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
      <div class="flex-col justify-center">
        <div class="flex max-w-4xl items-center justify-between py-2 mx-auto">
          <SearchBar
            class="mr-4 w-full align-middle"
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
          class="mx-auto max-w-4xl"
          :text="channelError.message"
        />
        <ChannelList
          v-if="channelResult && channelResult.getSortedChannels?.channels"
          class="mx-auto max-w-4xl flex-1 rounded-lg bg-gray-100 md:p-6 dark:bg-gray-900"
          :channels="channelResult.getSortedChannels?.channels || []"
          :result-count="channelResult.getSortedChannels?.aggregateChannelCount || 0"
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
