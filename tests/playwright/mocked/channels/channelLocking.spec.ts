import { expect, test } from '../../helpers/testFixture';
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
  getUserSuspensionInChannel: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, SuspendedUsers: [] }],
    },
  }),
  getModsByChannel: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, Moderators: [] }],
    },
  }),
});

// The form-level notice every locked create surface shows. Distinct from the
// ChannelLockedBanner copy in the forum layout, so asserting it targets the
// create form specifically rather than the page banner.
const LOCKED_CREATE_NOTICE =
  /New discussions, events, and comments cannot be created/i;

const lockedChannelMocks = (username: string) => ({
  ...getBaseMocks(username),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
          displayName: 'Locked Forum',
          overrides: {
            eventsEnabled: true,
            locked: true,
            lockReason: 'Spam wave',
          },
        }),
      ],
    },
  }),
  getDiscussionsInChannel: () => ({
    data: { getDiscussionsInChannel: [] },
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

  test('locked banner is shown on the events tab too (layout-level banner)', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...lockedChannelMocks(TEST_USER),
      getEvents: () => ({ data: { events: [] } }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/events`);

      await expect(
        page.getByText(/This forum is locked/i).first()
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('locked forum blocks discussion creation with an explanation', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, lockedChannelMocks(TEST_USER));

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/create`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(LOCKED_CREATE_NOTICE)).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('locked forum blocks event creation with an explanation', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, lockedChannelMocks(TEST_USER));

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(LOCKED_CREATE_NOTICE)).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
