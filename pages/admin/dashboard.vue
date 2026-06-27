<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
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

const dashboardVariables = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
  limit: channelLimit.value,
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
  const values = dashboard.value?.issueAging.map((bucket) => bucket.count) || [];
  return Math.max(...values, 1);
});

const maxChannelActivity = computed(() => {
  const values =
    dashboard.value?.channelHealth.map((channel) => channel.activityScore) || [];
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
      tone:
        (data.medianOpenIssueAgeDays || 0) >= 7
          ? 'yellow'
          : 'green',
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
const attentionItems = computed(() => dashboard.value?.attentionItems || []);
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

const issuePressureLabel = (row: ChannelHealthRow) => {
  if (row.issuesPerHundredContributions === 0) return '0';
  return row.issuesPerHundredContributions.toFixed(1);
};

const issuePressureDescription = (row: ChannelHealthRow) => {
  return `${issuePressureLabel(row)} new admin/server-scoped issues per 100 contributions in this date range.`;
};

const healthLabelDescription = (row: ChannelHealthRow) => {
  if (row.healthLabel === 'Needs review') {
    return 'Needs review means at least 10 open admin/server-scoped issues, or the oldest open admin/server-scoped issue is at least 14 days old.';
  }
  if (row.healthLabel === 'High moderation load') {
    return 'High moderation load means at least 3 new admin/server-scoped issues and at least 20 new admin/server-scoped issues per 100 contributions in this date range.';
  }
  if (row.healthLabel === 'Healthy activity') {
    return 'Healthy activity means at least 20 contributions and fewer than 5 new admin/server-scoped issues per 100 contributions in this date range.';
  }
  if (row.healthLabel === 'Quiet') {
    return 'Quiet means this channel had no discussions, comments, or events in this date range.';
  }
  return 'Active means the channel had activity without crossing the review or high-load thresholds.';
};

const severityClasses = (severity: string) => {
  if (severity === 'CRITICAL') {
    return 'border-red-200 bg-red-100 !text-red-900 dark:border-red-900/60 dark:bg-red-900/30 dark:!text-red-100';
  }
  if (severity === 'WARNING') {
    return 'border-yellow-200 bg-yellow-100 !text-yellow-900 dark:border-yellow-900/60 dark:bg-yellow-900/30 dark:!text-yellow-100';
  }
  return 'border-blue-200 bg-blue-100 !text-blue-900 dark:border-blue-900/60 dark:bg-blue-900/30 dark:!text-blue-100';
};

const healthLabelClasses = (label: string) => {
  if (label === 'Needs review' || label === 'High moderation load') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100';
  }
  if (label === 'Healthy activity') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100';
  }
  if (label === 'Quiet') {
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100';
};
</script>

<template>
  <div class="space-y-5 px-2 py-4 dark:text-white md:px-4">
    <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Server Dashboard
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Community activity, issue pressure, and moderation workload.
        </p>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <label class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
          Start
          <input
            v-model="startDate"
            type="date"
            class="rounded-md border-gray-300 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          >
        </label>
        <label class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
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
        <div class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div class="h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div class="h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      </template>

      <div
        v-if="error"
        class="rounded-md border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-100"
      >
        {{ error.message }}
      </div>

      <div v-if="loading && !dashboard" class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold !text-gray-900 dark:!text-gray-100">
                Activity
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Discussions, comments, and events by day.
              </p>
            </div>
            <CalendarDays class="h-5 w-5 text-gray-400" />
          </div>

          <div class="flex h-64 items-end gap-2 overflow-x-auto overflow-y-visible pb-12">
            <div
              v-for="point in timeSeries"
              :key="point.date"
              class="relative flex min-w-6 flex-1 flex-col items-center justify-end gap-1"
              :title="`${formatDateLabel(point.date)}: ${point.discussions + point.comments + point.events}`"
            >
              <div class="flex h-44 w-full max-w-7 flex-col justify-end overflow-hidden rounded-t bg-gray-100 dark:bg-gray-800">
                <div
                  class="bg-blue-500"
                  :style="{ height: `${percent(point.discussions, maxActivity)}%` }"
                />
                <div
                  class="bg-orange-500"
                  :style="{ height: `${percent(point.comments, maxActivity)}%` }"
                />
                <div
                  class="bg-green-500"
                  :style="{ height: `${percent(point.events, maxActivity)}%` }"
                />
              </div>
              <span class="absolute -bottom-9 left-1/2 hidden w-14 origin-top-left -translate-x-1 -rotate-45 whitespace-nowrap text-left text-[10px] leading-none text-gray-500 sm:block">
                {{ formatDateLabel(point.date) }}
              </span>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
            <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-blue-500" />Discussions</span>
            <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-orange-500" />Comments</span>
            <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-green-500" />Events</span>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold !text-gray-900 dark:!text-gray-100">
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
              <div class="h-3 overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                <div
                  class="h-full rounded-sm bg-yellow-500"
                  :style="{ width: `${barPercent(bucket.count, maxIssueAgeBucket)}%` }"
                />
              </div>
              <span class="text-right text-gray-600 dark:text-gray-300">
                {{ bucket.count }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
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
                  <th class="px-4 py-3 font-medium">Channel</th>
                  <th class="px-4 py-3 font-medium">Activity</th>
                  <th class="px-4 py-3 font-medium">Contributors</th>
                  <th class="px-4 py-3 font-medium">
                    <span class="group relative inline-flex">
                      <button
                        type="button"
                        class="cursor-help uppercase underline decoration-dotted underline-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                      Issues
                      </button>
                      <span class="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-md border border-gray-200 bg-white p-2 text-left text-xs normal-case leading-snug text-gray-700 shadow-lg group-focus-within:block group-hover:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                        Open and new issues here only include admin/server-scoped issues: server-rule reports or issues opened without a channel scope.
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-3 font-medium">
                    <span class="group relative inline-flex">
                      <button
                        type="button"
                        class="cursor-help uppercase underline decoration-dotted underline-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                      Pressure
                      </button>
                      <span class="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-64 rounded-md border border-gray-200 bg-white p-2 text-left text-xs normal-case leading-snug text-gray-700 shadow-lg group-focus-within:block group-hover:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                        New admin/server-scoped issues per 100 discussions, comments, and events in the selected date range.
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="row in channelRows" :key="row.channelUniqueName">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="row.channelIconURL"
                        :src="row.channelIconURL"
                        alt=""
                        class="h-8 w-8 rounded-md object-cover"
                      >
                      <div v-else class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {{ row.channelUniqueName.slice(0, 2).toUpperCase() }}
                      </div>
                      <div>
                        <nuxt-link
                          :to="`/forums/${row.channelUniqueName}`"
                          class="font-medium text-gray-900 hover:underline dark:text-gray-100"
                        >
                          {{ row.displayName || row.channelUniqueName }}
                        </nuxt-link>
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
                          :style="{ width: `${percent(row.activityScore, maxChannelActivity)}%` }"
                        />
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
                    {{ row.uniqueContributorCount }}
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <div>{{ row.openIssueCount }} open</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ row.issueOpenedCount }} new this period
                    </div>
                  </td>
                  <td
                    class="px-4 py-3 text-gray-700 dark:text-gray-200"
                    :title="issuePressureDescription(row)"
                  >
                    {{ issuePressureLabel(row) }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                      :class="healthLabelClasses(row.healthLabel)"
                      :title="healthLabelDescription(row)"
                    >
                      {{ row.healthLabel }}
                    </span>
                  </td>
                </tr>
                <tr v-if="channelRows.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No channel activity in this range.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold !text-gray-900 dark:!text-gray-100">
                  Attention
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  Channels with stale or concentrated moderation load.
                </p>
              </div>
              <AlertTriangle class="h-5 w-5 text-yellow-500" />
            </div>

            <div v-if="attentionItems.length" class="space-y-3">
              <div
                v-for="item in attentionItems"
                :key="`${item.title}-${item.channelUniqueName}-${item.metric}`"
                class="rounded-md border px-3 py-3"
                :class="severityClasses(item.severity)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold !text-current">{{ item.title }}</h3>
                    <p class="mt-1 text-sm !text-current opacity-90">{{ item.description }}</p>
                  </div>
                  <ShieldAlert class="h-4 w-4 shrink-0" />
                </div>
              </div>
            </div>
            <div
              v-else
              class="flex items-center gap-2 rounded-md border border-green-200 bg-green-100 px-3 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-900/30 dark:text-green-100"
            >
              <CheckCircle2 class="h-4 w-4" />
              No attention items in this range.
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
              <Download class="mb-3 h-5 w-5 text-gray-400" />
              <p class="text-2xl font-semibold !text-gray-900 dark:!text-gray-100">
                {{ summary?.downloadCount || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">Downloads</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
              <Lock class="mb-3 h-5 w-5 text-gray-400" />
              <p class="text-2xl font-semibold !text-gray-900 dark:!text-gray-100">
                {{ summary?.suspensionCount || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">Suspensions</p>
            </div>
          </div>
        </div>
      </section>
      </template>
    </ClientOnly>
  </div>
</template>
