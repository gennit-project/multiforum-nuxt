<script lang="ts" setup>
import { computed } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import ArchiveBox from '@/components/icons/ArchiveBox.vue';
import ArchiveBoxXMark from '@/components/icons/ArchiveBoxXMark.vue';
import BrokenRulesModal from '@/components/mod/BrokenRulesModal.vue';
import UnarchiveModal from '@/components/mod/UnarchiveModal.vue';
import Notification from '@/components/NotificationComponent.vue';
import { useModerationOutcomeUI } from '@/composables/useModerationOutcomeUI';
import { useQuery } from '@vue/apollo-composable';
import {
  GET_DISCUSSION_CHANNEL,
  GET_EVENT_CHANNEL,
} from '@/graphQLData/mod/queries';
import { GET_COMMENT_ARCHIVED } from '@/graphQLData/comment/queries';

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
  discussionId: {
    type: String,
    required: false,
    default: '',
  },
  eventId: {
    type: String,
    required: false,
    default: '',
  },
  commentId: {
    type: String,
    required: false,
    default: '',
  },
  contextText: {
    type: String,
    required: false,
    default: '',
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
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

const { result: isCommentArchivedResult } = useQuery(GET_COMMENT_ARCHIVED, {
  commentId: props.commentId,
});

const isArchived = computed(() => {
  if (props.discussionId) {
    return getDiscussionChannelResult.value?.discussionChannels?.[0]?.archived;
  } else if (props.eventId) {
    return getEventChannelResult.value?.eventChannels?.[0]?.archived;
  } else if (props.commentId) {
    return isCommentArchivedResult.value?.comments?.[0]?.archived;
  }
  return false;
});

const discussionChannelId = computed(() => {
  return getDiscussionChannelResult.value?.discussionChannels?.[0]?.id ?? '';
});

const eventChannelId = computed(() => {
  return getEventChannelResult.value?.eventChannels?.[0]?.id ?? '';
});

const emit = defineEmits(['archived-successfully', 'unarchived-successfully']);
const {
  showArchiveModal,
  showUnarchiveModal,
  showSuccessfullyArchived,
  showSuccessfullyUnarchived,
  openArchiveModal,
  closeArchiveModal,
  openUnarchiveModal,
  closeUnarchiveModal,
  handleArchivedSuccessfully,
  handleUnarchivedSuccessfully,
  dismissArchivedNotification,
  dismissUnarchivedNotification,
} = useModerationOutcomeUI();

const clickUnarchive = () => {
  if (props.disabled) {
    return;
  }
  openUnarchiveModal();
};
const clickArchive = () => {
  if (props.disabled) {
    return;
  }
  openArchiveModal();
};

const archivedContentType = computed(() => {
  if (props.discussionId) {
    return 'Discussion';
  } else if (props.eventId) {
    return 'Event';
  } else if (props.commentId) {
    return 'Comment';
  }
  return 'Content';
});
</script>

<template>
  <button
    v-if="isArchived"
    :disabled="disabled"
    class="font-semibold flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm text-white"
    :class="{
      'cursor-pointer bg-blue-600 hover:bg-blue-500': !disabled,
      'cursor-not-allowed bg-gray-500': disabled,
    }"
    @click="clickUnarchive"
  >
    <ArchiveBoxXMark />
    Unarchive
  </button>
  <button
    v-else
    class="font-semibold flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm text-white"
    :class="{
      'cursor-pointer bg-red-600 hover:bg-red-500': !disabled,
      'cursor-not-allowed bg-gray-500': disabled,
    }"
    :disabled="disabled"
    @click="clickArchive"
  >
    <ArchiveBox />
    {{ `Archive ${archivedContentType}` }}
  </button>
  <BrokenRulesModal
    :title="'Archive Content'"
    :open="showArchiveModal"
    :discussion-title="contextText"
    :event-title="contextText"
    :discussion-id="discussionId"
    :event-id="eventId"
    :comment-id="commentId"
    :archive-after-reporting="true"
    :discussion-channel-id="discussionChannelId"
    :event-channel-id="eventChannelId"
    @close="closeArchiveModal"
    @reported-and-archived-successfully="
      () => {
        handleArchivedSuccessfully();
        emit('archived-successfully');
      }
    "
  />
  <UnarchiveModal
    v-if="
      (discussionChannelId && discussionId) ||
      (eventChannelId && eventId) ||
      commentId
    "
    :open="showUnarchiveModal"
    :discussion-channel-id="discussionChannelId"
    :event-channel-id="eventChannelId"
    :discussion-id="discussionId"
    :event-id="eventId"
    :comment-id="commentId"
    @close="closeUnarchiveModal"
    @unarchived-successfully="
      () => {
        handleUnarchivedSuccessfully();
        emit('unarchived-successfully');
      }
    "
  />
  <Notification
    :show="showSuccessfullyArchived"
    :title="'The content was reported and archived successfully.'"
    @close-notification="dismissArchivedNotification"
  />
  <Notification
    :show="showSuccessfullyUnarchived"
    :title="'The content was unarchived successfully.'"
    @close-notification="dismissUnarchivedNotification"
  />
</template>
