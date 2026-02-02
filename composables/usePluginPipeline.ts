import { ref, computed, watch, onUnmounted, type Ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_PIPELINE_RUNS } from '@/graphQLData/admin/queries';

export type PipelineStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED';

export type PipelineScope = 'SERVER' | 'CHANNEL';

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
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineGroup {
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
}

export function usePluginPipeline(
  targetId: Ref<string | null | undefined>,
  targetType: Ref<string>,
  options: UsePluginPipelineOptions = {}
) {
  const { pollInterval = 3000, enabled = true } = options;

  const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null);
  const isPolling = ref(false);

  // Query for pipeline runs
  const {
    result,
    loading,
    error,
    refetch,
  } = useQuery(
    GET_PIPELINE_RUNS,
    () => ({
      targetId: targetId.value,
      targetType: targetType.value,
    }),
    () => ({
      enabled:
        !!targetId.value &&
        !!targetType.value &&
        (typeof enabled === 'boolean' ? enabled : enabled.value),
      fetchPolicy: 'cache-and-network',
    })
  );

  // Get all pipeline runs
  const pipelineRuns = computed((): PipelineRun[] => {
    return result.value?.getPipelineRuns || [];
  });

  // Group runs by pipelineId
  const pipelineGroups = computed((): PipelineGroup[] => {
    const groups: Record<string, PipelineRun[]> = {};

    for (const run of pipelineRuns.value) {
      const pipelineId = run.pipelineId;
      if (!groups[pipelineId]) {
        groups[pipelineId] = [];
      }
      groups[pipelineId]!.push(run);
    }

    return Object.entries(groups)
      .map(([pipelineId, runs]) => {
        // Sort runs by execution order
        const sortedRuns = [...runs].sort(
          (a, b) => a.executionOrder - b.executionOrder
        );

        // Determine overall pipeline status
        const hasRunning = sortedRuns.some((r) => r.status === 'RUNNING');
        const hasPending = sortedRuns.some((r) => r.status === 'PENDING');
        const hasFailed = sortedRuns.some((r) => r.status === 'FAILED');
        const allComplete = sortedRuns.every(
          (r) =>
            r.status === 'SUCCEEDED' ||
            r.status === 'FAILED' ||
            r.status === 'SKIPPED'
        );

        let status: PipelineStatus;
        if (hasRunning) {
          status = 'RUNNING';
        } else if (hasPending) {
          status = 'PENDING';
        } else if (hasFailed) {
          status = 'FAILED';
        } else {
          status = 'SUCCEEDED';
        }

        return {
          pipelineId,
          runs: sortedRuns,
          startedAt: sortedRuns[0]?.createdAt || '',
          status,
          isComplete: allComplete,
          scope: sortedRuns[0]?.scope || 'SERVER',
          channelId: sortedRuns[0]?.channelId,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
  });

  // Get the most recent pipeline
  const latestPipeline = computed((): PipelineGroup | null => {
    return pipelineGroups.value[0] || null;
  });

  // Check if any pipeline is still running
  const hasActivePipeline = computed(() => {
    return pipelineGroups.value.some((group) => !group.isComplete);
  });

  // Start polling
  const startPolling = () => {
    if (pollingTimer.value || !import.meta.client) return;

    isPolling.value = true;
    pollingTimer.value = setInterval(async () => {
      if (hasActivePipeline.value) {
        await refetch();
      } else {
        // Stop polling if all pipelines are complete
        stopPolling();
      }
    }, pollInterval);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value);
      pollingTimer.value = null;
    }
    isPolling.value = false;
  };

  // Auto-start polling when there's an active pipeline
  watch(
    hasActivePipeline,
    (active) => {
      if (active) {
        startPolling();
      } else {
        stopPolling();
      }
    },
    { immediate: true }
  );

  // Clean up on unmount
  onUnmounted(() => {
    stopPolling();
  });

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
      case 'FAILED':
        return {
          icon: 'fa-solid fa-times-circle',
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          label: 'Failed',
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
    hasActivePipeline,
    loading,
    error,
    refetch,
    isPolling,
    startPolling,
    stopPolling,
    formatDuration,
    getStatusInfo,
  };
}
