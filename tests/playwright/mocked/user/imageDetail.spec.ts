import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
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
  getUserFavoriteImage: () => ({
    data: { users: [{ username, FavoriteImages: [] }] },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: { users: [{ username, Collections: [] }] },
  }),
  getServerConfig: () => ({
    data: { serverConfigs: [buildServerConfig({ serverName: 'Listical' })] },
  }),
  GetImageDetails: () => ({ data: { images: [buildImage()] } }),
  GetUserAlbumsForImageSave: () => ({ data: { albums: [] } }),
  GetUserCollectionsImages: () => ({
    data: {
      users: [
        {
          username,
          Collections: [],
          FavoriteImages: [],
        },
      ],
    },
  }),
  CheckImageInCollections: () => ({
    data: { users: [{ username, Collections: [] }] },
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

    const diagnostics = await installGraphqlMocks(
      page,
      getBaseMocks(TEST_USER)
    );

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

      await expect(page.getByText(/uploaded by bob, not/i)).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('saves another user image to the logged-in user album', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const bobImage = buildImage({
      Uploader: {
        username: 'bob',
        displayName: 'Bob',
        profilePicURL: '',
      },
    });
    const aliceAlbum = buildAlbum({
      id: 'album-alice',
      imageOrder: [],
      Discussions: [
        {
          id: 'discussion-alice-album',
          title: 'Alice inspiration board',
          createdAt: '2024-01-04T00:00:00.000Z',
          Author: { username: TEST_USER, displayName: 'Alice' },
          DiscussionChannels: [
            { id: 'channel-1', channelUniqueName: 'sims4_builds' },
          ],
        },
      ],
      ImagesAggregate: { count: 2 },
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      GetImageDetails: () => ({ data: { images: [bobImage] } }),
      GetUserAlbumsForImageSave: () => ({
        data: {
          albums: [{ ...aliceAlbum, matchingImages: [] }],
        },
      }),
      AddImageToAlbum: ({ body }) => {
        expect(body.variables).toEqual({
          albumId: 'album-alice',
          imageId: IMAGE_ID,
        });
        return { data: { addImageToAlbum: true } };
      },
    });

    try {
      await page.goto('/u/bob/images/image-1');

      await page.getByRole('button', { name: 'Save to album' }).click();
      await expect(
        page.getByRole('heading', { name: 'Save image to album' })
      ).toBeVisible();
      await page
        .getByRole('button', { name: /Alice inspiration board/ })
        .click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'AddImageToAlbum'
      );
      await expect(
        page.getByRole('heading', { name: 'Save image to album' })
      ).not.toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('opens the existing image collection save modal', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(
      page,
      getBaseMocks(TEST_USER)
    );

    try {
      await page.goto(`/u/${TEST_USER}/images/${IMAGE_ID}`);

      await page.getByRole('button', { name: 'Save to collection' }).click();
      await expect(
        page.getByRole('dialog', { name: 'Add to List' })
      ).toBeVisible();
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetUserCollectionsImages'
      );
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'CheckImageInCollections'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
