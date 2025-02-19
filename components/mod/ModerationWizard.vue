<script setup lang="ts">
import type { Issue } from "@/__generated__/graphql";
import ArchiveButton from "./ArchiveButton.vue";
import SuspendUserButton from "./SuspendUserButton.vue";

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
});

defineEmits([
  "close-issue",
  "archived-successfully",
  "unarchived-successfully",
  "suspended-successfully",
  "unsuspended-successfully",
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
  <div class="flex flex-col justify-center w-full pt-12">
    <h1 class="text-xl font-bold">Moderation Actions</h1>
    <hr >
    <div class="flex flex-col space-y-4 mt-4">
      <ArchiveButton
        :discussion-id="discussionId"
        :event-id="eventId"
        :comment-id="commentId"
        :context-text="contextText"
        :channel-unique-name="channelUniqueName"
        :issue="issue"
      />
      <SuspendUserButton 
        :issue="issue"
        :discussion-title="contextText"
        :discussion-id="discussionId"
        :event-title="contextText"
        :event-id="eventId"
        :channel-unique-name="channelUniqueName"
      />
      <!-- <SuspendModButton 
        :mod-is-suspended="modIsSuspendedFromChannel" 
      /> -->
    </div>
  </div>
</template>
