<script lang="ts">
import CreateRootCommentForm from "@/components/comments/CreateRootCommentForm.vue";
import { Comment, Event } from "@/__generated__/graphql";
import { defineComponent, ref, PropType, computed } from "vue";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CreateEditCommentFormValues } from "@/types/Comment";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { useRoute } from "vue-router";
import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_EVENT_COMMENTS } from "@/graphQLData/comment/queries";
import { GET_EVENT } from "@/graphQLData/event/queries";

export const COMMENT_LIMIT = 50;

// The purpose of this component is to wrap the CreateRootCommentForm component
// and put the event-specific logic in here. This is because the CreateRootCommentForm
// component is used to put comments on events as well, and we don't want to duplicate
// what is the same between them.

export default defineComponent({
  name: "EventRootCommentFormWrapper",
  components: {
    CreateRootCommentForm,
  },
  props: {
    event: {
      // It is needed for the comment to be created, but I made it optional
      // so that this form does not disappear while the event is loading,
      // which happens if the user navigates between hot, top and new comments.
      type: Object as PropType<Event>,
      required: false,
      default: () => {
        return null;
      },
    },
    previousOffset: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const createCommentDefaultValues: CreateEditCommentFormValues = {
      text: "",
      isRootComment: true,
      depth: 1,
    };

    const createFormValues = ref<CreateEditCommentFormValues>(
      createCommentDefaultValues,
    );

    // eslint-disable-next-line no-undef
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      let username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const createCommentInput = computed(() => {
      let input = {
        isRootComment: true,
        text: createFormValues.value.text || "",
        CommentAuthor: {
          User: {
            connect: {
              where: {
                node: {
                  username: username.value,
                },
              },
            },
          },
        },
        Event: {
          connect: {
            where: {
              node: {
                id: props.event.id,
              },
            },
          },
        },
        UpvotedByUsers: {
          connect: {
            where: {
              node: {
                username: username.value,
              },
            },
          },
        },
      };

      return [input];
    });

    const createCommentLoading = ref(false);
    const commentEditorOpen = ref(false);

    const {
      mutate: createComment,
      error: createCommentError,
      onDone,
    } = useMutation(CREATE_COMMENT, () => ({
      errorPolicy: "all",
      variables: {
        createCommentInput: createCommentInput.value,
      },
      update: (cache: any, result: any) => {
        // This is the logic for updating the cache
        // after creating a root comment. For the logic for updating
        // the cache after replying to a comment, see the CommentSection
        // component.

        const newComment: Comment = result.data?.createComments?.comments[0];
        // Will use readQuery and writeQuery to update the cache
        // https://www.apollographql.com/docs/react/caching/cache-interaction/#using-graphql-queries

        const eventCommentsQueryVariables = {
          eventId: props.event.id,
          limit: COMMENT_LIMIT,
          offset: props.previousOffset,
          sort: getSortFromQuery(route.query),
        };

        // update the root comments that we got from GET_EVENT_COMMENTS.
        const readEventCommentsQueryResult = cache.readQuery({
          query: GET_EVENT_COMMENTS,
          variables: eventCommentsQueryVariables,
        });

        const existingEventCommentsData =
          readEventCommentsQueryResult?.getEventComments || null;

        let newRootComments: Comment[] = [
          newComment,
          ...(existingEventCommentsData?.Comments || []),
        ];

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

        // update the aggregate count which we got from GET_EVENT.
        const readEventQueryResult = cache.readQuery({
          query: GET_EVENT,
          variables: {
            id: props.event.id,
          },
        });

        const existingEventData: Event =
          readEventQueryResult?.events[0] || null;

        const existingCount = existingEventData?.CommentsAggregate?.count || 0;

        cache.writeQuery({
          query: GET_EVENT,
          variables: {
            id: props.event.id,
          },
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
    }));

    onDone(() => {
      createFormValues.value = createCommentDefaultValues;
      createCommentLoading.value = false;
      commentEditorOpen.value = false;
    });

    const eventCommentsAreLocked = computed(() => {
      if (!props.event) {
        return false;
      }
      return props.event.locked;
    });

    return {
      eventCommentsAreLocked,
      createComment,
      commentEditorOpen,
      createCommentError,
      createCommentLoading,
      createFormValues,
    };
  },
  methods: {
    async handleCreateComment() {
      if (!this.event) {
        console.warn(
          "Could not create the comment because there is no event in the create root comment form",
        );
        return;
      }
      this.createCommentLoading = true;
      this.createComment();
    },
    handleUpdateComment(event: any) {
      this.createFormValues.text = event;
    },
    updateCreateInputValuesForRootComment(text: string) {
      this.createFormValues.text = text;
    },
  },
});
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
      @handleCreateComment="handleCreateComment"
      @handleUpdateComment="handleUpdateComment"
    />
  </div>
</template>
