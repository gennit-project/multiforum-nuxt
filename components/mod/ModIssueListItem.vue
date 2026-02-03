<script setup lang="ts">
import { computed } from 'vue';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';
import { DateTime } from 'luxon';
import FlagIcon from '@/components/icons/FlagIcon.vue';

type Issue = GeneratedIssue & {
  issueNumber: number;
  locked?: boolean;
};

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
  isSelectable: {
    type: Boolean,
    default: false,
  },
  selectedIssueNumber: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits<{
  select: [payload: { issueNumber: number; title: string; channelId: string }];
}>();

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

const handleSelect = () => {
  if (!props.issue?.issueNumber || !props.issue.Channel?.uniqueName) return;
  emit('select', {
    issueNumber: props.issue.issueNumber,
    title: props.issue.title || '',
    channelId: props.issue.Channel.uniqueName,
  });
};

const isSelected = computed(() => {
  return props.selectedIssueNumber === props.issue?.issueNumber;
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
            class="hover:underline dark:text-gray-200 lg:hidden"
            :to="{
              name: 'forums-forumId-issues-issueNumber',
              params: {
                issueNumber: issue.issueNumber,
                forumId: issue.Channel?.uniqueName,
              },
            }"
            @click="handleSelect"
          >
            {{ issue.title }}
          </nuxt-link>
          <button
            v-if="issue.issueNumber"
            type="button"
            class="hidden text-left hover:underline dark:text-gray-200 lg:inline-block"
            @click="handleSelect"
          >
            <span
              :class="
                isSelected
                  ? 'rounded bg-gray-100 px-1 dark:bg-gray-700'
                  : ''
              "
            >
              {{ issue.title }}
            </span>
          </button>
          <span v-else class="dark:text-gray-200">{{ issue.title }}</span>
          <span
            v-if="issue.locked"
            class="inline-flex items-center gap-1 rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-100"
            title="This issue is locked"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clip-rule="evenodd"
              />
            </svg>
            Locked
          </span>
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
