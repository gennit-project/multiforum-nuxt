<script setup lang="ts">
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import CreateRootCommentForm from "@/components/comments/CreateRootCommentForm.vue";
import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_EVENT_COMMENTS } from "@/graphQLData/comment/queries";
import { GET_EVENT } from "@/graphQLData/event/queries";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import type { Event, Comment } from "@/__generated__/graphql";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import { usernameVar } from "@/cache";

const COMMENT_LIMIT = 50;
const props = defineProps({
  event: {
    type: Object as PropType<Event>,
    required: false,
    default: null,
  },
  previousOffset: {
    type: Number,
    required: true,
  },
});
const route = useRoute();

const createCommentDefaultValues: CreateEditCommentFormValues = {
  text: "",
  isRootComment: true,
  depth: 1,
};

const createFormValues = ref<CreateEditCommentFormValues>(createCommentDefaultValues);

const createCommentInput = computed(() => [{
  isRootComment: true,
  text: createFormValues.value.text || "",
  CommentAuthor: {
    User: {
      connect: {
        where: {
          node: { username: usernameVar.value },
        },
      },
    },
  },
  Event: {
    connect: {
      where: {
        node: { id: props.event?.id },
      },
    },
  },
  UpvotedByUsers: {
    connect: {
      where: { node: { username: usernameVar.value } },
    },
  },
}]);

const createCommentLoading = ref(false);
const commentEditorOpen = ref(false);

// Mutation for creating a comment
const { mutate: createComment, error: createCommentError, onDone } = useMutation(CREATE_COMMENT, {
  errorPolicy: "all",
  update(cache, result) {
    const newComment: Comment = result.data?.createComments?.comments[0];

    const eventCommentsQueryVariables = {
      eventId: props.event?.id,
      limit: COMMENT_LIMIT,
      offset: props.previousOffset,
      sort: getSortFromQuery(route.query),
    };

    // Update root comments in the cache
    const readEventCommentsQueryResult = cache.readQuery({
      query: GET_EVENT_COMMENTS,
      variables: eventCommentsQueryVariables,
    });

    const existingEventCommentsData = readEventCommentsQueryResult?.getEventComments || null;

    const newRootComments = [newComment, ...(existingEventCommentsData?.Comments || [])];

    cache.writeQuery({
      query: GET_EVENT_COMMENTS,
      variables: eventCommentsQueryVariables,
      data: {
        ...readEventCommentsQueryResult,
        getEventComments: {
          ...existingEventCommentsData,
          Comments: newRootComments,
        },
      },
    });

    // Update aggregate count from GET_EVENT
    const readEventQueryResult = cache.readQuery({
      query: GET_EVENT,
      variables: { id: props.event?.id },
    });

    const existingEventData = readEventQueryResult?.events[0] || null;
    const existingCount = existingEventData?.CommentsAggregate?.count || 0;

    cache.writeQuery({
      query: GET_EVENT,
      variables: { id: props.event?.id },
      data: {
        ...readEventQueryResult,
        events: [
          {
            ...existingEventData,
            CommentsAggregate: {
              ...existingEventData?.CommentsAggregate,
              count: existingCount + 1,
            },
          },
        ],
      },
    });
  },
});

// After mutation completion
onDone(() => {
  createFormValues.value = createCommentDefaultValues;
  createCommentLoading.value = false;
  commentEditorOpen.value = false;
});
function handleCreateComment() {
  if (!props.event) {
    console.warn("Could not create the comment because there is no event in the create root comment form");
    return;
  }
  createCommentLoading.value = true;
  createComment({ createCommentInput: createCommentInput.value });
}

function handleUpdateComment(event: string) {
  createFormValues.value.text = event;
}


</script>

<template>
  <div>
    <CreateRootCommentForm
      v-if="event"
      :create-form-values="createFormValues"
      :create-comment-loading="createCommentLoading"
      :create-comment-error="createCommentError"
      :comment-editor-open="commentEditorOpen"
      @open-comment-editor="commentEditorOpen = true"
      @close-comment-editor="commentEditorOpen = false"
      @handle-create-comment="handleCreateComment"
      @handle-update-comment="handleUpdateComment"
    />
  </div>
</template>

<style scoped>
/* Add any necessary styles here */
</style>
