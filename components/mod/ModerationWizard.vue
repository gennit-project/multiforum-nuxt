<script setup lang="ts">
import { computed, ref } from "vue";
import type { Issue } from "@/__generated__/graphql";
import ArchiveBox from "@/components/icons/ArchiveBox.vue";
import ArchiveBoxXMark from "@/components/icons/ArchiveBoxXMark.vue";
import OpenIssueModal from "@/components/mod/OpenIssueModal.vue";
import UnarchiveModal from "@/components/mod/UnarchiveModal.vue";
import Notification from "@/components/NotificationComponent.vue";
import { GET_DISCUSSION_CHANNEL } from "@/graphQLData/mod/queries";
import { useQuery } from "@vue/apollo-composable";

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

const { result } = useQuery(GET_DISCUSSION_CHANNEL, {
  discussionId: props.discussionId,
  channelUniqueName: props.channelUniqueName,
});

const discussionChannelId = computed(() => {
  return result.value?.discussionChannels?.[0]?.id ?? "";
});

const isArchived = computed(() => {
  return  result.value?.discussionChannels?.[0]?.archived;
})

// Emits for custom events
defineEmits(["close-issue", "archived-successfully", "unarchived-successfully"]);

// const suspensionMessage = computed(() => {
//   return `
//     Your post has been removed from ${channelId.value} for violating the following rules:
//     ${brokenRules.value}

//     As a result, you have been suspended from posting in ${channelId.value} ${
//       selectedSuspensionLength.value === "indefinitely"
//         ? "indefinitely"
//         : `for ${selectedSuspensionLength.value}`
//     }.

//     If you believe this was done in error, please open a support ticket.
//   `;
// });

const showArchiveModal = ref(false);
const showUnarchiveModal = ref(false);
const showSuccessfullyArchived = ref(false);
const showSuccessfullyUnarchived = ref(false);
</script>

<template>
  <div class="flex flex-col justify-center w-full pt-12">
    <h1 class="text-xl font-bold">Moderation Actions</h1>
    <hr />
    <div class="flex flex-col space-y-4 mt-4">
      <button
        v-if="isArchived"
        @click="showUnarchiveModal = true"
        class="bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
      >
        <ArchiveBoxXMark />
        Unarchive
      </button>
      <button
        v-else
        @click="showArchiveModal = true"
        class="bg-red-500 text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
        :disabled="issue.isOpen"
      >
        <ArchiveBox />
        Archive
      </button>
    </div>

    <OpenIssueModal
      :title="'Archive Content'"
      :open="showArchiveModal"
      :discussion-title="contextText"
      :discussion-id="discussionId"
      :archive-after-reporting="true"
      :discussion-channel-id="discussionChannelId"
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
      v-if="discussionChannelId && discussionId"
      :open="showUnarchiveModal"
      :discussion-channel-id="discussionChannelId"
      :discussion-id="discussionId"
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
  </div>
</template>
