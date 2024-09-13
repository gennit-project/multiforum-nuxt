<script lang="ts">
import CreateRootCommentForm from "@/components/comments/CreateRootCommentForm.vue";
import type { Comment, DiscussionChannel } from "@/__generated__/graphql";
import type { PropType} from "vue";
import { defineComponent, ref, computed } from "vue";
import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import { GET_DISCUSSION_COMMENTS } from "@/graphQLData/comment/queries";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { useRoute } from "vue-router";

const COMMENT_LIMIT = 50;

// The purpose of this component is to wrap the CreateRootCommentForm component
// and put the discussion-specific logic in here. This is because the CreateRootCommentForm
// component is used to put comments on events as well, and we don't want to duplicate
// what is the same between them.

export default defineComponent({
  name: "DiscussionRootCommentFormWrapper",
  components: {
    CreateRootCommentForm,
  },
  props: {
    link: {
      type: String,
      default: "",
    },
    dataTestid: {
      type: String,
      default: "",
    },
    discussionChannel: {
      // It is needed for the comment to be created, but I made it optional
      // so that this form does not disappear while the discussionChannel is loading,
      // which happens if the user navigates between hot, top and new comments.
      type: Object as PropType<DiscussionChannel>,
      required: false,
      default: () => {
        return null;
      },
    },
    previousOffset: {
      type: Number,
      required: true,
    },
    modName: {
      type: String,
      required: false,
      default: "",
    }
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

     
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const createCommentInput = computed(() => {
      const input = {
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
        DiscussionChannel: {
          connect: {
            where: {
              node: {
                id: props.discussionChannel.id,
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

        const commentSectionQueryVariables = {
          discussionId: props.discussionChannel.discussionId,
          channelUniqueName: props.discussionChannel.channelUniqueName,
          modName: props.modName,
          limit: COMMENT_LIMIT,
          offset: props.previousOffset,
          sort: getSortFromQuery(route.query),
        };

        const readQueryResult = cache.readQuery({
          query: GET_DISCUSSION_COMMENTS,
          variables: commentSectionQueryVariables,
        });

        const existingDiscussionChannelData: DiscussionChannel =
          readQueryResult?.getCommentSection?.DiscussionChannel;

        const newRootComments: Comment[] = [
          newComment,
          ...(readQueryResult?.getCommentSection?.Comments || []),
        ];

        const existingCount =
          existingDiscussionChannelData?.CommentsAggregate?.count || 0;

        cache.writeQuery({
          query: GET_DISCUSSION_COMMENTS,
          variables: commentSectionQueryVariables,
          data: {
            ...readQueryResult,
            getCommentSection: {
              ...readQueryResult?.getCommentSection,
              DiscussionChannel: {
                ...existingDiscussionChannelData,
                CommentsAggregate: {
                  ...existingDiscussionChannelData?.CommentsAggregate,
                  count: existingCount + 1,
                },
              },
              Comments: newRootComments,
            },
          },
        });
      },
    }));

    onDone(() => {
      createFormValues.value = createCommentDefaultValues;
      createCommentLoading.value = false;
      commentEditorOpen.value = false;
    });

    const discussionChannelIsLocked = computed(() => {
      if (!props.discussionChannel) {
        return false;
      }
      return props.discussionChannel.locked;
    });

    return {
      discussionChannelIsLocked,
      commentEditorOpen,
      createComment,
      createCommentError,
      createCommentLoading,
      createFormValues,
    };
  },
  methods: {
    async handleCreateComment() {
      if (!this.discussionChannel) {
        console.warn(
          "Could not create the comment because there is no discussion channel in the create root comment form",
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
  <CreateRootCommentForm
    :create-form-values="createFormValues"
    :create-comment-loading="createCommentLoading"
    :create-comment-error="createCommentError"
    :comment-editor-open="commentEditorOpen"
    @open-comment-editor="commentEditorOpen = true"
    @close-comment-editor="commentEditorOpen = false"
    @handle-create-comment="handleCreateComment"
    @handle-update-comment="handleUpdateComment"
  />
</template>
