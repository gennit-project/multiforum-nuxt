<script setup lang="ts">
import { computed, ref } from 'vue';
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

const startDate = ref(toDateInputValue(defaultStart));
const endDate = ref(toDateInputValue(today));
const channelLimit = ref(20);

const dashboardVariables = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
  limit: channelLimit.value,
}));

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
      label: 'Open Issues',
      value: data.openIssueCount,
      detail: `${data.issueOpenedCount} opened`,
      icon: Flag,
      tone: data.openIssueCount > 0 ? 'amber' : 'green',
    },
    {
      label: 'Issue Age',
      value:
        data.medianOpenIssueAgeDays == null
          ? '0d'
          : `${Math.round(data.medianOpenIssueAgeDays)}d`,
      detail: 'median open age',
      icon: Clock3,
      tone:
        (data.medianOpenIssueAgeDays || 0) >= 7
          ? 'amber'
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
      tone: data.archivedContentCount > 0 ? 'amber' : 'slate',
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

const issuePressureLabel = (row: ChannelHealthRow) => {
  if (row.issuesPerHundredContributions === 0) return '0';
  return row.issuesPerHundredContributions.toFixed(1);
};

const severityClasses = (severity: string) => {
  if (severity === 'CRITICAL') {
    return 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100';
  }
  if (severity === 'WARNING') {
    return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100';
  }
  return 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100';
};

const healthLabelClasses = (label: string) => {
  if (label === 'Needs review' || label === 'High moderation load') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100';
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
        <h1 class="text-2xl font-semibold text-gray-950 dark:text-gray-50">
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
            class="rounded-md border-gray-300 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
        </label>
        <label class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
          End
          <input
            v-model="endDate"
            type="date"
            class="rounded-md border-gray-300 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
        </label>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
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
        class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
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
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ card.label }}
              </p>
              <p class="mt-2 text-2xl font-semibold text-gray-950 dark:text-gray-50">
                {{ formatNumber(card.value) }}
              </p>
            </div>
            <component
              :is="card.icon"
              class="h-5 w-5"
              :class="{
                'text-blue-600 dark:text-blue-300': card.tone === 'blue',
                'text-amber-600 dark:text-amber-300': card.tone === 'amber',
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
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold text-gray-950 dark:text-gray-50">
                Activity
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Discussions, comments, and events by day.
              </p>
            </div>
            <CalendarDays class="h-5 w-5 text-gray-400" />
          </div>

          <div class="flex h-56 items-end gap-1 overflow-x-auto pb-2">
            <div
              v-for="point in timeSeries"
              :key="point.date"
              class="flex min-w-5 flex-1 flex-col items-center justify-end gap-1"
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
              <span class="hidden text-[10px] text-gray-500 sm:block">
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

        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold text-gray-950 dark:text-gray-50">
                Issue Aging
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Open issues by age bucket.
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
              <div class="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  class="h-full rounded-full bg-amber-500"
                  :style="{ width: `${percent(bucket.count, maxIssueAgeBucket)}%` }"
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
        <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <h2 class="text-base font-semibold text-gray-950 dark:text-gray-50">
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
              <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th class="px-4 py-3 font-medium">Channel</th>
                  <th class="px-4 py-3 font-medium">Activity</th>
                  <th class="px-4 py-3 font-medium">Contributors</th>
                  <th class="px-4 py-3 font-medium">Issues</th>
                  <th class="px-4 py-3 font-medium">Pressure</th>
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
                          class="font-medium text-gray-950 hover:underline dark:text-gray-50"
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
                      {{ row.issueOpenedCount }} opened
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
                    {{ issuePressureLabel(row) }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                      :class="healthLabelClasses(row.healthLabel)"
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
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-gray-950 dark:text-gray-50">
                  Attention
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  Channels with stale or concentrated moderation load.
                </p>
              </div>
              <AlertTriangle class="h-5 w-5 text-amber-500" />
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
                    <h3 class="text-sm font-semibold">{{ item.title }}</h3>
                    <p class="mt-1 text-sm opacity-90">{{ item.description }}</p>
                  </div>
                  <ShieldAlert class="h-4 w-4 shrink-0" />
                </div>
              </div>
            </div>
            <div
              v-else
              class="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-100"
            >
              <CheckCircle2 class="h-4 w-4" />
              No attention items in this range.
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Download class="mb-3 h-5 w-5 text-gray-400" />
              <p class="text-2xl font-semibold text-gray-950 dark:text-gray-50">
                {{ summary?.downloadCount || 0 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">Downloads</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Lock class="mb-3 h-5 w-5 text-gray-400" />
              <p class="text-2xl font-semibold text-gray-950 dark:text-gray-50">
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
