<script setup lang="ts">
import RequireAuth from "@/components/auth/RequireAuth.vue";
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
  "open-issue",
  "archived-successfully",
  "unarchived-successfully",
  "suspended-user-successfully",
  "suspended-mod-successfully",
  "unsuspended-user-successfully",
  "unsuspended-mod-successfully"
]);

</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <div class="flex pt-12 gap-x-2" data-test="mod-wizard">
        <div
<<<<<<< HEAD
          class="flex h-10 w-10 items-center justify-center rounded-lg"
          :class="[issue.isOpen ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-700']"
=======
          class="flex justify-center items-center w-10 h-10  rounded-lg"
          :class="[issue.isOpen ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700']"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        >
          <div class="">
            <EyeIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div
<<<<<<< HEAD
          class="px-4py-4 flex-1 flex-col space-y-4 rounded-lg border border-gray-300"
          :class="[issue.isOpen ? 'border-orange-500' : 'border-gray-300 dark:border-gray-700']"
        >
          <h1
            v-if="issue.isOpen"
            class="border-b border-gray-300 pb-2 text-xl font-bold text-orange-500 dark:border-gray-600"
=======
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          >
            Mod Decision Needed
          </h1>
          <h1
            v-else
            class="text-xl font-bold text-gray-500 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-2"
          >
            Mod Actions
          </h1>
          <p v-if="!issue.isOpen" class="text-gray-600 dark:text-gray-400" >
            {{ "Mod actions are disabled because the issue is closed." }}
          </p>
          <RequireAuth :full-width="true">
            <template #has-auth>
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
<<<<<<< HEAD
                  class="flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-500"
=======
                  class="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                  :loading="closeIssueLoading"
                  @click="$emit('close-issue')"
                >
                  <XCircleIcon />
                  Close Issue (No Action Needed)
                </button>
              </div>
            </template>
            <template #does-not-have-auth>
              <div class="flex flex-col space-y-4 mt-4">
                <p class="text-gray-600 dark:text-gray-400">
                  Please log in to access moderation features
                </p>
              </div>
            </template>
          </RequireAuth>
         
        </div>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex pt-12 gap-x-2">
        <div class="flex justify-center items-center w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg">
          <div class="">
            <EyeIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div class="flex-1 flex-col space-y-4 px-4 py-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          <h1 class="text-xl font-bold text-gray-500 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-2">
            Mod Actions
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Please log in to access moderation features
          </p>
        </div>
      </div>
    </template>
  </RequireAuth>
</template>
