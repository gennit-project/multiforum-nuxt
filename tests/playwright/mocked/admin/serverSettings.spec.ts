import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
  buildServerPermissionsConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Server settings pages (admin/settings/*) read the single ServerConfig and let
// an admin edit it. These are admin-only configuration surfaces that had no
// end-to-end coverage; here we verify each tab renders its form for an admin.
const TEST_USER = 'alice';

const getMocks = (overrides: { enableDownloads?: boolean } = {}) => ({
  getBasicUserInfo: () => ({
    data: { users: [buildBasicUser({ username: TEST_USER, displayName: TEST_USER })] },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          username: TEST_USER,
          notifyOnReplyToDiscussionByDefault: true,
          notifyOnReplyToEventByDefault: true,
        },
      ],
    },
  }),
  getUserFavorites: () => ({
    data: { users: [{ username: TEST_USER, FavoriteChannels: [], Collections: [] }] },
  }),
  GetUserFavoriteChannels: () => ({
    data: { users: [{ username: TEST_USER, FavoriteChannels: [] }] },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: { users: [{ username: TEST_USER, Collections: [] }] },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({
          serverName: 'Listical',
          enableEvents: true,
          enableDownloads: overrides.enableDownloads ?? true,
        }),
      ],
    },
  }),
});

test.describe('Server settings (admin)', () => {
  test('downloads tab renders the enable-downloads toggle', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, getMocks({ enableDownloads: true }));

    try {
      await page.goto('/admin/settings/downloads', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByText('Enable downloads tab in individual forums')
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  const tabs = [
    { path: 'basic', text: 'Server Description' },
    { path: 'calendar', text: 'Enable events/calendar tab in individual forums' },
    { path: 'rules', text: 'Forum Rules' },
  ];

  for (const tab of tabs) {
    test(`${tab.path} tab renders its settings form`, async ({
      context,
      page,
    }, testInfo) => {
      await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
      const diagnostics = await installGraphqlMocks(page, getMocks());

      try {
        await page.goto(`/admin/settings/${tab.path}`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(tab.text)).toBeVisible();
      } finally {
        await testInfo.attach('graphql-operations.json', {
          body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
          contentType: 'application/json',
        });
      }
    });
  }

  test('roles tab renders the server roles content', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...getMocks(),
      getServerConfig: () => ({
        data: {
          serverConfigs: [buildServerPermissionsConfig()],
        },
      }),
      GetModChannelRoles: () => ({ data: { modChannelRoles: [] } }),
    });

    try {
      await page.goto('/admin/settings/roles', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Server Roles' })).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
