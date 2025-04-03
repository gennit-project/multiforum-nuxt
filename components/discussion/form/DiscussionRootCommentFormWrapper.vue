<script lang="ts" setup>
import { ref, computed } from "vue";
import type { PropType } from "vue";
import { useMutation } from "@vue/apollo-composable";
import CreateRootCommentForm from "@/components/comments/CreateRootCommentForm.vue";
import type { Comment, DiscussionChannel } from "@/__generated__/graphql";
import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_DISCUSSION_COMMENTS } from "@/graphQLData/comment/queries";
import { usernameVar } from "@/cache";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { useRoute } from "nuxt/app";

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

const createCommentInput = computed(() => {
  const input = {
    isRootComment: true,
    isFeedbackComment: false,
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
            uniqueName: props.discussionChannel?.channelUniqueName,
          },
        },
      },
    },
    UpvotedByUsers: {
      connect: {
        where: {
          node: {
            username: usernameVar.value,
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
  
  update: (cache, result) => {
    const newComment: Comment = result.data?.createComments?.comments[0];
    console.log("newComment", newComment);
    
    // Modify the specific field in the cache directly
    cache.modify({
      id: cache.identify({
        __typename: 'DiscussionChannel',
        id: props.discussionChannel?.id
      }),
      fields: {
        CommentsAggregate(existing = { count: 0 }) {
          return {
            ...existing,
            count: existing.count + 1
          }
        },
        Comments(existing = []) {
          return [newComment, ...existing]
        }
      }
    });

 
  }
}));

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
  if (!usernameVar.value) {
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
