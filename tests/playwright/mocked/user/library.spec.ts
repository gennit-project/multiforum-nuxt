import { test, expect } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
  DEFAULT_USERNAME,
} from '../../helpers/graphqlFixtures';

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: {
      users: [buildBasicUser({ username, displayName: username })],
    },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          __typename: 'User',
          username,
          notifyOnReplyToCommentByDefault: true,
          notifyOnReplyToDiscussionByDefault: true,
          notifyOnReplyToEventByDefault: true,
        },
      ],
    },
  }),
  getUserActiveSuspensions: () => ({
    data: {
      users: [{ username, Suspensions: [] }],
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
      serverConfigs: [buildServerConfig({ serverName: 'Listical' })],
    },
  }),
  getServerRules: () => ({
    data: {
      serverConfigs: [{ rules: '[]' }],
    },
  }),
  getChannelNames: () => ({
    data: {
      channels: [],
    },
  }),
  // Library-specific queries
  getUserFavoriteCounts: () => ({
    data: {
      users: [
        {
          __typename: 'User',
          username,
          FavoriteChannelsConnection: { totalCount: 3 },
          FavoriteImagesConnection: { totalCount: 5 },
          FavoriteCommentsConnection: { totalCount: 8 },
          FavoriteDiscussionsConnection: { totalCount: 12 },
          FavoriteDownloadsConnection: { totalCount: 2 },
        },
      ],
    },
  }),
  getUserOwnedDownloadsCount: () => ({
    data: {
      users: [
        {
          __typename: 'User',
          username,
          OwnedDownloadsAggregate: { count: 7 },
        },
      ],
    },
  }),
  getUploadedDownloadableFiles: () => ({
    data: { getUploadedDownloadableFiles: [] },
  }),
  GetAllUserCollections: () => ({
    data: {
      users: [
        {
          __typename: 'User',
          username,
          Collections: [
            {
              __typename: 'Collection',
              id: 'downloads-1',
              name: 'Downloaded Items',
              description:
                'Items appear here automatically when you download them.',
              itemCount: 7,
              visibility: 'PRIVATE',
              collectionType: 'DOWNLOADS',
            },
            {
              __typename: 'Collection',
              id: 'custom-collection-1',
              name: 'My Reading List',
              description: 'Articles to read later',
              itemCount: 15,
              visibility: 'PRIVATE',
              collectionType: 'DISCUSSIONS',
            },
          ],
        },
      ],
    },
  }),
  GetUnifiedLibraryFavorites: () => ({
    data: {
      users: [
        {
          __typename: 'User',
          username,
          FavoriteDiscussions: [
            {
              __typename: 'Discussion',
              id: 'favorite-discussion-1',
              title: 'Compact community spaces',
              body: 'A discussion about making community tools feel calmer.',
              createdAt: '2026-09-29T18:00:00.000Z',
              hasDownload: false,
              Author: {
                __typename: 'User',
                username: 'maya',
                displayName: 'Maya',
                profilePicURL: '',
              },
              DiscussionChannels: [
                {
                  __typename: 'DiscussionChannel',
                  channelUniqueName: 'design',
                  Channel: {
                    __typename: 'Channel',
                    uniqueName: 'design',
                    displayName: 'Design Forum',
                    channelIconURL: '',
                  },
                },
              ],
              Album: {
                __typename: 'Album',
                id: 'favorite-album-1',
                imageOrder: [],
                Images: [],
              },
            },
          ],
          FavoriteImages: [
            {
              __typename: 'Image',
              id: 'favorite-image-1',
              url: '/images/placeholder.jpg',
              alt: 'A colorful abstract poster',
              caption: 'Color study',
              createdAt: '2026-09-28T18:00:00.000Z',
              Uploader: {
                __typename: 'User',
                username: 'zoe',
                displayName: 'Zoe',
                profilePicURL: '',
              },
              Albums: [],
            },
          ],
          FavoriteComments: [],
          FavoriteChannels: [],
        },
      ],
    },
  }),
});

const waitForLibraryData = async (
  completedOperations: Array<{ operationName: string }>
) => {
  const requiredOperations = [
    'GetUnifiedLibraryFavorites',
    'getUserFavoriteCounts',
    'getUserOwnedDownloadsCount',
    'getUploadedDownloadableFiles',
    'GetAllUserCollections',
  ];
  await expect
    .poll(
      () =>
        requiredOperations.every((requiredOperation) =>
          completedOperations.some(
            (operation) => operation.operationName === requiredOperation
          )
        ),
      { timeout: 60000 }
    )
    .toBe(true);
};

test.describe('Library page', () => {
  test.describe.configure({ timeout: 120000 });
  test('loads library page without errors', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);

    await expect(
      page.getByRole('heading', { name: 'Your Library' })
    ).toBeVisible({
      timeout: 30000,
    });

    // Page should load without JavaScript errors
    expect(diagnostics.pageErrors).toEqual([]);
    expect(
      diagnostics.consoleErrors.filter((message) =>
        /hydration|server rendered/i.test(message)
      )
    ).toEqual([]);
  });

  test('displays filter buttons', async ({ page, setupMockedPage }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);

    const filters = page.getByLabel('Filter favorite items');
    await expect(filters.getByRole('button', { name: 'All' })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      filters.getByRole('button', { name: 'Discussions' })
    ).toBeVisible();
    await expect(filters.getByRole('button', { name: 'Images' })).toBeVisible();
    await expect(
      filters.getByRole('button', { name: 'Comments' })
    ).toBeVisible();
    await expect(
      filters.getByRole('button', { name: 'Downloads' })
    ).toBeVisible();
    await expect(filters.getByRole('button', { name: 'Forums' })).toBeVisible();
  });

  test('displays My Downloads section', async ({ page, setupMockedPage }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);

    // Check My Downloads section - use the link locator which is more specific
    await expect(page.getByRole('link', { name: /My Downloads/i })).toBeVisible(
      { timeout: 10000 }
    );
  });

  test('links My Downloads to the auto-saved downloads collection when it exists', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);

    const downloads = page.getByRole('link', { name: /My Downloads/i });
    await expect(downloads).toHaveAttribute('href', '/library/my-downloads');
    await expect(downloads).toContainText('Downloads · 7');
  });

  test('displays one mixed favorites entry', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);

    await expect(page.getByTestId('library-item-all-favorites')).toContainText(
      '30 saved'
    );
  });

  test('displays custom collections in the same flat list', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);

    await expect(
      page.getByRole('link', { name: /My Reading List/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('links both the source forum and original uploader', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);

    const favorite = page.getByTestId(
      'library-favorite-discussion-favorite-discussion-1'
    );
    await expect(
      favorite.getByRole('link', { name: 'Design Forum' }).first()
    ).toHaveAttribute('href', '/forums/design');
    await expect(
      favorite.getByRole('link', { name: '@maya' }).first()
    ).toHaveAttribute('href', '/u/maya');
  });

  test('puts collection and removal actions in the row menu', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');
    await waitForLibraryData(diagnostics.completedOperations);
    await page
      .getByRole('button', { name: 'Actions for Compact community spaces' })
      .click();

    await expect(
      page.getByRole('menuitem', { name: 'Add to collection' })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Remove from favorites' })
    ).toBeVisible();
  });
});
