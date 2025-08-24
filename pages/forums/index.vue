<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import ChannelList from '@/components/channel/ChannelList.vue';
import { GET_CHANNELS_DISCUSSIONS, GET_CHANNELS_DOWNLOADS } from '@/graphQLData/channel/queries';
import TagIcon from '@/components/icons/TagIcon.vue';
import FilterChip from '@/components/FilterChip.vue';
import SearchBar from '@/components/SearchBar.vue';
import SearchableTagList from '@/components/SearchableTagList.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { getTagLabel } from '@/utils';
import type { LocationQueryValue } from 'vue-router';
import type { Channel } from '@/__generated__/graphql';

const route = useRoute();
const router = useRouter();

const selectedTags = ref<Array<string>>(
  route.query.tag && typeof route.query.tag === 'string'
    ? [route.query.tag]
    : []
);
const searchInput = ref<string>('');

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
    if (typeof route.query.tag === 'string') {
      selectedTags.value = [route.query.tag];
    } else {
      selectedTags.value = route.query.tag.map((tag: LocationQueryValue) => {
        // convert to string
        return tag?.toString() || '';
      });
    }
  } else {
    selectedTags.value = [];
  }
});

// Query for channels with discussion counts
const {
  result: channelResult,
  loading: channelLoading,
  fetchMore,
  error: channelError,
} = useQuery(
  GET_CHANNELS_DISCUSSIONS,
  {
    limit: 25,
    offset: 0,
    tags: selectedTags,
    searchInput: searchInput,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

// Query for channels with download counts
const {
  result: downloadCountsResult,
  fetchMore: fetchMoreDownloadCounts,
} = useQuery(
  GET_CHANNELS_DOWNLOADS,
  {
    limit: 25,
    offset: 0,
    tags: selectedTags,
    searchInput: searchInput,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

// Create map of channel name -> discussion count from the discussions query
const discussionCountMap = computed(() => {
  const map = new Map<string, number>();
  const discussionChannels = channelResult.value?.getSortedChannels?.channels || [];
  
  discussionChannels.forEach((channel: Channel) => {
    if (channel.uniqueName) {
      const discussionCount = channel.DiscussionChannelsAggregate?.count || 0;
      map.set(channel.uniqueName, discussionCount);
    }
  });
  
  return map;
});

// Create map of channel name -> download count from the downloads query  
const downloadCountMap = computed(() => {
  const map = new Map<string, number>();
  const downloadChannels = downloadCountsResult.value?.getSortedChannels?.channels || [];
  
  downloadChannels.forEach((channel: Channel) => {
    if (channel.uniqueName) {
      const downloadCount = channel.DiscussionChannelsAggregate?.count || 0;
      map.set(channel.uniqueName, downloadCount);
    }
  });
  
  return map;
});

// Merge channels by injecting both counts from the maps
const mergedChannels = computed(() => {
  const baseChannels = channelResult.value?.getSortedChannels?.channels || [];
  
  return baseChannels.map((channel: Channel) => {
    const discussionCount = discussionCountMap.value.get(channel.uniqueName) || 0;
    const downloadCount = downloadCountMap.value.get(channel.uniqueName) || 0;
    
    // Create new channel object with corrected discussion count and added download count
    return {
      ...channel,
      DiscussionChannelsAggregate: {
        ...channel.DiscussionChannelsAggregate,
        count: discussionCount
      },
      downloadCount
    };
  });
});

// Function to load more channels
const loadMore = () => {
  // Load more for both queries in parallel
  const currentOffset = channelResult.value.getSortedChannels?.channels?.length || 0;
  
  fetchMore({
    variables: {
      offset: currentOffset,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        ...previousResult,
        getSortedChannels: {
          channels: [
            ...(previousResult.getSortedChannels?.channels || []),
            ...(fetchMoreResult.getSortedChannels?.channels || []),
          ],
          aggregateChannelCount:
            fetchMoreResult.getSortedChannels?.aggregateChannelCount || 0,
        },
      };
    },
  });

  // Also fetch more download counts
  fetchMoreDownloadCounts({
    variables: {
      offset: currentOffset,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        ...previousResult,
        getSortedChannels: {
          channels: [
            ...(previousResult.getSortedChannels?.channels || []),
            ...(fetchMoreResult.getSortedChannels?.channels || []),
          ],
        },
      };
    },
  });
};

// Get the tag label
const tagLabel = computed(() => getTagLabel(selectedTags.value));

const defaultLabels = {
  tags: 'Tags',
};
</script>

<template>
  <NuxtLayout>
    <div class="bg-gray-200 dark:bg-black">
      <div class="flex-col justify-center">
        <div class="mx-auto flex max-w-4xl items-center justify-between py-2">
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
        <ClientOnly>
          <ErrorBanner
            v-if="channelError"
            class="mx-auto max-w-4xl"
            :text="channelError.message"
          />
          <ChannelList
            v-if="channelResult && channelResult.getSortedChannels?.channels"
            class="mx-auto max-w-4xl flex-1 rounded-lg bg-gray-100 dark:bg-gray-900 md:p-6"
            :channels="mergedChannels"
            :result-count="
              channelResult.getSortedChannels?.aggregateChannelCount || 0
            "
            :search-input="searchInput"
            :selected-tags="selectedTags"
            @filter-by-tag="setSelectedTags"
            @load-more="loadMore"
          />
          <div v-if="channelLoading" class="mx-auto max-w-5xl flex-1">
            Loading...
          </div>
          <template #fallback>
            <div
              class="mx-auto max-w-4xl flex-1 rounded-lg bg-gray-100 dark:bg-gray-900 md:p-6"
            >
              <div class="animate-pulse">
                <div
                  class="mb-4 h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700"
                />
                <div class="space-y-4">
                  <div class="h-20 rounded bg-gray-200 dark:bg-gray-700" />
                  <div class="h-20 rounded bg-gray-200 dark:bg-gray-700" />
                  <div class="h-20 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </NuxtLayout>
</template>
