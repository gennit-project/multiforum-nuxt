<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import ChannelHealthTable from '@/components/admin/ChannelHealthTable.vue';
import ServerDashboardActivityChart from '@/components/admin/ServerDashboardActivityChart.vue';
import ServerDashboardIssueAging from '@/components/admin/ServerDashboardIssueAging.vue';
import ServerDashboardMetricCards from '@/components/admin/ServerDashboardMetricCards.vue';
import ServerDashboardSecondaryStats from '@/components/admin/ServerDashboardSecondaryStats.vue';
import { RefreshCw } from 'lucide-vue-next';
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

type DashboardData = {
  startDate: string;
  endDate: string;
  generatedAt: string;
  summary: ServerHealthSummary;
  timeSeries: ServerHealthTimeSeriesPoint[];
  channelHealth: ChannelHealthRow[];
  issueAging: IssueAgingBucket[];
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

const channelRows = computed(() => dashboard.value?.channelHealth || []);
const issueAging = computed(() => dashboard.value?.issueAging || []);
const timeSeries = computed(() => dashboard.value?.timeSeries || []);

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
        <ServerDashboardMetricCards :summary="dashboard.summary" />

        <section
          class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]"
        >
          <ServerDashboardActivityChart :time-series="timeSeries" />
          <ServerDashboardIssueAging :issue-aging="issueAging" />
        </section>

        <ChannelHealthTable
          :rows="channelRows"
          :loading="isChannelHealthLoading"
          :active-sort-by="activeSortBy"
          :active-sort-direction="activeSortDirection"
          @sort="updateChannelSort"
        />

        <ServerDashboardSecondaryStats
          :download-count="dashboard.summary.downloadCount"
          :suspension-count="dashboard.summary.suspensionCount"
        />
      </template>
    </ClientOnly>
  </div>
</template>
