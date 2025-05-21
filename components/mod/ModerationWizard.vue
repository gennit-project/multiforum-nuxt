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
    "unsuspended-mod-successfully",
  ]);
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <div
        class="flex gap-x-2 pt-12"
        data-test="mod-wizard"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg"
          :class="[issue.isOpen ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700']"
        >
          <div class="">
            <EyeIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div
          class="px-4py-4 flex-1 flex-col space-y-4 rounded-lg border border-black"
          :class="[issue.isOpen ? 'border-blue-500' : 'border-black dark:border-gray-700']"
        >
          <h1
            v-if="issue.isOpen"
            class="border-b border-black pb-2 text-xl font-bold text-blue-500 dark:border-gray-600"
          >
            Mod Decision Needed
          </h1>
          <h1
            v-else
            class="border-b border-black pb-2 text-xl font-bold text-gray-500 dark:border-gray-600 dark:text-gray-300"
          >
            Mod Actions
          </h1>
          <p
            v-if="!issue.isOpen"
            class="text-gray-600 dark:text-gray-400"
          >
            {{ "Mod actions are disabled because the issue is closed." }}
          </p>
          <RequireAuth :full-width="true">
            <template #has-auth>
              <div class="mt-4 flex flex-col space-y-4">
                <ArchiveButton
                  :channel-unique-name="channelUniqueName"
                  :comment-id="commentId"
                  :context-text="contextText"
                  :disabled="!issue.isOpen"
                  :discussion-id="discussionId"
                  :event-id="eventId"
                  :issue="issue"
                  @archived-successfully="$emit('archived-successfully')"
                  @unarchived-successfully="$emit('unarchived-successfully')"
                />
                <SuspendUserButton
                  :channel-unique-name="channelUniqueName"
                  :disabled="!issue.isOpen"
                  :discussion-id="discussionId"
                  :discussion-title="contextText"
                  :event-id="eventId"
                  :event-title="contextText"
                  :issue="issue"
                  @suspended-successfully="$emit('suspended-user-successfully')"
                  @unsuspended-successfully="$emit('unsuspended-user-successfully')"
                />
                <button
                  v-if="issue.isOpen"
                  class="flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
                  :loading="closeIssueLoading"
                  @click="$emit('close-issue')"
                >
                  <XCircleIcon />
                  Close Issue (No Action Needed)
                </button>
              </div>
            </template>
            <template #does-not-have-auth>
              <div class="mt-4 flex flex-col space-y-4">
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
      <div class="flex gap-x-2 pt-12">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700"
        >
          <div class="">
            <EyeIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div
          class="flex-1 flex-col space-y-4 rounded-lg border border-black px-4 py-4 dark:border-gray-700"
        >
          <h1
            class="border-b border-black pb-2 text-xl font-bold text-gray-500 dark:border-gray-600 dark:text-gray-300"
          >
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
