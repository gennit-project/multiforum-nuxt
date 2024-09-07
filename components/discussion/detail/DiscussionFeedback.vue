<script lang="ts">
import type { Discussion } from "@/__generated__/graphql";
import BackLink from "@/components/BackLink.vue";
import { GET_DISCUSSION_FEEDBACK } from "@/graphQLData/discussion/queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import type { Ref } from "vue";
import { computed, defineComponent, ref, watch } from "vue";
import type { RouteLocationRaw} from "vue-router";
import { useRoute } from "vue-router";
import DiscussionBody from "./DiscussionBody.vue";
import DiscussionHeader from "./DiscussionHeader.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import FeedbackSection from "@/components/comments/FeedbackSection.vue";
import { ADD_FEEDBACK_COMMENT_TO_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_LOCAL_MOD_PROFILE_NAME } from "@/graphQLData/user/queries";
import { GET_FEEDBACK_ON_COMMENT } from "@/graphQLData/comment/queries";

const PAGE_LIMIT = 10;

export default defineComponent({
  name: "DiscussionFeedback",
  components: {
    BackLink,
    DiscussionBody,
    DiscussionHeader,
    ErrorBanner,
    FeedbackSection,
    PageNotFound,
  },
  setup: () => {
    const route = useRoute();
    const updateShowPermalinkedFeedback = () => {
      return route.name === "DiscussionFeedbackPermalink";
    };
    const contextLink: Ref<RouteLocationRaw> = ref("");
    const channelId = ref("");
    const discussionId = ref("");
    const commentId = ref("");
    const offset = ref(0);
    const feedbackId = ref("");
    const showPermalinkedFeedback = ref(updateShowPermalinkedFeedback());
    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value?.modProfileName || "";
    });
    const {
      result: getDiscussionResult,
      error: getDiscussionError,
      loading: getDiscussionLoading,
      fetchMore,
    } = useQuery(GET_DISCUSSION_FEEDBACK, {
      id: discussionId,
      limit: PAGE_LIMIT,
      offset: offset,
      loggedInModName: loggedInUserModName,
    });

    const commentToRemoveFeedbackFrom = ref<Comment | null>(null);
    const commentToGiveFeedbackOn = ref<Comment | null>(null);

    const discussion = computed<Discussion>(() => {
      if (getDiscussionError.value) {
        return null;
      }
      return getDiscussionResult.value?.discussions[0] || null;
    });

    const feedbackComments = computed(() => {
      return discussion.value?.FeedbackComments || [];
    });

    const feedbackCommentsAggregate = computed(() => {
      return discussion.value?.FeedbackCommentsAggregate?.count || 0;
    });

    const loadMore = () => {
      fetchMore({
        variables: {
          offset: feedbackComments.value.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          const prevFeedbackComments =
            previousResult.discussions[0].FeedbackComments;
          const newFeedbackComments =
            fetchMoreResult.discussions[0].FeedbackComments;

          return {
            ...previousResult,
            discussions: [
              {
                ...previousResult.discussions[0],
                FeedbackComments: [
                  ...prevFeedbackComments,
                  ...newFeedbackComments,
                ],
              },
            ],
          };
        },
      });
    };

    const { result: getCommentResult, error: getCommentError, loading: getCommentLoading } = useQuery(
      GET_FEEDBACK_ON_COMMENT,
      {
        commentId: commentId,
        limit: PAGE_LIMIT,
        offset: offset,
        loggedInModName: loggedInUserModName,
      },
    );

    const originalComment = computed<Comment>(() => {
      if (getCommentError.value) {
        return null;
      }
      return getCommentResult.value?.comments[0] || null;
    });

    const contextOfFeedbackComment = computed(() => {
      if (getCommentError.value) {
        return null;
      }
      if (getCommentLoading.value) {
        return null;
      }
      if (originalComment.value) {
       let context = null;
         if (originalComment.value.GivesFeedbackOnComment) {
          context = originalComment.value.GivesFeedbackOnComment;
         }
         if (originalComment.value.GivesFeedbackOnDiscussion) {
          context = originalComment.value.GivesFeedbackOnDiscussion;
         }
        return context;
      }
      return null;
    });

    const updateContextLink = () => {
      if (discussion.value) {
        if (route.name === "DiscussionFeedback") {
          return {
            name: "DiscussionPermalink",
            params: {
              discussionId: route.params.discussionId,
            },
          };
        }
        if (route.name === "FeedbackOnDiscussionFeedback") {
          if (!contextOfFeedbackComment.value) {
            console.warn("No context of feedback comment found");
            return "";
          }
          return {
            name: "DiscussionCommentFeedbackPermalink",
            params: {
              discussionId: route.params.discussionId,
              forumId: route.params.forumId,
              feedbackId: contextOfFeedbackComment.value.id,
            },
          };
        }
        if (route.name === "DiscussionFeedbackPermalink") {
          // In this case we are already on the permalinked feedback comment page.
          // If the original comment has a populated GivesFeedbackOnComment field,
          // link to that feedback comment's permalink page.
          // Otherwise link to the normal discussion comment permalink page.
          if (!contextOfFeedbackComment.value) {
            return {
              name: "DiscussionCommentPermalink",
              params: {
                discussionId: route.params.discussionId,
                commentId: route.params.commentId,
              },
            };
          } else {
            return {
              name: "DiscussionCommentFeedbackPermalink",
              params: {
                discussionId: route.params.discussionId,
                commentId: contextOfFeedbackComment.value?.id || "",
                forumId: route.params.forumId,
                feedbackId: originalComment.value.id || "",
              },
            };
          }
        }
      }
      return "";
    };

    const reachedEndOfResults = computed(() => {
      if (getDiscussionLoading.value || getDiscussionError.value) {
        return false;
      }
      return feedbackComments.value.length === feedbackCommentsAggregate.value;
    });

    const {
      mutate: addFeedbackCommentToComment,
      loading: addFeedbackCommentToCommentLoading,
      error: addFeedbackCommentToCommentError,
      onDone: onAddFeedbackCommentToCommentDone,
    } = useMutation(ADD_FEEDBACK_COMMENT_TO_COMMENT, {
      update: (cache: any, result: any) => {
        const newFeedbackComment = result.data.createComments.comments[0];

        if (commentToGiveFeedbackOn.value) {
          const prevQueryResult = cache.readQuery({
            query: GET_DISCUSSION_FEEDBACK,
            variables: {
              id: discussionId.value,
              limit: PAGE_LIMIT,
              offset: offset.value,
              loggedInModName: loggedInUserModName.value,
            },
          });

          const prevOriginalFeedbackList = discussion.value.FeedbackComments;

          const prevFeedbackComments =
            commentToGiveFeedbackOn.value.FeedbackComments || [];

          const updatedDiscussion = {
            ...discussion.value,
            FeedbackComments: [
              ...prevOriginalFeedbackList.filter(
                (comment) => comment.id !== commentToGiveFeedbackOn.value?.id,
              ),
              {
                ...commentToGiveFeedbackOn.value,
                FeedbackComments: [...prevFeedbackComments, newFeedbackComment],
                FeedbackCommentsAggregate: {
                  count:
                    (prevQueryResult.discussions ? prevQueryResult.discussions[0].FeedbackCommentsAggregate
                  .count : 0) + 1,
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
              loggedInModName: loggedInUserModName.value,
            },
            data: {
              discussions: [updatedDiscussion],
            },
          });
        }
      },
    });

    const showFeedbackFormModal = ref(false);
    const showFeedbackSubmittedSuccessfully = ref(false);

    onAddFeedbackCommentToCommentDone(() => {
      showFeedbackFormModal.value = false;
      showFeedbackSubmittedSuccessfully.value = true;
    });
    const updateParams = () => {
      channelId.value =
        typeof route.params.forumId === "string"
          ? route.params.forumId
          : "";
      discussionId.value =
        typeof route.params.discussionId === "string"
          ? route.params.discussionId
          : "";
      commentId.value =
        typeof route.params.commentId === "string"
          ? route.params.commentId
          : "";
      feedbackId.value =
        typeof route.params.feedbackId === "string"
          ? route.params.feedbackId
          : "";
      contextLink.value = updateContextLink();
      showPermalinkedFeedback.value = updateShowPermalinkedFeedback();
    };

    watch(
      () => route.params,
      () => {
        updateParams();
      },
      { immediate: true }, // This ensures the watcher runs immediately to set the initial values
    );

    return {
      addFeedbackCommentToComment,
      addFeedbackCommentToCommentError,
      addFeedbackCommentToCommentLoading,
      channelId,
      commentToRemoveFeedbackFrom,
      commentToGiveFeedbackOn,
      contextOfFeedbackComment,
      discussion,
      getDiscussionLoading,
      getDiscussionError,
      feedbackComments,
      feedbackCommentsAggregate,
      loadMore,
      loggedInUserModName,
      reachedEndOfResults,
      route,
      showFeedbackFormModal,
      showFeedbackSubmittedSuccessfully,
      showPermalinkedFeedback,
      timeAgo,
    };
  },
});
</script>
<template>
  <div
    class="w-full max-w-7xl space-y-4 rounded-lg bg-white py-2 dark:bg-gray-800 sm:px-2 md:px-5"
  >
    <div class="align-center mx-1 flex justify-between px-1 sm:mt-2 md:mt-5">
      <BackLink
        :link="`/forums/f/${channelId}/discussions/d/${discussion?.id}`"
        :data-testid="'discussion-detail-back-link'"
      />
    </div>
    <h1 class="text-wrap text-center text-2xl font-bold dark:text-gray-200">
      Feedback
    </h1>
    <div v-if="getDiscussionLoading">
      Loading...
    </div>
    <ErrorBanner
      v-else-if="getDiscussionError"
      class="mt-2 px-4"
      :text="getDiscussionError.message"
    />
    <PageNotFound
      v-else-if="!getDiscussionLoading && !getDiscussionError && !discussion"
    />
    <div v-else>
      <p class="px-2">
        This page collects feedback on this discussion:
      </p>
      <div class="ml-2 flex flex-col gap-2 border-l pl-4">
        <h3 class="text-wrap px-1 px-2 text-xl font-bold sm:tracking-tight">
          {{ discussion && discussion.title ? discussion.title : "[Deleted]" }}
        </h3>

        <div class="space-y-3 px-2">
          <div
            class="dark:bg-gray-950 rounded-lg border px-4 pb-2 dark:border-gray-700 dark:bg-gray-700"
          >
            <DiscussionHeader
              :discussion="discussion"
              :channel-id="channelId"
            />
            <DiscussionBody
              :discussion="discussion"
              :channel-id="channelId"
              :show-emoji-button="false"
              :word-limit="100"
            />
          </div>
        </div>
      </div>
      <FeedbackSection
        v-if="feedbackCommentsAggregate > 0"
        :add-feedback-comment-to-comment-error="
          addFeedbackCommentToCommentError?.message || ''
        "
        :add-feedback-comment-to-comment-loading="
          addFeedbackCommentToCommentLoading
        "
        :comment-to-give-feedback-on="commentToGiveFeedbackOn"
        :comment-to-remove-feedback-from="commentToRemoveFeedbackFrom"
        :feedback-comments="feedbackComments"
        :feedback-comments-aggregate="feedbackCommentsAggregate"
        :show-permalinked-feedback="showPermalinkedFeedback"
        :loading="getDiscussionLoading"
        :logged-in-user-mod-name="loggedInUserModName"
        :reached-end-of-results="reachedEndOfResults"
        :load-more="loadMore"
        :show-feedback-form-modal="showFeedbackFormModal"
        :show-feedback-submitted-successfully="
          showFeedbackSubmittedSuccessfully
        "
        @add-feedback-comment-to-comment="($event) => {
          addFeedbackCommentToComment($event);
        }"
        @open-feedback-form-modal="showFeedbackFormModal = true"
        @close-feedback-form-modal="showFeedbackFormModal = false"
        @update-comment-to-give-feedback-on="commentToGiveFeedbackOn = $event"
        @update-comment-to-remove-feedback-from="
          commentToRemoveFeedbackFrom = $event
        "
      />
    </div>
  </div>
</template>
