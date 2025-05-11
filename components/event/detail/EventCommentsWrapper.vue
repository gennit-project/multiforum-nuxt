<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import type { Event, Comment as CommentType } from "@/__generated__/graphql";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import CommentSection from "@/components/comments/CommentSection.vue";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import { usernameVar } from "@/cache";
import { useRoute } from "nuxt/app";

const COMMENT_LIMIT = 50;

const props = defineProps({
  event: {
    type: Object as PropType<Event>,
    required: false,
    default: null,
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
  originalPoster: {
    type: String,
    required: true,
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

const eventId = computed(() => props.event?.id);

const aggregateCommentCount = computed(() => {
  return props.event?.CommentsAggregate?.count || 0;
});

const commentSectionQueryVariables = computed(() => ({
  eventId: eventId.value,
  limit: COMMENT_LIMIT,
  offset: props.previousOffset,
  sort: getSortFromQuery(route.query),
}));

const createCommentDefaultValues = {
  text: "",
  isRootComment: false,
  depth: 1,
  parentCommentId: "",
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

const createCommentInput = computed(() => ({
  isRootComment: false,
  Event: {
    connect: {
      where: {
        node: {
          id: props.event?.id,
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
}));

// Methods for handling comment section updates
function updateCreateReplyCommentInput(event: CreateEditCommentFormValues) {
  createFormValues.value = event;
}

function updateCommentSectionQueryResult(input: {
  cache: any;
  commentToDeleteId: string;
}) {
  try {
    const { cache, commentToDeleteId } = input;

    if (!commentToDeleteId) {
      console.error("No comment ID provided for deletion");
      return;
    }

    // Directly evict the comment from the cache
    cache.evict({
      id: cache.identify({ __typename: "Comment", id: commentToDeleteId }),
    });

    // Garbage collection to clean up unreachable references
    cache.gc();
  } catch (error) {
    console.error("Error updating comment section query result:", error);
  }
}

function incrementCommentCount(cache: any) {
  try {
    if (!props.event?.id) {
      console.error("No event ID found for incrementing comment count");
      return;
    }

    // Use cache.modify to directly update the CommentsAggregate field
    // This is much safer than using writeQuery
    const eventId = cache.identify({
      __typename: "Event",
      id: props.event.id,
    });

    if (!eventId) {
      console.error("Could not identify event in cache");
      return;
    }

    cache.modify({
      id: eventId,
      fields: {
        CommentsAggregate(existing = {}) {
          return {
            ...existing,
            count: (existing.count || 0) + 1,
          };
        },
      },
    });
  } catch (error) {
    console.error("Error incrementing comment count:", error);
  }
}

function decrementCommentCount(cache: any) {
  try {
    if (!props.event?.id) {
      console.error("No event ID found for decrementing comment count");
      return;
    }

    // Use cache.modify to directly update the CommentsAggregate field
    // This is much safer than using writeQuery
    const eventId = cache.identify({
      __typename: "Event",
      id: props.event.id,
    });

    if (!eventId) {
      console.error("Could not identify event in cache");
      return;
    }

    cache.modify({
      id: eventId,
      fields: {
        CommentsAggregate(existing = {}) {
          return {
            ...existing,
            count: Math.max(0, (existing.count || 0) - 1),
          };
        },
      },
    });
  } catch (error) {
    console.error("Error decrementing comment count:", error);
  }
}
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
    :enable-feedback="false"
    :original-poster="originalPoster"
    :show-comment-sort-buttons="false"
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
