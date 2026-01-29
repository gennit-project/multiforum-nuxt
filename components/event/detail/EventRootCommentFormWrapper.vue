<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'nuxt/app';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import CreateRootCommentForm from '@/components/comments/CreateRootCommentForm.vue';
import { CREATE_COMMENT } from '@/graphQLData/comment/mutations';
import { GET_EVENT_COMMENTS } from '@/graphQLData/comment/queries';
import { GET_USER } from '@/graphQLData/user/queries';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { getSortFromQuery } from '@/components/comments/getSortFromQuery';
import type { Event, CommentCreateInput } from '@/__generated__/graphql';
import type { CreateEditCommentFormValues } from '@/types/Comment';
import { usernameVar } from '@/cache';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';

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
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

// Query for user data to get notification preferences
const { result: getUserResult } = useQuery(
  GET_USER,
  {
    username: usernameVar.value,
  },
  {
    enabled: !!usernameVar.value,
  }
);

// Get user's notification preference for comment replies
const notifyOnReplyToCommentByDefault = computed(() => {
  return (
    getUserResult.value?.users[0]?.notifyOnReplyToCommentByDefault ?? false
  );
});

const createCommentDefaultValues: CreateEditCommentFormValues = {
  text: '',
  isRootComment: true,
  depth: 1,
};

const createFormValues = ref<CreateEditCommentFormValues>(
  createCommentDefaultValues
);

const createCommentInput = computed(() => {
  const baseInput: CommentCreateInput = {
    isRootComment: true,
    isFeedbackComment: false,
    text: createFormValues.value.text || '',
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
      connect: [
        {
          where: { node: { username: usernameVar.value } },
        },
      ],
    },
  };

  // Add the logged-in user to SubscribedToNotifications if they want to be notified by default
  if (notifyOnReplyToCommentByDefault.value) {
    baseInput.SubscribedToNotifications = {
      connect: [
        {
          where: {
            node: { username: usernameVar.value },
          },
        },
      ],
    };
  }

  return [baseInput];
});

const createCommentLoading = ref(false);
const commentEditorOpen = ref(false);
const createCommentPermissionError = ref('');
const submitAttempted = ref(false);

// Mutation for creating a comment
const {
  mutate: createComment,
  error: createCommentError,
  onDone,
} = useMutation(CREATE_COMMENT, {
  errorPolicy: 'all',
  refetchQueries: () => [
    {
      query: GET_EVENT_COMMENTS,
      variables: {
        eventId: props.event?.id,
        limit: COMMENT_LIMIT,
        offset: props.previousOffset,
        sort: getSortFromQuery(route.query),
      },
    },
  ],
  awaitRefetchQueries: true,
});

// After mutation completion
onDone((result) => {
  if (result.errors?.length) {
    console.error('Error creating comment:', result.errors);
    createCommentPermissionError.value =
      result.errors[0]?.message || 'Unknown error';
    createCommentLoading.value = false;
    return;
  }
  submitAttempted.value = false;
  createFormValues.value = createCommentDefaultValues;
  createCommentLoading.value = false;
  commentEditorOpen.value = false;
});

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(channelId);

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
});

function handleCreateComment() {
  if (!props.event) {
    console.warn(
      'Could not create the comment because there is no event in the create root comment form'
    );
    return;
  }
  submitAttempted.value = true;
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
      :create-form-values="createFormValues"
      :create-comment-loading="createCommentLoading"
      :create-comment-error="createCommentError"
      :allow-bot-mentions="false"
      :suspension-issue-number="
        showSuspensionNotice ? suspensionIssueNumber ?? undefined : undefined
      "
      :suspension-channel-id="
        showSuspensionNotice ? suspensionChannelId ?? undefined : undefined
      "
      :suspension-until="
        showSuspensionNotice ? suspensionUntil ?? undefined : undefined
      "
      :suspension-indefinitely="
        showSuspensionNotice ? suspensionIndefinitely : false
      "
      :suspension-message="'You are suspended in this forum and cannot comment.'"
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
