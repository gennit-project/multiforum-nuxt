<script setup lang="ts">
import type { Issue } from "@/__generated__/graphql";
import { DateTime } from "luxon";

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
});

const formatDate = (date: string) => {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
};
</script>

<template>
  <li
    class="border-bottom flex flex-col border-gray-200 p-3 pl-8 dark:border-gray-800"
  >
    <div class="text-md flex space-x-2 font-bold text-base">
      <i v-if="issue.isOpen" class="mt-1 far fa-dot-circle list-item-icon" />
      <i v-else class="mt-1 fa-solid fa-circle-check text-purple-500" />

      <div class="flex-col">
        <nuxt-link
          :to="{
            name: 'forums-forumId-issues-issueId',
            params: {
              issueId: issue.id,
              forumId: channelId,
            },
          }"
        >
          {{ issue.title }}
        </nuxt-link>
        <div class="text-xs text-gray-500 dark:text-gray-200">
          {{
            `Opened on ${formatDate(issue.createdAt)} by ${
              issue.Author?.displayName || "[Deleted]"
            }`
          }}
        </div>
      </div>
    </div>
  </li>
</template>
