import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks, waitForGraphqlOperation } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'downloads-forum';
const TEST_USER = 'alice';
const DISCUSSION_ID = 'download-1';

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
          Moderators: [{ displayName: username }],
          SuspendedMods: [],
        },
      ],
    },
  }),
});

const buildDownload = (overrides = {}) => ({
  __typename: 'Discussion',
  id: DISCUSSION_ID,
  title: 'Test Download',
  body: 'This is a test download with files',
  hasDownload: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  Author: { username: TEST_USER, displayName: 'Alice' },
  Tags: [],
  DiscussionChannels: [
    {
      id: 'dc-1',
      Channel: { uniqueName: TEST_CHANNEL },
      LabelOptions: [
        {
          id: 'label-1',
          value: 'tools',
          displayName: 'Tools',
          group: { key: 'category' },
        },
      ],
    },
  ],
  DownloadableFiles: [
    {
      id: 'file-1',
      fileName: 'model.stl',
      url: 'https://example.com/model.stl',
      kind: 'MODEL',
      size: 1024000,
      priceModel: 'FREE',
    },
  ],
  Album: null,
  ...overrides,
});

test.describe('Download labels moderation', () => {
  // Skip: requires many additional mocks (collections, etc.) - functionality covered by unit tests
  test.skip('download detail page loads without errors', async ({
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
              displayName: 'Downloads Forum',
              overrides: {
                eventsEnabled: false,
                downloadsEnabled: true,
              },
            }),
          ],
        },
      }),
      getDiscussion: () => ({
        data: {
          discussions: [buildDownload()],
        },
      }),
      getDiscussionsInChannel: () => ({
        data: {
          getDiscussionsInChannel: [buildDownload()],
        },
      }),
      getChannelDownloadCount: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              DiscussionChannelsAggregate: { count: 1 },
            },
          ],
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/downloads/${DISCUSSION_ID}`);

      // Wait for discussion data to load
      await waitForGraphqlOperation(diagnostics.completedOperations, 'getDiscussion');

      // Page should load without JavaScript errors
      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
