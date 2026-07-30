import {
  computed,
  getCurrentInstance,
  onUnmounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_DOWNLOAD_PIPELINE_OVERVIEW } from '@/graphQLData/admin/queries';
import type {
  PipelineRun,
  PipelineScope,
  PublicPipelineDiagnostic,
} from '@/composables/usePluginPipeline';

export type PublicPipelineAttemptStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'CANCELLED';

export type PublicPipelineDisplayStatus =
  | 'NOT_REQUIRED'
  | 'NOT_EXECUTED'
  | 'QUEUED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'SKIPPED'
  | 'TIMED_OUT'
  | 'CANCELLED'
  | 'MANUALLY_APPROVED';

export interface PublicExpectedPipelineJob {
  pluginId: string;
  pluginName: string;
  version: string;
  order: number;
  condition: 'ALWAYS' | 'PREVIOUS_SUCCEEDED' | 'PREVIOUS_FAILED';
  continueOnError: boolean;
}

export interface ApplicablePublicPipeline {
  targetId: string;
  targetType: string;
  eventType: string;
  scope: PipelineScope;
  channelId?: string | null;
  configured: boolean;
  applicability:
    | 'NEW_FILES_ONLY'
    | 'ALL_FILES_GRADUAL'
    | 'ALL_FILES_IMMEDIATE';
  effectiveAt?: string | null;
  required: boolean;
  reason:
    | 'APPLICABLE'
    | 'UPLOADED_BEFORE_POLICY'
    | 'NO_APPLICABLE_PLUGINS';
  expectedJobs: PublicExpectedPipelineJob[];
}

export interface PublicPipelineJob
  extends Omit<PipelineRun, 'pipelineId' | 'diagnostics'> {
  diagnostics: PublicPipelineDiagnostic[];
}

export interface PublicPipelineAttempt {
  id: string;
  pipelineId: string;
  targetId: string;
  targetType: string;
  eventType: string;
  scope: PipelineScope;
  channelId?: string | null;
  status: PublicPipelineAttemptStatus;
  trigger:
    | 'EVENT'
    | 'OWNER_START'
    | 'MODERATOR_START'
    | 'OWNER_RETRY'
    | 'MODERATOR_RETRY'
    | 'AUTOMATIC_RETRY';
  initiatedByUsername?: string | null;
  retryOfPipelineRunId?: string | null;
  attemptNumber: number;
  applicability?: string | null;
  policyEffectiveAt?: string | null;
  queuedAt: string;
  startedAt?: string | null;
  heartbeatAt?: string | null;
  timeoutAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  jobs: PublicPipelineJob[];
}

const attemptTimestamp = (attempt: PublicPipelineAttempt) =>
  new Date(attempt.createdAt).getTime();

const attemptDisplayStatus = (
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

export const getApplicablePipelineStatus = ({
  pipeline,
  attempts,
}: {
  pipeline: ApplicablePublicPipeline;
  attempts: PublicPipelineAttempt[];
}): PublicPipelineDisplayStatus => {
  if (!pipeline.required) return 'NOT_REQUIRED';
  const latestAttempt = attempts
    .filter(
      (attempt) =>
        attempt.scope === pipeline.scope &&
        attempt.eventType === pipeline.eventType &&
        (pipeline.scope !== 'CHANNEL' ||
          attempt.channelId === pipeline.channelId)
    )
    .sort((left, right) => attemptTimestamp(right) - attemptTimestamp(left))[0];

  return latestAttempt ? attemptDisplayStatus(latestAttempt) : 'NOT_EXECUTED';
};

export function useDownloadPipelineOverview(
  downloadableFileId: Ref<string | null | undefined>,
  discussionId: Ref<string | null | undefined>,
  channelUniqueName: Ref<string | null | undefined>,
  {
    pollInterval = 3000,
    pollWhileActive = true,
  }: {
    pollInterval?: number;
    pollWhileActive?: boolean;
  } = {}
) {
  const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null);
  const isPolling = ref(false);
  const enabled = computed(
    () =>
      !!downloadableFileId.value &&
      !!discussionId.value &&
      !!channelUniqueName.value
  );

  const { result, loading, error, refetch } = useQuery(
    GET_DOWNLOAD_PIPELINE_OVERVIEW,
    () => ({
      downloadableFileId: downloadableFileId.value,
      discussionId: discussionId.value,
      channelUniqueName: channelUniqueName.value,
    }),
    () => ({
      enabled: enabled.value,
      fetchPolicy: 'cache-and-network',
    })
  );

  const applicablePipelines = computed<ApplicablePublicPipeline[]>(() =>
    [result.value?.serverApplicable, result.value?.channelApplicable].filter(
      (pipeline): pipeline is ApplicablePublicPipeline =>
        Boolean(
          pipeline &&
            (pipeline.configured || pipeline.expectedJobs?.length > 0)
        )
    )
  );

  const attempts = computed<PublicPipelineAttempt[]>(() =>
    [
      ...(result.value?.serverSummary?.attempts || []),
      ...(result.value?.channelSummary?.attempts || []),
    ].sort(
      (left: PublicPipelineAttempt, right: PublicPipelineAttempt) =>
        attemptTimestamp(right) - attemptTimestamp(left)
    )
  );

  const hasPipelineContent = computed(
    () => applicablePipelines.value.length > 0 || attempts.value.length > 0
  );
  const hasActiveAttempt = computed(() =>
    attempts.value.some(
      (attempt) =>
        attempt.status === 'QUEUED' || attempt.status === 'RUNNING'
    )
  );

  const stopPolling = () => {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value);
      pollingTimer.value = null;
    }
    isPolling.value = false;
  };
  const startPolling = () => {
    if (pollingTimer.value || typeof window === 'undefined') return;
    isPolling.value = true;
    pollingTimer.value = setInterval(async () => {
      if (!hasActiveAttempt.value) {
        stopPolling();
        return;
      }
      await refetch();
    }, pollInterval);
  };

  watch(
    hasActiveAttempt,
    (active) => {
      if (active && pollWhileActive) startPolling();
      else stopPolling();
    },
    { immediate: true }
  );
  if (getCurrentInstance()) {
    onUnmounted(stopPolling);
  }

  return {
    applicablePipelines,
    attempts,
    hasPipelineContent,
    hasActiveAttempt,
    isPolling,
    loading,
    error,
    refetch,
  };
}
