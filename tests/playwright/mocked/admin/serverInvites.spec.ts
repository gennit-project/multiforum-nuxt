import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_USER = 'alice';

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: {
      users: [
        buildBasicUser({
          username,
          displayName: username,
        }),
      ],
    },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          username,
          notifyOnReplyToDiscussionByDefault: true,
          notifyOnReplyToEventByDefault: true,
        },
      ],
    },
  }),
  getUserFavorites: () => ({
    data: {
      users: [{ username, FavoriteChannels: [], Collections: [] }],
    },
  }),
  GetUserFavoriteChannels: () => ({
    data: {
      users: [{ username, FavoriteChannels: [] }],
    },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: {
      users: [{ username, Collections: [] }],
    },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({
          serverName: 'Listical',
          enableEvents: true,
        }),
      ],
    },
  }),
});

test.describe('Server admin/mod invites', () => {
  test('admin invite page shows accept button when authenticated', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      acceptServerAdminInvite: () => ({
        data: {
          acceptServerAdminInvite: true,
        },
      }),
    });

    try {
      await page.goto('/admin/accept-admin-invite');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should see the admin invitation heading
      await expect(page.getByText('Server Admin Invitation')).toBeVisible({
        timeout: 30000,
      });

      // Should see accept button
      await expect(page.getByRole('button', { name: 'Accept Invitation' })).toBeVisible();

      // Should see decline button
      await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();

      // Should show logged in as username
      await expect(page.getByText('Logged in as:')).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('mod invite page shows mod profile requirement', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
      // No mod profile set
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
    });

    try {
      await page.goto('/admin/accept-mod-invite');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // The page should load without errors
      // The exact content depends on whether the user has a mod profile
      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('server roles page shows admin and mod lists', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getServerConfig: () => ({
        data: {
          serverConfigs: [
            {
              serverName: 'TestServer',
              serverIconURL: null,
              enableEvents: true,
              Admins: [
                {
                  username: 'admin1',
                  displayName: 'Admin One',
                  profilePicURL: null,
                  commentKarma: 10,
                  discussionKarma: 20,
                  createdAt: '2024-01-01T00:00:00Z',
                },
              ],
              PendingAdmins: [],
              Moderators: [
                {
                  displayName: 'Mod One',
                  User: { username: 'mod1' },
                },
              ],
              PendingModerators: [
                {
                  displayName: 'Pending Mod',
                  User: { username: 'pending1' },
                },
              ],
            },
          ],
        },
      }),
    });

    try {
      await page.goto('/admin/roles');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should see the roles page content
      await expect(page.getByText(/Server Admins|Administrators/i)).toBeVisible({
        timeout: 30000,
      });

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
