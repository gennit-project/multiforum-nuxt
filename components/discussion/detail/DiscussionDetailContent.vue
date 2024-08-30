<script lang="ts">
import { defineComponent, computed, ref, watch } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import {
  GET_DISCUSSION_COMMENTS,
  GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
} from "@/graphQLData/comment/queries";
import { relativeTime } from "../../../dateTimeUtils";
import type { Discussion , DiscussionChannel , Comment } from "@/src/__generated__/graphql";
import ErrorBanner from "../../ErrorBanner.vue";
import { useDisplay } from "vuetify";
import DiscussionBody from "./DiscussionBody.vue";
import DiscussionHeader from "./DiscussionHeader.vue";
import DiscussionCommentsWrapper from "@/components/discussion/detail/DiscussionCommentsWrapper.vue";
import DiscussionChannelLinks from "./DiscussionChannelLinks.vue";
import DiscussionRootCommentFormWrapper from "@/components/discussion/form/DiscussionRootCommentFormWrapper.vue";
import DiscussionVotes from "../vote/DiscussionVotes.vue";
import "md-editor-v3/lib/style.css";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import PageNotFound from "@/components/PageNotFound.vue";
import GenericFeedbackFormModal from "@/components/forms/GenericFeedbackFormModal.vue";
import ConfirmUndoDiscussionFeedbackModal from "@/components/discussion/detail/ConfirmUndoDiscussionFeedbackModal.vue";
import { ADD_FEEDBACK_COMMENT_TO_DISCUSSION } from "@/graphQLData/discussion/mutations";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import Notification from "@/components/Notification.vue";
import EditFeedbackModal from "@/components/discussion/detail/EditFeedbackModal.vue";
import DiscussionAlbum from "./DiscussionAlbum.vue";

export const COMMENT_LIMIT = 50;

