import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_USER = 'alice';
const ALBUM_ID = 'album-1';

const buildAlbum = (overrides = {}) => ({
  id: ALBUM_ID,
  imageOrder: ['img-1'],
  Owner: { username: TEST_USER, displayName: 'Alice' },
  Images: [
    {
      id: 'img-1',
      url: 'https://img.test/sunset.png',
      alt: 'A sunset',
      caption: 'Sunset over the hills',
      createdAt: '2024-01-01T00:00:00.000Z',
      Uploader: { username: TEST_USER, displayName: 'Alice' },
    },
  ],
  Discussions: [],
  ...overrides,
});

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: { users: [buildBasicUser({ username, displayName: 'Alice' })] },
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
  GetAlbumDetails: () => ({ data: { albums: [buildAlbum()] } }),
});

test.describe('User album detail', () => {
  test('renders an album with its owner and images', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, getBaseMocks(TEST_USER));

    try {
      await page.goto(`/u/${TEST_USER}/albums/${ALBUM_ID}`);

      await expect(
        page.getByRole('heading', { name: /Album by Alice/ })
      ).toBeVisible();
      await expect(page.getByText('Sunset over the hills')).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetAlbumDetails'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('shows the not-found state for a missing album', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      GetAlbumDetails: () => ({ data: { albums: [] } }),
    });

    try {
      await page.goto(`/u/${TEST_USER}/albums/${ALBUM_ID}`);

      await expect(
        page.getByRole('heading', { name: 'Album Not Found' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
