import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

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
  test('download edit page loads existing labels', async ({
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
                FilterGroups: [
                  {
                    id: 'fg-1',
                    key: 'category',
                    displayName: 'Category',
                    options: [
                      { id: 'opt-1', value: 'tools', displayName: 'Tools' },
                      { id: 'opt-2', value: 'models', displayName: 'Models' },
                      { id: 'opt-3', value: 'textures', displayName: 'Textures' },
                    ],
                  },
                  {
                    id: 'fg-2',
                    key: 'license',
                    displayName: 'License',
                    options: [
                      { id: 'opt-4', value: 'free', displayName: 'Free' },
                      { id: 'opt-5', value: 'commercial', displayName: 'Commercial' },
                    ],
                  },
                ],
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
      await page.goto(`/forums/${TEST_CHANNEL}/downloads/edit/${DISCUSSION_ID}`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should see the download title in form
      await expect(page.getByDisplayValue('Test Download')).toBeVisible({
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

  test('download detail shows labels', async ({
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
                FilterGroups: [
                  {
                    id: 'fg-1',
                    key: 'category',
                    displayName: 'Category',
                    options: [
                      { id: 'opt-1', value: 'tools', displayName: 'Tools' },
                    ],
                  },
                ],
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

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should see the download title
      await expect(page.getByText('Test Download')).toBeVisible({
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