export default defineComponent({
  components: {
    ConfirmUndoDiscussionFeedbackModal,
    DiscussionAlbum,
    DiscussionChannelLinks,
    DiscussionRootCommentFormWrapper,
    DiscussionCommentsWrapper,
    DiscussionBody,
    DiscussionHeader,
    DiscussionVotes,
    EditFeedbackModal,
    ErrorBanner,
    GenericFeedbackFormModal,
    Notification,
    PageNotFound,
  },
  props: {
    discussionId: {
      type: String,
      required: true,
    },
    compactMode: {
      type: Boolean,
      default: false,
    },
    loggedInUserModName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const offset = ref(0);

    // Makes the query refetch if the discussionId changes.
    const discussionId = computed(() => props.discussionId);

    // Makes the query refetch if the mod name changes.
    const loggedInUserModName = computed(() => props.loggedInUserModName);

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const {
      result: localUsernameResult,
      loading: localUsernameLoading,
      error: localUsernameError,
    } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      if (localUsernameLoading.value || localUsernameError.value) {
        return "";
      }
      return localUsernameResult.value.username;
    });

    const {
      result: getDiscussionResult,
      error: getDiscussionError,
      loading: getDiscussionLoading,
      refetch: refetchDiscussion,
    } = useQuery(GET_DISCUSSION, {
      id: discussionId,
      loggedInModName: props.loggedInUserModName,
      channelUniqueName: channelId.value,
    });

    const {
      mutate: addFeedbackCommentToDiscussion,
      loading: addFeedbackCommentToDiscussionLoading,
      error: addFeedbackCommentToDiscussionError,
      onDone: onAddFeedbackCommentToDiscussionDone,
    } = useMutation(ADD_FEEDBACK_COMMENT_TO_DISCUSSION);

    const showFeedbackFormModal = ref(false);
    const showEditFeedbackModal = ref(false);
    const showConfirmUndoFeedbackModal = ref(false);
    const showFeedbackSubmittedSuccessfully = ref(false);

    onAddFeedbackCommentToDiscussionDone(() => {
      showFeedbackFormModal.value = false;
      showFeedbackSubmittedSuccessfully.value = true;
    });

    const commentSort = computed(() => {
      return getSortFromQuery(route.query);
    });

    const {
      result: getDiscussionChannelResult,
      error: getDiscussionChannelError,
      loading: getDiscussionChannelLoading,
      fetchMore: fetchMoreComments,
    } = useQuery(GET_DISCUSSION_COMMENTS, {
      discussionId: discussionId,
      channelUniqueName: channelId,
      modName: loggedInUserModName,
      offset: offset.value,
      limit: COMMENT_LIMIT,
      sort: commentSort,
    });

    watch(commentSort, () => {
      fetchMoreComments({ variables: { sort: commentSort.value } });
    });

    const activeDiscussionChannel = computed<DiscussionChannel>(() => {
      if (
        getDiscussionChannelLoading.value ||
        getDiscussionChannelError.value ||
        !getDiscussionChannelResult.value
      ) {
        return null;
      }
      return getDiscussionChannelResult.value.getCommentSection
        ?.DiscussionChannel;
    });

    const comments = computed(() => {
      if (getDiscussionChannelError.value) {
        return [];
      }
      return (
        getDiscussionChannelResult.value?.getCommentSection?.Comments || []
      );
    });

    const loadedRootCommentCount = computed(() => {
      if (
        getDiscussionChannelLoading.value ||
        getDiscussionChannelError.value
      ) {
        return [];
      }

      const rootComments = comments.value.filter((comment: Comment) => {
        return comment.ParentComment === null;
      });
      return rootComments.length;
    });

    // We get the aggregate count of root comments so that we will know
    // whether or not to show the "Load More" button at the end of the comments.
    const {
      result: getDiscussionChannelRootCommentAggregateResult,
      error: getDiscussionChannelRootCommentAggregateError,
      loading: getDiscussionChannelRootCommentAggregateLoading,
    } = useQuery(GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE, {
      discussionId: discussionId,
      channelUniqueName: channelId,
    });

    const discussion = computed<Discussion>(() => {
      if (getDiscussionLoading.value || getDiscussionError.value) {
        return null;
      }
      return getDiscussionResult.value.discussions[0];
    });

    const { lgAndUp, mdAndUp, smAndDown } = useDisplay();

    const commentCount = computed(() => {
      if (!activeDiscussionChannel.value) {
        return 0;
      }
      return activeDiscussionChannel.value.CommentsAggregate?.count || 0;
    });

    const aggregateRootCommentCount = computed(() => {
      if (
        getDiscussionChannelRootCommentAggregateLoading.value ||
        getDiscussionChannelRootCommentAggregateError.value
      ) {
        return 0;
      }
      if (
        !getDiscussionChannelRootCommentAggregateResult.value ||
        !getDiscussionChannelRootCommentAggregateResult.value.discussionChannels
      ) {
        return 0;
      }

      const discussionChannels =
        getDiscussionChannelRootCommentAggregateResult.value.discussionChannels;
      if (discussionChannels.length === 0) {
        return 0;
      }
      const discussionChannel = discussionChannels[0];
      return discussionChannel.CommentsAggregate?.count || 0;
    });

    // Needed to update the cached result of the query if the
    // user creates a root comment.
    const previousOffset = ref(0);

    const loadMore = () => {
      fetchMoreComments({
        variables: {
          offset:
            getDiscussionChannelResult.value?.getCommentSection?.Comments
              .length || 0,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          offset.value =
            offset.value + fetchMoreResult.getCommentSection.Comments.length;

          // We need to update the result of GET_DISCUSSION_COMMENTS
          // to include the new comments.
          return {
            ...previousResult,
            getCommentSection: {
              ...previousResult.getCommentSection,
              Comments: [
                ...previousResult.getCommentSection.Comments,
                ...fetchMoreResult.getCommentSection.Comments,
              ],
            },
          };
        },
      });
    };

    const reachedEndOfResults = computed(() => {
      return (
        loadedRootCommentCount.value >= aggregateRootCommentCount.value ||
        loadedRootCommentCount.value >= commentCount.value
      );
    });

    const loggedInUserIsAuthor = computed(() => {
      if (!discussion.value) {
        return false;
      }
      return discussion.value.Author?.username === username.value;
    });

    const discussionAuthor = computed(() => {
      if (!discussion.value) {
        return "";
      }
      return discussion.value.Author?.username;
    });

    return {
      activeDiscussionChannel,
      addFeedbackCommentToDiscussion,
      addFeedbackCommentToDiscussionError,
      addFeedbackCommentToDiscussionLoading,
      channelId,
      commentCount,
      comments,
      getDiscussionResult,
      getDiscussionError,
      getDiscussionLoading,
      getDiscussionChannelLoading,
      discussion,
      discussionAuthor,
      feedbackText: ref(""),
      lgAndUp,
      loadedRootCommentCount,
      loadMore,
      loggedInUserIsAuthor,
      mdAndUp,
      offset,
      previousOffset,
      reachedEndOfResults,
      relativeTime,
      aggregateRootCommentCount,
      refetchDiscussion,
      route,
      router,
      showConfirmUndoFeedbackModal,
      showEditFeedbackModal,
      showFeedbackFormModal,
      showFeedbackSubmittedSuccessfully,
      smAndDown,
    };
  },
  methods: {
    handleClickGiveFeedback() {
      this.showFeedbackFormModal = true;
    },
    handleClickEditFeedback() {
      this.showEditFeedbackModal = true;
    },
    handleClickUndoFeedback() {
      this.showConfirmUndoFeedbackModal = true;
    },
    handleFeedbackInput(event: any) {
      this.feedbackText = event.target.value;
    },
    async handleSubmitFeedback() {
      if (!this.activeDiscussionChannel?.channelUniqueName) {
        console.error("No active discussion channel found.");
        return;
      }
      await this.addFeedbackCommentToDiscussion({
        discussionId: this.discussionId,
        text: this.feedbackText,
        modProfileName: this.loggedInUserModName,
        channelId: this.activeDiscussionChannel?.channelUniqueName,
      });
      // Refetch the discussion so that the thumbs-down shows
      // that it's active, meaning the user has given feedback.
      this.refetchDiscussion();
    },
  },
});
</script>

