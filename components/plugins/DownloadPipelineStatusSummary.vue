<script setup lang="ts">
import { computed, onMounted, ref, toRef } from 'vue';
import { getDownloadTabRoute } from '@/utils/discussionLinks';
import {
  getApplicablePipelineStatus,
  attemptDisplayStatus,
  useSharedDownloadPipelineOverview,
  type PublicPipelineDisplayStatus,
} from '@/composables/useDownloadPipelineOverview';

const props = defineProps<{
  fileId: string;
  discussionId: string;
  /** Per-forum number and title of the download, for the checks link. */
  discussionNumber?: number | null;
  discussionTitle?: string | null;
  channelName: string;
}>();

const hasMounted = ref(false);

onMounted(() => {
  hasMounted.value = true;
});

const {
  applicablePipelines,
  attempts,
  hasPipelineContent,
  hasActiveAttempt,
  loading,
  ready,
} = useSharedDownloadPipelineOverview(
  toRef(props, 'fileId'),
  toRef(props, 'discussionId'),
  toRef(props, 'channelName'),
  { pollWhileActive: false }
);

const checksRoute = computed(() =>
  getDownloadTabRoute({
    target: {
      forumId: props.channelName,
      discussionNumber: props.discussionNumber,
      title: props.discussionTitle,
      discussionId: props.discussionId,
    },
    tab: 'pipelines',
  })
);

const displayStatus = computed<PublicPipelineDisplayStatus>(() => {
  if (hasActiveAttempt.value) return 'RUNNING';
  const latest = attempts.value[0];
  if (latest) return attemptDisplayStatus(latest);

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
    v-if="!hasMounted || hasPipelineContent || loading"
    aria-live="polite"
    class="mt-3 flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700"
    data-testid="pipeline-status-summary"
  >
    <span class="text-gray-700 dark:text-gray-200">
      <i
        class="fa-solid mr-1"
        :class="hasActiveAttempt ? 'fa-spinner fa-spin' : 'fa-shield-halved'"
        aria-hidden="true"
      />
      {{
        !hasMounted || (loading && !ready)
          ? 'Loading checks…'
          : labels[displayStatus]
      }}
    </span>
    <NuxtLink
      v-if="hasPipelineContent"
      :to="checksRoute"
      class="text-brand-700 dark:text-brand-300 font-medium underline"
    >
      View checks
    </NuxtLink>
  </div>
</template>
