<script setup lang="ts">
import type { Issue } from "@/__generated__/graphql";
import { DateTime } from "luxon";

const props = defineProps({
  issue: {
    type: Object as () => Issue,
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
    <div class="text-lg flex space-x-2">
      <i v-if="issue.isOpen" class="mt-1 far fa-dot-circle list-item-icon" />
      <i v-else class="mt-1 fa-solid fa-circle-check text-purple-500" />

      <div class="flex-col">
        <nuxt-link
          v-if="issue.Channel"
          class="hover:underline dark:text-gray-200"
          :to="{
            name: 'forums-forumId-issues-issueId',
            params: {
              issueId: issue.id,
              forumId: issue.Channel?.uniqueName,
            },
          }"
        >
          {{ issue.title }}
        </nuxt-link>
        <div v-else class="dark:text-gray-200">{{ issue.title }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-200">
          {{
            `Opened on ${formatDate(issue.createdAt)} by ${
              issue.Author?.displayName || "[Deleted]"
            } in ${issue.Channel?.uniqueName || "[Deleted]"}`
          }}
        </div>
      </div>
    </div>
  </li>
</template>
