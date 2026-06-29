<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import ChannelHealthTableRow from '@/components/admin/ChannelHealthTableRow.vue';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Archive,
  CalendarDays,
  Clock3,
  Download,
  Flag,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ThumbsUp,
  Users,
} from 'lucide-vue-next';
import { GET_SERVER_HEALTH_DASHBOARD } from '@/graphQLData/admin/queries';

type ServerHealthSummary = {
  activeChannelCount: number;
  discussionCount: number;
  commentCount: number;
  eventCount: number;
  downloadCount: number;
  voteCount: number;
  openIssueCount: number;
  issueOpenedCount: number;
  issueClosedCount: number;
  moderationActionCount: number;
  archivedContentCount: number;
  lockedContentCount: number;
  suspensionCount: number;
  medianOpenIssueAgeDays?: number | null;
};

type ServerHealthTimeSeriesPoint = {
  date: string;
  discussions: number;
  comments: number;
  events: number;
  downloads: number;
  issuesOpened: number;
  moderationActions: number;
};

type ChannelHealthRow = {
  id: string;
  channelUniqueName: string;
  displayName?: string | null;
  channelIconURL?: string | null;
  discussionCount: number;
  commentCount: number;
  eventCount: number;
  downloadCount: number;
  voteCount: number;
  uniqueContributorCount: number;
  openIssueCount: number;
  issueOpenedCount: number;
  moderationActionCount: number;
  archivedContentCount: number;
  lockedContentCount: number;
  oldestOpenIssueAgeDays?: number | null;
  issuesPerHundredContributions: number;
  activityScore: number;
  healthLabel: string;
};

type IssueAgingBucket = {
  label: string;
  minDays: number;
  maxDays?: number | null;
  count: number;
};

type AttentionItem = {
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  title: string;
  description: string;
  channelUniqueName?: string | null;
  metric?: string | null;
  value?: number | null;
};

type DashboardData = {
  startDate: string;
  endDate: string;
  generatedAt: string;
  summary: ServerHealthSummary;
  timeSeries: ServerHealthTimeSeriesPoint[];
  channelHealth: ChannelHealthRow[];
  issueAging: IssueAgingBucket[];
  attentionItems: AttentionItem[];
};

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

const defaultSortBy: ChannelHealthSortKey = 'activityScore';
const defaultSortDirection: SortDirection = 'desc';
const channelHealthSortKeys = new Set<ChannelHealthSortKey>([
  'channelUniqueName',
  'activityScore',
  'uniqueContributorCount',
  'openIssueCount',
  'issueOpenedCount',
  'oldestOpenIssueAgeDays',
  'issuesPerHundredContributions',
  'moderationActionCount',
  'healthLabel',
]);
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

const toDateInputValue = (date: Date) => date.toISOString().split('T')[0] || '';

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - 30);

const route = useRoute();
const router = useRouter();

const getQueryString = (value: unknown) => {
  return typeof value === 'string' && value ? value : null;
};

const isDateInputValue = (value: string | null): value is string => {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const getSortByFromQuery = (value: unknown): ChannelHealthSortKey => {
  const sortBy = getQueryString(value);
  if (sortBy && channelHealthSortKeys.has(sortBy as ChannelHealthSortKey)) {
    return sortBy as ChannelHealthSortKey;
  }
  return defaultSortBy;
};

const getSortDirectionFromQuery = (value: unknown): SortDirection => {
  return value === 'asc' || value === 'desc' ? value : defaultSortDirection;
};

const defaultStartDate = toDateInputValue(defaultStart);
const defaultEndDate = toDateInputValue(today);

const startDate = ref(
  isDateInputValue(getQueryString(route.query.startDate))
    ? getQueryString(route.query.startDate) || defaultStartDate
    : defaultStartDate
);
const endDate = ref(
  isDateInputValue(getQueryString(route.query.endDate))
    ? getQueryString(route.query.endDate) || defaultEndDate
    : defaultEndDate
);
const channelLimit = ref(20);

const activeSortBy = computed(() => getSortByFromQuery(route.query.sort));
const activeSortDirection = computed(() =>
  getSortDirectionFromQuery(route.query.sortDirection)
);

const dashboardVariables = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
  limit: channelLimit.value,
  sortBy: activeSortBy.value,
  sortDirection: activeSortDirection.value,
}));

