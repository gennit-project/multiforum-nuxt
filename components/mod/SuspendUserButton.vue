<script lang="ts" setup>
import { ref, defineProps, computed } from "vue";
import type { PropType } from "vue";
import UserPlus from "../icons/UserPlus.vue";
import UserMinus from "../icons/UserMinus.vue";
import BrokenRulesModal from "@/components/mod/BrokenRulesModal.vue";
import Notification from "@/components/NotificationComponent.vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_DISCUSSION_CHANNEL, GET_EVENT_CHANNEL, IS_ORIGINAL_POSTER_SUSPENDED } from "@/graphQLData/mod/queries";
import UnsuspendUserModal from "@/components/mod/UnsuspendUserModal.vue";
import type { Issue } from "@/__generated__/graphql";

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
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});
console.log('suspend user button')
defineEmits([
  "suspended-successfully",
  "unsuspended-successfully",
]);

const {
  result: getUserSuspensionResult,
  loading: getUserSuspensionLoading,
  error: getUserSuspensionError,
  // refetch: refetchUserSuspension
} = useQuery(IS_ORIGINAL_POSTER_SUSPENDED, {
  issueId: props.issue.id,
});
const userIsSuspendedFromChannel = computed(() => {
  if (getUserSuspensionLoading.value || getUserSuspensionError.value)
    return false;
  return getUserSuspensionResult.value?.isOriginalPosterSuspended ?? false;
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
  if (props.disabled) return;
  showSuspendModal.value = true;
};

const clickUnsuspend = () => {
  if (props.disabled) return;
  showUnsuspendModal.value = true;
};

</script>

<template>
  <div>
  <button
    v-if="userIsSuspendedFromChannel"
    class="w-full text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
    :class="{
      'bg-green-600 hover:bg-green-500 cursor-pointer': !disabled,
      'bg-gray-500 cursor-not-allowed': disabled,
    }"
    @click="clickUnsuspend"
  >
    <UserPlus />
    Unsuspend Author
  </button>
  <button
    v-else
    class="w-full text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
    :class="{
      'bg-red-600 hover:bg-red-500 cursor-pointer': !disabled,
      'bg-gray-500 cursor-not-allowed': disabled,
    }"
    @click="clickSuspend"
  >
    <UserMinus />
    Suspend Author (Includes Archive)
  </button>
  <BrokenRulesModal
    :title="'Suspend Author'"
    :open="showSuspendModal"
    :discussion-title="discussionTitle"
    :discussion-id="issue.relatedDiscussionId ?? ''"
    :discussion-channel-id="discussionChannelId"
    :event-title="eventTitle"
    :event-id="issue.relatedEventId ?? ''"
    :event-channel-id="eventChannelId"
    :comment-id="issue.relatedCommentId ?? ''"
    :suspend-user-enabled="true"
    :text-box-label="'(Optional) Explain why you are suspending this author:'"
    :issue-id="issue.id"
    @close="showSuspendModal = false"
    @suspended-user-successfully="
      () => {
        showSuccessfullySuspended = true;
        showSuspendModal = false;
        $emit('suspended-successfully');
      }
    "
  />
  <UnsuspendUserModal
    :title="'Unsuspend Author'"
    :open="showUnsuspendModal"
    :issue-id="issue.id"
    @close="showUnsuspendModal = false"
    @unsuspended-successfully="
      () => {
        showSuccessfullyUnsuspended = true;
        showUnsuspendModal = false;
        $emit('unsuspended-successfully');
      }
    "
  />
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
  </div>
</template>
