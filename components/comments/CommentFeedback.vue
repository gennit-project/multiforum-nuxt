<script lang="ts">
import type { Comment } from "@/__generated__/graphql";
import BackLink from "@/components/BackLink.vue";
import { GET_FEEDBACK_ON_COMMENT } from "@/graphQLData/comment/queries";
import { ADD_FEEDBACK_COMMENT_TO_COMMENT } from "@/graphQLData/comment/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import type { Ref } from "vue";
import { computed, defineComponent, watch, ref } from "vue";
import type { RouteLocationRaw} from "vue-router";
import { useRoute } from "vue-router";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import CommentHeader from "./CommentHeader.vue";
import { GET_LOCAL_MOD_PROFILE_NAME } from "@/graphQLData/user/queries";
import FeedbackSection from '@/components/comments/FeedbackSection.vue'

const PAGE_LIMIT = 10;

export default defineComponent({
  name: "CommentFeedback",
  components: {
    BackLink,
    CommentHeader,
    ErrorBanner,
    FeedbackSection,
    MarkdownPreview,
    PageNotFound,
  },
  setup: () => {
    const route = useRoute();

    const updateShowPermalinkedFeedback = () => {
      return route.name === "DiscussionCommentFeedbackPermalink";
    };

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
      return localModProfileNameResult.value.modProfileName;
    });

    const {
      result: getCommentResult,
      error: getCommentError,
      loading: getCommentLoading,
      fetchMore,
      onResult: onGetCommentDone,
    } = useQuery(GET_FEEDBACK_ON_COMMENT, {
      commentId: commentId,
      limit: PAGE_LIMIT,
      offset: offset,
      loggedInModName: loggedInUserModName,
    });

    const originalComment = computed<Comment>(() => {
      if (!getCommentResult.value || getCommentError.value) {
        return null;
      }
      return getCommentResult.value?.comments[0] || null;
    });

    const contextOfFeedbackComment = computed(() => {
      if (originalComment.value) {
        let context = null;
        if (originalComment.value.GivesFeedbackOnComment) {
          context = originalComment.value.GivesFeedbackOnComment;
        } else if (originalComment.value.GivesFeedbackOnDiscussion) {
          context = originalComment.value.GivesFeedbackOnDiscussion;
        }
        return context;
      }
      return null;
    });

    const updateContextLink = () => {
      if (originalComment.value) {
        if (route.name === "CommentFeedback") {
          return {
            name: "DiscussionCommentPermalink",
            params: {
              discussionId: route.params.discussionId,
              commentId: originalComment.value.id || "",
            },
          };
        }
        if (route.name === "FeedbackOnCommentFeedback") {
          if (!contextOfFeedbackComment.value) {
            console.warn("No context of feedback comment found");
            return "";
          }
          return {
            name: "DiscussionCommentFeedbackPermalink",
            params: {
              discussionId: route.params.discussionId,
              commentId: contextOfFeedbackComment.value?.id || "",
              channelId: route.params.channelId,
              feedbackId: originalComment.value.id || "",
            },
          };
        }
        if (route.name === "DiscussionCommentFeedbackPermalink") {
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
                channelId: route.params.channelId,
                feedbackId: originalComment.value.id || "",
              },
            };
          }
        }
      }
      return "";
    };

    const contextLink: Ref<RouteLocationRaw> = ref("");

    // onGetCommentDone should trigger context link to update.
    onGetCommentDone(() => {
      contextLink.value = updateContextLink();
    });

    const updateParams = () => {
      channelId.value =
        typeof route.params.channelId === "string"
          ? route.params.channelId
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

    const parentCommentId = computed(() => {
      if (originalComment.value && originalComment.value.ParentComment) {
        return originalComment.value.ParentComment.id;
      }
      return "";
    });

    const feedbackComments = computed(() => {
      if (originalComment.value) {
        return originalComment.value.FeedbackComments;
      }
      return [];
    });

    const feedbackCommentsAggregate = computed(() => {
      if (originalComment.value) {
        return originalComment.value.FeedbackCommentsAggregate?.count || 0;
      }
      return 0;
    });

    const loadMore = () => {
      fetchMore({
        variables: {
          offset: feedbackComments.value.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          const prevFeedbackComments =
            previousResult.comments[0].FeedbackComments;
          const newFeedbackComments =
            fetchMoreResult.comments[0].FeedbackComments;

          return {
            ...previousResult,
            comments: [
              {
                ...previousResult.comments[0],
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

    const reachedEndOfResults = computed(() => {
      if (getCommentLoading.value || getCommentError.value) {
        return false;
      }
      return feedbackComments.value.length === feedbackCommentsAggregate.value;
    });

    const commentToRemoveFeedbackFrom = ref<Comment | null>(null);
    const commentToGiveFeedbackOn = ref<Comment | null>(null);

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
            query: GET_FEEDBACK_ON_COMMENT,
            variables: {
              commentId: commentId.value,
              limit: PAGE_LIMIT,
              offset: 0,
              loggedInModName: loggedInUserModName.value,
            },
          });

          const prevOriginalFeedbackList =
            originalComment.value.FeedbackComments;

          const prevFeedbackComments =
            commentToGiveFeedbackOn.value.FeedbackComments || [];

          const updatedComment = {
            ...originalComment.value,
            FeedbackComments: [
              ...prevOriginalFeedbackList.filter(
                (comment) => comment.id !== commentToGiveFeedbackOn.value?.id,
              ),
              {
                ...commentToGiveFeedbackOn.value,
                FeedbackComments: [...prevFeedbackComments, newFeedbackComment],
                FeedbackCommentsAggregate: {
                  count:
                    (prevQueryResult.comments ? prevQueryResult.comments[0].FeedbackCommentsAggregate
                      .count : 0) + 1,
                  __typename: "FeedbackCommentsAggregate",
                },
              },
            ],
          };

          cache.writeQuery({
            query: GET_FEEDBACK_ON_COMMENT,
            variables: {
              commentId: commentId.value,
              limit: PAGE_LIMIT,
              offset: 0,
              loggedInModName: loggedInUserModName.value,
            },
            data: {
              comments: [updatedComment],
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

    return {
      addFeedbackCommentToComment,
      addFeedbackCommentToCommentError,
      addFeedbackCommentToCommentLoading,
      channelId,
      contextLink,
      commentToGiveFeedbackOn,
      commentToRemoveFeedbackFrom,
      discussionId,
      getCommentLoading,
      getCommentError,
      getCommentResult,
      feedbackComments,
      feedbackCommentsAggregate,
      feedbackId,
      feedbackText: ref(""),
      loadMore,
      loggedInUserModName,
      originalComment,
      reachedEndOfResults,
      route,
      parentCommentId,
      showFeedbackFormModal,
      showFeedbackSubmittedSuccessfully,
      showPermalinkedFeedback,
      timeAgo,
    };
  },
});
</script>
<template>
  <div class="flex justify-center">
    <div
      class="w-full max-w-4xl space-y-4 rounded-lg bg-white p-4 dark:bg-gray-800 sm:px-2 md:px-5"
    >
      <div v-if="getCommentLoading && !getCommentResult">
        Loading...
      </div>
      <ErrorBanner
        v-if="getCommentError"
        :text="getCommentError.message"
      />
      <div v-else>
        <div v-if="originalComment">
          <router-link
            v-if="parentCommentId"
            class="text-xs underline"
            :to="{
              name: 'DiscussionCommentPermalink',
              params: {
                discussionId: route.params.discussionId,
                commentId: parentCommentId,
              },
            }"
          >
            View Context
          </router-link>
          <div
            class="align-center mx-1 flex justify-between px-1 sm:mt-2 md:mt-5"
          >
            <BackLink
              :link="`/forums/f/${channelId}/discussions/d/${discussionId}`"
              :data-testid="'comment-detail-back-link'"
            />
          </div>
          <h1
            class="text-wrap text-center text-2xl font-bold dark:text-gray-200"
          >
            Feedback
          </h1>
          <ErrorBanner
            v-if="getCommentError"
            class="mt-2 px-4"
            :text="getCommentError?.message || 'Error loading comment'"
          />
          <PageNotFound
            v-if="!getCommentLoading && !getCommentError && !originalComment"
          />
          <p class="px-2">
            This page collects feedback on this comment:
          </p>
          <CommentHeader
            :comment-data="originalComment"
            :is-highlighted="false"
            :parent-comment-id="parentCommentId"
            :show-context-link="true"
            :show-channel="false"
          />
          <div class="ml-2 flex flex-col gap-2 border-l pl-4">
            <MarkdownPreview
              class="-ml-4"
              :text="originalComment?.text || '[Deleted]'"
              :disable-gallery="true"
            />
          </div>
          <router-link
            :to="contextLink"
            class="text-blue-500 underline"
          >
            View original context
          </router-link>
        </div>
        <FeedbackSection
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
          :loading="getCommentLoading"
          :logged-in-user-mod-name="loggedInUserModName"
          :reached-end-of-results="reachedEndOfResults"
          :load-more="loadMore"
          :show-feedback-form-modal="showFeedbackFormModal"
          :show-feedback-submitted-successfully="
            showFeedbackSubmittedSuccessfully
          "
          @open-feedback-form-modal="showFeedbackFormModal = true"
          @close-feedback-form-modal="showFeedbackFormModal = false"
          @update-comment-to-give-feedback-on="commentToGiveFeedbackOn = $event"
          @update-comment-to-remove-feedback-from="
            commentToRemoveFeedbackFrom = $event
          "
          @add-feedback-comment-to-comment="($event) => {
            addFeedbackCommentToComment($event);
          }"
        />
      </div>
    </div>
  </div>
</template>
