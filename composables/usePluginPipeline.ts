import { computed, type Ref } from 'vue';
import { usePipelineHistory } from './usePipelineHistory';
import type { PublicPluginPipelineRunPage } from '@/__generated__/graphql';

export type PipelineStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED'
  | 'TIMED_OUT'
  | 'CANCELLED';

export type PipelineScope = 'SERVER' | 'CHANNEL';

export interface PublicPipelineDiagnostic {
  level: 'INFO' | 'WARNING' | 'ERROR';
  code: string;
  message: string;
  details?: unknown;
  helpUrl?: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  pluginId: string;
  pluginName: string;
  version: string;
  scope: PipelineScope;
  channelId?: string;
  eventType: string;
  status: PipelineStatus;
  message?: string;
  durationMs?: number;
  executionOrder: number;
  skippedReason?: string;
  diagnostics?: PublicPipelineDiagnostic[];
  queuedAt?: string;
  startedAt?: string | null;
  heartbeatAt?: string | null;
  timeoutAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineGroup {
  page?: PublicPluginPipelineRunPage;
  pipelineId: string;
  runs: PipelineRun[];
  startedAt: string;
  status: PipelineStatus;
  isComplete: boolean;
  scope: PipelineScope;
  channelId?: string;
}

interface UsePluginPipelineOptions {
  pollInterval?: number;
  enabled?: Ref<boolean> | boolean;
  channelId?: Ref<string | undefined>;
}

export function usePluginPipeline(
  targetId: Ref<string | null | undefined>,
  targetType: Ref<string>,
  options: UsePluginPipelineOptions = {}
) {
  const { pollInterval = 3000, enabled = true } = options;

  const history = usePipelineHistory(
    computed(() => ({
      targetId: targetId.value || '',
      targetType: targetType.value,
      first: 1,
      channelId: options.channelId?.value,
    })),
    computed(
      () =>
        !!targetId.value &&
        !!targetType.value &&
        (typeof enabled === 'boolean' ? enabled : enabled.value)
    ),
    pollInterval
  );
  const pipelineGroups = computed<PipelineGroup[]>(() =>
    history.attempts.value.map((page) => ({
      page,
      pipelineId: page.run.pipelineId,
      runs: page.run.jobs.map((job) => ({
        ...job,
        pipelineId: page.run.pipelineId,
        scope: job.scope as PipelineScope,
        channelId: job.channelId ?? undefined,
        message: job.message ?? undefined,
        durationMs: job.durationMs ?? undefined,
        skippedReason: job.skippedReason ?? undefined,
        diagnostics: job.diagnostics.map((diagnostic) => ({
          ...diagnostic,
          helpUrl: diagnostic.helpUrl ?? undefined,
        })),
      })),
      startedAt: page.run.createdAt,
      status: page.displayStatus,
      isComplete: !page.hasActiveWork,
      scope: page.run.scope as PipelineScope,
      channelId: page.run.channelId ?? undefined,
    }))
  );
  const pipelineRuns = computed(() =>
    pipelineGroups.value.flatMap((group) => group.runs)
  );
  const latestPipeline = computed(() => pipelineGroups.value[0] ?? null);

  // Format duration for display
  const formatDuration = (ms?: number): string => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get status display info
  const getStatusInfo = (status: PipelineStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: 'fa-solid fa-circle',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          label: 'Pending',
        };
      case 'RUNNING':
        return {
          icon: 'fa-solid fa-spinner fa-spin',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          label: 'Running',
        };
      case 'SUCCEEDED':
        return {
          icon: 'fa-solid fa-check-circle',
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          label: 'Passed',
        };
      case 'TIMED_OUT':
      case 'CANCELLED':
      case 'FAILED':
        return {
          icon: 'fa-solid fa-times-circle',
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          label:
            status === 'TIMED_OUT'
              ? 'Timed out'
              : status === 'CANCELLED'
                ? 'Cancelled'
                : 'Failed',
        };
      case 'SKIPPED':
        return {
          icon: 'fa-solid fa-forward',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          label: 'Skipped',
        };
      default:
        return {
          icon: 'fa-solid fa-question-circle',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          label: 'Unknown',
        };
    }
  };

  return {
    pipelineRuns,
    pipelineGroups,
    latestPipeline,
    ...history,
    hasActivePipeline: history.hasActiveWork,
    formatDuration,
    getStatusInfo,
  };
}
