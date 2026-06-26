import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_USER = 'alice';
const REGISTRY_URL = 'https://registry.test/plugins';

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: { users: [buildBasicUser({ username, displayName: username })] },
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
    data: { users: [{ username, FavoriteChannels: [], Collections: [] }] },
  }),
  GetUserFavoriteChannels: () => ({
    data: { users: [{ username, FavoriteChannels: [] }] },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: { users: [{ username, Collections: [] }] },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({
          serverName: 'Listical',
          pluginRegistries: [REGISTRY_URL],
        }),
      ],
    },
  }),
});

test.describe('Server plugin registries', () => {
  test('lists the configured plugin registries', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, getBaseMocks(TEST_USER));

    try {
      await page.goto('/admin/settings/plugins/registries');

      await expect(page.getByText('Current Registries (1)')).toBeVisible();
      await expect(page.getByText(REGISTRY_URL)).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'getServerConfig'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
