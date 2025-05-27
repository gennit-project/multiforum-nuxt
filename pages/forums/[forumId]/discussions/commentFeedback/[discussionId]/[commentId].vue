<script lang="ts" setup>
import type { Comment } from "@/__generated__/graphql";
import BackLink from "@/components/BackLink.vue";
import { GET_FEEDBACK_ON_COMMENT } from "@/graphQLData/comment/queries";
import { ADD_FEEDBACK_COMMENT_TO_COMMENT } from "@/graphQLData/comment/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ref, computed, watch } from "vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import CommentHeader from "@/components/comments/CommentHeader.vue";
import FeedbackSection from "@/components/comments/FeedbackSection.vue";
import { modProfileNameVar } from "@/cache";
import { useRoute } from "nuxt/app";

const PAGE_LIMIT = 10;

const route = useRoute();
const channelId = ref("");
const discussionId = ref("");
const commentId = ref("");
const offset = ref(0);
const feedbackId = ref("");

const {
  result: getCommentResult,
  error: getCommentError,
  loading: getCommentLoading,
  fetchMore,
  onResult: onGetCommentDone,
} = useQuery(GET_FEEDBACK_ON_COMMENT, {
  // @ts-ignore
  commentId: commentId,
  limit: PAGE_LIMIT,
  offset: offset,
  loggedInModName: modProfileNameVar.value,
});

const originalComment = computed<Comment | null>(() => {
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
const feedbackOnComment = "forums-forumId-discussions-commentFeedback-discussionId-commentId";
const commentPermalinkRoute = "forums-forumId-discussions-discussionId-comments-commentId"
const feedbackOnDiscussionPermalink = "forums-forumId-discussions-feedback-discussionId-feedbackId";
const feedbackOnCommentPermalink = "forums-forumId-discussions-commentFeedback-discussionId-commentId-feedbackPermalink-feedbackId"

const updateContextLink = () => {
  if (originalComment.value) {
    if (route.name === feedbackOnComment) {
        // If the comment is a feedback comment, we want to link to the original comment.
      return {
        name: commentPermalinkRoute,
        params: {
          discussionId: route.params.discussionId,
          commentId: originalComment.value.id || "",
        },
      };
    }
    if (route.name === feedbackOnDiscussionPermalink) {
        // If the comment is permalinked feedback on a comment, link to the original comment.
      if (!contextOfFeedbackComment.value) {
        return {
          name: commentPermalinkRoute,
          params: {
            discussionId: route.params.discussionId,
            commentId: route.params.commentId,
          },
        };
      }
    }
    if (route.name === feedbackOnCommentPermalink) {
        // If the comment is a feedback comment, we want to link to the original comment.
      return {
        name: commentPermalinkRoute,
        params: {
          forumId: route.params.forumId,
          discussionId: route.params.discussionId,
          commentId: originalComment.value.id || "",
        },
      };
    }
  }
  return "";
};

// context link is a router object
const contextLink = ref(updateContextLink());

onGetCommentDone(() => {
  contextLink.value = updateContextLink();
});

const updateParams = () => {
  channelId.value =
    typeof route.params.forumId === "string" ? route.params.forumId : "";
  discussionId.value =
    typeof route.params.discussionId === "string" ? route.params.discussionId : "";
  commentId.value =
    typeof route.params.commentId === "string" ? route.params.commentId : "";
  feedbackId.value =
    typeof route.params.feedbackId === "string" ? route.params.feedbackId : "";
  contextLink.value = updateContextLink();
};

watch(
  () => route.params,
  () => {
    updateParams();
  },
  { immediate: true }
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
      // @ts-ignore
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

const commentToRemoveFeedbackFrom = ref<Comment | undefined>(undefined);
const commentToGiveFeedbackOn = ref<Comment | undefined>(undefined);

const {
  mutate: addFeedbackCommentToComment,
  loading: addFeedbackCommentToCommentLoading,
  error: addFeedbackCommentToCommentError,
  onDone: onAddFeedbackCommentToCommentDone,
} = useMutation(ADD_FEEDBACK_COMMENT_TO_COMMENT, {
  update: (cache, result) => {
    const newFeedbackComment = result.data.createComments.comments[0];

    if (commentToGiveFeedbackOn.value) {
      const prevQueryResult: any = cache.readQuery({
        query: GET_FEEDBACK_ON_COMMENT,
        variables: {
          commentId: commentId.value,
          limit: PAGE_LIMIT,
          offset: 0,
          loggedInModName: modProfileNameVar.value,
        },
      });

      const prevOriginalFeedbackList = originalComment.value?.FeedbackComments || [];
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
                (prevQueryResult.comments
                  ? prevQueryResult.comments[0].FeedbackCommentsAggregate.count
                  : 0) + 1,
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
          loggedInModName: modProfileNameVar.value,
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
</script>

<template>
  <div class="flex justify-center dark:text-white">
    <div class="w-full max-w-4xl space-y-4 rounded-lg bg-white p-4 dark:bg-gray-800 sm:px-2 md:px-5">
      <div v-if="getCommentLoading && !getCommentResult">
        Loading...
      </div>
      <ErrorBanner v-if="getCommentError" :text="getCommentError.message" />
      <div v-else>
        <div v-if="originalComment">
          <nuxt-link
            v-if="parentCommentId"
            class="text-xs underline"
            :to="{
              name: 'forums-forumId-discussions-discussionId-comments-commentId',
              params: {
                discussionId: route.params.discussionId,
                commentId: parentCommentId,
              },
            }"
          >
            View Context
          </nuxt-link>
          <div class="align-center mx-1 flex justify-between px-1 sm:mt-2 md:mt-5">
            <BackLink
              :link="`/forums/${channelId}/discussions/${discussionId}`"
              :data-testid="'comment-detail-back-link'"
            />
          </div>
          <h1 class="text-wrap text-center text-2xl font-bold dark:text-gray-200">
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
          <p class="px-2 mb-4 dark:text-white">
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
              :text="originalComment?.text || '[Deleted]'"
              :disable-gallery="true"
            />
          </div>
<<<<<<< HEAD
          <nuxt-link
            class="text-orange-500 underline"
            :to="contextLink"
          >
=======
          <nuxt-link :to="contextLink" class="text-blue-500 underline">
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            View original context
          </nuxt-link>
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
          :loading="getCommentLoading"
          :logged-in-user-mod-name="modProfileNameVar"
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
