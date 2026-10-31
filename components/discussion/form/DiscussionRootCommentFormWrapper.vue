<script lang="ts" setup>
import { CreateCommentDocument as CREATE_COMMENT } from '@/__generated__/operations';
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import CreateRootCommentForm from '@/components/comments/CreateRootCommentForm.vue';
import type { OwnedCommentCreateInput } from '@/__generated__/graphql';

import { GET_USER } from '@/graphQLData/user/queries';
import { getSortFromQuery } from '@/utils/getSortFromQuery';
import { useRoute } from 'nuxt/app';
import { insertRootComment } from '@/utils/rootCommentCache';
import type { CommentChannelView as DiscussionChannel } from '@/types/DiscussionPresentation';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import type { BotSuggestion } from '@/utils/botMentions';
import type { ModSuggestion } from '@/utils/modMentions';
import { useUsername } from '@/composables/useAuthState';

const usernameVar = useUsername();

defineOptions({ inheritAttrs: false });

// Props
const props = defineProps({
  link: {
    type: String,
    default: '',
  },
  dataTestid: {
    type: String,
    default: '',
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
    default: '',
  },
  botSuggestions: {
    type: Array as PropType<BotSuggestion[]>,
    default: () => [],
  },
  modSuggestions: {
    type: Array as PropType<ModSuggestion[]>,
    default: () => [],
  },
});

// Setup
const route = useRoute();

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
    getUserResult.value?.users?.[0]?.notifyOnReplyToCommentByDefault ?? false
  );
});

const createCommentDefaultValues = {
  text: '',
  isRootComment: true,
  depth: 1,
};

const createFormValues = ref(createCommentDefaultValues);

const imageUploadsEnabled = computed(
  () => props.discussionChannel?.Channel?.imageUploadsEnabled !== false
);

const channelConnections = computed(() =>
  props.discussionChannel?.channelUniqueName
    ? [props.discussionChannel.channelUniqueName]
    : []
);

const createCommentInput = computed((): OwnedCommentCreateInput[] => {
  const input: OwnedCommentCreateInput = {
    isRootComment: true,
    isFeedbackComment: false,
    text: createFormValues.value.text || '',
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

  // Add the logged-in user to SubscribedToNotifications if they want to be notified by default
  if (notifyOnReplyToCommentByDefault.value) {
    input.SubscribedToNotifications = {
      connect: [
        {
          where: {
            node: { username: usernameVar.value },
          },
        },
      ],
    };
  }

  return [input];
});

const commentEditorOpen = ref(false);
const showSavedNotice = ref(false);
const submitAttempted = ref(false);
let savedNoticeTimeout: ReturnType<typeof setTimeout> | null = null;

const {
  mutate: createComment,
  loading: createCommentLoading,
  error: createCommentError,
  onDone,
} = useMutation(CREATE_COMMENT, () => {
  const scope = {
    discussionId: props.discussionChannel?.discussionId || '',
    channelUniqueName: props.discussionChannel?.channelUniqueName || '',
    modName: props.modName,
    sort: getSortFromQuery(route.query),
  };
  return {
    errorPolicy: 'none',
    variables: { createCommentInput: createCommentInput.value },
    update: (cache, result) => {
      const comment =
        result.data?.createCommentWithOwnedConnections?.comments?.[0];
      if (comment) insertRootComment(cache, comment, scope);
    },
  };
});

onDone((result) => {
  const channel =
    result.data?.createCommentWithOwnedConnections?.comments?.[0]
      ?.DiscussionChannel;
  if (
    !channel ||
    channel.id !== props.discussionChannel?.id ||
    result?.errors?.length
  ) {
    return;
  }
  submitAttempted.value = false;
  createFormValues.value = createCommentDefaultValues;
  commentEditorOpen.value = false;
  showSavedNotice.value = true;
  if (savedNoticeTimeout) {
    clearTimeout(savedNoticeTimeout);
  }
  savedNoticeTimeout = setTimeout(() => {
    showSavedNotice.value = false;
  }, 2000);
  // clear input
  createFormValues.value.text = '';
});

const channelUniqueName = computed(() => {
  return props.discussionChannel?.channelUniqueName || '';
});

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(channelUniqueName);

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
});

const handleCreateComment = async () => {
  if (!props.discussionChannel) {
    console.warn(
      'Could not create the comment because there is no discussion channel in the create root comment form'
    );
    return;
  }
  if (!usernameVar.value) {
    console.warn(
      'Could not create the comment because there is no username in the create root comment form'
    );
    return;
  }
  submitAttempted.value = true;
  createComment();
};

const handleUpdateComment = (event: string) => {
  createFormValues.value.text = event;
};
</script>

<template>
  <div v-bind="$attrs">
    <slot
      :create-form-values="createFormValues"
      :create-comment-loading="createCommentLoading"
      :create-comment-error="createCommentError"
      :suspension-issue-number="
        showSuspensionNotice ? (suspensionIssueNumber ?? undefined) : undefined
      "
      :suspension-channel-id="
        showSuspensionNotice ? (suspensionChannelId ?? undefined) : undefined
      "
      :suspension-until="
        showSuspensionNotice ? (suspensionUntil ?? undefined) : undefined
      "
      :suspension-indefinitely="
        showSuspensionNotice ? suspensionIndefinitely : false
      "
      :comment-editor-open="commentEditorOpen"
      :show-saved-notice="showSavedNotice"
      :open-comment-editor="() => (commentEditorOpen = true)"
      :close-comment-editor="() => (commentEditorOpen = false)"
      :handle-create-comment="handleCreateComment"
      :handle-update-comment="handleUpdateComment"
    >
      <CreateRootCommentForm
        :create-form-values="createFormValues"
        :create-comment-loading="createCommentLoading"
        :create-comment-error="createCommentError"
        :bot-suggestions="botSuggestions"
        :allow-image-upload="imageUploadsEnabled"
        :channel-connections="channelConnections"
        :mod-suggestions="modSuggestions"
        :suspension-issue-number="
          showSuspensionNotice
            ? (suspensionIssueNumber ?? undefined)
            : undefined
        "
        :suspension-channel-id="
          showSuspensionNotice ? (suspensionChannelId ?? undefined) : undefined
        "
        :suspension-until="
          showSuspensionNotice ? (suspensionUntil ?? undefined) : undefined
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
    </slot>
  </div>
</template>
