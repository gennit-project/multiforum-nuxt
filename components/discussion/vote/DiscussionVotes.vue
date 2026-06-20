<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation } from '@vue/apollo-composable';
import type { User } from '@/__generated__/graphql';
import {
  UPVOTE_DISCUSSION_CHANNEL,
  UNDO_UPVOTE_DISCUSSION_CHANNEL,
} from '@/graphQLData/discussion/mutations';
import VoteButtons from '@/components/discussion/vote/VoteButtons.vue';
import NewEmojiButton from '@/components/comments/NewEmojiButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import SuperUpvoteModal from '@/components/superUpvote/SuperUpvoteModal.vue';
import { UNDO_SUPER_UPVOTE } from '@/graphQLData/scratchpad/mutations';
import { usernameVar, modProfileNameVar } from '@/cache';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';

const props = defineProps({
  discussionChannel: {
    type: Object,
    required: true,
  },
  discussion: {
    type: Object,
    default: null,
  },
  showDownvote: {
    type: Boolean,
    default: true,
  },
  showEmojiButton: {
    type: Boolean,
    default: false,
  },
  useHeartIcon: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'handleClickGiveFeedback',
  'handleClickEditFeedback',
  'handleClickUndoFeedback',
]);

const route = useRoute();
const router = useRouter();
const discussionIdInParams = computed(() => {
  return typeof route.params.discussionId === 'string'
    ? route.params.discussionId
    : '';
});

const discussionChannelId = computed(() => props.discussionChannel.id || '');
const channelUniqueName = computed(
  () =>
    props.discussionChannel?.channelUniqueName ||
    props.discussionChannel?.Channel?.uniqueName ||
    ''
);

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(channelUniqueName);

const showReactionSuspensionNotice = ref(false);
const hasReactionSuspension = computed(() => {
  return !!suspensionIssueNumber.value && !!suspensionChannelId.value;
});

const {
  mutate: upvoteDiscussionChannel,
  error: upvoteDiscussionChannelError,
  loading: upvoteDiscussionChannelLoading,
} = useMutation(UPVOTE_DISCUSSION_CHANNEL);
const {
  mutate: undoUpvoteDiscussionChannel,
  error: undoUpvoteDiscussionChannelError,
  loading: undoUpvoteDiscussionChannelLoading,
} = useMutation(UNDO_UPVOTE_DISCUSSION_CHANNEL);

const {
  mutate: undoSuperUpvote,
  error: undoSuperUpvoteError,
  loading: undoSuperUpvoteLoading,
} = useMutation(UNDO_SUPER_UPVOTE, {
  update: (cache, { data }) => {
    if (data?.undoSuperUpvote?.success) {
      cache.modify({
        id: cache.identify({ __typename: 'DiscussionChannel', id: discussionChannelId.value }),
        fields: {
          SuperUpvotedByUsers: () => data.undoSuperUpvote.superUpvotedByUsers || [],
        },
      });
    }
  },
});

const showSuperUpvoteModal = ref(false);

const loggedInUserUpvoted = computed(() => {
  if (!usernameVar.value) return false;
  const users = props.discussionChannel?.UpvotedByUsers || [];
  return users.some((user: User) => user.username === usernameVar.value);
});

const loggedInUserSuperUpvoted = computed(() => {
  if (!usernameVar.value) return false;
  const users = props.discussionChannel?.SuperUpvotedByUsers || [];
  return users.some((user: User) => user.username === usernameVar.value);
});

const discussionAuthorUsername = computed(() => {
  const author = props.discussion?.Author;
  if (author && 'username' in author) {
    return author.username || '';
  }
  return '';
});

const forumDisplayName = computed(() => {
  return (
    props.discussionChannel?.Channel?.displayName ||
    props.discussionChannel?.channelUniqueName ||
    ''
  );
});

const isOwnContent = computed(() => {
  if (!usernameVar.value) return false;
  return discussionAuthorUsername.value === usernameVar.value;
});

const loggedInUserDownvoted = computed(
  () => props.discussion?.FeedbackComments?.length > 0 || false
);
const upvoteCount = computed(
  () => props.discussionChannel?.UpvotedByUsersAggregate?.count || 0
);
const downvoteCount = computed(
  () => props.discussion?.FeedbackCommentsAggregate?.count || 0
);
const upvoteIcon = computed(() => {
  if (props.useHeartIcon) {
    return loggedInUserUpvoted.value
      ? 'fa-solid fa-heart'
      : 'fa-regular fa-heart';
  }
  return 'fa-solid fa-arrow-up';
});

const upvoteTooltips = computed(() => {
  if (props.useHeartIcon) {
    return {
      active: 'Undo like',
      inactive: 'Like this post',
      unauthenticated: 'Like this post',
    };
  }
  return {
    active: 'Undo upvote',
    inactive: 'Upvote to make this discussion more visible',
    unauthenticated: 'Make this discussion more visible to others',
  };
});

// Client-side vote errors (e.g. the username guard below) that aren't carried
// by a useMutation error ref. Surfaced in the ErrorBanner alongside the
// mutation errors so an auth failure is always visible, never just an uncaught
// console rejection.
const voteError = ref('');

