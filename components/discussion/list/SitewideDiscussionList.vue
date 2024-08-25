<script lang="ts">
import { computed, defineComponent, Ref, ref } from "vue";
import ErrorBanner from "../../ErrorBanner.vue";
import SitewideDiscussionListItem from "./SitewideDiscussionListItem.vue";
import LoadMore from "../../LoadMore.vue";
import { GET_SITE_WIDE_DISCUSSION_LIST } from "@/graphQLData/discussion/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "vue-router";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import { SearchDiscussionValues } from "@/types/Discussion";
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from "@/components/comments/getSortFromQuery";
import RequireAuth from '@/components/auth/RequireAuth.vue'

const DISCUSSION_PAGE_LIMIT = 15;

export default defineComponent({
  components: {
    ErrorBanner,
    LoadMore,
    RequireAuth,
    SitewideDiscussionListItem,
  },
  inheritAttrs: false,
  // The reason we have separate components for the sidewide discussion
  // list and the channel discussion list is because the channel discussion
  // list needs the query to get discussions to return more information,
  // specifically the comment section data, which is needed to display
  // the vote buttons.
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const filterValues: Ref<SearchDiscussionValues> = ref(
      getFilterValuesFromParams({ route, channelId: channelId.value }),
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
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset: 0,
        sort: activeSort,
        timeFrame: activeTimeFrame,
      },
      fetchPolicy: "cache-and-network",
    });

    const discussions = computed(() => {
      if (!discussionResult.value) {
        return [];
      }
      const { getSiteWideDiscussionList } = discussionResult.value;
      if (!getSiteWideDiscussionList) {
        return [];
      }
      const { discussions } = getSiteWideDiscussionList;
      return discussions;
    });

    const aggregateDiscussionCount = computed(() => {
      if (!discussionResult.value) {
        return 0;
      }
      return discussionResult.value.getSiteWideDiscussionList
        .aggregateDiscussionCount;
    });

    const reachedEndOfResults = ref(false);

    const loadMore = () => {
      fetchMore({
        variables: {
          options: {
            limit: DISCUSSION_PAGE_LIMIT,
            offset:
              discussionResult.value.getSiteWideDiscussionList.discussions
                .length,
            sort: activeSort.value,
            timeFrame: activeTimeFrame.value,
          },
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          return {
            getSiteWideDiscussionList: {
              ...previousResult.getSiteWideDiscussionList,
              aggregateDiscussionCount:
                previousResult.getSiteWideDiscussionList
                  .aggregateDiscussionCount,
              discussions: [
                ...previousResult.getSiteWideDiscussionList.discussions,
                ...fetchMoreResult.getSiteWideDiscussionList.discussions,
              ],
            },
          };
        },
      });
    };

    return {
      aggregateDiscussionCount,
      discussionError,
      discussionLoading,
      discussions,
      discussionResult,
      filterValues,
      loadMore,
      reachedEndOfResults,
      refetchDiscussions,
    };
  },
  created() {
    this.$watch("$route.query", () => {
      if (this.$route.query) {
        this.filterValues = getFilterValuesFromParams({
          route: this.$route,
          channelId: this.channelId,
        });
      }
    });
  },
  methods: {
    filterByTag(tag: string) {
      this.$emit("filterByTag", tag);
    },
    filterByChannel(channel: string) {
      this.$emit("filterByChannel", channel);
    },
    updateFilters(params: SearchDiscussionValues) {
      const existingQuery = this.$route.query;
      // Updating the URL params causes the events
      // to be refetched by the EventListView
      // and MapView components
      this.$router.replace({
        query: {
          ...existingQuery,
          ...params,
        },
      });
    },
  },
});
</script>
<template>
  <div class="w-full md:rounded-lg md:px-2">
    <slot />
    <p v-if="discussionLoading">
      Loading...
    </p>
    <ErrorBanner
      v-else-if="discussionError"
      class="max-w-5xl"
      :text="discussionError.message"
    />
    <p
      v-else-if="discussions && discussions.length === 0"
      class="my-6 flex gap-2 px-4"
    >
      <span>There are no discussions to show.</span>

      <RequireAuth :full-width="false">
        <template #has-auth>
          <router-link
            :to="{
              name: 'CreateDiscussion',
            }"
            class="text-blue-500 underline"
          >
            Create one?
          </router-link>
        </template>
        <template #does-not-have-auth>
          <span class="cursor-pointer text-blue-500 underline">Create one?</span>
        </template>
      </RequireAuth>
    </p>
    <div v-if="discussions && discussions.length > 0">
      <ul
        role="list"
        class="my-6 flex flex-col gap-1"
        data-testid="sitewide-discussion-list"
      >
        <SitewideDiscussionListItem
          v-for="discussion in discussionResult.getSiteWideDiscussionList
            .discussions"
          :key="discussion.id"
          :discussion="discussion"
          :score="discussion.score"
          :search-input="filterValues.searchInput"
          :selected-tags="filterValues.tags"
          :selected-channels="filterValues.channels"
          @filterByTag="filterByTag"
          @filterByChannel="filterByChannel"
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
          @loadMore="loadMore"
        />
      </div>
    </div>
  </div>
</template>
