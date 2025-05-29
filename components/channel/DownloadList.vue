<script setup lang="ts">
  import { computed, ref, onMounted, watch } from "vue";
  import { useRoute } from "nuxt/app";
  import { useQuery } from "@vue/apollo-composable";
  import { useUIStore } from "@/stores/uiStore";
  import { storeToRefs } from "pinia";
  import ChannelDiscussionListItem from "../discussion/list/ChannelDiscussionListItem.vue";
  import LoadMore from "../LoadMore.vue";
  import ErrorBanner from "../ErrorBanner.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from "@/graphQLData/discussion/queries";
  import { usernameVar } from "@/cache";
  import { getFilterValuesFromParams } from "@/components/event/list/filters/getEventFilterValuesFromParams";
  import { getSortFromQuery, getTimeFrameFromQuery } from "@/components/comments/getSortFromQuery";

  const DOWNLOAD_PAGE_LIMIT = 25;

  const emit = defineEmits(["filterByTag", "filterByChannel"]);

  const route = useRoute();
  const uiStore = useUIStore();
  const { expandChannelDiscussions } = storeToRefs(uiStore);

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
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
    options: {
      limit: DOWNLOAD_PAGE_LIMIT,
      offset: 0,
      sort: activeSort,
      timeFrame: activeTimeFrame,
    },
  });

  watch(
    () => usernameVar.value,
    (newValue) => {
      if (newValue) {
        // This makes it so that items upvoted by the logged
        // in user show the orange active upvote button.
        refetchDownloads();
      }
    }
  );

  const loadMore = () => {
    fetchMore({
      variables: {
        options: {
          limit: DOWNLOAD_PAGE_LIMIT,
          offset: downloadChannelResult.value?.getDiscussionsInChannel.discussionChannels.length,
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
              fetchMoreResult.getDiscussionsInChannel.aggregateDiscussionChannelsCount,
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

  onMounted(() => {
    if (downloadChannelResult.value?.getDiscussionsInChannel.discussionChannels.length === 0) {
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
    emit("filterByTag", tag);
  };

  const filterByChannel = (channel: string) => {
    emit("filterByChannel", channel);
  };

  const reachedEndOfResults = computed(() => {
    return (
      downloadChannelResult.value?.getDiscussionsInChannel.aggregateDiscussionChannelsCount ===
      downloadChannelResult.value?.getDiscussionsInChannel?.discussionChannels.length
    );
  });
</script>

<template>
  <div class="px-2">
    <slot />
    <p
      v-if="!downloadChannelResult && downloadLoading"
      class="dark:text-gray-200"
    >
      Loading...
    </p>
    <ErrorBanner
      v-else-if="downloadError"
      class="max-w-5xl"
      :text="downloadError.message"
    />
    <p
      v-else-if="downloadChannelResult?.getDiscussionsInChannel?.discussionChannels?.length === 0"
      class="flex gap-2 p-4"
    >
      <span class="dark:text-white">There are no downloads yet.</span>

      <RequireAuth :full-width="false">
        <template #has-auth>
          <nuxt-link
            v-if="channelId"
            class="text-orange-500 underline"
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
          <span class="cursor-pointer text-orange-500 underline">Create one?</span>
        </template>
      </RequireAuth>
    </p>

    <ul
      v-else-if="downloadChannelResult?.getDiscussionsInChannel?.discussionChannels?.length > 0"
      class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
      data-testid="channel-download-list"
    >
      <ChannelDiscussionListItem
        v-for="discussionChannel in downloadChannelResult.getDiscussionsInChannel
          .discussionChannels"
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
      />
    </ul>
    <div v-if="downloadChannelResult?.getDiscussionsInChannel?.discussionChannels?.length > 0">
      <LoadMore
        class="mb-6 justify-self-center"
        :loading="downloadLoading"
        :reached-end-of-results="reachedEndOfResults"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
