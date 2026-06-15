import { test, expect } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
  DEFAULT_USERNAME,
} from '../../helpers/graphqlFixtures';

const TEST_EMAIL = 'test@example.com';
const TEST_DISPLAY_NAME = 'Test User';
const TEST_BIO = 'This is my test bio.';

const buildAccountUser = (overrides = {}) =>
  buildBasicUser({
    username: DEFAULT_USERNAME,
    displayName: TEST_DISPLAY_NAME,
    bio: TEST_BIO,
    Email: { address: TEST_EMAIL },
    notifyOnReplyToCommentByDefault: true,
    notifyOnReplyToDiscussionByDefault: false,
    notifyOnReplyToEventByDefault: true,
    notifyWhenTagged: true,
    notifyOnSubscribedIssueUpdates: true,
    notifyOnFeedback: false,
    notifyOnSuspensionBlocks: true,
    notificationBundleInterval: 'hourly',
    notificationBundleEnabled: true,
    enableSensitiveContentByDefault: false,
    ...overrides,
  });

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: {
      users: [buildAccountUser()],
    },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          username,
          notifyOnReplyToCommentByDefault: true,
          notifyOnReplyToDiscussionByDefault: false,
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
  updateUsers: () => ({
    data: {
      updateUsers: {
        users: [buildAccountUser()],
      },
    },
  }),
});

test.describe('Account settings page', () => {
  test('loads and displays user settings', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: DEFAULT_USERNAME,
      email: TEST_EMAIL,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/account_settings');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check that the email is displayed
    await expect(page.getByText(TEST_EMAIL)).toBeVisible({ timeout: 10000 });

    // Check that basic account sections are visible
    await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible();

    // Page should load without JavaScript errors
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('displays notification preferences checkboxes', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      email: TEST_EMAIL,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/account_settings');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check that notification checkboxes are visible
    await expect(page.getByTestId('notify-comment-reply')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('notify-discussion-reply')).toBeVisible();
    await expect(page.getByTestId('notify-event-reply')).toBeVisible();
    await expect(page.getByTestId('notify-tagged')).toBeVisible();
    await expect(page.getByTestId('notify-feedback')).toBeVisible();
  });

  test('displays content preferences section', async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({
      username: DEFAULT_USERNAME,
      email: TEST_EMAIL,
      handlers: getBaseMocks(DEFAULT_USERNAME),
    });

    await page.goto('/account_settings');

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Check that content preferences section is visible
    await expect(page.getByText('Content Preferences')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('enable-sensitive-content')).toBeVisible();
  });
});
