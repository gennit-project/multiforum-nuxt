<script setup lang="ts">
import { computed } from 'vue';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';
import { DateTime } from 'luxon';
import FlagIcon from '@/components/icons/FlagIcon.vue';

type Issue = GeneratedIssue & { issueNumber: number };

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
});

const formatDate = (date: string) => {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
};

const issueAuthorName = (issue: Issue) => {
  if (issue.Author?.__typename === 'ModerationProfile') {
    return issue.Author.displayName || '[Deleted]';
  }

  if (issue.Author?.__typename === 'User') {
    return issue.Author.username || '[Deleted]';
  }

  return '[Deleted]';
};

const reportCount = computed(() => {
  const count = props.issue?.ActivityFeedAggregate?.count;
  return typeof count === 'number' ? count : null;
});

const reportCountLabel = computed(() => {
  if (reportCount.value === null) return '';
  return `${reportCount.value} ${reportCount.value === 1 ? 'report' : 'reports'}`;
});
</script>

<template>
  <li
    class="border-bottom flex flex-col border-gray-200 p-3 pl-4 dark:border-gray-800"
  >
    <div class="flex space-x-2 text-sm md:text-lg">
      <i v-if="issue.isOpen" class="far fa-dot-circle list-item-icon mt-1" />
      <i v-else class="fa-solid fa-circle-check mt-1 text-purple-500" />

      <div class="flex-col">
        <span v-if="issue.Channel" class="flex flex-wrap items-center gap-2">
          <nuxt-link
            v-if="issue.issueNumber"
            class="hover:underline dark:text-gray-200"
            :to="{
              name: 'forums-forumId-issues-issueNumber',
              params: {
                issueNumber: issue.issueNumber,
                forumId: issue.Channel?.uniqueName,
              },
            }"
          >
            {{ issue.title }}
          </nuxt-link>
          <span v-else class="dark:text-gray-200">{{ issue.title }}</span>
          <span
            v-if="issue.flaggedServerRuleViolation"
            class="rounded-lg bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700 dark:text-white"
            >Server Rule Violation</span
          >
          <span
            v-if="reportCount !== null && reportCount > 0"
            class="inline-flex items-center gap-1 rounded-full bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/70 dark:text-red-100"
          >
            <FlagIcon class="h-3 w-3" aria-hidden="true" />
            {{ reportCountLabel }}
          </span>
        </span>
        <div v-else class="dark:text-gray-200">{{ issue.title }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-200">
          {{
            `Opened on ${formatDate(issue.createdAt)} by ${issueAuthorName(
              issue
            )} in ${issue.Channel?.uniqueName || '[Deleted]'}`
          }}
        </div>
      </div>
    </div>
  </li>
</template>
