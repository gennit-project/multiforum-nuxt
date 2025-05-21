<script setup lang="ts">
  import { ref, computed } from "vue";
  import { useRoute } from "nuxt/app";
  import type { PropType } from "vue";
  import { useMutation } from "@vue/apollo-composable";
  import CreateRootCommentForm from "@/components/comments/CreateRootCommentForm.vue";
  import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
  import { GET_EVENT_COMMENTS } from "@/graphQLData/comment/queries";
  import ErrorBanner from "@/components/ErrorBanner.vue";
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

  const channelId = computed(() => {
    if (typeof route.params.forumId === "string") {
      return route.params.forumId;
    }
    return "";
  });

  const createCommentDefaultValues: CreateEditCommentFormValues = {
    text: "",
    isRootComment: true,
    depth: 1,
  };

  const createFormValues = ref<CreateEditCommentFormValues>(createCommentDefaultValues);

  const createCommentInput = computed(() => [
    {
      isRootComment: true,
      isFeedbackComment: false,
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
      Channel: {
        connect: {
          where: {
            node: { uniqueName: channelId.value },
          },
        },
      },
      UpvotedByUsers: {
        connect: {
          where: { node: { username: usernameVar.value } },
        },
      },
    },
  ]);

  const createCommentLoading = ref(false);
  const commentEditorOpen = ref(false);
  const createCommentPermissionError = ref("");

  // Mutation for creating a comment
  const {
    mutate: createComment,
    error: createCommentError,
    onDone,
  } = useMutation(CREATE_COMMENT, {
    errorPolicy: "all",
    update(cache, result) {
      try {
        console.log("result", result);
        // Get the new comment from the result
        if (result.errors?.length) {
          console.error("Error creating comment:", result.errors);
          createCommentPermissionError.value = result.errors[0].message;
          return;
        }
        const newComment: Comment = result.data?.createComments?.comments[0];
        if (!newComment) {
          console.error("No new comment returned from createComments mutation");
          return;
        }

        // Define the query variables
        const eventCommentsQueryVariables = {
          eventId: props.event?.id,
          limit: COMMENT_LIMIT,
          offset: props.previousOffset,
          sort: getSortFromQuery(route.query),
        };

        // Try to read the existing query result
        try {
          const readEventCommentsQueryResult = cache.readQuery({
            query: GET_EVENT_COMMENTS,
            variables: eventCommentsQueryVariables,
          });

          if (readEventCommentsQueryResult) {
            // If we get a result, update it
            cache.writeQuery({
              query: GET_EVENT_COMMENTS,
              variables: eventCommentsQueryVariables,
              data: {
                ...readEventCommentsQueryResult,
                getEventComments: {
                  ...readEventCommentsQueryResult.getEventComments,
                  Comments: [
                    newComment,
                    ...(readEventCommentsQueryResult.getEventComments?.Comments || []),
                  ],
                },
              },
            });
          }
        } catch (err) {
          console.warn("Error reading or writing event comments query", err);
        }

        // Update the event comment count
        // This uses the safer cache.modify approach
        if (props.event?.id) {
          const eventId = cache.identify({
            __typename: "Event",
            id: props.event.id,
          });

          if (eventId) {
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
          }
        }
      } catch (error) {
        console.error("Error updating cache after creating event comment:", error);
      }
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
      console.warn(
        "Could not create the comment because there is no event in the create root comment form"
      );
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
    <ErrorBanner
      v-if="createCommentPermissionError"
      :text="createCommentPermissionError"
    />
    <CreateRootCommentForm
      v-if="event"
      :comment-editor-open="commentEditorOpen"
      :create-comment-error="createCommentError"
      :create-comment-loading="createCommentLoading"
      :create-form-values="createFormValues"
      @close-comment-editor="commentEditorOpen = false"
      @handle-create-comment="handleCreateComment"
      @handle-update-comment="handleUpdateComment"
      @open-comment-editor="commentEditorOpen = true"
    />
  </div>
</template>

<style scoped>
  /* Add any necessary styles here */
</style>
