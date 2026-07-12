<script setup lang="ts">
import { computed } from 'vue';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MessageSquare,
} from 'lucide-vue-next';
import ChannelHealthTableRow from '@/components/admin/ChannelHealthTableRow.vue';

type ChannelHealthSortKey =
  | 'channelUniqueName'
  | 'activityScore'
  | 'uniqueContributorCount'
  | 'openIssueCount'
  | 'issueOpenedCount'
  | 'oldestOpenIssueAgeDays'
  | 'issuesPerHundredContributions'
  | 'moderationActionCount'
  | 'healthLabel';

type SortDirection = 'asc' | 'desc';
type SortAria = 'none' | 'ascending' | 'descending';

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
  rows: ChannelHealthRow[];
  loading: boolean;
  activeSortBy: ChannelHealthSortKey;
  activeSortDirection: SortDirection;
  detailRouteBase?: string | null;
}>();

const emit = defineEmits<{
  sort: [sortBy: ChannelHealthSortKey];
}>();

const channelHealthColumnDefinitions: Array<{
  key: ChannelHealthSortKey;
  label: string;
  title?: string;
}> = [
  { key: 'channelUniqueName', label: 'Channel' },
  { key: 'activityScore', label: 'Activity' },
  { key: 'uniqueContributorCount', label: 'Contributors' },
  {
    key: 'openIssueCount',
    label: 'Open Issues',
    title:
      'Open issues only include admin/server-scoped issues: server-rule reports or issues opened without a channel scope.',
  },
  {
    key: 'issueOpenedCount',
    label: 'New Issues',
    title:
      'New issues only include admin/server-scoped issues in the selected date range.',
  },
  {
    key: 'oldestOpenIssueAgeDays',
    label: 'Stale Open',
    title: 'Oldest currently open admin/server-scoped issue for this channel.',
  },
  {
    key: 'issuesPerHundredContributions',
    label: 'Pressure',
    title:
      'New admin/server-scoped issues per 100 discussions, comments, and events in the selected date range.',
  },
  { key: 'healthLabel', label: 'Status' },
];

const maxChannelActivity = computed(() => {
  const values = props.rows.map((channel) => channel.activityScore);
  return Math.max(...values, 1);
});

const maxChannelIssuePressure = computed(() => {
  const values = props.rows.map((channel) => channel.issuesPerHundredContributions);
  return Math.max(...values, 1);
});

const channelHealthColumns = computed(() => {
  return channelHealthColumnDefinitions.map((column) => {
    const isActive = props.activeSortBy === column.key;
    const ariaSort: SortAria = !isActive
      ? 'none'
      : props.activeSortDirection === 'asc'
        ? 'ascending'
        : 'descending';
    return {
      ...column,
      ariaSort,
      sortIcon:
        isActive && props.activeSortDirection === 'asc'
          ? ArrowUp
          : isActive
            ? ArrowDown
            : ArrowUpDown,
      sortIconClass: isActive ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 opacity-50',
    };
  });
});

const tableColumnCount = computed(() => {
  return channelHealthColumnDefinitions.length + (props.detailRouteBase ? 1 : 0);
});
</script>

<template>
  <section class="space-y-4">
    <div class="rounded-lg border border-gray-200 bg-white !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
      <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div>
          <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
            Channel Health
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Ranked by activity and moderation load.
          </p>
        </div>
        <MessageSquare class="h-5 w-5 text-gray-400" />
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead class="bg-gray-100 text-left text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th
                v-for="column in channelHealthColumns"
                :key="column.key"
                scope="col"
                class="px-4 py-3 font-medium"
                :aria-sort="column.ariaSort"
                :title="column.title"
              >
                <button
                  type="button"
                  class="inline-flex items-center gap-1 uppercase hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-gray-100"
                  @click="emit('sort', column.key)"
                >
                  {{ column.label }}
                  <component
                    :is="column.sortIcon"
                    :class="column.sortIconClass"
                  />
                </button>
              </th>
              <th
                v-if="detailRouteBase"
                scope="col"
                class="px-4 py-3 text-right font-medium"
              >
                <span class="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <template v-if="loading">
              <tr
                v-for="index in 5"
                :key="`loading-${index}`"
                data-testid="channel-health-loading-row"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                    <div class="space-y-2">
                      <div class="h-3 w-28 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      <div class="h-2 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                </td>
                <td
                  v-for="columnIndex in 7"
                  :key="columnIndex"
                  class="px-4 py-3"
                >
                  <div class="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                </td>
                <td
                  v-if="detailRouteBase"
                  class="px-4 py-3"
                >
                  <div class="ml-auto h-8 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                </td>
              </tr>
            </template>
            <template v-else>
              <ChannelHealthTableRow
                v-for="row in rows"
                :key="row.id"
                :row="row"
                :max-activity="maxChannelActivity"
                :max-issue-pressure="maxChannelIssuePressure"
                :detail-route-base="detailRouteBase"
              />
            </template>
            <tr v-if="!loading && rows.length === 0">
              <td
                :colspan="tableColumnCount"
                class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                No channel activity in this range.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
