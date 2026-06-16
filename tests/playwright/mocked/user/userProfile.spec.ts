import { test, expect } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
  DEFAULT_USERNAME,
} from '../../helpers/graphqlFixtures';

const PROFILE_USERNAME = 'testuser';

type MockHandlerInput = {
  body: {
    operationName?: string;
    variables?: Record<string, unknown>;
  };
};

const getBaseMocks = (loggedInUsername: string) => ({
  // This query is called with the profile username from route params
  getBasicUserInfo: ({ body }: MockHandlerInput) => {
    const username = (body.variables?.username as string) || PROFILE_USERNAME;
    return {
      data: {
        users: [
          buildBasicUser({
            username,
            displayName: username,
            bio: 'Test bio for ' + username,
            commentKarma: 42,
            discussionKarma: 100,
          }),
        ],
      },
    };
  },
  getUser: () => ({
    data: {
      users: [
        {
          username: loggedInUsername,
          notifyOnReplyToCommentByDefault: true,
          notifyOnReplyToDiscussionByDefault: true,
          notifyOnReplyToEventByDefault: true,
        },
      ],
    },
  }),
  getUserActiveSuspensions: () => ({
    data: {
      users: [{ username: loggedInUsername, Suspensions: [] }],
    },
  }),
  getUserFavorites: () => ({
    data: {
      users: [{ username: loggedInUsername, FavoriteChannels: [], Collections: [] }],
    },
  }),
  GetUserFavoriteChannels: () => ({
    data: {
      users: [{ username: loggedInUsername, FavoriteChannels: [] }],
    },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: {
      users: [{ username: loggedInUsername, Collections: [] }],
    },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({
          serverName: 'Listical',
        }),
      ],
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
  getUserContributions: () => ({
    data: {
      getUserContributions: [],
    },
  }),
  getUserComments: ({ body }: MockHandlerInput) => {
    const username = (body.variables?.username as string) || PROFILE_USERNAME;
    return {
      data: {
        users: [
          {
            username,
            profilePicURL: '',
            CommentsAggregate: { count: 0 },
            Comments: [],
          },
        ],
      },
    };
  },
});

test.describe('User profile page', () => {
  test('loads user profile page without errors', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    // Navigate to the profile page - /u/[username] redirects to /u/[username]/comments
    await page.goto(`/u/${PROFILE_USERNAME}/comments`);

    // Wait for the profile to render before checking for errors
    await expect(
      page.getByRole('link', { name: 'Comments' })
    ).toBeVisible({ timeout: 10000 });

    // Page should load without JavaScript errors
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('displays profile tabs', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto(`/u/${PROFILE_USERNAME}/comments`);

    // Check that profile tabs are present
    await expect(page.getByRole('link', { name: 'Comments' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Discussions' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Events' })).toBeVisible();
  });

  test('displays contribution chart', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto(`/u/${PROFILE_USERNAME}/comments`);

    // Check that contribution chart is present
    await expect(page.getByRole('region', { name: 'Contribution chart' })).toBeVisible({ timeout: 10000 });
  });

  test('displays year selector for contributions', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto(`/u/${PROFILE_USERNAME}/comments`);

    // Check that year selector is present
    await expect(page.getByRole('combobox', { name: /Year/i })).toBeVisible({ timeout: 10000 });
  });
});
