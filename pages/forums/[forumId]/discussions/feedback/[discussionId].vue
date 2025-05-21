<script lang="ts" setup>
  import { ref, computed, watch } from "vue";
  import { useQuery, useMutation } from "@vue/apollo-composable";
  import BackLink from "@/components/BackLink.vue";
  import DiscussionBody from "@/components/discussion/detail/DiscussionBody.vue";
  import DiscussionHeader from "@/components/discussion/detail/DiscussionHeader.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import PageNotFound from "@/components/PageNotFound.vue";
  import FeedbackSection from "@/components/comments/FeedbackSection.vue";
  import { GET_DISCUSSION_FEEDBACK } from "@/graphQLData/discussion/queries";
  import { ADD_FEEDBACK_COMMENT_TO_COMMENT } from "@/graphQLData/comment/mutations";
  import { GET_FEEDBACK_ON_COMMENT } from "@/graphQLData/comment/queries";
  import { modProfileNameVar } from "@/cache";
  import { useRoute } from "nuxt/app";
  import type { Comment } from "__generated__/graphql";

  const PAGE_LIMIT = 10;

  const route = useRoute();

  const contextLink = ref("");
  const channelId = ref(typeof route.params.forumId === "string" ? route.params.forumId : "");
  const discussionId = ref(
    typeof route.params.discussionId === "string" ? route.params.discussionId : ""
  );
  const commentId = ref(typeof route.params.commentId === "string" ? route.params.commentId : "");
  const offset = ref(0);
  const feedbackId = ref(
    typeof route.params.feedbackId === "string" ? route.params.feedbackId : ""
  );

  const {
    result: getDiscussionResult,
    error: getDiscussionError,
    loading: getDiscussionLoading,
    fetchMore,
  } = useQuery(
    GET_DISCUSSION_FEEDBACK,
    {
      id: discussionId,
      limit: PAGE_LIMIT,
      offset: offset,
      loggedInModName: modProfileNameVar.value,
    },
    {
      fetchPolicy: "cache-first",
    }
  );

  const commentToRemoveFeedbackFrom = ref(null);
  const commentToGiveFeedbackOn = ref<Comment | null>(null);

  const discussion = computed(() => {
    return getDiscussionResult.value?.discussions[0] || null;
  });

  const feedbackComments = computed(() => discussion.value?.FeedbackComments || []);
  const feedbackCommentsAggregate = computed(
    () => discussion.value?.FeedbackCommentsAggregate?.count || 0
  );

  const loadMore = () => {
    fetchMore({
      variables: {
        offset: feedbackComments.value.length,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previousResult;
        const prevFeedbackComments = previousResult.discussions[0].FeedbackComments;
        const newFeedbackComments = fetchMoreResult.discussions[0].FeedbackComments;
        return {
          ...previousResult,
          discussions: [
            {
              ...previousResult.discussions[0],
              FeedbackComments: [...prevFeedbackComments, ...newFeedbackComments],
            },
          ],
        };
      },
    });
  };

  const {
    result: getCommentResult,
    error: getCommentError,
    loading: getCommentLoading,
  } = useQuery(
    GET_FEEDBACK_ON_COMMENT,
    {
      commentId: commentId,
      limit: PAGE_LIMIT,
      offset: offset,
      loggedInModName: modProfileNameVar.value,
    },
    {
      fetchPolicy: "cache-first",
    }
  );

  const originalComment = computed(() => {
    if (getCommentError.value) return null;
    return getCommentResult.value?.comments[0] || null;
  });

  const contextOfFeedbackComment = computed(() => {
    if (getCommentError.value || getCommentLoading.value) return null;
    return (
      originalComment.value?.GivesFeedbackOnComment ||
      originalComment.value?.GivesFeedbackOnDiscussion ||
      null
    );
  });

  const updateContextLink = () => {
    if (discussion.value) {
      if (route.name === "forums-forumId-discussions-feedback-discussionId") {
        // If we are on the page that collects feedback on a discussion, go to the
        // discussion page for the original context.
        return {
          name: "forums-forumId-discussions-discussionId",
          params: {
            discussionId: route.params.discussionId,
            forumId: route.params.forumId,
          },
        };
      }
      if (
        route.name ===
        "forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId"
      ) {
        // If we are on a page that collects feedback on a feedback comment,
        // go to the original feedback comment's permalink.
        // (It's the same route with different params.)
        if (!contextOfFeedbackComment.value) {
          console.warn("No context of feedback comment found");
          return "";
        }
        return {
          name: "forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId",
          params: {
            discussionId: route.params.discussionId,
            forumId: route.params.forumId,
            feedbackId: contextOfFeedbackComment.value.id,
          },
        };
      }
    }
    return "";
  };

  const reachedEndOfResults = computed(() => {
    if (getDiscussionLoading.value || getDiscussionError.value) return false;
    return feedbackComments.value.length === feedbackCommentsAggregate.value;
  });

  const {
    mutate: addFeedbackCommentToComment,
    loading: addFeedbackCommentToCommentLoading,
    error: addFeedbackCommentToCommentError,
    onDone: onAddFeedbackCommentToCommentDone,
  } = useMutation(ADD_FEEDBACK_COMMENT_TO_COMMENT, {
    update: (cache, result) => {
      const newFeedbackComment = result.data.createComments.comments[0];
      const prevQueryResult = cache.readQuery({
        query: GET_DISCUSSION_FEEDBACK,
        variables: {
          id: discussionId.value,
          limit: PAGE_LIMIT,
          offset: offset.value,
          loggedInModName: modProfileNameVar.value,
        },
      });
      const prevOriginalFeedbackList = discussion.value.FeedbackComments;
      const prevFeedbackComments = commentToGiveFeedbackOn.value?.FeedbackComments || [];
      const updatedDiscussion = {
        ...discussion.value,
        FeedbackComments: [
          ...prevOriginalFeedbackList.filter(
            (comment: Comment) => comment.id !== commentToGiveFeedbackOn.value?.id
          ),
          {
            ...commentToGiveFeedbackOn.value,
            FeedbackComments: [...prevFeedbackComments, newFeedbackComment],
            FeedbackCommentsAggregate: {
              count: (prevQueryResult.discussions[0].FeedbackCommentsAggregate?.count || 0) + 1,
              __typename: "FeedbackCommentsAggregate",
            },
          },
        ],
      };
      cache.writeQuery({
        query: GET_DISCUSSION_FEEDBACK,
        variables: {
          commentId: commentId.value,
          limit: PAGE_LIMIT,
          offset: 0,
          loggedInModName: modProfileNameVar.value,
        },
        data: { discussions: [updatedDiscussion] },
      });
    },
  });

  const showFeedbackFormModal = ref(false);
  const showFeedbackSubmittedSuccessfully = ref(false);

  onAddFeedbackCommentToCommentDone(() => {
    showFeedbackFormModal.value = false;
    showFeedbackSubmittedSuccessfully.value = true;
  });

  const updateParams = () => {
    channelId.value = typeof route.params.forumId === "string" ? route.params.forumId : "";
    discussionId.value =
      typeof route.params.discussionId === "string" ? route.params.discussionId : "";
    commentId.value = typeof route.params.commentId === "string" ? route.params.commentId : "";
    feedbackId.value = typeof route.params.feedbackId === "string" ? route.params.feedbackId : "";
    contextLink.value = updateContextLink() as string;
  };

  watch(() => route.params, updateParams, { immediate: true });
