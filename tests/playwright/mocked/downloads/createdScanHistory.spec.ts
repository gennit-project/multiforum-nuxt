import {
  FileKind,
  PriceModel,
  ScanStatus,
} from '../../../../__generated__/graphql';
import { expect, test } from '../../helpers/testFixture';
import { buildDiscussion } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { expectNoAxeViolations } from '../../helpers/axe';

const channel = 'downloads-forum';
const discussionId = 'download-scan-history';
const fileId = 'scan-file';

const attempt = (
  pipelineId: string,
  eventType: string,
  attemptNumber: number
) => ({
  __typename: 'PublicPluginPipelineRun',
  id: pipelineId,
  pipelineId,
  targetId: fileId,
  targetType: 'DownloadableFile',
  eventType,
  scope: 'SERVER',
  channelId: null,
  status: 'SUCCEEDED',
  trigger: 'EVENT',
  initiatedByUsername: null,
  retryOfPipelineRunId: null,
  attemptNumber,
  applicability: null,
  policyEffectiveAt: null,
  policyId: null,
  campaignId: null,
  queuedAt: '2026-09-24T06:00:00.000Z',
  startedAt: null,
  heartbeatAt: null,
  timeoutAt: null,
  finishedAt: '2026-09-24T06:01:00.000Z',
  createdAt: '2026-09-24T06:00:00.000Z',
  updatedAt: '2026-09-24T06:01:00.000Z',
  jobs: [],
});

