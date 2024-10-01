<script lang="ts" setup>
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import CreateRootCommentForm from "@/components/comments/CreateRootCommentForm.vue";
import type { Comment, DiscussionChannel } from "@/__generated__/graphql";
import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_DISCUSSION_COMMENTS } from "@/graphQLData/comment/queries";
import { usernameVar } from "@/cache";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";

// Props
const props = defineProps({
  link: {
    type: String,
    default: "",
  },
  dataTestid: {
    type: String,
    default: "",
  },
  discussionChannel: {
    type: Object as PropType<DiscussionChannel>,
    required: false,
    default: () => null,
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
});

const COMMENT_LIMIT = 50;

// Setup
const route = useRoute();

const createCommentDefaultValues = {
  text: "",
  isRootComment: true,
  depth: 1,
};

const createFormValues = ref(createCommentDefaultValues);

const username = computed(() => {
  return usernameVar() || "";
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
            id: props.discussionChannel?.id,
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

const { mutate: createComment, error: createCommentError, onDone } = useMutation(
  CREATE_COMMENT,
  () => ({
    errorPolicy: "all",
    variables: {
      createCommentInput: createCommentInput.value,
    },
    update: (cache, result) => {
      const newComment: Comment = result.data?.createComments?.comments[0];

      const commentSectionQueryVariables = {
        discussionId: props.discussionChannel?.discussionId,
        channelUniqueName: props.discussionChannel?.channelUniqueName,
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
  })
);

onDone(() => {
  createFormValues.value = createCommentDefaultValues;
  createCommentLoading.value = false;
  commentEditorOpen.value = false;
});

const handleCreateComment = async () => {
  if (!props.discussionChannel) {
    console.warn(
      "Could not create the comment because there is no discussion channel in the create root comment form"
    );
    return;
  }
  if (!username.value) {
    console.warn(
      "Could not create the comment because there is no username in the create root comment form"
    );
    return;
  }
  createCommentLoading.value = true;
  createComment();
};

const handleUpdateComment = (event: any) => {
  createFormValues.value.text = event;
};
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
