<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import ChannelHealthTable from '@/components/admin/ChannelHealthTable.vue';
import ServerDashboardActivityChart from '@/components/admin/ServerDashboardActivityChart.vue';
import ServerDashboardAttention from '@/components/admin/ServerDashboardAttention.vue';
import ServerDashboardIssueAging from '@/components/admin/ServerDashboardIssueAging.vue';
import ServerDashboardMetricCards from '@/components/admin/ServerDashboardMetricCards.vue';
import ServerDashboardModerationSnapshot from '@/components/admin/ServerDashboardModerationSnapshot.vue';
import ServerDashboardPipelineHealth from '@/components/admin/ServerDashboardPipelineHealth.vue';
import { RefreshCw } from 'lucide-vue-next';
import { GetServerHealthChannelHealthDocument as GET_SERVER_HEALTH_CHANNEL_HEALTH, GetServerHealthDashboardOverviewDocument as GET_SERVER_HEALTH_DASHBOARD_OVERVIEW } from '@/__generated__/operations';

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
  failedDownloadScanCount: number;
  queuedPluginJobCount: number;
  runningPluginJobCount: number;
  pluginTimeoutCount24h: number;
  pluginTimeoutRate24h: number;
  repeatedPluginFailureCount24h: number;
  pluginRetryAttemptCount1h: number;
  pluginRetryStormCount1h: number;
  oldestQueuedPluginJobAgeSeconds: number;
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
  issueAging: IssueAgingBucket[];
};

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

const defaultSortBy: ChannelHealthSortKey = 'activityScore';
const defaultSortDirection: SortDirection = 'desc';
const channelHealthSortKeys = new Set<ChannelHealthSortKey>([
  'channelUniqueName',
  'discussionCount',
  'commentCount',
  'eventCount',
  'voteCount',
  'uniqueContributorCount',
  'openIssueCount',
  'oldestOpenIssueAgeDays',
  'activityScore',
  'healthLabel',
]);

const DEFAULT_RANGE_DAYS = 30;
const RANGE_PRESETS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];
const DAY_MS = 24 * 60 * 60 * 1000;

const toDateInputValue = (date: Date) => date.toISOString().split('T')[0] || '';

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - DEFAULT_RANGE_DAYS);

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
// The table filters client-side (needs review / active / quiet), so ask for as
// many channels as the backend allows. The backend rejects anything above 100
// (BAD_USER_INPUT), which the /api/graphql proxy surfaces as "backend service
// is temporarily unavailable" and leaves the table empty.
const MAX_CHANNEL_LIMIT = 100;
const channelLimit = ref(MAX_CHANNEL_LIMIT);

const activeSortBy = computed(() => getSortByFromQuery(route.query.sort));
const activeSortDirection = computed(() =>
  getSortDirectionFromQuery(route.query.sortDirection)
);

const dashboardOverviewVariables = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
}));

const channelHealthVariables = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
  limit: channelLimit.value,
  sortBy: activeSortBy.value,
  sortDirection: activeSortDirection.value,
}));

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS
  );

// A preset is "selected" when the range ends today and spans exactly N days.
const activeRangeDays = computed(() => {
  if (endDate.value !== defaultEndDate) return null;
  const span = daysBetween(startDate.value, endDate.value);
  return RANGE_PRESETS.find((preset) => preset.days === span)?.days ?? null;
});

const customRangeOpen = ref(activeRangeDays.value === null);

const rangePresets = computed(() =>
  RANGE_PRESETS.map((preset) => ({
    ...preset,
    active: !customRangeOpen.value && activeRangeDays.value === preset.days,
  }))
);

