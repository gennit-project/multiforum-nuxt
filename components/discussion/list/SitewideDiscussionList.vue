<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ErrorBanner from "../../ErrorBanner.vue";
import SitewideDiscussionListItem from "./SitewideDiscussionListItem.vue";
import LoadMore from "../../LoadMore.vue";
import { GET_SITE_WIDE_DISCUSSION_LIST } from "@/graphQLData/discussion/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getEventFilterValuesFromParams";
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from "@/components/comments/getSortFromQuery";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import { useUIStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";

const DISCUSSION_PAGE_LIMIT = 15;

// Props and Emits
const emit = defineEmits(["filterByTag", "filterByChannel"]);

// Setup function
const route = useRoute();
const uiStore = useUIStore();
const { expandSitewideDiscussions } = storeToRefs(uiStore);

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const filterValues = ref(
  getFilterValuesFromParams({ route, channelId: channelId.value })
);

const selectedChannelsComputed = computed(() => {
  return filterValues.value.channels;
});

const selectedTagsComputed = computed(() => {
  return filterValues.value.tags;
});

const searchInputComputed = computed(() => {
  return filterValues.value.searchInput || "";
});

const activeSort = computed(() => {
  return getSortFromQuery(route.query);
});

const activeTimeFrame = computed(() => {
  return getTimeFrameFromQuery(route.query);
});

<<<<<<< HEAD
  const {
    result: discussionResult,
    error: discussionError,
    loading: discussionLoading,
    refetch: refetchDiscussions,
    fetchMore,
  } = useQuery(GET_SITE_WIDE_DISCUSSION_LIST, {
    searchInput: searchInputComputed,
    selectedChannels: selectedChannelsComputed,
    selectedTags: selectedTagsComputed,
    showArchived: false,
    hasDownload: false,
    options: {
      limit: DISCUSSION_PAGE_LIMIT,
      offset: 0,
      sort: activeSort,
      timeFrame: activeTimeFrame,
=======
const {
  result: discussionResult,
  error: discussionError,
  loading: discussionLoading,
  refetch: refetchDiscussions,
  fetchMore,
} = useQuery(GET_SITE_WIDE_DISCUSSION_LIST, {
  searchInput: searchInputComputed,
  selectedChannels: selectedChannelsComputed,
  selectedTags: selectedTagsComputed,
  showArchived: false,
  options: {
    limit: DISCUSSION_PAGE_LIMIT,
    offset: 0,
    sort: activeSort,
    timeFrame: activeTimeFrame,
  },
});

const discussions = computed(() => {
  if (!discussionResult.value) {
    return [];
  }
  const { getSiteWideDiscussionList } = discussionResult.value;
  if (!getSiteWideDiscussionList) {
    return [];
  }
  return getSiteWideDiscussionList.discussions;
});

const aggregateDiscussionCount = computed(() => {
  if (!discussionResult.value) {
    return 0;
  }
  return discussionResult.value.getSiteWideDiscussionList
    .aggregateDiscussionCount;
});

const loadMore = () => {
  fetchMore({
    variables: {
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset:
          discussionResult.value.getSiteWideDiscussionList.discussions.length,
        // @ts-ignore 
        sort: activeSort.value,
        // @ts-ignore
        timeFrame: activeTimeFrame.value,
      },
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;

      return {
        getSiteWideDiscussionList: {
          ...previousResult.getSiteWideDiscussionList,
          aggregateDiscussionCount:
            previousResult.getSiteWideDiscussionList.aggregateDiscussionCount,
          discussions: [
            ...previousResult.getSiteWideDiscussionList.discussions,
            ...fetchMoreResult.getSiteWideDiscussionList.discussions,
          ],
        },
      };
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    },
  });
};

// Watchers
watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      });
    }
    if (
      discussionResult?.value?.getDiscussionsInChannel?.discussionChannels
        ?.length === 0
    ) {
      refetchDiscussions();
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
</script>

<template>
  <div class="flex justify-center">
  <div class="flex-1 bg-white dark:bg-gray-800 dark:text-white max-w-screen-2xl">
    <slot />
    <p v-if="discussionLoading">Loading...</p>
    <ErrorBanner
      v-else-if="discussionError"
      class="max-w-5xl"
      :text="discussionError.message"
    />
    <p
      v-else-if="discussions && discussions.length === 0"
      class="my-6 flex gap-2 px-4"
    >
      <span class="dark:text-white">There are no discussions to show.</span>

<<<<<<< HEAD
        <RequireAuth :full-width="false">
          <template #has-auth>
            <nuxt-link
              class="text-orange-500 underline"
              :to="{ name: 'discussions-create' }"
            >
              Create one?
            </nuxt-link>
          </template>
          <template #does-not-have-auth>
            <span class="cursor-pointer text-orange-500 underline">Create one?</span>
          </template>
        </RequireAuth>
      </p>
      <div
        v-if="discussions && discussions.length > 0"
        class="p-0"
=======
      <RequireAuth :full-width="false">
        <template #has-auth>
          <nuxt-link
            :to="{ name: 'discussions-create' }"
            class="text-blue-500 underline"
          >
            Create one?
          </nuxt-link>
        </template>
        <template #does-not-have-auth>
          <span class="cursor-pointer text-blue-500 underline"
            >Create one?</span
          >
        </template>
      </RequireAuth>
    </p>
    <div v-if="discussions && discussions.length > 0" class="p-0">
      <ul
        role="list"
        class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 shadow sm:rounded-lg p-0 m-0"
        data-testid="sitewide-discussion-list"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      >
        <SitewideDiscussionListItem
          v-for="discussion in discussionResult.getSiteWideDiscussionList
            .discussions"
          :key="`${discussion.id}-${expandSitewideDiscussions}`"
          :discussion="discussion"
          :score="discussion.score"
          :search-input="filterValues.searchInput"
          :selected-tags="filterValues.tags"
          :selected-channels="filterValues.channels"
          :default-expanded="expandSitewideDiscussions"
          @filter-by-tag="filterByTag"
          @filter-by-channel="filterByChannel"
        />
      </ul>
      <div
        v-if="discussionResult.getSiteWideDiscussionList.discussions.length > 0"
      >
        <LoadMore
          class="ml-4 justify-self-center"
          :loading="discussionLoading"
          :reached-end-of-results="
            aggregateDiscussionCount ===
            discussionResult.getSiteWideDiscussionList.discussions.length
          "
          @load-more="loadMore"
        />
      </div>
    </div>
  </div>
</div>
</template>
