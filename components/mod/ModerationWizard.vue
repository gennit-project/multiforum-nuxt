<script setup lang="ts">
import { computed } from "vue";
import type { Issue } from "@/__generated__/graphql";
import { useQuery } from "@vue/apollo-composable";
import {
  GET_USER_SUSPENSION,
  GET_MOD_SUSPENSION,
} from "@/graphQLData/mod/queries";
import { modProfileNameVar } from "@/cache";
import ArchiveButton from "./ArchiveButton.vue";
import SuspendUserButton from "./SuspendUserButton.vue";

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

// const issueAuthorName = computed(() => {
//   const { rle}
// });
const {
  result: getUserSuspensionResult,
  loading: getUserSuspensionLoading,
  error: getUserSuspensionError,
  // refetch: refetchUserSuspension
} = useQuery(GET_USER_SUSPENSION, {
  channelUniqueName: props.channelUniqueName,
  username: modProfileNameVar.value,
});

const {
  result: getModSuspensionResult,
  loading: getModSuspensionLoading,
  error: getModSuspensionError,
  // refetch: refetchModSuspension
} = useQuery(GET_MOD_SUSPENSION, {
  channelUniqueName: props.channelUniqueName,
  modProfileName: modProfileNameVar.value,
});

const userIsSuspendedFromChannel = computed(() => {
  if (getUserSuspensionLoading.value || getUserSuspensionError.value)
    return false;
  return getUserSuspensionResult.value?.channels[0].SuspendedUsers.length > 0;
});

const modIsSuspendedFromChannel = computed(() => {
  if (getModSuspensionLoading.value || getModSuspensionError.value)
    return false;
  return getModSuspensionResult.value?.channels[0].SuspendedMods.length > 0;
});
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
        :issue-id="issue.id"
        :discussion-title="contextText"
        :discussion-id="discussionId"
        :event-title="contextText"
        :event-id="eventId"
        :user-is-suspended="userIsSuspendedFromChannel" 
        :channel-unique-name="channelUniqueName"
      />
      <!-- <SuspendModButton 
        :mod-is-suspended="modIsSuspendedFromChannel" 
      /> -->
    </div>
  </div>
</template>
