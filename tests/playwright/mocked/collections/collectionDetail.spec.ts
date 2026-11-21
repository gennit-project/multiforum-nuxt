import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_USER = 'alice';
const COLLECTION_ID = 'collection-1';
const COLLECTION_OWNER = 'bob';
const COLLECTION_NUMBER = 1;

const buildPublicCollection = (overrides = {}) => ({
  id: COLLECTION_ID,
  collectionNumber: COLLECTION_NUMBER,
  ownerUsername: COLLECTION_OWNER,
  name: 'My Favorite Models',
  description: 'A public collection of 3D models.',
  visibility: 'PUBLIC',
  collectionType: 'DOWNLOADS',
  itemCount: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  CreatedBy: {
    username: 'bob',
    displayName: 'Bob',
    profilePicURL: '',
  },
  DownloadsConnection: { aggregate: { count: { nodes: 1 } } },
  Downloads: [
    {
      id: 'download-1',
      title: 'Cool Widget',
      createdAt: '2024-01-01T00:00:00.000Z',
      hasSensitiveContent: false,
      Album: { id: 'album-1', imageOrder: [], Images: [] },
      DiscussionChannels: [
        { id: 'dc-1', channelUniqueName: 'cats', discussionNumber: 1 },
      ],
    },
  ],
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
  // The route carries the collection number; the page resolves it to the global id.
  getCollectionIdByNumber: () => ({
    data: { getCollectionIdByNumber: COLLECTION_ID },
  }),
  GetPublicCollectionById: () => ({
    data: { collections: [buildPublicCollection()] },
  }),
});

test.describe('Public collection detail', () => {
  test('renders a public collection and its items', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, getBaseMocks(TEST_USER));

    try {
      // Signed-in alice views bob's collection, so she gets the public view.
      await page.goto(
        `/u/${COLLECTION_OWNER}/collections/${COLLECTION_NUMBER}-my-favorite-models`
      );

      await expect(
        page.getByRole('heading', { name: 'My Favorite Models' })
      ).toBeVisible();
      await expect(
        page.getByText('A public collection of 3D models.')
      ).toBeVisible();
      await expect(page.getByText('Cool Widget')).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetPublicCollectionById'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