watch(
  () => [route.query.startDate, route.query.endDate],
  ([queryStartDate, queryEndDate]) => {
    const nextStartDate = getQueryString(queryStartDate);
    const nextEndDate = getQueryString(queryEndDate);

    if (isDateInputValue(nextStartDate) && nextStartDate !== startDate.value) {
      startDate.value = nextStartDate;
    }

    if (isDateInputValue(nextEndDate) && nextEndDate !== endDate.value) {
      endDate.value = nextEndDate;
    }
  }
);

watch([startDate, endDate], ([nextStartDate, nextEndDate]) => {
  if (
    route.query.startDate === nextStartDate &&
    route.query.endDate === nextEndDate
  ) {
    return;
  }

  router.replace({
    query: {
      ...route.query,
      startDate: nextStartDate,
      endDate: nextEndDate,
    },
  });
});

const { result, loading, error, refetch } = useQuery(
  GET_SERVER_HEALTH_DASHBOARD,
  dashboardVariables,
  {
    fetchPolicy: 'cache-and-network',
    prefetch: false,
  }
);

const dashboard = computed<DashboardData | null>(() => {
  return result.value?.getServerHealthDashboard || null;
});

const showInitialDashboardSkeleton = computed(() => {
  return loading.value && !dashboard.value;
});

const isChannelHealthLoading = computed(() => {
  return loading.value && !!dashboard.value && channelRows.value.length === 0;
});

const summary = computed<ServerHealthSummary | null>(() => {
  return dashboard.value?.summary || null;
});

const totalContributions = computed(() => {
  if (!summary.value) return 0;
  return (
    summary.value.discussionCount +
    summary.value.commentCount +
    summary.value.eventCount
  );
});

const maxActivity = computed(() => {
  const values =
    dashboard.value?.timeSeries.map(
      (point) => point.discussions + point.comments + point.events
    ) || [];
  return Math.max(...values, 1);
});

const maxIssueAgeBucket = computed(() => {
  const values =
    dashboard.value?.issueAging.map((bucket) => bucket.count) || [];
  return Math.max(...values, 1);
});

const maxChannelActivity = computed(() => {
  const values =
    dashboard.value?.channelHealth.map((channel) => channel.activityScore) ||
    [];
  return Math.max(...values, 1);
});

const metricCards = computed(() => {
  const data = summary.value;
  if (!data) return [];
  return [
    {
      label: 'Active Channels',
      value: data.activeChannelCount,
      detail: `${totalContributions.value} contributions`,
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Admin Open Issues',
      value: data.openIssueCount,
      detail: `${data.issueOpenedCount} new this period`,
      icon: Flag,
      tone: data.openIssueCount > 0 ? 'yellow' : 'green',
    },
    {
      label: 'Admin Issue Age',
      value:
        data.medianOpenIssueAgeDays == null
          ? '0d'
          : `${Math.round(data.medianOpenIssueAgeDays)}d`,
      detail: 'median open admin issue age',
      icon: Clock3,
      tone: (data.medianOpenIssueAgeDays || 0) >= 7 ? 'yellow' : 'green',
    },
    {
      label: 'Mod Actions',
      value: data.moderationActionCount,
      detail: `${data.issueClosedCount} issues closed`,
      icon: ShieldAlert,
      tone: 'slate',
    },
    {
      label: 'Votes',
      value: data.voteCount,
      detail: `${data.commentCount} comments`,
      icon: ThumbsUp,
      tone: 'blue',
    },
    {
      label: 'Archived',
      value: data.archivedContentCount,
      detail: `${data.lockedContentCount} locked`,
      icon: Archive,
      tone: data.archivedContentCount > 0 ? 'yellow' : 'slate',
    },
  ];
});

const channelRows = computed(() => dashboard.value?.channelHealth || []);
const issueAging = computed(() => dashboard.value?.issueAging || []);
const timeSeries = computed(() => dashboard.value?.timeSeries || []);

const formatNumber = (value: number | string) => {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat().format(value);
};

const formatDateLabel = (date: string) => {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};

