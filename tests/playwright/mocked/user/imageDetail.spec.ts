import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_USER = 'alice';
const IMAGE_ID = 'image-1';

const buildAlbum = (overrides = {}) => ({
  id: 'album-1',
  imageOrder: [IMAGE_ID],
  Owner: {
    username: TEST_USER,
    displayName: 'Alice',
  },
  Images: [],
  Discussions: [],
  ...overrides,
});

const buildImage = (overrides = {}) => ({
  id: IMAGE_ID,
  url: 'https://img.test/photo.png',
  alt: 'A scenic photo',
  caption: 'Sunset over the hills',
  copyright: '',
  longDescription: '',
  hasSensitiveContent: false,
  hasSpoiler: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  scanCheckedAt: '2024-01-01T00:00:00.000Z',
  Uploader: {
    username: TEST_USER,
    displayName: 'Alice',
    profilePicURL: '',
  },
  Albums: [],
  ...overrides,
});

const buildImageAlbumUsage = (overrides = {}) => ({
  imageId: IMAGE_ID,
  uploaderUsername: TEST_USER,
  uploaderOwnedAlbums: [],
  otherAlbums: [],
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
  GetImageDetails: () => ({ data: { images: [buildImage()] } }),
  GetImageAlbumUsage: () => ({
    data: { getImageAlbumUsage: buildImageAlbumUsage() },
  }),
});

test.describe('User image detail', () => {
  test('renders an image with its uploader and caption', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, getBaseMocks(TEST_USER));

    try {
      await page.goto(`/u/${TEST_USER}/images/${IMAGE_ID}`);

      await expect(page.getByText('Image uploaded by Alice')).toBeVisible();
      await expect(
        page.getByText('Sunset over the hills', { exact: true })
      ).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetImageDetails'
      );
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetImageAlbumUsage'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('warns when the route user is not the uploader', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      GetImageDetails: () => ({
        data: {
          images: [
            buildImage({
              Uploader: {
                username: 'bob',
                displayName: 'Bob',
                profilePicURL: '',
              },
            }),
          ],
        },
      }),
    });

    try {
      // Route says /u/alice but the image was uploaded by bob.
      await page.goto(`/u/${TEST_USER}/images/${IMAGE_ID}`);

      await expect(
        page.getByText(/uploaded by bob, not/i)
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('groups album usage by uploader-owned and other-user albums', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const uploaderAlbum = buildAlbum({
      id: 'album-uploader',
      Images: [
        {
          id: 'image-2',
          url: 'https://img.test/other.png',
          alt: 'Another scenic photo',
          caption: 'Another image',
          Uploader: { username: TEST_USER },
        },
      ],
      Discussions: [
        {
          id: 'discussion-1',
          title: 'Alice album discussion',
          createdAt: '2024-01-02T00:00:00.000Z',
          Author: { username: TEST_USER, displayName: 'Alice' },
          DiscussionChannels: [
            { id: 'channel-1', channelUniqueName: 'sims4_builds' },
          ],
        },
      ],
    });

    const otherUserAlbum = buildAlbum({
      id: 'album-other',
      Owner: {
        username: 'bob',
        displayName: 'Bob',
      },
      Discussions: [
        {
          id: 'discussion-2',
          title: 'Bob remixed this album',
          createdAt: '2024-01-03T00:00:00.000Z',
          Author: { username: 'bob', displayName: 'Bob' },
          DiscussionChannels: [
            { id: 'channel-1', channelUniqueName: 'sims4_builds' },
          ],
        },
      ],
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      GetImageDetails: () => ({
        data: {
          images: [
            buildImage({
              Albums: [uploaderAlbum],
            }),
          ],
        },
      }),
      GetImageAlbumUsage: () => ({
        data: {
          getImageAlbumUsage: buildImageAlbumUsage({
            uploaderOwnedAlbums: [uploaderAlbum],
            otherAlbums: [otherUserAlbum],
          }),
        },
      }),
    });

    try {
      await page.goto(`/u/${TEST_USER}/images/${IMAGE_ID}`);

      await expect(page.getByText('Albums by the uploader')).toBeVisible();
      await expect(page.getByText('Album by Alice')).toBeVisible();
      await expect(page.getByText('Alice album discussion')).toBeVisible();
      await expect(page.getByText('Albums by other users')).toBeVisible();
      await expect(page.getByText('Album by Bob')).toBeVisible();
      await expect(page.getByText('Bob remixed this album')).toBeVisible();
      await expect(page.getByText('Other images in this album:')).toBeVisible();
      await expect(page.getByAltText('Another scenic photo')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
