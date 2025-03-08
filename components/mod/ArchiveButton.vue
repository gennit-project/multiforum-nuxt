<script lang="ts" setup>
import { computed, ref } from "vue";
import type { Issue } from "@/__generated__/graphql";
import ArchiveBox from "@/components/icons/ArchiveBox.vue";
import ArchiveBoxXMark from "@/components/icons/ArchiveBoxXMark.vue";
import BrokenRulesModal from "@/components/mod/BrokenRulesModal.vue";
import UnarchiveModal from "@/components/mod/UnarchiveModal.vue";
import Notification from "@/components/NotificationComponent.vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_DISCUSSION_CHANNEL, GET_EVENT_CHANNEL } from "@/graphQLData/mod/queries";
import { GET_COMMENT_ARCHIVED } from "@/graphQLData/comment/queries";

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
  discussionId: {
    type: String,
    required: false,
    default: "",
  },
  eventId: {
    type: String,
    required: false,
    default: "",
  },
  commentId: {
    type: String,
    required: false,
    default: "",
  },
  contextText: {
    type: String,
    required: false,
    default: "",
  },
  channelUniqueName: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const { 
    result: getDiscussionChannelResult
} = useQuery(GET_DISCUSSION_CHANNEL, {
  discussionId: props.discussionId,
  channelUniqueName: props.channelUniqueName,
});

const { 
    result: getEventChannelResult
} = useQuery(GET_EVENT_CHANNEL, {
  eventId: props.eventId,
  channelUniqueName: props.channelUniqueName,
});

const {
  result: isCommentArchivedResult
} = useQuery(GET_COMMENT_ARCHIVED, {
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
  return getDiscussionChannelResult.value?.discussionChannels?.[0]?.id ?? "";
});

const eventChannelId = computed(() => {
  return getEventChannelResult.value?.eventChannels?.[0]?.id ?? "";
});

defineEmits(["archived-successfully", "unarchived-successfully"]);

const showArchiveModal = ref(false);
const showUnarchiveModal = ref(false);

const showSuccessfullyArchived = ref(false);
const showSuccessfullyUnarchived = ref(false);

const clickUnarchive = () => {
  if (props.disabled) {
    return;
  }
  showUnarchiveModal.value = true;
};
const clickArchive = () => {
  if (props.disabled) {
    return;
  }
  showArchiveModal.value = true;
};

const archivedContentType = computed(() => {
  if (props.discussionId) {
    return "Discussion";
  } else if (props.eventId) {
    return "Event";
  } else if (props.commentId) {
    return "Comment";
  }
  return "Content";
});
</script>

<template>
  <button
    v-if="isArchived"
    :disabled="disabled"
    class="text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
    :class="{
      'bg-green-600 hover:bg-green-500 cursor-pointer': !disabled,
      'bg-gray-500 cursor-not-allowed': disabled,
    }"
    @click="clickUnarchive"
  >
    <ArchiveBoxXMark />
    Unarchive
  </button>
  <button
    v-else
    class="text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
    :class="{
      'bg-red-600 hover:bg-red-500 cursor-pointer': !disabled,
      'bg-gray-500 cursor-not-allowed': disabled,
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
    @close="showArchiveModal = false"
    @reported-and-archived-successfully="
      () => {
        showSuccessfullyArchived = true;
        showArchiveModal = false;
        $emit('archived-successfully');
      }
    "
  />
  <UnarchiveModal
    v-if="(discussionChannelId && discussionId) || (eventChannelId && eventId) || commentId"
    :open="showUnarchiveModal"
    :discussion-channel-id="discussionChannelId"
    :event-channel-id="eventChannelId"
    :discussion-id="discussionId"
    :event-id="eventId"
    :comment-id="commentId"
    @close="showUnarchiveModal = false"
    @unarchived-successfully="
      () => {
        showSuccessfullyUnarchived = true;
        showUnarchiveModal = false;
        $emit('unarchived-successfully');
      }
    "
  />
  <Notification
    :show="showSuccessfullyArchived"
    :title="'The content was reported and archived successfully.'"
    @close-notification="showSuccessfullyArchived = false"
  />
  <Notification
    :show="showSuccessfullyUnarchived"
    :title="'The content was unarchived successfully.'"
    @close-notification="showSuccessfullyUnarchived = false"
  />
</template>
