<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import {
  GET_DISCUSSION_COMMENTS,
  GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
} from "@/graphQLData/comment/queries";
import type {
  Discussion,
  DiscussionChannel,
  Comment,
} from "@/__generated__/graphql";
import { ADD_FEEDBACK_COMMENT_TO_DISCUSSION } from "@/graphQLData/discussion/mutations";
import ErrorBanner from "@/components/ErrorBanner.vue";
import DiscussionBody from "@/components/discussion/detail/DiscussionBody.vue";
import DiscussionHeader from "@/components/discussion/detail/DiscussionHeader.vue";
import DiscussionCommentsWrapper from "@/components/discussion/detail/DiscussionCommentsWrapper.vue";
import DiscussionChannelLinks from "@/components/discussion/detail/DiscussionChannelLinks.vue";
import DiscussionRootCommentFormWrapper from "@/components/discussion/form/DiscussionRootCommentFormWrapper.vue";
import DiscussionVotes from "@/components/discussion/vote/DiscussionVotes.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import GenericFeedbackFormModal from "@/components/GenericFeedbackFormModal.vue";
import ConfirmUndoDiscussionFeedbackModal from "@/components/discussion/detail/ConfirmUndoDiscussionFeedbackModal.vue";
import EditFeedbackModal from "@/components/discussion/detail/EditFeedbackModal.vue";
import Notification from "@/components/NotificationComponent.vue";
import DiscussionAlbum from "@/components/discussion/detail/DiscussionAlbum.vue";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { usernameVar } from "@/cache";


const COMMENT_LIMIT = 50;

const props = defineProps({
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
});

const route = useRoute();
const offset = ref(0);
const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);

const username = computed(() => {
  return usernameVar || ""
});

const {
  result: getDiscussionResult,
  error: getDiscussionError,
  loading: getDiscussionLoading,
  refetch: refetchDiscussion,
} = useQuery(GET_DISCUSSION, {
  id: props.discussionId,
  loggedInModName: props.loggedInUserModName,
  channelUniqueName: channelId.value,
});

const {
  mutate: addFeedbackCommentToDiscussion,
  error: addFeedbackCommentToDiscussionError,
  loading: addFeedbackCommentToDiscussionLoading,
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

const commentSort = computed(() => getSortFromQuery(route.query));

const {
  result: getDiscussionChannelResult,
  error: getDiscussionChannelError,
  loading: getDiscussionChannelLoading,
  fetchMore: fetchMoreComments,
} = useQuery(GET_DISCUSSION_COMMENTS, {
  discussionId: props.discussionId,
  channelUniqueName: channelId,
  modName: props.loggedInUserModName,
  offset: offset.value,
  limit: COMMENT_LIMIT,
  sort: commentSort,
});

watch(commentSort, () =>
  fetchMoreComments({ variables: { sort: commentSort.value } })
);

const activeDiscussionChannel = computed<DiscussionChannel | null>(() => {
  if (
    !getDiscussionChannelResult.value
  ) {
    return null;
  }
  return (
    getDiscussionChannelResult.value.getCommentSection?.DiscussionChannel ||
    null
  );
});

const comments = computed(() =>
  getDiscussionChannelError.value
    ? []
    : getDiscussionChannelResult.value?.getCommentSection?.Comments || []
);

const loadedRootCommentCount = computed(() => {
  const rootComments = comments.value.filter(
    (comment: Comment) => comment.ParentComment === null
  );
  return rootComments.length;
});

const {
  result: getDiscussionChannelRootCommentAggregateResult,
  error: getDiscussionChannelRootCommentAggregateError,
  loading: getDiscussionChannelRootCommentAggregateLoading,
} = useQuery(GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE, {
  discussionId: props.discussionId,
  channelUniqueName: channelId,
});

const discussion = computed<Discussion | null>(() =>
  getDiscussionLoading.value || getDiscussionError.value
    ? null
    : getDiscussionResult.value.discussions[0]
);

const commentCount = computed(
  () => activeDiscussionChannel.value?.CommentsAggregate?.count || 0
);

const aggregateRootCommentCount = computed(() => {
  if (
    getDiscussionChannelRootCommentAggregateLoading.value ||
    getDiscussionChannelRootCommentAggregateError.value
  ) {
    return 0;
  }
  const discussionChannels =
    getDiscussionChannelRootCommentAggregateResult.value?.discussionChannels ||
    [];
  if (!discussionChannels.length) return 0;
  return discussionChannels[0].CommentsAggregate?.count || 0;
});

const loadMore = () => {
  fetchMoreComments({
    variables: {
      offset:
        getDiscussionChannelResult.value?.getCommentSection?.Comments.length ||
        0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      offset.value += fetchMoreResult.getCommentSection.Comments.length;
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

const reachedEndOfResults = computed(
  () =>
    loadedRootCommentCount.value >= aggregateRootCommentCount.value ||
    loadedRootCommentCount.value >= commentCount.value
);

const loggedInUserIsAuthor = computed(
  () => discussion.value?.Author?.username === username.value
);
const discussionAuthor = computed(
  () => discussion.value?.Author?.username || ""
);

const handleClickGiveFeedback = () => {
  showFeedbackFormModal.value = true;
};

const feedbackText = ref("");
const previousOffset = ref(0);

const handleSubmitFeedback = async () => {
  if (!feedbackText.value) {
    console.error("No feedback text found.");
    return;
  }
  if (!props.loggedInUserModName) {
    console.error("No mod name found.");
    return;
  }
  if (!activeDiscussionChannel.value?.channelUniqueName) {
    console.error("No active discussion channel found.");
    return;
  }
  await addFeedbackCommentToDiscussion({
    discussionId: props.discussionId,
    text: feedbackText.value,
    modProfileName: props.loggedInUserModName,
    channelId: activeDiscussionChannel.value?.channelUniqueName,
  });
  // Refetch the discussion so that the thumbs-down shows
  // that it's active, meaning the user has given feedback.
  refetchDiscussion();
  // showFeedbackFormModal.value = false;
};
const handleFeedbackInput = (event: string) => {
  feedbackText.value = event;
};
const handleClickUndoFeedback = () => {
  showConfirmUndoFeedbackModal.value = true;
};
const handleClickEditFeedback = () => {
  showEditFeedbackModal.value = true;
};

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
      class="flex max-w-screen-2xl justify-center space-y-2 bg-white py-2 dark:bg-gray-800 sm:px-2 md:px-5"
    >
      <div class="w-full flex-col space-y-2">
        <ErrorBanner
          v-if="getDiscussionError"
          class="mt-2 px-4"
          :text="getDiscussionError.message"
        />
        <v-row v-if="discussion" class="flex justify-center">
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
            :discussion-channel="activeDiscussionChannel || undefined"
            :previous-offset="previousOffset"
            :mod-name="loggedInUserModName"
          />
          <div class="mx-2 my-6 rounded-lg">
            <DiscussionCommentsWrapper
              :key="activeDiscussionChannel?.id"
              :loading="getDiscussionChannelLoading"
              :discussion-channel="activeDiscussionChannel || undefined"
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
            :discussion-channels="discussion.DiscussionChannels"
            :channel-id="activeDiscussionChannel?.channelUniqueName || ''"
          />
        </div>
      </div>
    </div>
    <GenericFeedbackFormModal
      v-if="showFeedbackFormModal"
      :error="addFeedbackCommentToDiscussionError?.message"
      :open="showFeedbackFormModal"
      :loading="addFeedbackCommentToDiscussionLoading"
      :primary-button-disabled="!feedbackText"
      @close="showFeedbackFormModal = false"
      @update-feedback="handleFeedbackInput"
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
