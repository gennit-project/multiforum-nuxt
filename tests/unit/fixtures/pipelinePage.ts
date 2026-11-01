import {
  PluginRunStatus,
  PluginPipelineRunStatus,
  PluginPipelineRunTrigger,
} from '@/__generated__/graphql';
import type { GetPipelineSummaryPageQuery, GetPipelineRunPageQuery } from '@/__generated__/operations';
type PublicPluginPipelineRunPage = NonNullable<GetPipelineRunPageQuery['getPipelineRunPage']>;
type PublicPluginJobRun = PublicPluginPipelineRunPage['run']['jobs'][number];
type PluginPipelineSummaryPage = GetPipelineSummaryPageQuery['getPipelineSummaryPage'];
const timestamp = '2026-10-01T00:00:00.000Z';
export const pipelineJob = (
  overrides: Partial<PublicPluginJobRun> = {}
): PublicPluginJobRun => ({
  id: 'job-1',
  pluginId: 'scanner',
  pluginName: 'Scanner',
  version: '1',
  scope: 'SERVER',
  eventType: 'downloadableFile.created',
  status: PluginRunStatus.Succeeded,
  executionOrder: 0,
  channelId: null, message: null, durationMs: null, skippedReason: null, startedAt: null, heartbeatAt: null, timeoutAt: null, finishedAt: null,
  diagnostics: [],
  queuedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});
export const pipelinePage = (
  overrides: Partial<PublicPluginPipelineRunPage> = {}
): PublicPluginPipelineRunPage => ({
  displayStatus: PluginRunStatus.Succeeded,
  hasActiveWork: false,
  jobsPageInfo: {
    hasNextPage: false,
    endCursor: null,
  },
  run: {
    id: 'attempt-1',
    pipelineId: 'pipeline-1',
    targetId: 'file-1',
    targetType: 'DownloadableFile',
    eventType: 'downloadableFile.created',
    scope: 'SERVER',
    status: PluginPipelineRunStatus.Succeeded,
    trigger: PluginPipelineRunTrigger.Event,
    attemptNumber: 1,
    channelId: null, initiatedByUsername: null, retryOfPipelineRunId: null, applicability: null, policyEffectiveAt: null, policyId: null, campaignId: null, startedAt: null, heartbeatAt: null, timeoutAt: null, finishedAt: null,
    queuedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    jobs: [pipelineJob()],
  },
  ...overrides,
});
export const pipelineSummary = (
  overrides: Partial<PluginPipelineSummaryPage> = {}
): PluginPipelineSummaryPage => ({
  targetId: 'file-1',
  targetType: 'DownloadableFile',
  hasActiveWork: false,
  hasFailedWork: false,
  pageInfo: {
    hasNextPage: false,
    endCursor: null,
  },
  attempts: [pipelinePage()],
  ...overrides,
});
