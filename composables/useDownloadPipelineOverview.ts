import { computed, inject, provide, type InjectionKey, type Ref } from 'vue';
import { usePipelineHistory } from './usePipelineHistory';
import type {
  Query,
  PublicPluginPipelineRunPage,
  QueryGetApplicablePluginPipelineArgs,
} from '@/__generated__/graphql';
import { useQuery } from '@vue/apollo-composable';
import { GET_DOWNLOAD_PIPELINE_OVERVIEW } from '@/graphQLData/admin/queries';
import type {
  PipelineRun,
  PipelineScope,
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
  applicability: 'NEW_FILES_ONLY' | 'ALL_FILES_GRADUAL' | 'ALL_FILES_IMMEDIATE';
  effectiveAt?: string | null;
  policyId?: string | null;
  required: boolean;
  reason: 'APPLICABLE' | 'UPLOADED_BEFORE_POLICY' | 'NO_APPLICABLE_PLUGINS';
  expectedJobs: PublicExpectedPipelineJob[];
}

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
  scope: PipelineScope;
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
  scope: page.run.scope as PipelineScope,
  jobs: page.run.jobs.map((job) => ({
    ...job,
    scope: job.scope as PipelineScope,
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

  type ApplicableData = {
    serverApplicable: Query['getApplicablePluginPipeline'];
    channelApplicable: Query['getApplicablePluginPipeline'];
  };
  type ApplicableVariables = Required<
    Pick<
      QueryGetApplicablePluginPipelineArgs,
      'downloadableFileId' | 'discussionId' | 'channelUniqueName'
    >
  >;
  const { result, loading, error, refetch } = useQuery<
    ApplicableData,
    ApplicableVariables
  >(
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
                scope: pipeline.scope as PipelineScope,
                reason: pipeline.reason as ApplicablePublicPipeline['reason'],
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
