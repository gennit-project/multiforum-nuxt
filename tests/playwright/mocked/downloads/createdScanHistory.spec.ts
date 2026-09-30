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

test('checks page shows only creation scans and their retries', async ({
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
      DownloadableFiles: [file],
    },
  });
  await setupMockedPage({
    username: 'alice',
    handlers: {
      ...createBaseHandlers({ channelId: channel, discussionId }),
      getDownloadDetail: () => ({ data: { discussions: [discussion] } }),
      GetDownloadPipelineOverview: () => ({
        data: {
          serverApplicable: null,
          channelApplicable: null,
          serverSummary: {
            __typename: 'PluginPipelineSummary',
            attempts: [
              attempt('download-3', 'downloadableFile.downloaded', 3),
              attempt('download-2', 'downloadableFile.downloaded', 2),
              attempt('download-1', 'downloadableFile.downloaded', 1),
              {
                ...attempt('creation-2', 'downloadableFile.created', 2),
                trigger: 'OWNER_RETRY',
                retryOfPipelineRunId: 'creation-1',
              },
              attempt('creation-1', 'downloadableFile.created', 1),
            ],
          },
          channelSummary: {
            __typename: 'PluginPipelineSummary',
            attempts: [
              {
                ...attempt('channel-1', 'discussionChannel.created', 1),
                scope: 'CHANNEL',
                channelId: channel,
              },
            ],
          },
        },
      }),
    },
  });

  await page.goto(`/forums/${channel}/downloads/${discussionId}/pipelines`);
  const history = page.getByRole('region', { name: 'Attempt history' });
  await expect(history.getByRole('heading', { level: 4 })).toHaveText([
    'Server pipeline · Attempt 2',
    'Server pipeline · Attempt 1',
  ]);
  await expect(
    history.getByRole('link', { name: 'Permalink to attempt 2' })
  ).toHaveAttribute('href', /attempt=creation-2/);
  await expectNoAxeViolations(page);
});
