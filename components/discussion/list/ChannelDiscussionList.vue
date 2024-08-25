<script lang="ts">
import { defineComponent, PropType, computed, ref, Ref } from "vue";
import ChannelDiscussionListItem from "./ChannelDiscussionListItem.vue";
import LoadMore from "../../LoadMore.vue";
import ErrorBanner from "../../ErrorBanner.vue";
import { Discussion as DiscussionData } from "@/__generated__/graphql";
import { useRoute } from "vue-router";
import WarningModal from "../../WarningModal.vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { generateSlug } from "random-word-slugs";
import { CREATE_MOD_PROFILE } from "@/graphQLData/user/mutations";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from "@/graphQLData/discussion/queries";
import { modProfileNameVar } from "@/cache";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import { SearchDiscussionValues } from "../../../types/Discussion";
import { useDisplay } from "vuetify";
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from "@/components/comments/getSortFromQuery";
import RequireAuth from "@/components/auth/RequireAuth.vue";

export const DISCUSSION_PAGE_LIMIT = 25;

export default defineComponent({
  components: {
    ChannelDiscussionListItem,
    ErrorBanner,
    LoadMore,
    WarningModal,
    RequireAuth,
  },
  inheritAttrs: false,
  props: {
    searchInput: {
      type: String,
      default: "",
    },
    selectedTags: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
    selectedChannels: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
  },
  // The reason we have separate components for the sidewide discussion
  // list and the channel discussion list is because the channel discussion
  // list needs the query to get discussions to return more information,
  // specifically the comment section data, which is needed to display
  // the vote buttons.
  // The channel list fetches the DiscussionChannel nodes, which contain
  // comments and votes that are attached to the discussion's submission to a specific
  // channel. In contrast, the sitewide list fetches Discussion resources directly.
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const filterValues: Ref<SearchDiscussionValues> = ref(
      getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      }),
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

    // $channelUniqueName: String!
    // $searchInput: String!
    // $selectedTags: [String!]
    // $options: DiscussionListOptions

    const {
      result: discussionChannelResult,
      error: discussionError,
      loading: discussionLoading,
      refetch: refetchDiscussions,
      fetchMore,
    } = useQuery(GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA, {
      channelUniqueName: channelId,
      searchInput,
      selectedTags,
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset: 0,
        sort: activeSort,
        timeFrame: activeTimeFrame,
      },
    });

    const reachedEndOfResults = ref(false);

    const loadMore = () => {
      fetchMore({
        variables: {
          options: {
            limit: DISCUSSION_PAGE_LIMIT,
            offset:
              discussionChannelResult.value?.getDiscussionsInChannel
                .discussionChannels.length,
            sort: activeSort.value,
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
    const {
      result: localUsernameResult,
      loading: localUsernameLoading,
      error: localUsernameError,
    } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      if (localUsernameLoading.value || localUsernameError.value) {
        return "";
      }
      return localUsernameResult.value;
    });

    const randomWords = generateSlug(4, { format: "camel" });

    const { mutate: createModProfile, onDone: onDoneCreateModProfile } =
      useMutation(CREATE_MOD_PROFILE, () => ({
        variables: {
          displayName: randomWords,
          username: username.value?.username,
        },
      }));

    onDoneCreateModProfile(({ data }) => {
      const updatedUser = data.updateUsers.users[0];

      const newModProfileName = updatedUser.ModerationProfile.displayName;
      modProfileNameVar(newModProfileName);
    });
    const { mdAndDown } = useDisplay();

    return {
      channelId: channelId.value,
      createModProfile,
      discussionError,
      discussionLoading,
      discussionChannelResult,
      filterValues,
      loadMore,
      mdAndDown,
      reachedEndOfResults,
      refetchDiscussions,
      selectedDiscussion: {} as DiscussionData,
      showModProfileModal: ref(false),
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

    // If empty, fetch the first page of discussions.
    if (
      this.discussionChannelResult?.getDiscussionsInChannel.discussionChannels
        .length === 0
    ) {
      this.refetchDiscussions();
    }
  },
  methods: {
    filterByTag(tag: string) {
      this.$emit("filterByTag", tag);
    },
    filterByChannel(channel: string) {
      this.$emit("filterByChannel", channel);
    },
    async handleCreateModProfileClick() {
      await this.createModProfile();
      modProfileNameVar();
      this.downvote();
      this.showModProfileModal = false;
      // show snack
    },
  },
});
</script>
<template>
  <div class="md:px-6">
    <slot />
    <p v-if="!discussionChannelResult && discussionLoading">
      Loading...
    </p>
    <ErrorBanner
      v-else-if="discussionError"
      class="max-w-5xl"
      :text="discussionError.message"
    />
    <p
      v-else-if="
        discussionChannelResult &&
          discussionChannelResult.getDiscussionsInChannel.discussionChannels
            .length === 0
      "
      class="flex gap-2 p-4"
    >
      <span>There are no discussions to show.</span>

      <RequireAuth :full-width="false">
        <template #has-auth>
          <router-link
            v-if="channelId"
            :to="{
              name: 'CreateDiscussionInChannel',
              params: {
                channelId: channelId,
              },
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
    <div v-else>
      <div>
        <ul
          role="list"
          class="relative flex flex-col rounded  dark:divide-gray-700 divide-gray-200"
          data-testid="channel-discussion-list"
        >
          <ChannelDiscussionListItem
            v-for="discussionChannel in discussionChannelResult
              .getDiscussionsInChannel.discussionChannels"
            :key="discussionChannel.id"
            :discussion="discussionChannel.Discussion"
            :discussion-channel="discussionChannel"
            :search-input="searchInput"
            :selected-tags="selectedTags"
            :selected-channels="selectedChannels"
            @openModProfile="showModProfileModal = true"
            @filterByTag="filterByTag"
            @filterByChannel="filterByChannel"
          />
        </ul>
        <div
          v-if="
            discussionChannelResult.getDiscussionsInChannel.discussionChannels
              .length > 0
          "
        >
          <LoadMore
            class="justify-self-center mb-6"
            :loading="discussionLoading"
            :reached-end-of-results="
              discussionChannelResult.getDiscussionsInChannel
                .aggregateDiscussionChannelsCount ===
                discussionChannelResult.getDiscussionsInChannel.discussionChannels
                  .length
            "
            @loadMore="loadMore"
          />
        </div>
      </div>
    </div>
    <WarningModal
      :title="'Create Mod Profile'"
      :body="`Moderation activity is tracked to prevent abuse, therefore you need to create a mod profile in order to downvote this comment. Continue?`"
      :open="showModProfileModal"
      :primary-button-text="'Yes, create a mod profile'"
      @close="showModProfileModal = false"
      @primaryButtonClick="handleCreateModProfileClick"
    />
  </div>
</template>
