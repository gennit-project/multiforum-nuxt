<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import ChannelDownloadListItem from '../discussion/list/ChannelDownloadListItem.vue';
import DownloadSkeletonCard from '@/components/download/DownloadSkeletonCard.vue';
import LoadMore from '../LoadMore.vue';
import ErrorBanner from '../ErrorBanner.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import DiscussionAlbum from '@/components/discussion/detail/DiscussionAlbum.vue';
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from '@/graphQLData/discussion/queries';
import { usernameVar } from '@/cache';
import { getFilterValuesFromParams } from '@/components/event/list/filters/getEventFilterValuesFromParams';
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from '@/components/comments/getSortFromQuery';
import { convertUrlParamsToLabelFilters } from '@/utils/downloadFilters';
import type { Discussion, Album, FilterGroup } from '@/__generated__/graphql';

const DOWNLOAD_PAGE_LIMIT = 25;

// Props used in template
defineProps({
  filterGroups: {
    type: Array as () => FilterGroup[],
    default: () => [],
  },
});

const emit = defineEmits(['filterByTag', 'filterByChannel']);

const route = useRoute();
const uiStore = useUIStore();
const { expandChannelDiscussions } = storeToRefs(uiStore);

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const filterValues = ref(
  getFilterValuesFromParams({
    route,
    channelId: channelId.value,
  })
);

const activeSort = computed(() => {
  return getSortFromQuery(route.query);
});

const activeTimeFrame = computed(() => {
  return getTimeFrameFromQuery(route.query);
});

const searchInput = computed(() => {
  return filterValues.value.searchInput;
});

const selectedTags = computed(() => {
  return filterValues.value.tags;
});

const selectedChannels = computed(() => {
  return filterValues.value.channels;
});

const showArchived = computed(() => {
  return filterValues.value.showArchived;
});

const labelFilters = computed(() => {
  return convertUrlParamsToLabelFilters(route);
});

const {
  result: downloadChannelResult,
  error: downloadError,
  loading: downloadLoading,
  refetch: refetchDownloads,
  fetchMore,
} = useQuery(GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA, {
  channelUniqueName: channelId,
  searchInput,
  selectedTags,
  showArchived,
  hasDownload: true,
  labelFilters,
  options: {
    limit: DOWNLOAD_PAGE_LIMIT,
    offset: 0,
    sort: activeSort,
    timeFrame: activeTimeFrame,
  },
});

// Refetch when user logs in/out to update isFavorited and upvote status
watch(
  () => usernameVar.value,
  () => {
    refetchDownloads();
  }
);

const loadMore = () => {
  fetchMore({
    variables: {
      options: {
        limit: DOWNLOAD_PAGE_LIMIT,
        offset:
          downloadChannelResult.value?.getDiscussionsInChannel
            .discussionChannels.length,
        // @ts-ignore
        sort: activeSort.value,
        // @ts-ignore
        timeFrame: activeTimeFrame.value,
      },
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        getDiscussionsInChannel: {
          ...previousResult.getDiscussionsInChannel,
          aggregateDiscussionChannelsCount:
            fetchMoreResult.getDiscussionsInChannel
              .aggregateDiscussionChannelsCount,
          discussionChannels: [
            ...previousResult.getDiscussionsInChannel.discussionChannels,
            ...fetchMoreResult.getDiscussionsInChannel.discussionChannels,
          ],
        },
      };
    },
  });
};

const showModProfileModal = ref(false);

// Album lightbox state
type AlbumData = {
  discussion: Discussion;
  album: Album;
};

const openAlbumData = ref<AlbumData | null>(null);
const isAlbumLightboxOpen = ref(false);

const handleOpenAlbum = (albumData: AlbumData) => {
  openAlbumData.value = albumData;
  isAlbumLightboxOpen.value = true;
};

const handleCloseAlbum = () => {
  openAlbumData.value = null;
  isAlbumLightboxOpen.value = false;
};

