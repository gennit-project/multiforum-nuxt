<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight } from 'lucide-vue-next';
import type { ChannelHealthRow as GeneratedChannelHealthRow } from '@/__generated__/graphql';

type ChannelHealthRow = Pick<
  GeneratedChannelHealthRow,
  | 'id'
  | 'channelUniqueName'
  | 'displayName'
  | 'channelIconURL'
  | 'discussionCount'
  | 'commentCount'
  | 'eventCount'
  | 'voteCount'
  | 'uniqueContributorCount'
  | 'openIssueCount'
  | 'oldestOpenIssueAgeDays'
  | 'healthLabel'
>;

const props = defineProps<{
  row: ChannelHealthRow;
  detailRouteBase?: string | null;
}>();

const channelInitials = computed(() => {
  return props.row.channelUniqueName.slice(0, 2).toUpperCase();
});

const forumHref = computed(() => {
  return `/forums/${props.row.channelUniqueName}`;
});

const detailHref = computed(() => {
  if (!props.detailRouteBase) return null;
  return `${props.detailRouteBase}/${encodeURIComponent(props.row.channelUniqueName)}`;
});

const hasOpenIssues = computed(() => props.row.openIssueCount > 0);

const staleOpenIssueLabel = computed(() => {
  if (!hasOpenIssues.value) return '—';
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
    <td class="py-3 pr-4 pl-5">
      <div class="flex items-center gap-3">
        <img
          v-if="row.channelIconURL"
          :src="row.channelIconURL"
          alt=""
          class="h-8 w-8 rounded-md object-cover"
        >
        <div
          v-else
          class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
          <p class="text-xs text-gray-600 dark:text-gray-400">
            {{ row.channelUniqueName }}
          </p>
        </div>
      </div>
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.discussionCount }}
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.commentCount }}
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.eventCount }}
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.voteCount }}
    </td>
    <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
      {{ row.uniqueContributorCount }}
    </td>
    <td class="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
      {{ row.openIssueCount }}
    </td>
    <td
      class="px-4 py-3 text-gray-700 dark:text-gray-200"
      :title="staleOpenIssueDescription"
    >
      <span
        v-if="hasOpenIssues"
        class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
        :class="staleOpenIssueClasses"
      >
        {{ staleOpenIssueLabel }}
      </span>
      <template v-else>
        <span aria-hidden="true">{{ staleOpenIssueLabel }}</span>
        <span class="sr-only">No open issues</span>
      </template>
    </td>
    <td class="px-4 py-3">
      <span
        class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
        :class="healthLabelClasses"
        :title="healthLabelDescription"
      >
        <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-current" />
        {{ row.healthLabel }}
      </span>
    </td>
    <td
      v-if="detailHref"
      class="px-4 py-3 text-right"
    >
      <NuxtLink
        :to="detailHref"
        class="inline-flex min-h-8 items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
      >
        Details
        <ArrowRight class="h-3.5 w-3.5" />
      </NuxtLink>
    </td>
  </tr>
</template>
