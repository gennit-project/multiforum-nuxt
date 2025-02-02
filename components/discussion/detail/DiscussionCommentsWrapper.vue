<script setup lang="ts">
import type {
  DiscussionChannel,
  CommentCreateInput,
  Comment as CommentType,
} from "@/__generated__/graphql";
import type { PropType } from "vue";
import { computed, defineProps, ref } from "vue";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { GET_DISCUSSION_COMMENTS } from "@/graphQLData/comment/queries";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import CommentSection from "@/components/comments/CommentSection.vue";
import { usernameVar } from "@/cache";
import { useRoute } from "nuxt/app";

const COMMENT_LIMIT = 50;

type CommentSectionQueryUpdateInput = {
  cache: any;
  commentToDeleteId: string;
  commentToAddFeedbackTo?: CommentType;
  newFeedbackComment?: CommentType;
};

const props = defineProps({
  aggregateCommentCount: {
    type: Number,
    required: true,
  },
  discussionChannel: {
    type: Object as PropType<DiscussionChannel>,
    required: false,
    default: () => null,
  },
  discussionAuthor: {
    type: String,
    required: true,
  },
  comments: {
    type: Array as PropType<CommentType[]>,
    required: false,
    default: () => [],
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  reachedEndOfResults: {
    type: Boolean,
    required: true,
  },
  previousOffset: {
    type: Number,
    required: true,
  },
  modName: {
    type: String,
    required: false,
    default: "",
  },
  locked: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const route = useRoute();
const commentSectionQueryVariables = computed(() => ({
  discussionId: props.discussionChannel?.discussionId,
  channelUniqueName: props.discussionChannel?.channelUniqueName,
  modName: props.modName,
  limit: COMMENT_LIMIT,
  offset: props.previousOffset,
  sort: getSortFromQuery(route.query),
}));



const createCommentDefaultValues: CreateEditCommentFormValues = {
  text: "",
  isRootComment: false,
  depth: 1,
};

const createFormValues = ref<CreateEditCommentFormValues>(
  createCommentDefaultValues
);

const channelId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const createCommentInput = computed(() => {
  const input: CommentCreateInput = {
    isRootComment: false,
    DiscussionChannel: {
      connect: {
        where: {
          node: {
            id: props.discussionChannel?.id,
          },
        },
      },
    },
    Channel: {
      connect: {
        where: {
          node: {
            uniqueName: channelId.value,
          },
        },
      },
    },
    ParentComment: {
      connect: {
        where: {
          node: {
            id: createFormValues.value.parentCommentId,
          },
        },
      },
    },
    text: createFormValues.value.text || "",
    CommentAuthor: {
      User: {
        connect: {
          where: {
            node: {
              username: usernameVar.value,
            },
          },
        },
      },
    },
    UpvotedByUsers: {
      connect: [
        {
          where: {
            node: {
              username: usernameVar.value,
            },
          },
        },
      ],
    },
  };
  return input;
});

const updateCreateReplyCommentInput = (event: CreateEditCommentFormValues) => {
  if (!event.parentCommentId) {
    console.error("Parent comment id is required to create a reply comment");
    return;
  }
  createFormValues.value = event;
};

const updateCommentSectionQueryResult = (
  input: CommentSectionQueryUpdateInput
) => {
  const {
    cache,
    commentToDeleteId,
    commentToAddFeedbackTo,
    newFeedbackComment,
  } = input;

  if (commentToDeleteId) {
    cache.evict({
      id: cache.identify({ __typename: "Comment", id: commentToDeleteId }),
    });
  }

  if (commentToAddFeedbackTo) {
    const readCommentQueryResult = cache.readQuery({
      query: GET_DISCUSSION_COMMENTS,
      variables: commentSectionQueryVariables.value,
    });

    const existingComments =
      readCommentQueryResult?.getCommentSection?.Comments;

    const updatedComments = existingComments.map((comment: CommentType) => {
      if (comment.id === commentToAddFeedbackTo.id) {
        return {
          ...commentToAddFeedbackTo,
          FeedbackComments: [...comment.FeedbackComments, newFeedbackComment],
        };
      }
      return comment;
    });

    cache.writeQuery({
      query: GET_DISCUSSION_COMMENTS,
      variables: commentSectionQueryVariables.value,
      data: {
        ...readCommentQueryResult,
        getCommentSection: {
          ...readCommentQueryResult.getCommentSection,
          Comments: updatedComments,
        },
      },
    });
  }
};

const incrementCommentCount = (cache: any) => {
  const readDiscussionChannelQueryResult = cache.readQuery({
    query: GET_DISCUSSION_COMMENTS,
    variables: commentSectionQueryVariables.value,
  });

  const existingDiscussionChannelData =
    readDiscussionChannelQueryResult?.getCommentSection?.DiscussionChannel;

  const existingCommentAggregate =
    existingDiscussionChannelData?.CommentsAggregate?.count || 0;

  cache.writeQuery({
    query: GET_DISCUSSION_COMMENTS,
    variables: commentSectionQueryVariables.value,
    data: {
      ...readDiscussionChannelQueryResult,
      getCommentSection: {
        ...readDiscussionChannelQueryResult?.getCommentSection,
        DiscussionChannel: {
          ...existingDiscussionChannelData,
          Comments: existingDiscussionChannelData?.Comments || [],
          CommentsAggregate: {
            ...existingDiscussionChannelData?.CommentsAggregate,
            count: existingCommentAggregate + 1,
          },
        },
      },
    },
  });
};

const decrementCommentCount = (cache: any) => {
  const readDiscussionChannelQueryResult = cache.readQuery({
    query: GET_DISCUSSION_COMMENTS,
    variables: commentSectionQueryVariables.value,
  });

  const existingDiscussionChannelData =
    readDiscussionChannelQueryResult?.getCommentSection?.DiscussionChannel;

  const existingCommentAggregate =
    existingDiscussionChannelData?.CommentsAggregate?.count || 0;

  cache.writeQuery({
    query: GET_DISCUSSION_COMMENTS,
    variables: commentSectionQueryVariables.value,
    data: {
      ...readDiscussionChannelQueryResult,
      getCommentSection: {
        ...readDiscussionChannelQueryResult?.getCommentSection,
        DiscussionChannel: {
          ...existingDiscussionChannelData,
          CommentsAggregate: {
            ...existingDiscussionChannelData?.CommentsAggregate,
            count: Math.max(0, existingCommentAggregate - 1),
          },
        },
      },
    },
  });
};
</script>

<template>
  <CommentSection
    :aggregate-comment-count="aggregateCommentCount"
    :comments="comments"
    :loading="loading"
    :reached-end-of-results="reachedEndOfResults"
    :comment-section-query-variables="commentSectionQueryVariables"
    :create-form-values="createFormValues"
    :create-comment-input="createCommentInput"
    :previous-offset="previousOffset"
    :original-poster="discussionAuthor"
    :locked="locked"
    @decrement-comment-count="decrementCommentCount"
    @increment-comment-count="incrementCommentCount"
    @update-comment-section-query-result="updateCommentSectionQueryResult"
    @update-create-reply-comment-input="updateCreateReplyCommentInput"
  />
</template>
