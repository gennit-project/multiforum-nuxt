import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const WIKI_PAGE_ID = 'wiki-page-1';

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
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
          overrides: { eventsEnabled: true, wikiEnabled: true },
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

const buildWikiPage = (overrides = {}) => ({
  __typename: 'WikiPage',
  id: WIKI_PAGE_ID,
  title: 'Test Wiki Page',
  body: 'This is the current wiki content',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  Author: { username: 'bob', displayName: 'Bob' },
  VersionAuthor: { username: 'alice', displayName: 'Alice' },
  PastVersions: [
    {
      id: 'v1',
      body: 'This is the original content',
      createdAt: '2024-01-01T00:00:00Z',
      Author: { username: 'bob', displayName: 'Bob' },
      AuthorConnection: {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      },
    },
  ],
  Channel: {
    uniqueName: TEST_CHANNEL,
  },
  ...overrides,
});

test.describe('Wiki moderation', () => {
  test('wiki page loads without errors', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getWikiPage: () => ({
        data: {
          wikiPages: [buildWikiPage()],
        },
      }),
      getWikiPageByTitle: () => ({
        data: {
          wikiPages: [buildWikiPage()],
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/wiki/${WIKI_PAGE_ID}`);

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
});
