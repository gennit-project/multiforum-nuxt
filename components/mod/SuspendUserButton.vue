<script lang="ts" setup>
import { computed } from 'vue';
import type { PropType } from 'vue';
import UserPlus from '../icons/UserPlus.vue';
import UserMinus from '../icons/UserMinus.vue';
import BrokenRulesModal from '@/components/mod/BrokenRulesModal.vue';
import Notification from '@/components/NotificationComponent.vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GET_DISCUSSION_CHANNEL,
  GET_EVENT_CHANNEL,
  IS_ORIGINAL_POSTER_SUSPENDED,
} from '@/graphQLData/mod/queries';
import UnsuspendUserModal from '@/components/mod/UnsuspendUserModal.vue';
import type { Issue } from '@/__generated__/graphql';
import { useSuspensionActionUI } from '@/composables/useSuspensionActionUI';

const props = defineProps({
  issue: {
    type: Object as PropType<Issue>,
    required: true,
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
  discussionId: {
    type: String,
    required: false,
    default: '',
  },
  discussionTitle: {
    type: String,
    required: false,
    default: '',
  },
  eventId: {
    type: String,
    required: false,
    default: '',
  },
  eventTitle: {
    type: String,
    required: false,
    default: '',
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  isBot: {
    type: Boolean,
    required: false,
    default: false,
  },
});
defineEmits(['suspended-successfully', 'unsuspended-successfully']);

// Bot-aware labels
const suspendButtonLabel = computed(() =>
  props.isBot ? 'Suspend Bot' : 'Suspend Author (Includes Archive)'
);
const unsuspendButtonLabel = computed(() =>
  props.isBot ? 'Unsuspend Bot' : 'Unsuspend Author'
);
const suspendModalTitle = computed(() =>
  props.isBot ? 'Suspend Bot' : 'Suspend Author'
);
const unsuspendModalTitle = computed(() =>
  props.isBot ? 'Unsuspend Bot' : 'Unsuspend Author'
);
const suspendTextBoxLabel = computed(() =>
  props.isBot
    ? '(Optional) Explain why you are suspending this bot:'
    : '(Optional) Explain why you are suspending this author:'
);
const suspendedNotificationTitle = computed(() =>
  props.isBot ? 'The bot was suspended.' : 'The author was suspended.'
);
const unsuspendedNotificationTitle = computed(() =>
  props.isBot ? 'The bot was unsuspended.' : 'The author was unsuspended.'
);

const {
  result: getUserSuspensionResult,
  loading: getUserSuspensionLoading,
  error: getUserSuspensionError,
  // refetch: refetchUserSuspension
} = useQuery(
  IS_ORIGINAL_POSTER_SUSPENDED,
  {
    issueId: props.issue.id,
  },
  {
    enabled:
      !!props.issue.id &&
      (!!props.issue.relatedDiscussionId ||
        !!props.issue.relatedEventId ||
        !!props.issue.relatedCommentId),
  }
);
const userIsSuspendedFromChannel = computed(() => {
  if (getUserSuspensionLoading.value || getUserSuspensionError.value)
    return false;
  return getUserSuspensionResult.value?.isOriginalPosterSuspended ?? false;
});

const {
  showSuspendModal,
  showUnsuspendModal,
  showSuccessfullySuspended,
  showSuccessfullyUnsuspended,
  openSuspendModal,
  openUnsuspendModal,
  closeSuspendModal,
  closeUnsuspendModal,
  handleSuspendedSuccessfully,
  handleUnsuspendedSuccessfully,
  dismissSuspendedNotification,
  dismissUnsuspendedNotification,
} = useSuspensionActionUI({
  isDisabled: () => props.disabled,
});

const { result: getDiscussionChannelResult } = useQuery(
  GET_DISCUSSION_CHANNEL,
  {
    discussionId: props.discussionId,
    channelUniqueName: props.channelUniqueName,
  }
);

const { result: getEventChannelResult } = useQuery(GET_EVENT_CHANNEL, {
  eventId: props.eventId,
  channelUniqueName: props.channelUniqueName,
});

const discussionChannelId = computed(() => {
  return getDiscussionChannelResult.value?.discussionChannels?.[0]?.id ?? '';
});

const eventChannelId = computed(() => {
  return getEventChannelResult.value?.eventChannels?.[0]?.id ?? '';
});

</script>

<template>
  <div>
    <button
      v-if="userIsSuspendedFromChannel"
      class="font-semibold flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm text-white transition"
      :class="{
        'cursor-pointer bg-green-600 hover:bg-green-500': !disabled,
        'cursor-not-allowed bg-gray-500': disabled,
      }"
      @click="openUnsuspendModal"
    >
      <UserPlus class="h-6 w-6" />
      {{ unsuspendButtonLabel }}
    </button>
    <button
      v-else
      class="font-semibold flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm text-white transition"
      :class="{
        'cursor-pointer bg-red-600 hover:bg-red-500': !disabled,
        'cursor-not-allowed bg-gray-500': disabled,
      }"
      @click="openSuspendModal"
    >
      <UserMinus />
      {{ suspendButtonLabel }}
    </button>
    <BrokenRulesModal
      :title="suspendModalTitle"
      :open="showSuspendModal"
      :discussion-title="discussionTitle"
      :discussion-id="issue.relatedDiscussionId ?? ''"
      :discussion-channel-id="discussionChannelId"
      :event-title="eventTitle"
      :event-id="issue.relatedEventId ?? ''"
      :event-channel-id="eventChannelId"
      :comment-id="issue.relatedCommentId ?? ''"
      :suspend-user-enabled="true"
      :text-box-label="suspendTextBoxLabel"
      :issue-id="issue.id"
      @close="closeSuspendModal"
      @suspended-user-successfully="
        () => {
          handleSuspendedSuccessfully();
          $emit('suspended-successfully');
        }
      "
    />
    <UnsuspendUserModal
      :title="unsuspendModalTitle"
      :open="showUnsuspendModal"
      :issue-id="issue.id"
      @close="closeUnsuspendModal"
      @unsuspended-successfully="
        () => {
          handleUnsuspendedSuccessfully();
          $emit('unsuspended-successfully');
        }
      "
    />
    <Notification
      :show="showSuccessfullySuspended"
      :title="suspendedNotificationTitle"
      @close-notification="dismissSuspendedNotification"
    />
    <Notification
      :show="showSuccessfullyUnsuspended"
      :title="unsuspendedNotificationTitle"
      @close-notification="dismissUnsuspendedNotification"
    />
  </div>
</template>
