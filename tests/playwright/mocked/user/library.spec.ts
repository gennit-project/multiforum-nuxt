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
          username,
          FavoriteChannelsAggregate: { count: 3 },
          FavoriteImagesAggregate: { count: 5 },
          FavoriteCommentsAggregate: { count: 8 },
          FavoriteDiscussionsAggregate: { count: 12 },
        },
      ],
    },
  }),
  getUserFavoriteDownloadsCount: () => ({
    data: {
      users: [
        {
          username,
          FavoriteDiscussionsAggregate: { count: 2 },
        },
      ],
    },
  }),
  getUserOwnedDownloadsCount: () => ({
    data: {
      users: [
        {
          username,
          OwnedDownloadsAggregate: { count: 7 },
        },
      ],
    },
  }),
  GetAllUserCollections: () => ({
    data: {
      users: [
        {
          username,
          Collections: [
            {
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
});

test.describe('Library page', () => {
  test('loads library page without errors', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check that the Library header is visible
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible({ timeout: 10000 });

    // Page should load without JavaScript errors
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('displays filter buttons', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check that filter buttons are present
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Discussions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Images' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comments' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Downloads' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forums' })).toBeVisible();
  });

  test('displays My Downloads section', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check My Downloads section - use the link locator which is more specific
    await expect(page.getByRole('link', { name: /My Downloads/i })).toBeVisible({ timeout: 10000 });
  });

  test('displays Favorites section', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check that favorite sections are displayed (the sidebar "Favorites"
    // heading specifically — use exact match so it doesn't also match the
    // "...your favorites..." copy in the /library placeholder).
    await expect(
      page.getByText('Favorites', { exact: true })
    ).toBeVisible({ timeout: 10000 });
  });

  test('displays Your Collections section', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/library');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check that Your Collections header is displayed
    await expect(page.getByText('Your Collections')).toBeVisible({ timeout: 10000 });
  });
});
