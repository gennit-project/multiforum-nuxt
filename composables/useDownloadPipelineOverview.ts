import { computed, inject, provide, type InjectionKey, type Ref } from 'vue';
import { usePipelineHistory } from './usePipelineHistory';
import type { GetDownloadPipelineOverviewQuery } from '@/__generated__/operations';
import type { PublicPluginPipelineRunPage } from './usePipelineHistory';
import { useQuery } from '@vue/apollo-composable';
import { GetDownloadPipelineOverviewDocument as GET_DOWNLOAD_PIPELINE_OVERVIEW } from '@/__generated__/operations';
import type {
  PipelineRun,
  PublicPipelineDiagnostic,
} from '@/composables/usePluginPipeline';

export type PublicPipelineAttemptStatus =
  'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'CANCELLED';

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

export type ApplicablePublicPipeline = Omit<GetDownloadPipelineOverviewQuery['serverApplicable'], 'policyId'> & { policyId?: string | null };
export type PublicExpectedPipelineJob = ApplicablePublicPipeline['expectedJobs'][number];

export interface PublicPipelineJob extends Omit<
  PipelineRun,
  'pipelineId' | 'diagnostics'
> {
  diagnostics: PublicPipelineDiagnostic[];
}

export interface PublicPipelineAttempt {
  page?: PublicPluginPipelineRunPage;
  id: string;
  pipelineId: string;
  targetId: string;
  targetType: string;
  eventType: string;
  scope: PublicPluginPipelineRunPage['run']['scope'];
  channelId?: string | null;
  status: PublicPipelineAttemptStatus;
  trigger:
    | 'EVENT'
    | 'OWNER_START'
    | 'MODERATOR_START'
    | 'OWNER_RETRY'
    | 'MODERATOR_RETRY'
    | 'AUTOMATIC_RETRY'
    | 'CAMPAIGN';
  initiatedByUsername?: string | null;
  retryOfPipelineRunId?: string | null;
  attemptNumber: number;
  applicability?: string | null;
  policyEffectiveAt?: string | null;
  policyId?: string | null;
  campaignId?: string | null;
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

export const attemptDisplayStatus = (
  attempt: PublicPipelineAttempt
): PublicPipelineDisplayStatus => {
  if (attempt.page) {
    const status = attempt.page.displayStatus;
    return status === 'SUCCEEDED'
      ? 'PASSED'
      : status === 'PENDING'
        ? 'QUEUED'
        : status;
  }
  if (attempt.status === 'SUCCEEDED') {
    return attempt.jobs?.length > 0 &&
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

export const toPublicPipelineAttempt = (
  page: PublicPluginPipelineRunPage
): PublicPipelineAttempt => ({
  ...page.run,
  page,
  scope: page.run.scope,
  jobs: page.run.jobs.map((job) => ({
    ...job,
    scope: job.scope,
    channelId: job.channelId ?? undefined,
    message: job.message ?? undefined,
    durationMs: job.durationMs ?? undefined,
    skippedReason: job.skippedReason ?? undefined,
    diagnostics: job.diagnostics.map((item) => ({
      ...item,
      helpUrl: item.helpUrl ?? undefined,
    })),
  })),
});

export function useDownloadPipelineOverview(
  downloadableFileId: Ref<string | null | undefined>,
  discussionId: Ref<string | null | undefined>,
  channelUniqueName: Ref<string | null | undefined>,
  {
    pollInterval = 3000,
    pollWhileActive = true,
    eventType,
  }: {
    pollInterval?: number;
    pollWhileActive?: boolean;
    eventType?: Ref<string | undefined>;
  } = {}
) {
  const enabled = computed(
    () =>
      !!downloadableFileId.value &&
      !!discussionId.value &&
      !!channelUniqueName.value
  );

  const { result, loading, error, refetch } = useQuery(
    GET_DOWNLOAD_PIPELINE_OVERVIEW,
    () => ({
      downloadableFileId: downloadableFileId.value || '',
      discussionId: discussionId.value || '',
      channelUniqueName: channelUniqueName.value || '',
    }),
    () => ({
      enabled: enabled.value,
      fetchPolicy: 'cache-and-network',
      // The download detail tree already performs several SSR query waves.
      // Fetch this non-SEO overview after hydration so a slow check history
      // cannot prevent Vercel from returning the page shell.
      prefetch: false,
    })
  );

  const applicablePipelines = computed<ApplicablePublicPipeline[]>(() =>
    [result.value?.serverApplicable, result.value?.channelApplicable].flatMap(
      (pipeline) =>
        pipeline && (pipeline.configured || pipeline.expectedJobs.length > 0)
          ? [
              {
                ...pipeline,
                scope: pipeline.scope,
                reason: pipeline.reason,
              },
            ]
          : []
    )
  );

  const server = usePipelineHistory(
    computed(() => ({
      targetId: downloadableFileId.value || '',
      targetType: 'DownloadableFile',
      scope: 'SERVER',
      eventType: eventType?.value,
    })),
    enabled,
    pollWhileActive ? pollInterval : 0
  );
  const channel = usePipelineHistory(
    computed(() => ({
      targetId: discussionId.value || '',
      targetType: 'Discussion',
      scope: 'CHANNEL',
      channelId: channelUniqueName.value,
      eventType: eventType?.value,
    })),
    enabled,
    pollWhileActive ? pollInterval : 0
  );
  // A busy download history must not evict the latest applicable creation check.
  const latestServer = usePipelineHistory(
    computed(() => ({
      targetId: downloadableFileId.value || '',
      targetType: 'DownloadableFile',
      scope: 'SERVER',
      eventType: 'downloadableFile.created',
      first: 1,
    })),
    enabled,
    pollWhileActive ? pollInterval : 0
  );
  const latestChannel = usePipelineHistory(
    computed(() => ({
      targetId: discussionId.value || '',
      targetType: 'Discussion',
      scope: 'CHANNEL',
      channelId: channelUniqueName.value,
      eventType: 'discussionChannel.created',
      first: 1,
    })),
    enabled,
    pollWhileActive ? pollInterval : 0
  );

  const attempts = computed(() =>
    [...server.attempts.value, ...channel.attempts.value]
      .map(toPublicPipelineAttempt)
      .sort(
        (a, b) =>
          attemptTimestamp(b) - attemptTimestamp(a) || b.id.localeCompare(a.id)
      )
  );
  const latestAttempts = computed(() =>
    [...latestServer.attempts.value, ...latestChannel.attempts.value].map(
      toPublicPipelineAttempt
    )
  );
  const hasPipelineContent = computed(
    () =>
      applicablePipelines.value.length > 0 ||
      attempts.value.length > 0 ||
      hasActiveAttempt.value
  );
  const hasActiveAttempt = computed(
    () => server.hasActiveWork.value || channel.hasActiveWork.value
  );
  const isPolling = computed(
    () => server.isPolling.value || channel.isPolling.value
  );
  const histories = [server, channel, latestServer, latestChannel];

  return {
    applicablePipelines,
    ready: computed(
      () => !enabled.value || histories.every((history) => history.ready.value)
    ),
    attempts,
    latestAttempts,
    hasMore: computed(() => server.hasMore.value || channel.hasMore.value),
    moreLoading: computed(
      () => server.moreLoading.value || channel.moreLoading.value
    ),
    moreError: computed(
      () => server.moreError.value || channel.moreError.value
    ),
    loadMore: () => {
      server.loadMore();
      channel.loadMore();
    },
    updateAttempt: (page: PublicPluginPipelineRunPage) =>
      histories.forEach((history) => history.updateAttempt(page)),
    hasPipelineContent,
    hasActiveAttempt,
    isPolling,
    loading: computed(
      () => loading.value || histories.some((history) => history.loading.value)
    ),
    error: computed(
      () =>
        error.value ||
        histories.find((history) => history.error.value)?.error.value
    ),
    refetch: () =>
      Promise.all([
        refetch(),
        ...histories.map((history) => history.refetch()),
      ]),
  };
}

export type DownloadPipelineOverview = ReturnType<
  typeof useDownloadPipelineOverview
>;

const downloadPipelineOverviewKey: InjectionKey<DownloadPipelineOverview> =
  Symbol('download-pipeline-overview');

export function provideDownloadPipelineOverview(
  downloadableFileId: Ref<string | null | undefined>,
  discussionId: Ref<string | null | undefined>,
  channelUniqueName: Ref<string | null | undefined>
) {
  const overview = useDownloadPipelineOverview(
    downloadableFileId,
    discussionId,
    channelUniqueName
  );
  provide(downloadPipelineOverviewKey, overview);
  return overview;
}

export function useSharedDownloadPipelineOverview(
  downloadableFileId: Ref<string | null | undefined>,
  discussionId: Ref<string | null | undefined>,
  channelUniqueName: Ref<string | null | undefined>,
  options: {
    pollInterval?: number;
    pollWhileActive?: boolean;
    eventType?: Ref<string | undefined>;
  } = {}
) {
  return (
    (options.eventType ? null : inject(downloadPipelineOverviewKey, null)) ??
    useDownloadPipelineOverview(
      downloadableFileId,
      discussionId,
      channelUniqueName,
      options
    )
  );
}
