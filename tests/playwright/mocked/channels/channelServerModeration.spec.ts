import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { DEFAULT_MOD_ROLE } from '../../helpers/moderationFixtures';

// Server-moderation actions on the forum About page (`/forums/[forumId]/about`):
// reporting the forum, locking/unlocking it, and the permission gating that
// decides whether those controls appear. The default mock user (`cluse`) is a
// server admin (buildServerConfig lists them in Admins), which grants
// canReportChannel + canLockChannel.

const CHANNEL = 'cats';
const ABOUT_URL = `/forums/${CHANNEL}/about`;

const serverRulesHandler = () => ({
  data: {
    serverConfigs: [
      {
        serverName: 'Listical',
        rules: JSON.stringify([
          { summary: 'Be kind', detail: 'Keep the forum civil.' },
        ]),
      },
    ],
  },
});

const lockedChannelResponse = (locked: boolean) => ({
  uniqueName: CHANNEL,
  displayName: CHANNEL,
  locked,
  lockedAt: locked ? '2024-01-01T00:00:00.000Z' : null,
  lockReason: locked ? 'Spam wave' : null,
  LockedBy: locked ? { displayName: 'cluse' } : null,
});

test.describe('Forum About page – server moderation', () => {
  test('a server admin sees the Server Moderation section with report and lock actions', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({
        channelId: CHANNEL,
        serverConfigOverrides: { DefaultModRole: DEFAULT_MOD_ROLE },
      }),
      getServerRules: serverRulesHandler,
    });

    try {
      await page.goto(ABOUT_URL);

      await expect(page.getByText('Server Moderation')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Report Forum' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Lock Forum' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('a non-moderator does not see the Server Moderation section', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({
        channelId: CHANNEL,
        serverConfigOverrides: {
          Admins: [],
          Moderators: [],
          DefaultModRole: null,
          DefaultElevatedModRole: null,
        },
      }),
      getServerRules: serverRulesHandler,
    });

    try {
      await page.goto(ABOUT_URL);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('Server Moderation')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Report Forum' })
      ).toHaveCount(0);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('reporting the forum submits a server-scoped channel report', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({
        channelId: CHANNEL,
        serverConfigOverrides: { DefaultModRole: DEFAULT_MOD_ROLE },
      }),
      getServerRules: serverRulesHandler,
      reportChannel: () => ({
        data: {
          reportChannel: {
            id: 'issue-1',
            issueNumber: 1,
            relatedChannelUniqueName: CHANNEL,
          },
        },
      }),
    });

    try {
      await page.goto(ABOUT_URL);
      await page.getByRole('button', { name: 'Report Forum' }).click();

      // Select a server rule (enables the submit button). The checkbox lives in
      // the dialog panel, so checking it implicitly waits for the modal to open.
      await page.getByLabel('Select rule: Be kind').check();
      await page.getByTestId('report-channel-modal-primary-button').click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'reportChannel'
      );
      const op = diagnostics.completedOperations.find(
        (o) => o.operationName === 'reportChannel'
      );
      expect(op?.variables?.selectedServerRules).toEqual(['Be kind']);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('locking the forum from the About page fires lockChannel with a reason', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ channelId: CHANNEL }),
      getServerRules: serverRulesHandler,
      lockChannel: () => ({ data: { lockChannel: lockedChannelResponse(true) } }),
    });

    try {
      await page.goto(ABOUT_URL);
      await page.getByRole('button', { name: 'Lock Forum' }).click();

      // The reason field lives in the dialog panel; filling it waits for open.
      await page.locator('#lock-reason').fill('Coordinated spam');
      await page.getByTestId('lock-channel-dialog-primary-button').click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'lockChannel'
      );
      const op = diagnostics.completedOperations.find(
        (o) => o.operationName === 'lockChannel'
      );
      expect(op?.variables?.reason).toBe('Coordinated spam');
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('unlocking a locked forum from the About page fires unlockChannel', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({
        channelId: CHANNEL,
        channelOverrides: { locked: true, lockReason: 'Spam wave' },
      }),
      getServerRules: serverRulesHandler,
      unlockChannel: () => ({
        data: { unlockChannel: lockedChannelResponse(false) },
      }),
    });

    try {
      await page.goto(ABOUT_URL);
      await page.getByRole('button', { name: 'Unlock Forum' }).click();

      // No reason is required to unlock; confirm straight away.
      await page.getByTestId('unlock-channel-dialog-primary-button').click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'unlockChannel'
      );
      const op = diagnostics.completedOperations.find(
        (o) => o.operationName === 'unlockChannel'
      );
      expect(op?.variables?.channelUniqueName).toBe(CHANNEL);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