test('bounded checks retain status, retry history pages, load stages, and resolve older permalinks', async ({
  page,
  setupMockedPage,
}) => {
  const emptyConnection = {
    edges: [],
    pageInfo: { hasNextPage: false, hasPreviousPage: false },
    totalCount: 0,
  };
  const file = {
    __typename: 'DownloadableFile' as const,
    createdAt: '2026-09-24T06:00:00.000Z',
    purchasers: [],
    versions: [],
    licenseConnection: emptyConnection,
    purchasersConnection: emptyConnection,
    versionsConnection: emptyConnection,
    id: fileId,
    fileName: 'house.zip',
    url: 'https://example.test/house.zip',
    kind: FileKind.Zip,
    size: 100,
    priceModel: PriceModel.Free,
    priceCents: null,
    priceCurrency: null,
    downloadCountTotal: 0,
    downloadCountUnique: 0,
    attributionOverride: null,
    supportPatreonUrl: null,
    supportBuyMeACoffeeUrl: null,
    supportKoFiUrl: null,
    supportPayPalMeUrl: null,
    scanStatus: ScanStatus.Clean,
    scanCheckedAt: null,
    scanReason: null,
    uploadedByUsername: 'alice',
    license: null,
  };
  const discussion = buildDiscussion({
    id: discussionId,
    channelUniqueName: channel,
    title: 'Scanned download',
    overrides: {
      hasDownload: true,
      DownloadableFiles: [file as any],
    },
  });
  let failHistory = true;
  const job = (id: string, status = 'SUCCEEDED') => ({
    __typename: 'PublicPluginJobRun',
    id,
    pluginId: id,
    pluginName: id === 'first-stage' ? 'First stage' : 'Hidden failed stage',
    version: '1.0.0',
    scope: 'SERVER',
    channelId: null,
    eventType: 'downloadableFile.created',
    status,
    message: null,
    durationMs: null,
    executionOrder: id === 'first-stage' ? 0 : 1,
    skippedReason: null,
    diagnostics: [],
    queuedAt: '2026-09-24T06:00:00.000Z',
    startedAt: null,
    heartbeatAt: null,
    timeoutAt: null,
    finishedAt: null,
    createdAt: '2026-09-24T06:00:00.000Z',
    updatedAt: '2026-09-24T06:00:00.000Z',
  });
  const pageInfo = (hasNextPage = false, endCursor: string | null = null) => ({
    __typename: 'PluginPipelinePageInfo',
    hasNextPage,
    endCursor,
  });
  const latest = {
    __typename: 'PublicPluginPipelineRunPage',
    run: {
      ...attempt('creation-2', 'downloadableFile.created', 2),
      id: 'run-creation-2',
      status: 'FAILED',
      jobs: [job('first-stage')],
    },
    displayStatus: 'FAILED',
    hasActiveWork: false,
    jobsPageInfo: pageInfo(true, 'jobs-cursor'),
  };
  const older = {
    __typename: 'PublicPluginPipelineRunPage',
    run: {
      ...attempt('creation-1', 'downloadableFile.created', 1),
      id: 'run-creation-1',
    },
    displayStatus: 'SUCCEEDED',
    hasActiveWork: false,
    jobsPageInfo: pageInfo(),
  };
  await setupMockedPage({
    username: 'alice',
    handlers: {
      ...createBaseHandlers({ channelId: channel, discussionId }),
      getDownloadDetail: () => ({ data: { discussions: [discussion] } }),
      GetPipelineSummaryPage: ({ body }) => {
        const variables = body.variables || {};
        if (variables.after && failHistory) {
          failHistory = false;
          return { errors: [{ message: 'Temporary history failure' }] };
        }
        return {
          data: {
            getPipelineSummaryPage: {
              __typename: 'PluginPipelineSummaryPage',
              targetId: variables.targetId,
              targetType: variables.targetType,
              hasActiveWork: variables.targetType !== 'Discussion',
              hasFailedWork: true,
              pageInfo:
                variables.targetType === 'Discussion' || variables.after
                  ? pageInfo()
                  : pageInfo(true, 'history-cursor'),
              attempts:
                variables.targetType === 'Discussion'
                  ? []
                  : variables.after
                    ? [older]
                    : [latest],
            },
          },
        };
      },
      GetPipelineRunPage: ({ body }) => ({
        data: {
          getPipelineRunPage:
            body.variables?.pipelineRunId === 'run-creation-1'
              ? older
              : {
                  ...latest,
                  run: { ...latest.run, jobs: [job('hidden-stage', 'FAILED')] },
                  jobsPageInfo: pageInfo(),
                },
        },
      }),
      GetDownloadPipelineOverview: () => ({
        data: {
          serverApplicable: null,
          channelApplicable: null,
        },
      }),
    },
  });

  await page.goto(`/forums/${channel}/downloads/${discussionId}/pipelines`);
  const history = page.getByRole('region', { name: 'Attempt history' });
  await expect(history.getByRole('heading', { level: 4 })).toHaveText([
    'Server pipeline · Attempt 2',
  ]);
  await expect(history.getByText('Failed', { exact: true })).toBeVisible();
  await expect(page.getByText('Updating', { exact: true })).toBeVisible();
  await history.getByRole('button', { name: 'Load more stages' }).click();
  await expect(
    history.getByRole('heading', { name: '2. Hidden failed stage' })
  ).toBeVisible();
  await expect(
    history.getByRole('heading', { name: '1. First stage' })
  ).toBeVisible();
  await history.getByRole('button', { name: 'Load more attempts' }).click();
  await expect(history.getByRole('alert')).toHaveText(
    'Earlier attempts could not be loaded. Try again.'
  );
  await history.getByRole('button', { name: 'Load more attempts' }).click();
  await expect(history.getByRole('heading', { level: 4 })).toHaveText([
    'Server pipeline · Attempt 2',
    'Server pipeline · Attempt 1',
  ]);
  await expect(
    history.getByRole('link', { name: 'Permalink to attempt 2' })
  ).toHaveAttribute('href', /attempt=run-creation-2/);
  await expectNoAxeViolations(page);
  await page.goto(
    `/forums/${channel}/downloads/${discussionId}/pipelines?attempt=run-creation-1#attempt-creation-1`
  );
  await expect(
    page.getByRole('heading', {
      name: 'Server pipeline · Attempt 1',
      exact: true,
    })
  ).toBeVisible();
});
