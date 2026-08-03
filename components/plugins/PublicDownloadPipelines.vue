<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import {
  getApplicablePipelineStatus,
  useSharedDownloadPipelineOverview,
  type ApplicablePublicPipeline,
  type PublicPipelineAttempt,
  type PublicPipelineDisplayStatus,
} from '@/composables/useDownloadPipelineOverview';
import { useModProfileName, useUsername } from '@/composables/useAuthState';
import { useChannelPermissions } from '@/composables/useCommentPermissions';
import {
  RERUN_PLUGIN_PIPELINE,
  START_PLUGIN_PIPELINE,
} from '@/graphQLData/admin/mutations';

const props = defineProps<{
  fileId: string;
  discussionId: string;
  channelName: string;
  ownerUsername?: string;
  uploaderUsername?: string;
}>();

const {
  applicablePipelines,
  attempts,
  hasPipelineContent,
  hasActiveAttempt,
  isPolling,
  loading,
  error,
  refetch,
} = useSharedDownloadPipelineOverview(
  toRef(props, 'fileId'),
  toRef(props, 'discussionId'),
  toRef(props, 'channelName')
);

const username = useUsername();
const modProfileName = useModProfileName();
const { userPermissions } = useChannelPermissions(toRef(props, 'channelName'));
const canStartPipelines = computed(
  () =>
    (Boolean(username.value) &&
      [props.ownerUsername, props.uploaderUsername].includes(username.value)) ||
    (Boolean(modProfileName.value) &&
      userPermissions.value.canEditDiscussions)
);
const {
  mutate: startPluginPipeline,
  loading: startingPipeline,
  error: startPipelineError,
  onDone: onPipelineStarted,
} = useMutation(START_PLUGIN_PIPELINE);
onPipelineStarted(() => {
  refetch();
});
const {
  mutate: rerunPluginPipeline,
  loading: rerunningPipeline,
  error: rerunPipelineError,
  onDone: onPipelineRerun,
} = useMutation(RERUN_PLUGIN_PIPELINE);
onPipelineRerun(() => {
  refetch();
});

const canStartPipeline = (pipeline: ApplicablePublicPipeline) =>
  canStartPipelines.value &&
  ['DownloadableFile', 'Discussion'].includes(pipeline.targetType) &&
  pipeline.required &&
  applicabilityStatus(pipeline) === 'NOT_EXECUTED';

const startPipeline = (pipeline: ApplicablePublicPipeline) => {
  if (!canStartPipeline(pipeline) || startingPipeline.value) return;
  startPluginPipeline({
    targetId: pipeline.targetId,
    targetType: pipeline.targetType,
    eventType: pipeline.eventType,
    channelId: pipeline.channelId || null,
  });
};

const retryableStatuses = new Set([
  'FAILED',
  'TIMED_OUT',
  'CANCELLED',
]);
const isLatestPipelineAttempt = (attempt: PublicPipelineAttempt) =>
  attempts.value.find(
    candidate =>
      candidate.scope === attempt.scope &&
      candidate.eventType === attempt.eventType &&
      (candidate.channelId || null) === (attempt.channelId || null)
  )?.pipelineId === attempt.pipelineId;
const canRerunAttempt = (attempt: PublicPipelineAttempt) =>
  canStartPipelines.value &&
  retryableStatuses.has(attempt.status) &&
  isLatestPipelineAttempt(attempt) &&
  !hasActiveAttempt.value;
const rerunAttempt = (attempt: PublicPipelineAttempt) => {
  if (!canRerunAttempt(attempt) || rerunningPipeline.value) return;
  rerunPluginPipeline({ pipelineRunId: attempt.pipelineId });
};

const statusInfo: Record<
  PublicPipelineDisplayStatus,
  { label: string; icon: string; classes: string }
> = {
  NOT_REQUIRED: {
    label: 'Not required',
    icon: 'fa-solid fa-minus-circle',
    classes: 'text-gray-600 dark:text-gray-300',
  },
  NOT_EXECUTED: {
    label: 'Not executed',
    icon: 'fa-regular fa-circle',
    classes: 'text-amber-700 dark:text-amber-300',
  },
  QUEUED: {
    label: 'Queued',
    icon: 'fa-regular fa-clock',
    classes: 'text-blue-600 dark:text-blue-300',
  },
  RUNNING: {
    label: 'Running',
    icon: 'fa-solid fa-spinner fa-spin',
    classes: 'text-blue-600 dark:text-blue-300',
  },
  PASSED: {
    label: 'Passed',
    icon: 'fa-solid fa-circle-check',
    classes: 'text-green-700 dark:text-green-300',
  },
  FAILED: {
    label: 'Failed',
    icon: 'fa-solid fa-circle-xmark',
    classes: 'text-red-700 dark:text-red-300',
  },
  SKIPPED: {
    label: 'Skipped',
    icon: 'fa-solid fa-forward',
    classes: 'text-gray-600 dark:text-gray-300',
  },
  TIMED_OUT: {
    label: 'Timed out',
    icon: 'fa-solid fa-hourglass-end',
    classes: 'text-red-700 dark:text-red-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: 'fa-solid fa-ban',
    classes: 'text-gray-600 dark:text-gray-300',
  },
  MANUALLY_APPROVED: {
    label: 'Manually approved',
    icon: 'fa-solid fa-user-shield',
    classes: 'text-green-700 dark:text-green-300',
  },
};

