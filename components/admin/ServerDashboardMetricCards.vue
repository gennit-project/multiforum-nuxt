<script setup lang="ts">
import { computed } from 'vue';
import {
  Archive,
  Clock3,
  Flag,
  ShieldAlert,
  ThumbsUp,
  Users,
} from 'lucide-vue-next';

type ServerHealthSummary = {
  activeChannelCount: number;
  discussionCount: number;
  commentCount: number;
  eventCount: number;
  voteCount: number;
  openIssueCount: number;
  issueOpenedCount: number;
  issueClosedCount: number;
  moderationActionCount: number;
  archivedContentCount: number;
  lockedContentCount: number;
  medianOpenIssueAgeDays?: number | null;
};

const props = defineProps<{
  summary: ServerHealthSummary;
}>();

const totalContributions = computed(() => {
  return (
    props.summary.discussionCount +
    props.summary.commentCount +
    props.summary.eventCount
  );
});

const metricCards = computed(() => {
  return [
    {
      label: 'Active Channels',
      value: props.summary.activeChannelCount,
      detail: `${totalContributions.value} contributions`,
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Admin Open Issues',
      value: props.summary.openIssueCount,
      detail: `${props.summary.issueOpenedCount} new this period`,
      icon: Flag,
      tone: props.summary.openIssueCount > 0 ? 'yellow' : 'green',
    },
    {
      label: 'Admin Issue Age',
      value:
        props.summary.medianOpenIssueAgeDays == null
          ? '0d'
          : `${Math.round(props.summary.medianOpenIssueAgeDays)}d`,
      detail: 'median open admin issue age',
      icon: Clock3,
      tone: (props.summary.medianOpenIssueAgeDays || 0) >= 7 ? 'yellow' : 'green',
    },
    {
      label: 'Mod Actions',
      value: props.summary.moderationActionCount,
      detail: `${props.summary.issueClosedCount} issues closed`,
      icon: ShieldAlert,
      tone: 'slate',
    },
    {
      label: 'Votes',
      value: props.summary.voteCount,
      detail: `${props.summary.commentCount} comments`,
      icon: ThumbsUp,
      tone: 'blue',
    },
    {
      label: 'Archived',
      value: props.summary.archivedContentCount,
      detail: `${props.summary.lockedContentCount} locked`,
      icon: Archive,
      tone: props.summary.archivedContentCount > 0 ? 'yellow' : 'slate',
    },
  ];
});

const formatNumber = (value: number | string) => {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat().format(value);
};
</script>

<template>
  <section class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
    <div
      v-for="card in metricCards"
      :key="card.label"
      class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            {{ card.label }}
          </p>
          <p class="mt-2 text-2xl font-semibold !text-gray-900 dark:!text-gray-100">
            {{ formatNumber(card.value) }}
          </p>
        </div>
        <component
          :is="card.icon"
          class="h-5 w-5"
          :class="{
            'text-blue-600 dark:text-blue-300': card.tone === 'blue',
            'text-yellow-600 dark:text-yellow-300': card.tone === 'yellow',
            'text-green-600 dark:text-green-300': card.tone === 'green',
            'text-gray-500 dark:text-gray-300': card.tone === 'slate',
          }"
        />
      </div>
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
        {{ card.detail }}
      </p>
    </div>
  </section>
</template>