async function handleClickUp() {
  voteError.value = '';
  try {
    if (loggedInUserUpvoted.value) {
      await undoUpvote();
    } else {
      await upvote();
    }
  } catch {
    // Mutation failures are already surfaced via the useMutation error refs
    // shown in the ErrorBanner. Catching here only prevents the awaited
    // rejection from escaping the click handler as an unhandled rejection.
  }
}

async function upvote() {
  if (!usernameVar.value) {
    voteError.value = 'You must be logged in to upvote.';
    return;
  }
  await upvoteDiscussionChannel({
    id: discussionChannelId.value,
    username: usernameVar.value,
  });
}

async function undoUpvote() {
  await undoUpvoteDiscussionChannel({
    id: discussionChannelId.value,
    username: usernameVar.value,
  });
}

function handleClickGiveFeedback() {
  if (modProfileNameVar.value) {
    if (!loggedInUserDownvoted.value) emit('handleClickGiveFeedback');
  } else {
    console.error('User is not a mod');
  }
}

function handleClickEditFeedback() {
  if (modProfileNameVar.value) emit('handleClickEditFeedback');
}

function handleClickUndoFeedback() {
  if (modProfileNameVar.value) emit('handleClickUndoFeedback');
}

function handleClickViewFeedback() {
  router.push({
    name: 'forums-forumId-discussions-feedback-discussionId',
    params: { discussionId: discussionIdInParams.value },
  });
}

function handleBlockedReaction() {
  showReactionSuspensionNotice.value = true;
}

function handleSuperUpvoteClick() {
  showSuperUpvoteModal.value = true;
}

function handleSuperUpvoteSuccess() {
  showSuperUpvoteModal.value = false;
}

async function handleUndoSuperUpvote() {
  voteError.value = '';
  try {
    await undoSuperUpvote({
      sourceType: 'discussion',
      sourceId: discussionChannelId.value,
    });
  } catch {
    // Surfaced via undoSuperUpvoteError in the ErrorBanner; catch prevents an
    // unhandled rejection.
  }
}
</script>

<template>
  <ErrorBanner
    v-if="voteError || upvoteDiscussionChannelError || undoUpvoteDiscussionChannelError || undoSuperUpvoteError"
    :text="
      voteError ||
      upvoteDiscussionChannelError?.message ||
      undoUpvoteDiscussionChannelError?.message ||
      undoSuperUpvoteError?.message ||
      ''
    "
  />
  <SuspensionNotice
    v-if="showReactionSuspensionNotice && hasReactionSuspension"
    class="mb-2"
    :issue-number="suspensionIssueNumber!"
    :channel-id="suspensionChannelId"
    :suspended-until="suspensionUntil ?? undefined"
    :suspended-indefinitely="suspensionIndefinitely ?? false"
    :message="'You are suspended in this forum and cannot react.'"
  />
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <VoteButtons
        :downvote-active="loggedInUserDownvoted"
        :downvote-count="downvoteCount"
        :has-mod-profile="!!modProfileNameVar"
        :show-downvote="false"
        :upvote-active="loggedInUserUpvoted"
        :super-upvote-active="loggedInUserSuperUpvoted"
        :upvote-count="upvoteCount"
        :upvote-icon="upvoteIcon"
        :upvote-loading="
          upvoteDiscussionChannelLoading || undoUpvoteDiscussionChannelLoading
        "
        :super-upvote-loading="undoSuperUpvoteLoading"
        :upvote-tooltip-active="upvoteTooltips.active"
        :upvote-tooltip-inactive="upvoteTooltips.inactive"
        :upvote-tooltip-unauthenticated="upvoteTooltips.unauthenticated"
        :is-own-content="isOwnContent"
        @click-up="handleClickUp"
        @super-upvote="handleSuperUpvoteClick"
        @undo-super-upvote="handleUndoSuperUpvote"
      />
      <NewEmojiButton
        v-if="showEmojiButton"
        :discussion-channel-id="discussionChannelId"
        :interaction-disabled="hasReactionSuspension"
        @blocked-action="handleBlockedReaction"
      />
    </div>
    <div class="flex items-center">
      <VoteButtons
        v-if="showDownvote"
        :downvote-active="loggedInUserDownvoted"
        :downvote-count="downvoteCount"
        :has-mod-profile="!!modProfileNameVar"
        :show-downvote="showDownvote"
        :show-upvote="false"
        :show-super-upvote="false"
        :upvote-active="loggedInUserUpvoted"
        :upvote-count="upvoteCount"
        :upvote-icon="upvoteIcon"
        :upvote-loading="
          upvoteDiscussionChannelLoading || undoUpvoteDiscussionChannelLoading
        "
        :upvote-tooltip-active="upvoteTooltips.active"
        :upvote-tooltip-inactive="upvoteTooltips.inactive"
        :upvote-tooltip-unauthenticated="upvoteTooltips.unauthenticated"
        @edit-feedback="handleClickEditFeedback"
        @give-feedback="handleClickGiveFeedback"
        @undo-feedback="handleClickUndoFeedback"
        @view-feedback="handleClickViewFeedback"
      />
    </div>
  </div>

  <SuperUpvoteModal
    :show="showSuperUpvoteModal"
    :recipient-username="discussionAuthorUsername"
    source-type="discussion"
    :source-id="discussionChannelId"
    :source-channel-unique-name="channelUniqueName"
    :forum-name="forumDisplayName"
    @close="showSuperUpvoteModal = false"
    @success="handleSuperUpvoteSuccess"
  />
</template>

<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