<template>
  <div class="w-full">
    <PageNotFound
      v-if="
        !getDiscussionLoading &&
          !getDiscussionChannelLoading &&
          !activeDiscussionChannel
      "
    />
    <div
      v-else
      class="flex max-w-7xl justify-center space-y-2 bg-white py-2 dark:bg-gray-800 sm:px-2 md:px-5"
    >
      <div class="w-full flex-col space-y-2">
        <ErrorBanner
          v-if="getDiscussionError"
          class="mt-2 px-4"
          :text="getDiscussionError.message"
        />

        <v-row
          v-if="discussion"
          class="flex justify-center"
        >
          <v-col>
            <div class="space-y-3 px-2">
              <div class="rounded-lg pb-2 dark:border-gray-700">
                <DiscussionHeader
                  :discussion="discussion"
                  :channel-id="channelId"
                  :compact-mode="compactMode"
                  @handle-click-give-feedback="handleClickGiveFeedback"
                />
                <DiscussionBody
                  :discussion="discussion"
                  :channel-id="channelId"
                  :discussion-channel-id="activeDiscussionChannel?.id"
                  :emoji-json="activeDiscussionChannel?.emoji"
                >
                  <template #album-slot>
                    <DiscussionAlbum
                      v-if="
                        discussion.Album && discussion.Album.Images?.length > 0
                      "
                      class=""
                      :album="discussion.Album"
                    />
                  </template>
                  <template #button-slot>
                    <div class="flex h-12 items-center">
                      <DiscussionVotes
                        v-if="activeDiscussionChannel"
                        :discussion="discussion"
                        :discussion-channel="activeDiscussionChannel"
                        :show-downvote="!loggedInUserIsAuthor"
                        @handle-click-give-feedback="handleClickGiveFeedback"
                        @handle-click-undo-feedback="handleClickUndoFeedback"
                        @handle-click-edit-feedback="handleClickEditFeedback"
                      />
                    </div>
                  </template>
                </DiscussionBody>
              </div>
            </div>
          </v-col>
        </v-row>
        <div>
          <DiscussionRootCommentFormWrapper
            :key="`${channelId}${discussionId}`"
            class="pr-3"
            :channel-id="channelId"
            :discussion-channel="activeDiscussionChannel"
            :previous-offset="previousOffset"
            :mod-name="loggedInUserModName"
          />
          <div class="mx-2 my-6 rounded-lg">
            <DiscussionCommentsWrapper
              :key="activeDiscussionChannel?.id"
              :loading="getDiscussionChannelLoading"
              :discussion-channel="activeDiscussionChannel"
              :discussion-author="discussionAuthor || ''"
              :comments="comments"
              :mod-name="loggedInUserModName"
              :reached-end-of-results="reachedEndOfResults"
              :previous-offset="previousOffset"
              @load-more="loadMore"
            />
          </div>
          <DiscussionChannelLinks
            v-if="discussion && discussion.DiscussionChannels"
            class="my-4"
            :discussion-channels="discussion.DiscussionChannels"
            :channel-id="
              activeDiscussionChannel
                ? activeDiscussionChannel.channelUniqueName
                : ''
            "
          />
        </div>
      </div>
    </div>
    <GenericFeedbackFormModal
      v-if="showFeedbackFormModal"
      :open="showFeedbackFormModal"
      :loading="addFeedbackCommentToDiscussionLoading"
      @close="showFeedbackFormModal = false"
      @input="handleFeedbackInput"
      @primary-button-click="handleSubmitFeedback"
    />
    <ConfirmUndoDiscussionFeedbackModal
      v-if="showConfirmUndoFeedbackModal"
      :key="loggedInUserModName"
      :open="showConfirmUndoFeedbackModal"
      :discussion-id="discussionId"
      :mod-name="loggedInUserModName"
      @close="showConfirmUndoFeedbackModal = false"
    />
    <EditFeedbackModal
      v-if="showEditFeedbackModal"
      :open="showEditFeedbackModal"
      :discussion-id="discussionId"
      :mod-name="loggedInUserModName"
      @close="showEditFeedbackModal = false"
    />
    <Notification
      :show="showFeedbackSubmittedSuccessfully"
      :title="'Your feedback was submitted successfully.'"
      @close-notification="showFeedbackSubmittedSuccessfully = false"
    />
  </div>
</template>
