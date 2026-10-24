<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next';
import ChannelHealthTableRow from '@/components/admin/ChannelHealthTableRow.vue';
import type { ChannelHealthRow as GeneratedChannelHealthRow } from '@/__generated__/graphql';

type ChannelHealthSortKey =
  | 'channelUniqueName'
  | 'discussionCount'
  | 'commentCount'
  | 'eventCount'
  | 'voteCount'
  | 'uniqueContributorCount'
  | 'openIssueCount'
  | 'oldestOpenIssueAgeDays'
  | 'activityScore'
  | 'healthLabel';

type SortDirection = 'asc' | 'desc';
type SortAria = 'none' | 'ascending' | 'descending';
type ChannelFilter = 'all' | 'review' | 'active' | 'quiet';
type ChannelCategory = Exclude<ChannelFilter, 'all'>;

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
  { key: 'discussionCount', label: 'Discussions' },
  { key: 'commentCount', label: 'Comments' },
  { key: 'eventCount', label: 'Events' },
  { key: 'voteCount', label: 'Votes' },
  { key: 'uniqueContributorCount', label: 'Contributors' },
  {
    key: 'openIssueCount',
    label: 'Open issues',
    title:
      'Open issues only include admin/server-scoped issues: server-rule reports or issues opened without a channel scope.',
  },
  {
    key: 'oldestOpenIssueAgeDays',
    label: 'Oldest open',
    title: 'Oldest currently open admin/server-scoped issue for this channel.',
  },
  { key: 'healthLabel', label: 'Status' },
];

// "Contributions" has no column of its own (discussions, comments and events
// are listed separately) but it is the default sort, so it still needs a name.
const sortLabels: Record<ChannelHealthSortKey, string> = {
  ...Object.fromEntries(
    channelHealthColumnDefinitions.map((column) => [
      column.key,
      column.label.toLowerCase(),
    ])
  ),
  activityScore: 'total contributions',
} as Record<ChannelHealthSortKey, string>;

const REVIEW_LABELS = new Set(['Needs review', 'High moderation load']);

const categoryOf = (row: ChannelHealthRow): ChannelCategory => {
  if (REVIEW_LABELS.has(row.healthLabel)) return 'review';
  if (row.healthLabel === 'Quiet') return 'quiet';
  return 'active';
};

const filter = ref<ChannelFilter>('all');

const categoryCounts = computed(() => {
  const counts: Record<ChannelCategory, number> = {
    review: 0,
    active: 0,
    quiet: 0,
  };
  for (const row of props.rows) counts[categoryOf(row)] += 1;
  return counts;
});

const filterChips = computed(() => [
  { key: 'all' as const, label: 'All', count: props.rows.length },
  {
    key: 'review' as const,
    label: 'Needs review',
    count: categoryCounts.value.review,
  },
  { key: 'active' as const, label: 'Active', count: categoryCounts.value.active },
  { key: 'quiet' as const, label: 'Quiet', count: categoryCounts.value.quiet },
]);

// The default view (most contributions first) floats channels that need review
// to the top. Once the admin picks a column to sort by, that order wins.
const isDefaultOrdering = computed(
  () => props.activeSortBy === 'activityScore' && props.activeSortDirection === 'desc'
);

const orderedRows = computed(() => {
  if (!isDefaultOrdering.value) return props.rows;
  const rank = (row: ChannelHealthRow) => (categoryOf(row) === 'review' ? 0 : 1);
  return [...props.rows].sort((a, b) => rank(a) - rank(b));
});

const visibleRows = computed(() =>
  orderedRows.value.filter((row) =>
    filter.value === 'all'
      ? categoryOf(row) !== 'quiet'
      : categoryOf(row) === filter.value
  )
);

const hiddenQuietCount = computed(() =>
  filter.value === 'all' ? categoryCounts.value.quiet : 0
);

const subtitle = computed(() => {
  if (isDefaultOrdering.value) {
    return 'Channels needing review first, then by total contributions. Issue counts are admin-scoped only.';
  }
  const direction = props.activeSortDirection === 'asc' ? 'ascending' : 'descending';
  return `Sorted by ${sortLabels[props.activeSortBy]}, ${direction}. Issue counts are admin-scoped only.`;
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
  <section
    aria-labelledby="channel-health-heading"
    class="overflow-hidden rounded-xl border border-gray-200 bg-white !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div>
        <h2
          id="channel-health-heading"
          class="text-base font-semibold text-gray-900 dark:text-gray-100"
        >
          Channel health
        </h2>
        <p
          data-testid="channel-health-subtitle"
          class="text-sm text-gray-600 dark:text-gray-400"
        >
          {{ subtitle }}
        </p>
      </div>
      <div
        role="group"
        aria-label="Filter channels"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="chip in filterChips"
          :key="chip.key"
          type="button"
          :data-testid="`channel-filter-${chip.key}`"
          :aria-pressed="filter === chip.key"
          class="min-h-11 rounded-full border px-3.5 text-sm font-medium"
          :class="
            filter === chip.key
              ? 'border-brand-500 bg-brand-500 text-gray-950'
              : 'border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800'
          "
          @click="filter = chip.key"
        >
          {{ chip.label }} <span class="opacity-80">{{ chip.count }}</span>
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table
        class="min-w-[56rem] w-full divide-y divide-gray-200 text-sm dark:divide-gray-800"
      >
        <thead
          class="bg-gray-50 text-left text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400"
        >
          <tr>
            <th
              v-for="column in channelHealthColumns"
              :key="column.key"
              scope="col"
              class="px-4 py-3 font-medium first:pl-5"
              :aria-sort="column.ariaSort"
              :title="column.title"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-gray-100"
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
              <td class="py-3 pr-4 pl-5">
                <div class="flex items-center gap-3">
                  <div
                    class="h-8 w-8 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"
                  />
                  <div class="space-y-2">
                    <div
                      class="h-3 w-28 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
                    />
                    <div
                      class="h-2 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                </div>
              </td>
              <td
                v-for="columnIndex in channelHealthColumnDefinitions.length - 1"
                :key="columnIndex"
                class="px-4 py-3"
              >
                <div
                  class="h-3 w-14 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
                />
              </td>
              <td v-if="detailRouteBase" class="px-4 py-3">
                <div
                  class="ml-auto h-8 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
                />
              </td>
            </tr>
          </template>
          <template v-else>
            <ChannelHealthTableRow
              v-for="row in visibleRows"
              :key="row.id"
              :row="row"
              :detail-route-base="detailRouteBase"
            />
          </template>
          <tr v-if="!loading && rows.length === 0">
            <td
              :colspan="tableColumnCount"
              class="px-4 py-8 text-center text-gray-600 dark:text-gray-400"
            >
              No channel activity in this range.
            </td>
          </tr>
          <tr
            v-else-if="!loading && visibleRows.length === 0 && hiddenQuietCount === 0"
          >
            <td
              :colspan="tableColumnCount"
              class="px-4 py-8 text-center text-gray-600 dark:text-gray-400"
            >
              No channels match this filter.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="!loading && hiddenQuietCount > 0"
      data-testid="quiet-channels-prompt"
      class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400"
    >
      <span>
        {{ hiddenQuietCount }} more
        {{ hiddenQuietCount === 1 ? 'channel' : 'channels' }} had no activity in
        this range.
      </span>
      <button
        type="button"
        class="min-h-11 rounded-lg border border-gray-300 px-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
        @click="filter = 'quiet'"
      >
        Show quiet channels
      </button>
    </div>
  </section>
</template>
