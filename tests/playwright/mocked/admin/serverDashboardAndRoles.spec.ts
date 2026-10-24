import { expect, test } from '../../helpers/testFixture';
import {
  buildServerHealthDashboard,
  buildServerPermissionsConfig,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { expectNoAxeViolations } from '../../helpers/axe';

// Admin server-health dashboard and the server-roles management page. Both are
// admin-only, data-gated surfaces: their content only renders once the
// dashboard health query / the GET_SERVER_PERMISSIONS (op `getServerConfig`)
// query resolve with valid shapes. These tests exercise the shared
// createBaseHandlers base plus the buildServerHealthDashboard /
// buildServerPermissionsConfig fixtures added for exactly this purpose.
const TEST_USER = 'alice';

test.describe('Admin dashboard + roles', () => {
  test('server dashboard renders for an admin', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      getServerHealthDashboard: () => ({
        data: { getServerHealthDashboard: buildServerHealthDashboard() },
      }),
    });

    try {
      await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'Server Dashboard' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('server dashboard surfaces what needs attention and filters channels', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });
    const channelRow = (name: string, healthLabel: string, activityScore = 0) => ({
      __typename: 'ChannelHealthRow',
      id: name,
      channelUniqueName: name,
      displayName: name,
      channelIconURL: null,
      discussionCount: activityScore,
      commentCount: 0,
      eventCount: 0,
      downloadCount: 0,
      voteCount: 0,
      uniqueContributorCount: activityScore ? 1 : 0,
      openIssueCount: healthLabel === 'Needs review' ? 1 : 0,
      issueOpenedCount: 0,
      moderationActionCount: 0,
      archivedContentCount: 0,
      lockedContentCount: 0,
      oldestOpenIssueAgeDays: healthLabel === 'Needs review' ? 286 : null,
      issuesPerHundredContributions: 0,
      activityScore,
      healthLabel,
    });
    const dashboardData = () => ({
      data: {
        getServerHealthDashboard: buildServerHealthDashboard({
          summary: {
            ...buildServerHealthDashboard().summary,
            openIssueCount: 1,
            failedDownloadScanCount: 1,
          },
          channelHealth: [
            channelRow('lively', 'Active', 5),
            channelRow('overdue', 'Needs review', 2),
            channelRow('sleepy', 'Quiet'),
          ],
        }),
      },
    });
    await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      getServerHealthDashboard: dashboardData,
      getServerHealthDashboardOverview: dashboardData,
      getServerHealthChannelHealth: dashboardData,
      getDownloadScanReviewQueue: () => ({
        data: {
          getDownloadScanReviewQueue: [
            {
              __typename: 'DownloadScanReviewItem',
              downloadableFileId: 'file-1',
              fileName: 'Chateau_Frise.zip',
              scanStatus: 'FAILED',
              scanReason: 'Plugin not configured',
              scanCheckedAt: null,
              reviewRequestedAt: null,
              reviewRequestReason: null,
              uploaderUsername: 'alice',
              discussionId: 'discussion-1',
              discussionTitle: 'Chateau Frise',
              channelUniqueName: 'lively',
            },
          ],
        },
      }),
    });

    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });

    const attention = page.getByRole('region', { name: 'Needs attention' });
    await expect(attention).toContainText('Chateau_Frise.zip');
    await expect(attention).toContainText('1 admin issue is still open');

    // Scan actions are not offered in place: the row links to the download's
    // detail page, where retry and release live.
    await expect(attention.getByRole('button')).toHaveCount(0);
    await expect(
      attention.getByRole('link', { name: 'Review Chateau_Frise.zip' })
    ).toHaveAttribute('href', '/forums/lively/downloads/discussion-1');

    // Missing pipeline metrics read "No data", never NaN/undefined.
    const pipeline = page.getByRole('region', { name: 'Plugin pipeline' });
    await expect(pipeline).toContainText('No data');
    await expect(pipeline).not.toContainText(/NaN|undefined/);

    // Quiet channels are collapsed until asked for; needs-review sorts first.
    const channels = page.getByRole('region', { name: 'Channel health' });
    await expect(channels.getByRole('row')).toHaveCount(3);
    await expect(channels.getByRole('row').nth(1)).toContainText('overdue');
    await expect(channels).not.toContainText('sleepy');
    await channels.getByRole('button', { name: 'Show quiet channels' }).click();
    await expect(channels).toContainText('sleepy');

    await expectNoAxeViolations(page);
  });

  test('server roles page renders the roles editor for an admin', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      // GET_SERVER_PERMISSIONS reuses the `getServerConfig` operation name but
      // needs the role tiers + pending invites populated.
      getServerConfig: () => ({
        data: { serverConfigs: [buildServerPermissionsConfig()] },
      }),
      // The roles page also lists channel-scoped mod roles.
      GetModChannelRoles: () => ({ data: { modChannelRoles: [] } }),
    });

    try {
      await page.goto('/admin/roles', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'Server Roles' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('server membership confirms before removing an admin', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      getServerConfig: () => ({
        data: {
          serverConfigs: [
            buildServerPermissionsConfig({
              SuperAdmins: [{ username: TEST_USER }],
              Admins: [{ username: TEST_USER, displayName: 'Alice' }],
            }),
          ],
        },
      }),
      GetModChannelRoles: () => ({ data: { modChannelRoles: [] } }),
    });

    try {
      await page.goto('/admin/suspensions/server-membership', {
        waitUntil: 'domcontentloaded',
      });
      await page.getByRole('button', { name: 'Remove' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText(
        'Remove u/alice from the current server admins?'
      );
      await expectNoAxeViolations(page);

      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).toBeHidden();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
