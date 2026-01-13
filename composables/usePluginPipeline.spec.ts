import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';

import {
  usePluginPipeline,
  type PipelineRun,
  type PipelineStatus,
} from './usePluginPipeline';

// Mock Apollo composable before importing the composable
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref({ getPipelineRuns: [] }),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  })),
}));

// Mock the GraphQL query
vi.mock('@/graphQLData/admin/queries', () => ({
  GET_PIPELINE_RUNS: 'mock-query',
}));

describe('usePluginPipeline composable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('formatDuration', () => {
    it('should return empty string for undefined/null', () => {
      const { formatDuration } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      expect(formatDuration(undefined)).toBe('');
      expect(formatDuration(0)).toBe('');
    });

    it('should format milliseconds correctly', () => {
      const { formatDuration } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds correctly', () => {
      const { formatDuration } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      expect(formatDuration(1000)).toBe('1.0s');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(12345)).toBe('12.3s');
    });
  });

  describe('getStatusInfo', () => {
    it('should return correct info for PENDING status', () => {
      const { getStatusInfo } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      const info = getStatusInfo('PENDING');
      expect(info.label).toBe('Pending');
      expect(info.color).toBe('text-gray-400');
      expect(info.icon).toContain('fa-circle');
    });

    it('should return correct info for RUNNING status', () => {
      const { getStatusInfo } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      const info = getStatusInfo('RUNNING');
      expect(info.label).toBe('Running');
      expect(info.color).toBe('text-blue-500');
      expect(info.icon).toContain('fa-spinner');
    });

    it('should return correct info for SUCCEEDED status', () => {
      const { getStatusInfo } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      const info = getStatusInfo('SUCCEEDED');
      expect(info.label).toBe('Passed');
      expect(info.color).toBe('text-green-500');
      expect(info.icon).toContain('fa-check-circle');
    });

    it('should return correct info for FAILED status', () => {
      const { getStatusInfo } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      const info = getStatusInfo('FAILED');
      expect(info.label).toBe('Failed');
      expect(info.color).toBe('text-red-500');
      expect(info.icon).toContain('fa-times-circle');
    });

    it('should return correct info for SKIPPED status', () => {
      const { getStatusInfo } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      const info = getStatusInfo('SKIPPED');
      expect(info.label).toBe('Skipped');
      expect(info.color).toBe('text-gray-500');
      expect(info.icon).toContain('fa-forward');
    });

    it('should handle unknown status', () => {
      const { getStatusInfo } = usePluginPipeline(
        ref(null),
        ref('DownloadableFile'),
        { enabled: false }
      );

      const info = getStatusInfo('UNKNOWN' as PipelineStatus);
      expect(info.label).toBe('Unknown');
    });
  });

  describe('pipelineGroups computed', () => {
    it('should group runs by pipelineId', async () => {
      const { useQuery } = await import('@vue/apollo-composable');
      const mockRuns: PipelineRun[] = [
        {
          id: '1',
          pipelineId: 'pipeline-1',
          pluginId: 'plugin-a',
          pluginName: 'Plugin A',
          version: '1.0.0',
          status: 'SUCCEEDED',
          executionOrder: 0,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:01Z',
        },
        {
          id: '2',
          pipelineId: 'pipeline-1',
          pluginId: 'plugin-b',
          pluginName: 'Plugin B',
          version: '1.0.0',
          status: 'SUCCEEDED',
          executionOrder: 1,
          createdAt: '2024-01-01T10:00:01Z',
          updatedAt: '2024-01-01T10:00:02Z',
        },
        {
          id: '3',
          pipelineId: 'pipeline-2',
          pluginId: 'plugin-a',
          pluginName: 'Plugin A',
          version: '1.0.0',
          status: 'RUNNING',
          executionOrder: 0,
          createdAt: '2024-01-01T11:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ];

      vi.mocked(useQuery).mockReturnValue({
        result: ref({ getPipelineRuns: mockRuns }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { pipelineGroups } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(pipelineGroups.value).toHaveLength(2);

      // Most recent pipeline should be first
      expect(pipelineGroups.value[0]!.pipelineId).toBe('pipeline-2');
      expect(pipelineGroups.value[0]!.runs).toHaveLength(1);
      expect(pipelineGroups.value[0]!.status).toBe('RUNNING');
      expect(pipelineGroups.value[0]!.isComplete).toBe(false);

      expect(pipelineGroups.value[1]!.pipelineId).toBe('pipeline-1');
      expect(pipelineGroups.value[1]!.runs).toHaveLength(2);
      expect(pipelineGroups.value[1]!.status).toBe('SUCCEEDED');
      expect(pipelineGroups.value[1]!.isComplete).toBe(true);
    });

    it('should sort runs by executionOrder within a group', async () => {
      const { useQuery } = await import('@vue/apollo-composable');
      const mockRuns: PipelineRun[] = [
        {
          id: '2',
          pipelineId: 'pipeline-1',
          pluginId: 'plugin-b',
          pluginName: 'Plugin B',
          version: '1.0.0',
          status: 'SUCCEEDED',
          executionOrder: 1,
          createdAt: '2024-01-01T10:00:01Z',
          updatedAt: '2024-01-01T10:00:02Z',
        },
        {
          id: '1',
          pipelineId: 'pipeline-1',
          pluginId: 'plugin-a',
          pluginName: 'Plugin A',
          version: '1.0.0',
          status: 'SUCCEEDED',
          executionOrder: 0,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:01Z',
        },
      ];

      vi.mocked(useQuery).mockReturnValue({
        result: ref({ getPipelineRuns: mockRuns }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { pipelineGroups } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(pipelineGroups.value[0]!.runs[0]!.executionOrder).toBe(0);
      expect(pipelineGroups.value[0]!.runs[1]!.executionOrder).toBe(1);
    });

    it('should determine pipeline status correctly with mixed run statuses', async () => {
      const { useQuery } = await import('@vue/apollo-composable');

      // Test FAILED status takes precedence when complete
      vi.mocked(useQuery).mockReturnValue({
        result: ref({
          getPipelineRuns: [
            {
              id: '1',
              pipelineId: 'pipeline-1',
              pluginId: 'plugin-a',
              pluginName: 'Plugin A',
              version: '1.0.0',
              status: 'SUCCEEDED',
              executionOrder: 0,
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: '2024-01-01T10:00:01Z',
            },
            {
              id: '2',
              pipelineId: 'pipeline-1',
              pluginId: 'plugin-b',
              pluginName: 'Plugin B',
              version: '1.0.0',
              status: 'FAILED',
              executionOrder: 1,
              createdAt: '2024-01-01T10:00:01Z',
              updatedAt: '2024-01-01T10:00:02Z',
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { pipelineGroups } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(pipelineGroups.value[0]!.status).toBe('FAILED');
      expect(pipelineGroups.value[0]!.isComplete).toBe(true);
    });
  });

  describe('latestPipeline computed', () => {
    it('should return null when no pipelines exist', async () => {
      const { useQuery } = await import('@vue/apollo-composable');
      vi.mocked(useQuery).mockReturnValue({
        result: ref({ getPipelineRuns: [] }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { latestPipeline } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(latestPipeline.value).toBeNull();
    });

    it('should return the most recent pipeline', async () => {
      const { useQuery } = await import('@vue/apollo-composable');
      vi.mocked(useQuery).mockReturnValue({
        result: ref({
          getPipelineRuns: [
            {
              id: '1',
              pipelineId: 'pipeline-old',
              pluginId: 'plugin-a',
              pluginName: 'Plugin A',
              version: '1.0.0',
              status: 'SUCCEEDED',
              executionOrder: 0,
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: '2024-01-01T10:00:01Z',
            },
            {
              id: '2',
              pipelineId: 'pipeline-new',
              pluginId: 'plugin-a',
              pluginName: 'Plugin A',
              version: '1.0.0',
              status: 'RUNNING',
              executionOrder: 0,
              createdAt: '2024-01-01T12:00:00Z',
              updatedAt: '2024-01-01T12:00:00Z',
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { latestPipeline } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(latestPipeline.value?.pipelineId).toBe('pipeline-new');
    });
  });

  describe('hasActivePipeline computed', () => {
    it('should return false when all pipelines are complete', async () => {
      const { useQuery } = await import('@vue/apollo-composable');
      vi.mocked(useQuery).mockReturnValue({
        result: ref({
          getPipelineRuns: [
            {
              id: '1',
              pipelineId: 'pipeline-1',
              pluginId: 'plugin-a',
              pluginName: 'Plugin A',
              version: '1.0.0',
              status: 'SUCCEEDED',
              executionOrder: 0,
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: '2024-01-01T10:00:01Z',
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { hasActivePipeline } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(hasActivePipeline.value).toBe(false);
    });

    it('should return true when a pipeline has RUNNING status', async () => {
      const { useQuery } = await import('@vue/apollo-composable');
      vi.mocked(useQuery).mockReturnValue({
        result: ref({
          getPipelineRuns: [
            {
              id: '1',
              pipelineId: 'pipeline-1',
              pluginId: 'plugin-a',
              pluginName: 'Plugin A',
              version: '1.0.0',
              status: 'RUNNING',
              executionOrder: 0,
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: '2024-01-01T10:00:00Z',
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { hasActivePipeline } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(hasActivePipeline.value).toBe(true);
    });

    it('should return true when a pipeline has PENDING status', async () => {
      const { useQuery } = await import('@vue/apollo-composable');
      vi.mocked(useQuery).mockReturnValue({
        result: ref({
          getPipelineRuns: [
            {
              id: '1',
              pipelineId: 'pipeline-1',
              pluginId: 'plugin-a',
              pluginName: 'Plugin A',
              version: '1.0.0',
              status: 'PENDING',
              executionOrder: 0,
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: '2024-01-01T10:00:00Z',
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any);

      const { hasActivePipeline } = usePluginPipeline(
        ref('test-id'),
        ref('DownloadableFile'),
        { enabled: true }
      );

      expect(hasActivePipeline.value).toBe(true);
    });
  });
});