const selectRangePreset = (days: number) => {
  const start = new Date(`${defaultEndDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days);
  startDate.value = toDateInputValue(start);
  endDate.value = defaultEndDate;
  customRangeOpen.value = false;
};

const formatRangeDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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

const {
  result: overviewResult,
  loading: overviewLoading,
  error: overviewError,
  refetch: refetchOverview,
} = useQuery(GET_SERVER_HEALTH_DASHBOARD_OVERVIEW, dashboardOverviewVariables, {
  fetchPolicy: 'cache-and-network',
  prefetch: false,
});

const {
  result: channelHealthResult,
  loading: channelHealthLoading,
  error: channelHealthError,
  refetch: refetchChannelHealth,
} = useQuery(GET_SERVER_HEALTH_CHANNEL_HEALTH, channelHealthVariables, {
  fetchPolicy: 'cache-and-network',
  prefetch: false,
});

const dashboard = computed<DashboardData | null>(() => {
  return overviewResult.value?.getServerHealthDashboard || null;
});

const showInitialDashboardSkeleton = computed(() => {
  return overviewLoading.value && !dashboard.value;
});

const isChannelHealthLoading = computed(() => {
  return (
    channelHealthLoading.value &&
    !!dashboard.value &&
    channelRows.value.length === 0
  );
});

const channelRows = computed(
  () => channelHealthResult.value?.getServerHealthDashboard?.channelHealth || []
);
const issueAging = computed(() => dashboard.value?.issueAging || []);
const timeSeries = computed(() => dashboard.value?.timeSeries || []);
const dashboardError = computed(
  () => overviewError.value || channelHealthError.value
);

// The attention panel names where the oldest open admin issue lives. Channel
// rows are the only per-channel source, so this is "oldest among loaded rows".
const oldestOpenIssue = computed(() => {
  let oldest: { days: number; channel: string } | null = null;
  for (const row of channelRows.value) {
    const days = row.oldestOpenIssueAgeDays;
    if (row.openIssueCount > 0 && days != null && (!oldest || days > oldest.days)) {
      oldest = { days, channel: row.channelUniqueName };
    }
  }
  return oldest;
});

const refreshDashboard = () => {
  refetchOverview(dashboardOverviewVariables.value);
  refetchChannelHealth(channelHealthVariables.value);
};

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

const generatedAtLabel = computed(() => {
  const generatedAt = dashboard.value?.generatedAt;
  if (!generatedAt) return '';
  return new Date(generatedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
});
</script>

<template>
  <div class="space-y-6 px-2 py-4 md:px-4 dark:text-white">
    <header
      class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Server Dashboard
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          <ClientOnly>
            <span data-testid="dashboard-range-summary">
              {{ formatRangeDate(startDate) }} – {{ formatRangeDate(endDate)
              }}<template v-if="generatedAtLabel">
                · Updated {{ generatedAtLabel }}</template
              >
            </span>
            <template #fallback>
              Community activity, issue pressure, and moderation workload.
            </template>
          </ClientOnly>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Date range"
          class="flex gap-0.5 rounded-xl border border-gray-300 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900"
        >
          <button
            v-for="preset in rangePresets"
            :key="preset.days"
            type="button"
            :data-testid="`range-preset-${preset.days}`"
            :aria-pressed="preset.active"
            class="min-h-10 rounded-lg px-3.5 text-sm font-medium"
            :class="
              preset.active
                ? 'bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-950'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
            "
            @click="selectRangePreset(preset.days)"
          >
            {{ preset.label }}
          </button>
          <button
            type="button"
            data-testid="range-preset-custom"
            :aria-pressed="customRangeOpen"
            class="min-h-10 rounded-lg px-3.5 text-sm font-medium"
            :class="
              customRangeOpen
                ? 'bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-950'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
            "
            @click="customRangeOpen = true"
          >
            Custom
          </button>
        </div>
        <template v-if="customRangeOpen">
          <label
            class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
          >
            Start
            <input
              v-model="startDate"
              type="date"
              class="rounded-md border-gray-300 text-sm text-gray-900 scheme-light dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:scheme-dark"
            />
          </label>
          <label
            class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
          >
            End
            <input
              v-model="endDate"
              type="date"
              class="rounded-md border-gray-300 text-sm text-gray-900 scheme-light dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:scheme-dark"
            />
          </label>
        </template>
        <button
          type="button"
          class="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          @click="refreshDashboard"
        >
          <RefreshCw class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <ClientOnly>
      <template #fallback>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="index in 4"
            :key="index"
            class="h-28 min-w-60 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        </div>
        <div class="mt-4 flex flex-wrap gap-4">
          <div
            class="h-72 min-w-0 flex-[999_1_35rem] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
          <div
            class="h-72 min-w-0 flex-[1_1_20rem] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        </div>
      </template>

      <div
        v-if="dashboardError"
        class="rounded-md border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-100"
      >
        {{ dashboardError.message }}
      </div>

      <div
        v-if="showInitialDashboardSkeleton"
        data-testid="dashboard-initial-loading"
        class="flex flex-wrap gap-4"
      >
        <div
          v-for="index in 4"
          :key="index"
          class="h-28 min-w-60 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
        />
      </div>

      <div v-else-if="dashboard" class="space-y-6">
        <ServerDashboardMetricCards
          :summary="dashboard.summary"
          :channel-count="channelRows.length || null"
        />

        <div class="flex flex-wrap items-start gap-4">
          <ServerDashboardAttention
            class="flex-[999_1_35rem]"
            :open-issue-count="dashboard.summary.openIssueCount"
            :oldest-open-issue-age-days="oldestOpenIssue?.days"
            :oldest-open-issue-channel="oldestOpenIssue?.channel"
          />
          <ServerDashboardPipelineHealth
            class="flex-[1_1_20rem]"
            :summary="dashboard.summary"
          />
        </div>

        <div class="flex flex-wrap items-stretch gap-4">
          <ServerDashboardActivityChart
            class="flex-[999_1_35rem]"
            :time-series="timeSeries"
            :start-date="startDate"
            :end-date="endDate"
          />
          <div class="flex min-w-0 flex-[1_1_20rem] flex-col gap-4">
            <ServerDashboardIssueAging :issue-aging="issueAging" />
            <ServerDashboardModerationSnapshot
              class="flex-1"
              :summary="dashboard.summary"
            />
          </div>
        </div>

        <ChannelHealthTable
          :rows="channelRows"
          :loading="isChannelHealthLoading"
          :active-sort-by="activeSortBy"
          :active-sort-direction="activeSortDirection"
          detail-route-base="/admin/dashboard"
          @sort="updateChannelSort"
        />
      </div>
    </ClientOnly>
  </div>
</template>
