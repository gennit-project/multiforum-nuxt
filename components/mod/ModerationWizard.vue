<script setup lang="ts">
import type { Issue } from "@/__generated__/graphql";
import ArchiveButton from "./ArchiveButton.vue";
import SuspendUserButton from "./SuspendUserButton.vue";
import EyeIcon from "../icons/EyeIcon.vue";
import XCircleIcon from "../icons/XCircleIcon.vue";

defineProps({
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
    required: false,
    default: "",
  },
  closeIssueLoading: {
    type: Boolean,
    required: false,
    default: false,
  },
});

defineEmits([
  "close-issue",
  "archived-successfully",
  "unarchived-successfully",
  "suspended-user-successfully",
  "unsuspended-user-successfully",
  "suspended-mod-successfully",
  "unsuspended-mod-successfully",
]);

// const suspensionMessage = computed(() => {
//   return `
//     This post has been removed from ${channelId.value} for violating the following rules:
//     ${brokenRules.value}

//     As a result, I have suspended ${authorUsername} from posting in ${channelId.value} ${
//       selectedSuspensionLength.value === "indefinitely"
//         ? "indefinitely"
//         : `for ${selectedSuspensionLength.value}`
//     }.
//   `;
// });
</script>

<template>
  <div class="flex pt-12 border gap-x-2">
    <div
      class="flex justify-center items-center w-10 h-10  rounded-lg"
      :class="[issue.isOpen ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700']"
    >
      <div class="">
        <EyeIcon class="h-6 w-6 text-white" />
      </div>
    </div>
    <div
      class="flex-1 flex-col space-y-4 px-4 py-4 border rounded-lg"
      :class="[
        issue.isOpen
          ? 'border-blue-500'
          : 'border-gray-300 dark:border-gray-700',
      ]"
    >
      <h1
        v-if="issue.isOpen"
        class="text-xl font-bold text-blue-500 border-b border-gray-300 dark:border-gray-600 pb-2"
      >
        Mod Decision Needed
      </h1>
      <h1
        v-else
        class="text-xl font-bold text-gray-500 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-2"

        >
        Mod Actions
      </h1>
      <p class="text-gray-600 dark:text-gray-400" v-if="!issue.isOpen">
        {{ "Mod actions are disabled because the issue is closed." }}
      </p>
      <div class="flex flex-col space-y-4 mt-4">
        <ArchiveButton
          :discussion-id="discussionId"
          :event-id="eventId"
          :comment-id="commentId"
          :context-text="contextText"
          :channel-unique-name="channelUniqueName"
          :issue="issue"
          :disabled="!issue.isOpen"
          @archived-successfully="$emit('archived-successfully')"
          @unarchived-successfully="$emit('unarchived-successfully')"
        />
        <SuspendUserButton
          :issue="issue"
          :discussion-title="contextText"
          :discussion-id="discussionId"
          :event-title="contextText"
          :event-id="eventId"
          :channel-unique-name="channelUniqueName"
          :disabled="!issue.isOpen"
          @suspended-successfully="$emit('suspended-user-successfully')"
          @unsuspended-successfully="$emit('unsuspended-user-successfully')"
        />
        <button
          v-if="issue.isOpen"
          class="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
          :loading="closeIssueLoading"
          @click="$emit('close-issue')"
        >
          <XCircleIcon />
          Close Issue (No Action Needed)
        </button>
      </div>
    </div>
  </div>
</template>