onMounted(() => {
  if (
    downloadChannelResult.value?.getDiscussionsInChannel.discussionChannels
      .length === 0
  ) {
    refetchDownloads();
  }
});

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

// Methods
const filterByTag = (tag: string) => {
  emit('filterByTag', tag);
};

const filterByChannel = (channel: string) => {
  emit('filterByChannel', channel);
};

// Use backend-filtered results directly
const filteredDownloads = computed(() => {
  return (
    downloadChannelResult.value?.getDiscussionsInChannel?.discussionChannels ||
    []
  );
});

const reachedEndOfResults = computed(() => {
  return (
    downloadChannelResult.value?.getDiscussionsInChannel
      .aggregateDiscussionChannelsCount === filteredDownloads.value.length
  );
});
</script>

<template>
  <div class="px-2">
    <slot />
    <!-- Loading skeleton cards -->
    <div
      v-if="
        downloadLoading &&
        (!downloadChannelResult ||
          downloadChannelResult?.getDiscussionsInChannel?.discussionChannels
            ?.length === 0)
      "
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <DownloadSkeletonCard v-for="n in 8" :key="n" />
    </div>
    <ErrorBanner
      v-else-if="downloadError"
      class="max-w-5xl"
      :text="downloadError.message"
    />
    <div
      v-else-if="
        downloadChannelResult?.getDiscussionsInChannel?.discussionChannels
          ?.length === 0
      "
      class="flex gap-2 p-4"
    >
      <span class="dark:text-white">There are no downloads yet.</span>

      <ClientOnly>
        <RequireAuth :full-width="false">
          <template #has-auth>
            <nuxt-link
              v-if="channelId"
              class="text-orange-500 underline dark:text-white"
              :to="{
                name: 'forums-forumId-downloads-create',
                params: {
                  forumId: channelId,
                },
              }"
            >
              Create one?
            </nuxt-link>
          </template>
          <template #does-not-have-auth>
            <span
              class="cursor-pointer text-orange-500 underline dark:text-white"
              >Create one?</span
            >
          </template>
        </RequireAuth>
      </ClientOnly>
    </div>

    <!-- Filtered results message -->
    <div
      v-else-if="
        downloadChannelResult?.getDiscussionsInChannel?.discussionChannels
          ?.length > 0 && filteredDownloads.length === 0
      "
      class="p-4 text-center"
    >
      <p class="text-gray-600 dark:text-gray-400">
        No downloads match the selected filters.
      </p>
    </div>

    <div
      v-else-if="filteredDownloads.length > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      data-testid="channel-download-list"
    >
      <ChannelDownloadListItem
        v-for="discussionChannel in filteredDownloads"
        :key="`${discussionChannel.id}-${expandChannelDiscussions}`"
        :default-expanded="expandChannelDiscussions"
        :discussion="discussionChannel.Discussion"
        :discussion-channel="discussionChannel"
        :search-input="searchInput"
        :selected-channels="selectedChannels"
        :selected-tags="selectedTags"
        @filter-by-channel="filterByChannel"
        @filter-by-tag="filterByTag"
        @open-mod-profile="showModProfileModal = true"
        @open-album="handleOpenAlbum"
      />
    </div>
    <div v-if="filteredDownloads.length > 0">
      <LoadMore
        class="mb-6 justify-self-center"
        :loading="downloadLoading"
        :reached-end-of-results="reachedEndOfResults"
        @load-more="loadMore"
      />
    </div>

    <!-- Album Lightbox -->
    <DiscussionAlbum
      v-if="isAlbumLightboxOpen && openAlbumData?.album"
      :album="openAlbumData.album"
      :discussion-id="openAlbumData.discussion?.id || ''"
      :discussion-author="openAlbumData.discussion?.Author?.username || ''"
      :show-edit-album="false"
      :start-in-lightbox="true"
      @close-lightbox="handleCloseAlbum"
    />
  </div>
</template>
