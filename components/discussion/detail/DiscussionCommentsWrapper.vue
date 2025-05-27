<script setup lang="ts">
import type {
  DiscussionChannel,
  CommentCreateInput,
  Comment as CommentType,
} from "@/__generated__/graphql";
import type { PropType } from "vue";
import { computed, defineProps, ref } from "vue";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
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
  archived: {
    type: Boolean,
    required: false,
    default: false,
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

  if (commentToAddFeedbackTo && newFeedbackComment) {
    cache.modify({
      id: cache.identify({
        __typename: "Comment",
        id: commentToAddFeedbackTo.id,
      }),
      fields: {
        FeedbackComments(existing = []) {
          return [...existing, newFeedbackComment];
        },
      },
    });
  }
};

const incrementCommentCount = (cache: any) => {
  try {
    if (!props.discussionChannel?.id) {
      console.error("No discussion channel ID found");
      return;
    }

    // Directly modify the CommentsAggregate field on the DiscussionChannel object
    // This is much safer than using writeQuery
    cache.modify({
      id: cache.identify({
        __typename: "DiscussionChannel",
        id: props.discussionChannel.id
      }),
      fields: {
        CommentsAggregate(existing = { count: 0 }) {
          return {
            ...existing,
            count: (existing.count || 0) + 1
          };
        }
      }
    });
  } catch (error) {
    console.error("Error incrementing comment count:", error);
  }
};

const decrementCommentCount = (cache: any) => {
  try {
    if (!props.discussionChannel?.id) {
      console.error("No discussion channel ID found");
      return;
    }

    // Directly modify the CommentsAggregate field on the DiscussionChannel object
    // This is much safer than using writeQuery
    cache.modify({
      id: cache.identify({
        __typename: "DiscussionChannel",
        id: props.discussionChannel.id
      }),
      fields: {
        CommentsAggregate(existing = { count: 0 }) {
          return {
            ...existing,
            count: Math.max(0, (existing.count || 0) - 1)
          };
        }
      }
    });
  } catch (error) {
    console.error("Error decrementing comment count:", error);
  }
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
    :archived="archived"
    :show-nuxt-page="true"
    @decrement-comment-count="decrementCommentCount"
    @increment-comment-count="incrementCommentCount"
    @update-comment-section-query-result="updateCommentSectionQueryResult"
    @update-create-reply-comment-input="updateCreateReplyCommentInput"
  >
    <slot />
  </CommentSection>
</template>