</script>

<template>
  <div
    class="w-full max-w-screen-2xl space-y-4 rounded-lg bg-white py-2 dark:bg-gray-800 dark:text-white"
  >
    <div class="align-center mx-1 flex justify-between px-1 sm:mt-2 md:mt-5">
      <BackLink
        :data-testid="'discussion-detail-back-link'"
        :link="`/forums/${channelId}/discussions/${discussion?.id}`"
      />
    </div>
    <h1 class="text-wrap text-center text-2xl font-bold dark:text-gray-200">Feedback</h1>
    <div v-if="getDiscussionLoading || getCommentLoading">Loading...</div>
    <ErrorBanner
      v-else-if="getDiscussionError"
      class="mt-2 px-4"
      :text="getDiscussionError.message"
    />
    <PageNotFound v-else-if="getDiscussionResult && !discussion" />
    <div v-else-if="discussion">
      <p class="mb-4 px-2">This page collects feedback on this discussion:</p>
      <div class="ml-2 flex flex-col gap-2 border-l pl-4">
        <h3 class="text-wrap px-1 px-2 text-xl font-bold sm:tracking-tight">
          {{ discussion && discussion.title ? discussion.title : "[Deleted]" }}
        </h3>
        <div class="space-y-3 px-2">
          <div
            class="dark:bg-gray-950 px-4pb-2 rounded-lg border border-black dark:border-gray-700 dark:bg-gray-700"
          >
            <DiscussionHeader
              :channel-id="channelId"
              :discussion="discussion"
              :show-action-menu="false"
            />
            <DiscussionBody
              :channel-id="channelId"
              :discussion="discussion"
              :show-emoji-button="false"
              :word-limit="100"
            />
          </div>
        </div>
      </div>
      <FeedbackSection
        :add-feedback-comment-to-comment-error="addFeedbackCommentToCommentError?.message || ''"
        :add-feedback-comment-to-comment-loading="addFeedbackCommentToCommentLoading"
        :comment-to-give-feedback-on="commentToGiveFeedbackOn"
        :comment-to-remove-feedback-from="commentToRemoveFeedbackFrom"
        :feedback-comments="feedbackComments"
        :feedback-comments-aggregate="feedbackCommentsAggregate"
        :load-more="loadMore"
        :loading="getDiscussionLoading"
        :logged-in-user-mod-name="modProfileNameVar"
        :reached-end-of-results="reachedEndOfResults"
        :show-feedback-form-modal="showFeedbackFormModal"
        :show-feedback-submitted-successfully="showFeedbackSubmittedSuccessfully"
        @add-feedback-comment-to-comment="($event) => addFeedbackCommentToComment($event)"
        @close-feedback-form-modal="showFeedbackFormModal = false"
        @open-feedback-form-modal="showFeedbackFormModal = true"
        @update-comment-to-give-feedback-on="commentToGiveFeedbackOn = $event"
        @update-comment-to-remove-feedback-from="commentToRemoveFeedbackFrom = $event"
      />
    </div>
  </div>
</template>