const attemptStatus = (
  attempt: PublicPipelineAttempt
): PublicPipelineDisplayStatus => {
  if (attempt.status === 'SUCCEEDED') {
    return attempt.jobs.length > 0 &&
      attempt.jobs.every((job) => job.status === 'SKIPPED')
      ? 'SKIPPED'
      : 'PASSED';
  }
  return attempt.status;
};

const applicabilityStatus = (pipeline: ApplicablePublicPipeline) =>
  getApplicablePipelineStatus({
    pipeline,
    attempts: attempts.value,
  });

const policyExplanation = (pipeline: ApplicablePublicPipeline) => {
  if (pipeline.reason === 'UPLOADED_BEFORE_POLICY') {
    return 'This file was uploaded before this check became required.';
  }
  if (pipeline.reason === 'NO_APPLICABLE_PLUGINS') {
    return 'No currently enabled plugin applies to this check.';
  }
  if (applicabilityStatus(pipeline) === 'NOT_EXECUTED') {
    return canStartPipelines.value
      ? 'This required check has not been run.'
      : 'The uploader or an authorized channel moderator must run this check.';
  }
  return pipeline.required
    ? 'This check is required for this download.'
    : 'This check is not required for this download.';
};

const formatTimestamp = (value?: string | null) => {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatDuration = (durationMs?: number) => {
  if (durationMs == null) return '';
  return durationMs < 1000
    ? `${durationMs}ms`
    : `${(durationMs / 1000).toFixed(1)}s`;
};

const formatDetails = (details: unknown) => {
  if (details == null) return '';
  return typeof details === 'string'
    ? details
    : JSON.stringify(details, null, 2);
};

type AttemptFilter = 'ALL' | 'ACTIVE' | 'PASSED' | 'FAILED';
const attemptFilter = ref<AttemptFilter>('ALL');
const shareFeedback = ref('');
const filteredAttempts = computed(() =>
  attempts.value.filter((attempt) => {
    if (attemptFilter.value === 'ACTIVE') {
      return ['QUEUED', 'RUNNING'].includes(attempt.status);
    }
    if (attemptFilter.value === 'PASSED') {
      return attempt.status === 'SUCCEEDED';
    }
    if (attemptFilter.value === 'FAILED') {
      return ['FAILED', 'TIMED_OUT', 'CANCELLED'].includes(attempt.status);
    }
    return true;
  })
);

const attemptPermalink = (pipelineId: string) =>
  `/forums/${encodeURIComponent(props.channelName)}/downloads/${encodeURIComponent(
    props.discussionId
  )}/pipelines?attempt=${encodeURIComponent(
    pipelineId
  )}#attempt-${encodeURIComponent(pipelineId)}`;

const absoluteAttemptUrl = (attempt: PublicPipelineAttempt) => {
  const path = attemptPermalink(attempt.pipelineId);
  return typeof window === 'undefined'
    ? path
    : new URL(path, window.location.origin).toString();
};

const diagnosticsText = (attempt: PublicPipelineAttempt) => {
  const lines = [
    `Pipeline attempt ${attempt.attemptNumber}`,
    `Status: ${attemptStatus(attempt)}`,
    `URL: ${absoluteAttemptUrl(attempt)}`,
  ];
  for (const job of attempt.jobs) {
    lines.push(`${job.pluginName} (${job.status})`);
    for (const diagnostic of job.diagnostics) {
      lines.push(`[${diagnostic.code}] ${diagnostic.message}`);
      const details = formatDetails(diagnostic.details);
      if (details) lines.push(details);
    }
  }
  return lines.join('\n');
};

const copyDiagnostics = async (attempt: PublicPipelineAttempt) => {
  await navigator.clipboard.writeText(diagnosticsText(attempt));
  shareFeedback.value = `Copied diagnostics for attempt ${attempt.attemptNumber}.`;
};

const shareAttempt = async (attempt: PublicPipelineAttempt) => {
  const url = absoluteAttemptUrl(attempt);
  if (navigator.share) {
    await navigator.share({
      title: `Pipeline attempt ${attempt.attemptNumber}`,
      text: `Public pipeline diagnostics: ${attemptStatus(attempt)}`,
      url,
    });
  } else {
    await navigator.clipboard.writeText(url);
  }
  shareFeedback.value = `Shared link for attempt ${attempt.attemptNumber}.`;
};

const supportDiscussionUrl = (
  attempt: PublicPipelineAttempt,
  code: string
) =>
  `/forums/${encodeURIComponent(
    props.channelName
  )}/discussions/create?pipelineAttempt=${encodeURIComponent(
    attempt.pipelineId
  )}&diagnosticCode=${encodeURIComponent(code)}`;

watch(
  attempts,
  async () => {
    if (typeof window === 'undefined' || !window.location.hash) return;
    await nextTick();
    document
      .getElementById(decodeURIComponent(window.location.hash.slice(1)))
      ?.scrollIntoView();
  },
  { immediate: true }
);
</script>

<template>
  <section aria-labelledby="pipeline-checks-heading" class="px-2 py-4">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2
          id="pipeline-checks-heading"
          class="text-xl font-semibold text-gray-900 dark:text-white"
        >
          Pipeline checks
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Public checks and diagnostics associated with this download.
        </p>
      </div>
      <span
        v-if="hasActiveAttempt && isPolling"
        class="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300"
      >
        <i class="fa-solid fa-arrows-rotate fa-spin" aria-hidden="true" />
        Updating
      </span>
    </div>

    <div
      v-if="loading && !hasPipelineContent"
      aria-busy="true"
      class="rounded-lg border border-gray-200 p-6 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300"
    >
      <i class="fa-solid fa-spinner fa-spin mr-2" aria-hidden="true" />
      Loading checks…
    </div>
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
      role="alert"
    >
      Pipeline information could not be loaded.
    </div>
    <div
      v-else-if="!hasPipelineContent"
      class="rounded-lg border border-gray-200 p-6 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300"
    >
      No checks are configured and no pipeline attempts have run.
    </div>

    <template v-else>
      <div
        v-if="startPipelineError || rerunPipelineError"
        class="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        role="alert"
      >
        The checks could not be started. Please try again later.
      </div>
      <section
        v-if="applicablePipelines.length"
        aria-labelledby="required-checks-heading"
        class="mb-8"
      >
        <h3
          id="required-checks-heading"
          class="mb-3 text-base font-semibold text-gray-900 dark:text-white"
        >
          Applicable checks
        </h3>
        <div class="grid gap-3">
          <article
            v-for="pipeline in applicablePipelines"
            :key="`${pipeline.scope}-${pipeline.channelId || 'server'}-${pipeline.eventType}`"
            class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ pipeline.scope === 'SERVER' ? 'Server check' : `Channel check · ${pipeline.channelId}` }}
                </h4>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {{ policyExplanation(pipeline) }}
                </p>
              </div>
              <span
                class="inline-flex items-center gap-2 text-sm font-medium"
                :class="statusInfo[applicabilityStatus(pipeline)].classes"
              >
                <i
                  :class="statusInfo[applicabilityStatus(pipeline)].icon"
                  aria-hidden="true"
                />
                {{ statusInfo[applicabilityStatus(pipeline)].label }}
              </span>
            </div>
            <ol
              v-if="pipeline.expectedJobs.length"
              class="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm dark:border-gray-700"
            >
              <li
                v-for="job in pipeline.expectedJobs"
                :key="`${pipeline.scope}-${job.order}-${job.pluginId}`"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-gray-800 dark:text-gray-200">
                  {{ job.order + 1 }}. {{ job.pluginName }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  v{{ job.version }}
                </span>
              </li>
            </ol>
            <button
              v-if="canStartPipeline(pipeline)"
              type="button"
              class="mt-4 inline-flex items-center gap-2 rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-600 dark:hover:bg-orange-500"
              :disabled="startingPipeline"
              @click="startPipeline(pipeline)"
            >
              <i
                :class="startingPipeline ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-play'"
                aria-hidden="true"
              />
              {{ startingPipeline ? 'Starting…' : 'Run checks' }}
            </button>
          </article>
        </div>
      </section>

      <section aria-labelledby="attempt-history-heading">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3
            id="attempt-history-heading"
            class="text-base font-semibold text-gray-900 dark:text-white"
          >
            Attempt history
          </h3>
          <label v-if="attempts.length" class="text-sm text-gray-600 dark:text-gray-300">
            Show
            <select
              v-model="attemptFilter"
              data-testid="pipeline-attempt-filter"
              class="ml-2 rounded-md border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="ALL">All attempts</option>
              <option value="ACTIVE">Active</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed or timed out</option>
            </select>
          </label>
        </div>
        <p v-if="shareFeedback" role="status" class="mb-3 text-sm text-green-700 dark:text-green-300">
          {{ shareFeedback }}
        </p>
        <p
          v-if="attempts.length === 0"
          class="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
        >
          No attempts have run yet.
        </p>
        <div v-else-if="filteredAttempts.length" class="space-y-4">
          <article
            v-for="attempt in filteredAttempts"
            :id="`attempt-${attempt.pipelineId}`"
            :key="attempt.id"
            class="scroll-mt-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            <header
              class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-4 dark:border-gray-700"
            >
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ attempt.scope === 'SERVER' ? 'Server pipeline' : `Channel pipeline · ${attempt.channelId}` }}
                  <span class="text-gray-500 dark:text-gray-400">
                    · Attempt {{ attempt.attemptNumber }}
                  </span>
                </h4>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTimestamp(attempt.createdAt) }}
                  <span v-if="attempt.initiatedByUsername">
                    · started by {{ attempt.initiatedByUsername }}
                  </span>
                </p>
                <p
                  v-if="attempt.retryOfPipelineRunId"
                  class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  Retry of {{ attempt.retryOfPipelineRunId }}
                </p>
              </div>
              <div class="flex items-center gap-4">
                <span
                  class="inline-flex items-center gap-2 text-sm font-medium"
                  :class="statusInfo[attemptStatus(attempt)].classes"
                >
                  <i
                    :class="statusInfo[attemptStatus(attempt)].icon"
                    aria-hidden="true"
                  />
                  {{ statusInfo[attemptStatus(attempt)].label }}
                </span>
                <a
                  :href="attemptPermalink(attempt.pipelineId)"
                  class="text-sm text-orange-700 underline dark:text-orange-300"
                  :aria-label="`Permalink to attempt ${attempt.attemptNumber}`"
                >
                  Permalink
                </a>
                <button
                  type="button"
                  class="text-sm text-orange-700 underline dark:text-orange-300"
                  @click="copyDiagnostics(attempt)"
                >
                  Copy diagnostics
                </button>
                <button
                  type="button"
                  class="text-sm text-orange-700 underline dark:text-orange-300"
                  @click="shareAttempt(attempt)"
                >
                  Share this attempt
                </button>
                <div v-if="canRerunAttempt(attempt)" class="text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md bg-orange-700 px-3 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-600 dark:hover:bg-orange-500"
                    :disabled="rerunningPipeline"
                    @click="rerunAttempt(attempt)"
                  >
                    <i
                      :class="rerunningPipeline ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate-right'"
                      aria-hidden="true"
                    />
                    {{ rerunningPipeline ? 'Starting…' : 'Run checks again' }}
                  </button>
                  <p class="mt-1 max-w-48 text-xs text-gray-500 dark:text-gray-400">
                    Runs the full pipeline using its current configuration.
                  </p>
                </div>
              </div>
            </header>

            <ol class="divide-y divide-gray-100 dark:divide-gray-700">
              <li
                v-for="job in attempt.jobs"
                :key="job.id"
                class="p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h5 class="font-medium text-gray-900 dark:text-white">
                      {{ job.executionOrder + 1 }}. {{ job.pluginName }}
                    </h5>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      v{{ job.version }}
                      <span v-if="formatDuration(job.durationMs)">
                        · {{ formatDuration(job.durationMs) }}
                      </span>
                    </p>
                  </div>
                  <span class="text-sm text-gray-700 dark:text-gray-200">
                    {{ job.status === 'SUCCEEDED' ? 'Passed' : job.status.charAt(0) + job.status.slice(1).toLowerCase() }}
                  </span>
                </div>
                <p
                  v-if="job.message || job.skippedReason"
                  class="mt-3 text-sm text-gray-700 dark:text-gray-200"
                >
                  {{ job.message || job.skippedReason }}
                </p>
                <ul v-if="job.diagnostics.length" class="mt-3 space-y-3">
                  <li
                    v-for="diagnostic in job.diagnostics"
                    :key="`${job.id}-${diagnostic.code}`"
                    class="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {{ diagnostic.code }}
                      </span>
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{ diagnostic.message }}
                      </span>
                    </div>
                    <pre
                      v-if="formatDetails(diagnostic.details)"
                      class="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-gray-900 p-3 text-xs text-gray-100"
                    >{{ formatDetails(diagnostic.details) }}</pre>
                    <a
                      v-if="diagnostic.helpUrl"
                      :href="diagnostic.helpUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-2 inline-block text-orange-700 underline dark:text-orange-300"
                    >
                      Documentation
                    </a>
                    <NuxtLink
                      :to="supportDiscussionUrl(attempt, diagnostic.code)"
                      class="ml-3 mt-2 inline-block text-orange-700 underline dark:text-orange-300"
                    >
                      Ask the community
                    </NuxtLink>
                  </li>
                </ul>
              </li>
            </ol>
          </article>
        </div>
        <p
          v-else
          class="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
        >
          No attempts match this filter.
        </p>
      </section>
    </template>
  </section>
</template>
