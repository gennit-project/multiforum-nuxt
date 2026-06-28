import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';
import { createBaseHandlers } from '../../helpers/baseHandlers';

// The server-admin Channel Reports page (`/admin/channel-reports`): it lists
// server-scoped channel reports with their open/locked status and offers
// per-row Lock / Unlock actions. The default mock user `cluse` is a server
// admin, which is what grants the lock controls.

const REPORTS_URL = '/admin/channel-reports';
const MOCK_DATE = '2024-01-01T00:00:00.000Z';

const channelReports = [
  {
    id: 'issue-1',
    issueNumber: 1,
    title: 'Reported channel: cats',
    body: '',
    isOpen: true,
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    relatedChannelUniqueName: 'cats',
    flaggedServerRuleViolation: true,
    locked: false,
    lockedAt: null,
    lockReason: null,
    LockedBy: null,
    Author: { __typename: 'User', username: 'reporter1' },
    ActivityFeedAggregate: { count: 1 },
  },
  {
    id: 'issue-2',
    issueNumber: 2,
    title: 'Reported channel: dogs',
    body: '',
    isOpen: true,
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    relatedChannelUniqueName: 'dogs',
    flaggedServerRuleViolation: true,
    locked: true,
    lockedAt: MOCK_DATE,
    lockReason: 'Spam wave',
    LockedBy: { displayName: 'cluse' },
    Author: { __typename: 'User', username: 'reporter2' },
    ActivityFeedAggregate: { count: 2 },
  },
];

const channelResponse = (uniqueName: string, locked: boolean) => ({
  uniqueName,
  displayName: uniqueName,
  locked,
  lockedAt: locked ? MOCK_DATE : null,
  lockReason: locked ? 'Spam wave' : null,
  LockedBy: locked ? { displayName: 'cluse' } : null,
});

const reportsHandlers = () => ({
  ...createBaseHandlers(),
  getChannelReports: () => ({ data: { issues: channelReports } }),
  lockChannel: () => ({ data: { lockChannel: channelResponse('cats', true) } }),
  unlockChannel: () => ({
    data: { unlockChannel: channelResponse('dogs', false) },
  }),
});

test.describe('Admin Channel Reports page', () => {
  test('lists channel reports with open and locked status badges', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, reportsHandlers());

    try {
      await page.goto(REPORTS_URL);

      await expect(
        page.getByRole('link', { name: 'cats' })
      ).toBeVisible();
      await expect(page.getByRole('link', { name: 'dogs' })).toBeVisible();
      // The unlocked report offers Lock; the locked one offers Unlock.
      await expect(page.getByRole('button', { name: 'Lock', exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Unlock', exact: true })
      ).toBeVisible();
      await expect(page.getByText('Locked', { exact: true })).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('locking a channel from a report row fires lockChannel', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, reportsHandlers());

    try {
      await page.goto(REPORTS_URL);

      await page.getByRole('button', { name: 'Lock', exact: true }).click();
      await page.locator('#lock-reason').fill('Coordinated spam');
      await page.getByTestId('lock-channel-dialog-primary-button').click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'lockChannel'
      );
      const op = diagnostics.completedOperations.find(
        (o) => o.operationName === 'lockChannel'
      );
      expect(op?.variables?.channelUniqueName).toBe('cats');
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('unlocking a channel from a report row fires unlockChannel', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, reportsHandlers());

    try {
      await page.goto(REPORTS_URL);

      await page.getByRole('button', { name: 'Unlock', exact: true }).click();
      await page.getByTestId('unlock-channel-dialog-primary-button').click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'unlockChannel'
      );
      const op = diagnostics.completedOperations.find(
        (o) => o.operationName === 'unlockChannel'
      );
      expect(op?.variables?.channelUniqueName).toBe('dogs');
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
