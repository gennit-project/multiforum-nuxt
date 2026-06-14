import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'locked-forum';
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
  getChannelTags: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, Tags: [] }],
    },
  }),
  getTags: () => ({
    data: { tags: [] },
  }),
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [],
          SuspendedUsers: [],
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
});

test.describe('Channel locking', () => {
  test('locked channel page loads without errors', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getChannel: () => ({
        data: {
          channels: [
            buildChannel({
              uniqueName: TEST_CHANNEL,
              displayName: 'Locked Forum',
              overrides: {
                eventsEnabled: true,
                locked: true,
              },
            }),
          ],
        },
      }),
      getDiscussionsInChannel: () => ({
        data: {
          getDiscussionsInChannel: [],
        },
      }),
      getChannelDownloadCount: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              DiscussionChannelsAggregate: { count: 0 },
            },
          ],
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Page should load without JavaScript errors
      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('unlocked channel does not show banner', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getChannel: () => ({
        data: {
          channels: [
            buildChannel({
              uniqueName: TEST_CHANNEL,
              displayName: 'Normal Forum',
              overrides: {
                eventsEnabled: true,
                locked: false,
              },
            }),
          ],
        },
      }),
      getDiscussionsInChannel: () => ({
        data: {
          getDiscussionsInChannel: [],
        },
      }),
      getChannelDownloadCount: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              DiscussionChannelsAggregate: { count: 0 },
            },
          ],
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should NOT see the locked banner
      await expect(page.getByText(/This forum is locked/i)).not.toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
