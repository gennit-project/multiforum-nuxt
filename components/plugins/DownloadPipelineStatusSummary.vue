<script setup lang="ts">
import { computed, toRef } from 'vue';
import {
  getApplicablePipelineStatus,
  useSharedDownloadPipelineOverview,
  type PublicPipelineDisplayStatus,
} from '@/composables/useDownloadPipelineOverview';

const props = defineProps<{
  fileId: string;
  discussionId: string;
  channelName: string;
}>();

const {
  applicablePipelines,
  attempts,
  hasPipelineContent,
  hasActiveAttempt,
  loading,
} = useSharedDownloadPipelineOverview(
  toRef(props, 'fileId'),
  toRef(props, 'discussionId'),
  toRef(props, 'channelName'),
  { pollWhileActive: false }
);

const displayStatus = computed<PublicPipelineDisplayStatus>(() => {
  if (hasActiveAttempt.value) return 'RUNNING';
  const latest = attempts.value[0];
  if (latest) {
    if (latest.status === 'SUCCEEDED') {
      return latest.jobs?.length > 0 &&
        latest.jobs.every((job) => job.status === 'SKIPPED')
        ? 'SKIPPED'
        : 'PASSED';
    }
    return latest.status;
  }
  const applicable = applicablePipelines.value[0];
  return applicable
    ? getApplicablePipelineStatus({
        pipeline: applicable,
        attempts: attempts.value,
      })
    : 'NOT_EXECUTED';
});

const labels: Record<PublicPipelineDisplayStatus, string> = {
  NOT_REQUIRED: 'Checks not required',
  NOT_EXECUTED: 'Checks not executed',
  QUEUED: 'Checks queued',
  RUNNING: 'Checks running',
  PASSED: 'Checks passed',
  FAILED: 'Checks failed',
  SKIPPED: 'Checks skipped',
  TIMED_OUT: 'Checks timed out',
  CANCELLED: 'Checks cancelled',
  MANUALLY_APPROVED: 'Checks manually approved',
};
</script>

<template>
  <div
    v-if="hasPipelineContent || loading"
    class="mt-3 flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700"
    data-testid="pipeline-status-summary"
  >
    <span class="text-gray-700 dark:text-gray-200">
      <i
        class="fa-solid mr-1"
        :class="hasActiveAttempt ? 'fa-spinner fa-spin' : 'fa-shield-halved'"
        aria-hidden="true"
      />
      {{ loading && !hasPipelineContent ? 'Loading checks…' : labels[displayStatus] }}
    </span>
    <NuxtLink
      v-if="hasPipelineContent"
      :to="{
        name: 'forums-forumId-downloads-discussionId-pipelines',
        params: {
          forumId: channelName,
          discussionId,
        },
      }"
      class="font-medium text-orange-700 underline dark:text-orange-300"
    >
      View checks
    </NuxtLink>
  </div>
</template>