const barPercent = (value: number, max: number) => {
  if (value <= 0) return 0;
  return Math.max(4, percent(value, max));
};

const maxChannelIssuePressure = computed(() => {
  const values = channelRows.value.map(
    (channel) => channel.issuesPerHundredContributions
  );
  return Math.max(...values, 1);
});

const updateChannelSort = (sortBy: ChannelHealthSortKey) => {
  const nextDirection =
    activeSortBy.value === sortBy && activeSortDirection.value === 'desc'
      ? 'asc'
      : 'desc';

  router.replace({
    query: {
      ...route.query,
      sort: sortBy,
      sortDirection: nextDirection,
    },
  });
};

const channelHealthColumns = computed(() => {
  return channelHealthColumnDefinitions.map((column) => {
    const isActive = activeSortBy.value === column.key;
    const ariaSort: SortAria = !isActive
      ? 'none'
      : activeSortDirection.value === 'asc'
        ? 'ascending'
        : 'descending';
    return {
      ...column,
      ariaSort,
      sortIcon:
        isActive && activeSortDirection.value === 'asc'
          ? ArrowUp
          : isActive
            ? ArrowDown
            : ArrowUpDown,
      sortIconClass: isActive ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 opacity-50',
    };
  });
});

</script>

<template>
  <div class="space-y-5 px-2 py-4 dark:text-white md:px-4">
    <header
      class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <h1 class="font-semibold text-2xl text-gray-900 dark:text-gray-100">
          Server Dashboard
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Community activity, issue pressure, and moderation workload.
        </p>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <label
          class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
        >
          Start
          <input
            v-model="startDate"
            type="date"
            class="rounded-md border-gray-300 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          />
        </label>
        <label
          class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
        >
          End
          <input
            v-model="endDate"
            type="date"
            class="rounded-md border-gray-300 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          />
        </label>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          @click="refetch(dashboardVariables)"
        >
          <RefreshCw class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <ClientOnly>
      <template #fallback>
        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="index in 6"
            :key="index"
            class="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        </div>
        <div
          class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]"
        >
          <div
            class="h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
          />
          <div
            class="h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        </div>
      </template>

      <div
        v-if="error"
        class="rounded-md border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-100"
      >
        {{ error.message }}
      </div>

      <div
        v-if="showInitialDashboardSkeleton"
        data-testid="dashboard-initial-loading"
        class="grid gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
        />
      </div>

      <template v-else-if="dashboard">
        <section class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="card in metricCards"
            :key="card.label"
            class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p
                  class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
                >
                  {{ card.label }}
                </p>
                <p
                  class="font-semibold mt-2 text-2xl !text-gray-900 dark:!text-gray-100"
                >
                  {{ formatNumber(card.value) }}
                </p>
              </div>
              <component
                :is="card.icon"
                class="h-5 w-5"
                :class="{
                  'text-blue-600 dark:text-blue-300': card.tone === 'blue',
                  'text-yellow-600 dark:text-yellow-300':
                    card.tone === 'yellow',
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

        <section
          class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]"
        >
          <div
            class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2
                  class="font-semibold text-base !text-gray-900 dark:!text-gray-100"
                >
                  Activity
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  Discussions, comments, and events by day.
                </p>
              </div>
              <CalendarDays class="h-5 w-5 text-gray-400" />
            </div>

            <div
              class="flex h-64 items-end gap-2 overflow-x-auto overflow-y-visible pb-12"
            >
              <div
                v-for="point in timeSeries"
                :key="point.date"
                class="relative flex min-w-6 flex-1 flex-col items-center justify-end gap-1"
                :title="`${formatDateLabel(point.date)}: ${point.discussions + point.comments + point.events}`"
              >
                <div
                  class="flex h-44 w-full max-w-7 flex-col justify-end overflow-hidden rounded-t bg-gray-100 dark:bg-gray-800"
                >
                  <div
                    class="bg-blue-500"
                    :style="{
                      height: `${percent(point.discussions, maxActivity)}%`,
                    }"
                  />
                  <div
                    class="bg-orange-500"
                    :style="{
                      height: `${percent(point.comments, maxActivity)}%`,
                    }"
                  />
                  <div
                    class="bg-green-500"
                    :style="{
                      height: `${percent(point.events, maxActivity)}%`,
                    }"
                  />
                </div>
                <span
                  class="absolute -bottom-9 left-1/2 hidden w-14 origin-top-left -translate-x-1 -rotate-45 whitespace-nowrap text-left text-[10px] leading-none text-gray-500 sm:block"
                >
                  {{ formatDateLabel(point.date) }}
                </span>
              </div>
            </div>

            <div
              class="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300"
            >
              <span class="inline-flex items-center gap-1"
                ><span
                  class="h-2 w-2 rounded-full bg-blue-500"
                />Discussions</span
              >
              <span class="inline-flex items-center gap-1"
                ><span
                  class="h-2 w-2 rounded-full bg-orange-500"
                />Comments</span
              >
              <span class="inline-flex items-center gap-1"
                ><span class="h-2 w-2 rounded-full bg-green-500" />Events</span
              >
            </div>
          </div>

          <div
            class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2
                  class="font-semibold text-base !text-gray-900 dark:!text-gray-100"
                >
                  Issue Aging
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  Open admin/server-scoped issues by age bucket.
                </p>
              </div>
              <Clock3 class="h-5 w-5 text-gray-400" />
            </div>

            <div class="space-y-3">
              <div
                v-for="bucket in issueAging"
                :key="bucket.label"
                class="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"
              >
                <span class="font-medium text-gray-700 dark:text-gray-200">
                  {{ bucket.label }}
                </span>
                <div
                  class="h-3 overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800"
                >
                  <div
                    class="h-full rounded-sm bg-yellow-500"
                    :style="{
                      width: `${barPercent(bucket.count, maxIssueAgeBucket)}%`,
                    }"
                  />
                </div>
                <span class="text-right text-gray-600 dark:text-gray-300">
                  {{ bucket.count }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div
            class="rounded-lg border border-gray-200 bg-white !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
          >
            <div
              class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <div>
                <h2
                  class="font-semibold text-base text-gray-900 dark:text-gray-100"
                >
                  Channel Health
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  Ranked by activity and moderation load.
                </p>
              </div>
              <MessageSquare class="h-5 w-5 text-gray-400" />
            </div>

            <div class="overflow-x-auto">
              <table
                class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800"
              >
                <thead
                  class="bg-gray-100 text-left text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                >
                  <tr>
                    <th
                      v-for="column in channelHealthColumns"
                      :key="column.key"
                      class="px-4 py-3 font-medium"
                      :aria-sort="column.ariaSort"
                      :title="column.title"
                    >
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 uppercase hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-gray-100"
                        @click="updateChannelSort(column.key)"
                      >
                        {{ column.label }}
                        <component
                          :is="column.sortIcon"
                          :class="column.sortIconClass"
                        />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <template v-if="isChannelHealthLoading">
                    <tr
                      v-for="index in 5"
                      :key="`loading-${index}`"
                      data-testid="channel-health-loading-row"
                    >
                      <td class="px-4 py-3">
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
                        v-for="columnIndex in 7"
                        :key="columnIndex"
                        class="px-4 py-3"
                      >
                        <div
                          class="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  </template>
                  <template v-else>
                    <ChannelHealthTableRow
                      v-for="row in channelRows"
                      :key="row.id"
                      :row="row"
                      :max-activity="maxChannelActivity"
                      :max-issue-pressure="maxChannelIssuePressure"
                    />
                  </template>
                  <tr
                    v-if="!isChannelHealthLoading && channelRows.length === 0"
                  >
                    <td
                      colspan="8"
                      class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No channel activity in this range.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div
              class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
            >
              <Download class="mb-3 h-5 w-5 text-gray-400" />
              <p
                class="font-semibold text-2xl !text-gray-900 dark:!text-gray-100"
              >
                {{ summary?.downloadCount || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">Downloads</p>
            </div>
            <div
              class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
            >
              <Lock class="mb-3 h-5 w-5 text-gray-400" />
              <p
                class="font-semibold text-2xl !text-gray-900 dark:!text-gray-100"
              >
                {{ summary?.suspensionCount || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Suspensions
              </p>
            </div>
          </div>
        </section>
      </template>
    </ClientOnly>
  </div>
</template>
