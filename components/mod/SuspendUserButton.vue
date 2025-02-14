<script lang="ts" setup>
import { ref, defineProps, computed } from "vue";
import UserPlus from "../icons/UserPlus.vue";
import UserMinus from "../icons/UserMinus.vue";
import BrokenRulesModal from "@/components/mod/BrokenRulesModal.vue";
import Notification from "@/components/NotificationComponent.vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_DISCUSSION_CHANNEL, GET_EVENT_CHANNEL } from "@/graphQLData/mod/queries";

const props = defineProps({
  issueId: {
    type: String,
    required: true,
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
  discussionId: {
    type: String,
    required: false,
    default: "",
  },
  discussionTitle: {
    type: String,
    required: false,
    default: "",
  },
  eventId: {
    type: String,
    required: false,
    default: "",
  },
  eventTitle: {
    type: String,
    required: false,
    default: "",
  },
  userIsSuspended: {
    type: Boolean,
    required: true,
  },
});

const showSuspendModal = ref(false);
const showUnsuspendModal = ref(false);
const showSuccessfullySuspended = ref(false);
const showSuccessfullyUnsuspended = ref(false);

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


const discussionChannelId = computed(() => {
  return getDiscussionChannelResult.value?.discussionChannels?.[0]?.id ?? "";
});

const eventChannelId = computed(() => {
  return getEventChannelResult.value?.eventChannels?.[0]?.id ?? "";
});

const clickSuspend = () => {
  showSuspendModal.value = true;
};

const clickUnsuspend = () => {
  showUnsuspendModal.value = true;
};

</script>

<template>
  <button
    v-if="userIsSuspended"
    class="cursor-pointer bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
    @click="clickUnsuspend"
  >
    <UserPlus />
    Unsuspend
  </button>
  <button
    v-else
    class="cursor-pointer bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
    @click="clickSuspend"
  >
    <UserMinus />
    Suspend Author
  </button>
  <BrokenRulesModal
    :title="'Suspend Author'"
    :open="showSuspendModal"
    :discussion-title="discussionTitle"
    :discussion-id="discussionId"
    :discussion-channel-id="discussionChannelId"
    :event-title="eventTitle"
    :event-id="eventId"
    :event-channel-id="eventChannelId"
    :suspend-user-enabled="true"
    :text-box-label="'(Optional) Explain why you are suspending this author:'"
    :issue-id="issueId"
    @close="showSuspendModal = false"
    @suspended-user-successfully="
      () => {
        showSuccessfullySuspended = true;
        showSuspendModal = false;
      }
    "
  />
  <!-- <UnsuspendModal
    :title="'Unsuspend Author'"
    :open="showUnsuspendModal"
    :discussion-title="discussionTitle"
    :discussion-id="discussionId"
    :suspend-author="true"
    :discussion-channel-id="discussionChannelId"
    :issue-id="issueId"
    @close="showUnsuspendModal = false"
    @unsuspend-user-successfully="
      () => {
        showSuccessfullyUnsuspended = true;
        showUnsuspendModal = false;
      }
    "
  /> -->

  <Notification
    :show="showSuccessfullySuspended"
    :title="'The author was suspended.'"
    @close-notification="showSuccessfullySuspended = false"
  />
  <Notification
    :show="showSuccessfullyUnsuspended"
    :title="'The author was unsuspended.'"
    @close-notification="showSuccessfullyUnsuspended = false"
  />
</template>
