import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import {
  getApplicablePipelineStatus,
  useDownloadPipelineOverview,
  type ApplicablePublicPipeline,
  type PublicPipelineAttempt,
} from './useDownloadPipelineOverview';

const mockQueryResult = ref<Record<string, unknown>>({});
const mockRefetch = vi.fn();
const mockUseQuery = vi.hoisted(() => vi.fn());

vi.mock('@vue/apollo-composable', () => ({
  useQuery: mockUseQuery,
}));

vi.mock('@/graphQLData/admin/queries', () => ({
  GET_DOWNLOAD_PIPELINE_OVERVIEW: 'download-pipeline-overview',
}));

const applicable = (
  overrides: Partial<ApplicablePublicPipeline> = {}
): ApplicablePublicPipeline => ({
  targetId: 'file-1',
  targetType: 'DownloadableFile',
  eventType: 'downloadableFile.created',
  scope: 'SERVER',
  configured: true,
  applicability: 'ALL_FILES_IMMEDIATE',
  required: true,
  reason: 'APPLICABLE',
  expectedJobs: [],
  ...overrides,
});

const attempt = (
  overrides: Partial<PublicPipelineAttempt> = {}
): PublicPipelineAttempt => ({
  id: 'attempt-1',
  pipelineId: 'pipeline-1',
  targetId: 'file-1',
  targetType: 'DownloadableFile',
  eventType: 'downloadableFile.created',
  scope: 'SERVER',
  status: 'SUCCEEDED',
  trigger: 'EVENT',
  attemptNumber: 1,
  queuedAt: '2026-07-30T00:00:00.000Z',
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:01.000Z',
  jobs: [],
  ...overrides,
});

describe('useDownloadPipelineOverview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockQueryResult.value = {};
    mockRefetch.mockReset();
    mockUseQuery.mockReturnValue({
      result: mockQueryResult,
      loading: ref(false),
      error: ref(null),
      refetch: mockRefetch,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('merges server and channel attempt history newest first', () => {
    mockQueryResult.value = {
      serverApplicable: applicable(),
      channelApplicable: applicable({
        targetId: 'discussion-1',
        targetType: 'Discussion',
        eventType: 'discussionChannel.created',
        scope: 'CHANNEL',
        channelId: 'cats',
      }),
      serverSummary: {
        attempts: [attempt()],
      },
      channelSummary: {
        attempts: [
          attempt({
            id: 'attempt-2',
            pipelineId: 'pipeline-2',
            targetId: 'discussion-1',
            targetType: 'Discussion',
            eventType: 'discussionChannel.created',
            scope: 'CHANNEL',
            channelId: 'cats',
            createdAt: '2026-07-31T00:00:00.000Z',
          }),
        ],
      },
    };

    const overview = useDownloadPipelineOverview(
      ref('file-1'),
      ref('discussion-1'),
      ref('cats')
    );

    expect({
      applicableScopes: overview.applicablePipelines.value.map(
        (pipeline) => pipeline.scope
      ),
      attemptIds: overview.attempts.value.map((item) => item.id),
      hasContent: overview.hasPipelineContent.value,
    }).toEqual({
      applicableScopes: ['SERVER', 'CHANNEL'],
      attemptIds: ['attempt-2', 'attempt-1'],
      hasContent: true,
    });
  });

  it('polls while an attempt is queued or running', async () => {
    mockQueryResult.value = {
      serverSummary: {
        attempts: [attempt({ status: 'RUNNING' })],
      },
    };
    const overview = useDownloadPipelineOverview(
      ref('file-1'),
      ref('discussion-1'),
      ref('cats'),
      { pollInterval: 100 }
    );

    await vi.advanceTimersByTimeAsync(100);

    expect({
      active: overview.hasActiveAttempt.value,
      polling: overview.isPolling.value,
      refetches: mockRefetch.mock.calls.length,
    }).toEqual({
      active: true,
      polling: true,
      refetches: 1,
    });
  });

  it('does not count an empty unconfigured response as pipeline content', () => {
    mockQueryResult.value = {
      serverApplicable: applicable({
        configured: false,
        required: false,
        reason: 'NO_APPLICABLE_PLUGINS',
      }),
      serverSummary: { attempts: [] },
      channelSummary: { attempts: [] },
    };

    const overview = useDownloadPipelineOverview(
      ref('file-1'),
      ref('discussion-1'),
      ref('cats')
    );

    expect(overview.hasPipelineContent.value).toBe(false);
  });
});

describe('getApplicablePipelineStatus', () => {
  it('distinguishes policy exclusion, missing execution, and terminal results', () => {
    const required = applicable();

    expect({
      notRequired: getApplicablePipelineStatus({
        pipeline: applicable({
          required: false,
          reason: 'UPLOADED_BEFORE_POLICY',
        }),
        attempts: [],
      }),
      notExecuted: getApplicablePipelineStatus({
        pipeline: required,
        attempts: [],
      }),
      passed: getApplicablePipelineStatus({
        pipeline: required,
        attempts: [attempt({ status: 'SUCCEEDED', jobs: [] })],
      }),
      skipped: getApplicablePipelineStatus({
        pipeline: required,
        attempts: [
          attempt({
            status: 'SUCCEEDED',
            jobs: [
              {
                id: 'job-1',
                pluginId: 'scanner',
                pluginName: 'Scanner',
                version: '1.0.0',
                scope: 'SERVER',
                eventType: 'downloadableFile.created',
                status: 'SKIPPED',
                executionOrder: 0,
                diagnostics: [],
                createdAt: '2026-07-30T00:00:00.000Z',
                updatedAt: '2026-07-30T00:00:01.000Z',
              },
            ],
          }),
        ],
      }),
      timedOut: getApplicablePipelineStatus({
        pipeline: required,
        attempts: [attempt({ status: 'TIMED_OUT' })],
      }),
      cancelled: getApplicablePipelineStatus({
        pipeline: required,
        attempts: [attempt({ status: 'CANCELLED' })],
      }),
    }).toEqual({
      notRequired: 'NOT_REQUIRED',
      notExecuted: 'NOT_EXECUTED',
      passed: 'PASSED',
      skipped: 'SKIPPED',
      timedOut: 'TIMED_OUT',
      cancelled: 'CANCELLED',
    });
  });
});
