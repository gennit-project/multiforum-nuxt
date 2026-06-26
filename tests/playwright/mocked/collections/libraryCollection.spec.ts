import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_USER = 'alice';
const COLLECTION_ID = 'collection-1';

const buildCollectionItems = (overrides = {}) => ({
  id: COLLECTION_ID,
  name: 'My Test Collection',
  description: 'A collection owned by the current user.',
  collectionType: 'DISCUSSIONS',
  visibility: 'PRIVATE',
  itemCount: 0,
  itemOrder: [],
  Discussions: [],
  Comments: [],
  Images: [],
  Channels: [],
  Downloads: [],
  ...overrides,
});

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
    data: { serverConfigs: [buildServerConfig({ serverName: 'Listical' })] },
  }),
  // library.vue parent shell counts
  GetAllUserCollections: () => ({
    data: { users: [{ username, Collections: [] }] },
  }),
  getUserFavoriteCounts: () => ({ data: { users: [{ username }] } }),
  getUserFavoriteDownloadsCount: () => ({ data: { users: [{ username }] } }),
  getUserOwnedDownloadsCount: () => ({ data: { users: [{ username }] } }),
  // the collection detail
  GetCollectionItems: () => ({
    data: { collections: [buildCollectionItems()] },
  }),
});

test.describe('Library collection detail', () => {
  test('renders an owned collection by name', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, getBaseMocks(TEST_USER));

    try {
      await page.goto(`/library/${COLLECTION_ID}`);

      await expect(page.getByText('My Test Collection').first()).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetCollectionItems'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
