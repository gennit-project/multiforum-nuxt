<script setup lang="ts">
import { computed } from 'vue';

type ChannelHealthRow = {
  id: string;
  channelUniqueName: string;
  displayName?: string | null;
  channelIconURL?: string | null;
  voteCount: number;
  uniqueContributorCount: number;
  openIssueCount: number;
  issueOpenedCount: number;
  oldestOpenIssueAgeDays?: number | null;
  issuesPerHundredContributions: number;
  activityScore: number;
  healthLabel: string;
};

const props = defineProps<{
  row: ChannelHealthRow;
  maxActivity: number;
  maxIssuePressure: number;
}>();

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};

const barPercent = (value: number, max: number) => {
  if (value <= 0) return 0;
  return Math.max(4, percent(value, max));
};

const channelInitials = computed(() => {
  return props.row.channelUniqueName.slice(0, 2).toUpperCase();
});

const forumHref = computed(() => {
  return `/forums/${props.row.channelUniqueName}`;
});

const activityBarWidth = computed(() => {
  return `${percent(props.row.activityScore, props.maxActivity)}%`;
});

const hasOpenIssues = computed(() => props.row.openIssueCount > 0);

const staleOpenIssueLabel = computed(() => {
  if (!hasOpenIssues.value) return 'None';
  if (props.row.oldestOpenIssueAgeDays == null) return 'Open';
  return `${props.row.oldestOpenIssueAgeDays}d`;
});

const staleOpenIssueDescription = computed(() => {
  if (!hasOpenIssues.value) {
    return 'No open admin/server-scoped issues.';
  }
  if (props.row.oldestOpenIssueAgeDays == null) {
    return `${props.row.openIssueCount} open admin/server-scoped issue${
      props.row.openIssueCount === 1 ? '' : 's'
    }.`;
  }
  return `${props.row.openIssueCount} open admin/server-scoped issue${
    props.row.openIssueCount === 1 ? '' : 's'
  }; oldest is ${props.row.oldestOpenIssueAgeDays} day${
    props.row.oldestOpenIssueAgeDays === 1 ? '' : 's'
  } old.`;
});

const staleOpenIssueClasses = computed(() => {
  const age = props.row.oldestOpenIssueAgeDays || 0;
  if (age >= 30) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100';
  }
  if (age >= 7) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
});

const issuePressureLabel = computed(() => {
  if (props.row.issuesPerHundredContributions === 0) return '0';
  return props.row.issuesPerHundredContributions.toFixed(1);
});

const issuePressureDescription = computed(() => {
  return `${issuePressureLabel.value} new admin/server-scoped issues per 100 contributions in this date range.`;
});

const issuePressureBarWidth = computed(() => {
  return `${barPercent(
    props.row.issuesPerHundredContributions,
    props.maxIssuePressure
  )}%`;
});

const issuePressureBarClasses = computed(() => {
  return props.row.issuesPerHundredContributions >= 20
    ? 'bg-yellow-500'
    : 'bg-blue-500';
});

const healthLabelDescription = computed(() => {
  if (props.row.healthLabel === 'Needs review') {
    return 'Needs review means at least 10 open admin/server-scoped issues, or the oldest open admin/server-scoped issue is at least 14 days old.';
  }
  if (props.row.healthLabel === 'High moderation load') {
    return 'High moderation load means at least 3 new admin/server-scoped issues and at least 20 new admin/server-scoped issues per 100 contributions in this date range.';
  }
  if (props.row.healthLabel === 'Healthy activity') {
    return 'Healthy activity means at least 20 contributions and fewer than 5 new admin/server-scoped issues per 100 contributions in this date range.';
  }
  if (props.row.healthLabel === 'Quiet') {
    return 'Quiet means this channel had no discussions, comments, or events in this date range.';
  }
  return 'Active means the channel had activity without crossing the review or high-load thresholds.';
});

const healthLabelClasses = computed(() => {
  if (
    props.row.healthLabel === 'Needs review' ||
    props.row.healthLabel === 'High moderation load'
  ) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100';
  }
  if (props.row.healthLabel === 'Healthy activity') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100';
  }
  if (props.row.healthLabel === 'Quiet') {
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100';
});
</script>

<template>
  <tr>
    <td class="px-4 py-3">
      <div class="flex items-center gap-3">
        <img
          v-if="row.channelIconURL"
          :src="row.channelIconURL"
          alt=""
          class="h-8 w-8 rounded-md object-cover"
        >
        <div
          v-else
          class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          {{ channelInitials }}
        </div>
        <div>
          <NuxtLink
            :to="forumHref"
            class="font-medium text-gray-900 hover:underline dark:text-gray-100"
          >
            {{ row.displayName || row.channelUniqueName }}
          </NuxtLink>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ row.channelUniqueName }}
          </p>
        </div>
      </div>
    </td>
    <td class="px-4 py-3">
      <div class="min-w-32">
        <div class="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{{ row.activityScore }}</span>
          <span>{{ row.voteCount }} votes</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            class="h-full rounded-full bg-blue-500"
            :style="{ width: activityBarWidth }"
          />
        </div>
      </div>
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.uniqueContributorCount }}
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.openIssueCount }}
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.issueOpenedCount }}
    </td>
    <td
      class="px-4 py-3 text-gray-700 dark:text-gray-200"
      :title="staleOpenIssueDescription"
    >
      <span
        class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
        :class="staleOpenIssueClasses"
      >
        {{ staleOpenIssueLabel }}
      </span>
    </td>
    <td
      class="px-4 py-3 text-gray-700 dark:text-gray-200"
      :title="issuePressureDescription"
    >
      <div class="min-w-28">
        <div class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-200">
          {{ issuePressureLabel }}
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            class="h-full rounded-full"
            :class="issuePressureBarClasses"
            :style="{ width: issuePressureBarWidth }"
          />
        </div>
      </div>
    </td>
    <td class="px-4 py-3">
      <span
        class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
        :class="healthLabelClasses"
        :title="healthLabelDescription"
      >
        {{ row.healthLabel }}
      </span>
    </td>
  </tr>
</template>
