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

const loggedInUserUpvoted = computed(() => {
  if (!usernameVar.value) return false;
  const users = props.discussionChannel?.UpvotedByUsers || [];
  return users.some((user: User) => user.username === usernameVar.value);
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

async function handleClickUp() {
  if (loggedInUserUpvoted.value) {
    await undoUpvote();
  } else {
    await upvote();
  }
}

async function upvote() {
  if (!usernameVar.value) throw new Error('Username is required to upvote');
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
</script>

<template>
  <ErrorBanner
    v-if="upvoteDiscussionChannelError || undoUpvoteDiscussionChannelError"
    :text="
      upvoteDiscussionChannelError?.message ||
      undoUpvoteDiscussionChannelError?.message ||
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
        :upvote-count="upvoteCount"
        :upvote-icon="upvoteIcon"
        :upvote-loading="
          upvoteDiscussionChannelLoading || undoUpvoteDiscussionChannelLoading
        "
        :upvote-tooltip-active="upvoteTooltips.active"
        :upvote-tooltip-inactive="upvoteTooltips.inactive"
        :upvote-tooltip-unauthenticated="upvoteTooltips.unauthenticated"
        @click-up="handleClickUp"
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
</template>

<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
