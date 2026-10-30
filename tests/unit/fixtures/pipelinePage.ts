import {
  PluginRunStatus,
  PluginPipelineRunStatus,
  PluginPipelineRunTrigger,
  type PublicPluginPipelineRunPage,
  type PublicPluginJobRun,
  type PluginPipelineSummaryPage,
} from '@/__generated__/graphql';
const timestamp = '2026-10-01T00:00:00.000Z';
export const pipelineJob = (
  overrides: Partial<PublicPluginJobRun> = {}
): PublicPluginJobRun => ({
  __typename: 'PublicPluginJobRun',
  id: 'job-1',
  pluginId: 'scanner',
  pluginName: 'Scanner',
  version: '1',
  scope: 'SERVER',
  eventType: 'downloadableFile.created',
  status: PluginRunStatus.Succeeded,
  executionOrder: 0,
  diagnostics: [],
  queuedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});
export const pipelinePage = (
  overrides: Partial<PublicPluginPipelineRunPage> = {}
): PublicPluginPipelineRunPage => ({
  __typename: 'PublicPluginPipelineRunPage',
  displayStatus: PluginRunStatus.Succeeded,
  hasActiveWork: false,
  jobsPageInfo: {
    __typename: 'PluginPipelinePageInfo',
    hasNextPage: false,
    endCursor: null,
  },
  run: {
    __typename: 'PublicPluginPipelineRun',
    id: 'attempt-1',
    pipelineId: 'pipeline-1',
    targetId: 'file-1',
    targetType: 'DownloadableFile',
    eventType: 'downloadableFile.created',
    scope: 'SERVER',
    status: PluginPipelineRunStatus.Succeeded,
    trigger: PluginPipelineRunTrigger.Event,
    attemptNumber: 1,
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
  __typename: 'PluginPipelineSummaryPage',
  targetId: 'file-1',
  targetType: 'DownloadableFile',
  hasActiveWork: false,
  hasFailedWork: false,
  pageInfo: {
    __typename: 'PluginPipelinePageInfo',
    hasNextPage: false,
    endCursor: null,
  },
  attempts: [pipelinePage()],
  ...overrides,
});
