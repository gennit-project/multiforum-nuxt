<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, RefreshCw } from 'lucide-vue-next';
import ServerDashboardActivityChart from '@/components/admin/ServerDashboardActivityChart.vue';
import ServerDashboardIssueAging from '@/components/admin/ServerDashboardIssueAging.vue';
import { GET_SERVER_HEALTH_DASHBOARD } from '@/graphQLData/admin/queries';

type ServerHealthSummary = {
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

type DashboardData = {
  startDate: string;
  endDate: string;
  generatedAt: string;
  summary: ServerHealthSummary;
  timeSeries: ServerHealthTimeSeriesPoint[];
  channelHealth: ChannelHealthRow[];
  issueAging: IssueAgingBucket[];
};

const props = withDefaults(
  defineProps<{
    channelUniqueName: string;
    audienceLabel?: string;
    backHref?: string | null;
    backLabel?: string;
  }>(),
  {
    audienceLabel: 'Dashboard',
    backHref: null,
    backLabel: 'Back',
  }
);

const toDateInputValue = (date: Date) => date.toISOString().split('T')[0] || '';

const route = useRoute();
const router = useRouter();

const getQueryString = (value: unknown) => {
  return typeof value === 'string' && value ? value : null;
};

const isDateInputValue = (value: string | null): value is string => {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - 30);

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

const queryVariables = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
  channelUniqueNames: [props.channelUniqueName],
  limit: 1,
}));

const { result, loading, error, refetch } = useQuery(
  GET_SERVER_HEALTH_DASHBOARD,
  queryVariables,
  {
    fetchPolicy: 'cache-and-network',
    prefetch: false,
  }
);

const dashboard = computed<DashboardData | null>(() => {
  return result.value?.getServerHealthDashboard || null;
});

const channel = computed<ChannelHealthRow | null>(() => {
  return dashboard.value?.channelHealth?.[0] || null;
});

const timeSeries = computed(() => dashboard.value?.timeSeries || []);
const issueAging = computed(() => dashboard.value?.issueAging || []);
const showInitialSkeleton = computed(() => loading.value && !dashboard.value);

const contributions = computed(() => {
  if (!channel.value) return 0;
  return (
    channel.value.discussionCount +
    channel.value.commentCount +
    channel.value.eventCount
  );
});

const summaryCards = computed(() => {
  if (!channel.value) return [];

  return [
    {
      label: 'Contributions',
      value: contributions.value,
      detail: `${channel.value.voteCount} votes`,
    },
    {
      label: 'Contributors',
      value: channel.value.uniqueContributorCount,
      detail: `${channel.value.activityScore} activity score`,
    },
    {
      label: 'Open Issues',
      value: channel.value.openIssueCount,
      detail: `${channel.value.issueOpenedCount} new this period`,
    },
    {
      label: 'Issue Pressure',
      value:
        channel.value.issuesPerHundredContributions === 0
          ? '0'
          : channel.value.issuesPerHundredContributions.toFixed(1),
      detail: 'new issues per 100 contributions',
    },
    {
      label: 'Mod Actions',
      value: channel.value.moderationActionCount,
      detail: `${channel.value.archivedContentCount} archived`,
    },
    {
      label: 'Stale Open',
      value:
        channel.value.oldestOpenIssueAgeDays == null
          ? 'None'
          : `${channel.value.oldestOpenIssueAgeDays}d`,
      detail:
        dashboard.value?.summary.medianOpenIssueAgeDays == null
          ? 'median open issue age unavailable'
          : `${Math.round(dashboard.value.summary.medianOpenIssueAgeDays)}d median open age`,
    },
  ];
});

const detailHeading = computed(() => {
  return channel.value?.displayName || props.channelUniqueName;
});

const forumHref = computed(() => `/forums/${props.channelUniqueName}`);

const refreshDashboard = () => {
  refetch(queryVariables.value);
};
</script>

<template>
  <div class="space-y-5 px-2 py-4 dark:text-white md:px-4">
    <header
      class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <NuxtLink
          v-if="backHref"
          :to="backHref"
          class="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ backLabel }}
        </NuxtLink>
        <h1 class="mt-2 font-semibold text-2xl text-gray-900 dark:text-gray-100">
          {{ detailHeading }}
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Channel health detail for the {{ audienceLabel.toLowerCase() }}.
        </p>
        <div
          v-if="channel"
          class="mt-3 flex flex-wrap items-center gap-2 text-sm"
        >
          <span class="rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-100">
            {{ channel.healthLabel }}
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ channel.channelUniqueName }}
          </span>
          <a
            :href="forumHref"
            class="font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            Open channel
          </a>
        </div>
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
          >
        </label>
        <label
          class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
        >
          End
          <input
            v-model="endDate"
            type="date"
            class="rounded-md border-gray-300 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          >
        </label>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          @click="refreshDashboard"
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
      </template>

      <div
        v-if="error"
        class="rounded-md border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-100"
      >
        {{ error.message }}
      </div>

      <div
        v-if="showInitialSkeleton"
        data-testid="channel-health-detail-loading"
        class="grid gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
        />
      </div>

      <template v-else-if="channel">
        <section class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
          >
            <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              {{ card.label }}
            </p>
            <p class="mt-2 text-2xl font-semibold !text-gray-900 dark:!text-gray-100">
              {{ card.value }}
            </p>
            <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {{ card.detail }}
            </p>
          </div>
        </section>

        <section
          class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]"
        >
          <ServerDashboardActivityChart
            :time-series="timeSeries"
            :start-date="startDate"
            :end-date="endDate"
          />
          <ServerDashboardIssueAging :issue-aging="issueAging" />
        </section>
      </template>

      <div
        v-else
        class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        No channel health data was returned for this channel in the selected range.
      </div>
    </ClientOnly>
  </div>
</template>
