<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import type { Event, Comment as CommentType } from "@/__generated__/graphql";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import CommentSection from "@/components/comments/CommentSection.vue";
import { GET_EVENT_COMMENTS } from "@/graphQLData/comment/queries";
import { GET_EVENT } from "@/graphQLData/event/queries";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import { usernameVar, modProfileNameVar } from "@/cache";
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
  const { cache, commentToDeleteId } = input;
  const readQueryResult = cache.readQuery({
    query: GET_EVENT_COMMENTS,
    variables: commentSectionQueryVariables.value,
  });

  const filteredRootComments = (
    readQueryResult?.getEventComments?.Comments || []
  ).filter((comment: CommentType) => comment.id !== commentToDeleteId);

  cache.writeQuery({
    query: GET_EVENT_COMMENTS,
    variables: commentSectionQueryVariables.value,
    data: {
      ...readQueryResult,
      getEventComments: {
        ...readQueryResult?.getEventComments,
        Comments: filteredRootComments,
      },
    },
  });
}

function incrementCommentCount(cache: any) {
  const readEventQueryResult = cache.readQuery({
    query: GET_EVENT,
    variables: {
      id: props.event?.id,
      channelUniqueName: channelId.value,
      loggedInModName: loggedInUserModName.value,
    },
  });

  const existingEventData = readEventQueryResult?.getEvent;

  const existingCommentAggregate =
    existingEventData?.CommentsAggregate?.count || 0;

  cache.writeQuery({
    query: GET_EVENT,
    variables: {
      id: props.event?.id,
      channelUniqueName: channelId.value,
      loggedInModName: loggedInUserModName.value,
    },
    data: {
      ...readEventQueryResult,
      getEvent: {
        ...existingEventData,
        CommentsAggregate: {
          ...existingEventData?.CommentsAggregate,
          count: Math.max(0, existingCommentAggregate + 1),
        },
      },
    },
  });
}

const loggedInUserModName = computed(() => modProfileNameVar.value);

function decrementCommentCount(cache: any) {
  const readEventQueryResult = cache.readQuery({
    query: GET_EVENT,
    variables: {
      id: props.event?.id,
      channelUniqueName: channelId.value,
      loggedInModName: loggedInUserModName.value,
    },
  });

  const existingEventData = readEventQueryResult?.getEvent;

  const existingCommentAggregate =
    existingEventData?.CommentsAggregate?.count || 0;

  cache.writeQuery({
    query: GET_EVENT,
    variables: {
      id: props.event?.id,
      channelUniqueName: channelId.value,
      loggedInModName: loggedInUserModName.value,
    },
    data: {
      ...readEventQueryResult,
      getEvent: {
        ...existingEventData,
        CommentsAggregate: {
          ...existingEventData?.CommentsAggregate,
          count: Math.max(0, existingCommentAggregate - 1),
        },
      },
    },
  });
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
    @decrement-comment-count="decrementCommentCount"
    @increment-comment-count="incrementCommentCount"
    @update-comment-section-query-result="updateCommentSectionQueryResult"
    @update-create-reply-comment-input="updateCreateReplyCommentInput"
  />
</template>
