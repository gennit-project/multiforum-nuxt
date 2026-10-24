<script setup lang="ts">
import { computed } from 'vue';

// These summary fields are served by the backend but are missing from the
// checked-in generated types, so they are declared here. Any of them can be
// absent (older backend, partial response); a missing value renders as
// "No data" instead of NaN/undefined.
type PipelineSummary = {
  failedDownloadScanCount?: number | null;
  queuedPluginJobCount?: number | null;
  runningPluginJobCount?: number | null;
  oldestQueuedPluginJobAgeSeconds?: number | null;
  pluginTimeoutCount24h?: number | null;
  pluginTimeoutRate24h?: number | null;
  repeatedPluginFailureCount24h?: number | null;
  pluginRetryAttemptCount1h?: number | null;
  pluginRetryStormCount1h?: number | null;
};

type Tone = 'bad' | 'warn' | 'good' | 'unknown';

const props = defineProps<{
  summary: PipelineSummary;
}>();

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const rows = computed(() => {
  const s = props.summary;
  const queuedAndRunning =
    isNumber(s.queuedPluginJobCount) && isNumber(s.runningPluginJobCount)
      ? s.queuedPluginJobCount + s.runningPluginJobCount
      : null;
  const timeoutDetail =
    isNumber(s.pluginTimeoutRate24h) && isNumber(s.repeatedPluginFailureCount24h)
      ? `${(s.pluginTimeoutRate24h * 100).toFixed(1)}% rate · ${formatNumber(
          s.repeatedPluginFailureCount24h
        )} repeated failures`
      : 'Rate and repeated failures';
  const queueDetail =
    queuedAndRunning != null &&
    isNumber(s.queuedPluginJobCount) &&
    isNumber(s.runningPluginJobCount)
      ? `${formatNumber(s.queuedPluginJobCount)} queued · ${formatNumber(
          s.runningPluginJobCount
        )} running`
      : 'Queued and running jobs';

  const row = (
    key: string,
    label: string,
    detail: string,
    value: number | null,
    badWhenPositive: boolean,
    warnWhenPositive = false
  ) => ({
    key,
    label,
    detail,
    value,
    tone: (value == null
      ? 'unknown'
      : value > 0 && badWhenPositive
        ? 'bad'
        : value > 0 && warnWhenPositive
          ? 'warn'
          : 'good') as Tone,
  });

  return [
    row(
      'scan-failures',
      'Scan failures',
      'Downloads blocked by scanner errors',
      isNumber(s.failedDownloadScanCount) ? s.failedDownloadScanCount : null,
      true
    ),
    row('job-queue', 'Job queue', queueDetail, queuedAndRunning, false, true),
    row(
      'timeouts',
      'Timeouts, 24h',
      timeoutDetail,
      isNumber(s.pluginTimeoutCount24h) ? s.pluginTimeoutCount24h : null,
      true
    ),
    row(
      'retry-storms',
      'Retry storms, 1h',
      isNumber(s.pluginRetryAttemptCount1h)
        ? `${formatNumber(s.pluginRetryAttemptCount1h)} retries in the last hour`
        : 'Retries in the last hour',
      isNumber(s.pluginRetryStormCount1h) ? s.pluginRetryStormCount1h : null,
      true
    ),
  ];
});

const anyUnknown = computed(() => rows.value.some((row) => row.tone === 'unknown'));

const dotClasses: Record<Tone, string> = {
  bad: 'bg-red-600 dark:bg-red-400',
  warn: 'bg-yellow-600 dark:bg-yellow-400',
  good: 'bg-green-600 dark:bg-green-400',
  unknown: 'bg-gray-400 dark:bg-gray-500',
};

const valueClasses: Record<Tone, string> = {
  bad: 'text-red-700 dark:text-red-300',
  warn: 'text-yellow-800 dark:text-yellow-300',
  good: 'text-gray-900 dark:text-gray-100',
  unknown: 'text-gray-600 dark:text-gray-400',
};
</script>

<template>
  <section
    aria-labelledby="pipeline-health-heading"
    data-testid="pipeline-health"
    class="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
  >
    <div class="px-5 py-4">
      <h2
        id="pipeline-health-heading"
        class="text-base font-semibold !text-gray-900 dark:!text-gray-100"
      >
        Plugin pipeline
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Scans, jobs and retries.
      </p>
    </div>

    <ul class="m-0 list-none p-0">
      <li
        v-for="row in rows"
        :key="row.key"
        :data-testid="`pipeline-row-${row.key}`"
        class="flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5 dark:border-gray-800"
      >
        <div class="min-w-0">
          <p class="m-0 font-medium">{{ row.label }}</p>
          <p class="m-0 text-sm text-gray-600 dark:text-gray-400">
            {{ row.detail }}
          </p>
        </div>
        <p
          class="m-0 inline-flex shrink-0 items-center gap-2 font-semibold"
          :class="valueClasses[row.tone]"
        >
          <span
            aria-hidden="true"
            class="h-2 w-2 rounded-full"
            :class="dotClasses[row.tone]"
          />
          {{ row.value == null ? 'No data' : formatNumber(row.value) }}
        </p>
      </li>
    </ul>

    <p
      v-if="anyUnknown"
      data-testid="pipeline-no-data-note"
      class="border-t border-gray-200 bg-gray-50 px-5 py-3.5 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
    >
      Pipeline metrics aren't reporting.
      <NuxtLink
        to="/admin/plugins"
        class="font-medium text-blue-700 underline dark:text-blue-300"
      >
        Check plugins
      </NuxtLink>
    </p>
  </section>
</template>
