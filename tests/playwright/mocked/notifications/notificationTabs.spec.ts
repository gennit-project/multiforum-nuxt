import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_USER = 'alice';

const buildGeneralNotification = (id: string, text: string, read = false) => ({
  __typename: 'Notification' as const,
  id,
  createdAt: '2024-01-15T10:00:00Z',
  read,
  text,
  notificationType: 'reply',
  url: '/forums/cats/discussions/disc-1',
});

const buildFeedbackNotification = (id: string, read = false) => ({
  __typename: 'Notification' as const,
  id,
  createdAt: '2024-01-16T10:00:00Z',
  read,
  text: 'You received feedback on your comment',
  notificationType: 'feedback',
  url: '/forums/cats/discussions/disc-1',
});

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
});

test.describe('Notification tabs', () => {
  test('feedback notifications appear in separate tab', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      // General notifications query
      getGeneralNotifications: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: TEST_USER,
              Notifications: [
                buildGeneralNotification('notif-1', 'Someone replied to your comment'),
                buildGeneralNotification('notif-2', 'You were mentioned in a discussion', true),
              ],
              NotificationsAggregate: { count: 1 },
              totalNotificationsAggregate: { count: 2 },
            },
          ],
        },
      }),
      // Feedback notifications query
      getFeedbackNotifications: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: TEST_USER,
              Notifications: [
                buildFeedbackNotification('feedback-1'),
              ],
              NotificationsAggregate: { count: 1 },
              totalNotificationsAggregate: { count: 1 },
            },
          ],
        },
      }),
    });

    try {
      await page.goto('/notifications');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible({
        timeout: 30000,
      });

      // Verify General tab is active by default
      const generalTab = page.getByRole('tab', { name: /General/i });
      await expect(generalTab).toBeVisible();

      // Verify Feedback tab exists with unread count
      const feedbackTab = page.getByRole('tab', { name: /Feedback/i });
      await expect(feedbackTab).toBeVisible();

      // General tab should show general notifications
      await expect(page.getByText('Someone replied to your comment')).toBeVisible();

      // Feedback notification should NOT be in General tab
      await expect(page.getByText('You received feedback on your comment')).not.toBeVisible();

      // Click Feedback tab
      await feedbackTab.click();

      // Now feedback notification should be visible
      await expect(page.getByText('You received feedback on your comment')).toBeVisible();

      // General notification should NOT be in Feedback tab
      await expect(page.getByText('Someone replied to your comment')).not.toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('shows per-tab unread count badges', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getGeneralNotifications: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: TEST_USER,
              Notifications: [
                buildGeneralNotification('g-1', 'Someone replied to your comment'),
                buildGeneralNotification('g-2', 'You were mentioned in a discussion'),
              ],
              NotificationsAggregate: { count: 2 },
              totalNotificationsAggregate: { count: 2 },
            },
          ],
        },
      }),
      getFeedbackNotifications: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: TEST_USER,
              Notifications: [
                buildFeedbackNotification('f-1'),
                buildFeedbackNotification('f-2'),
                buildFeedbackNotification('f-3'),
              ],
              NotificationsAggregate: { count: 3 },
              totalNotificationsAggregate: { count: 3 },
            },
          ],
        },
      }),
    });

    try {
      await page.goto('/notifications');

      const generalTab = page.getByRole('tab', { name: /General/i });
      await expect(generalTab).toBeVisible({ timeout: 30000 });

      // The General badge reflects its own aggregate count on load.
      await expect(generalTab.locator('span')).toContainText('2');

      // The Feedback query is only enabled once its tab is active, so its
      // badge populates after the tab is visited.
      const feedbackTab = page.getByRole('tab', { name: /Feedback/i });
      await feedbackTab.click();
      await expect(feedbackTab.locator('span')).toContainText('3');

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('marking all as read clears the active tab unread count', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    let markedAsRead = false;

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getGeneralNotifications: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: TEST_USER,
              Notifications: [
                buildGeneralNotification(
                  'g-1',
                  'Someone replied to your comment',
                  markedAsRead
                ),
                buildGeneralNotification(
                  'g-2',
                  'You were mentioned in a discussion',
                  markedAsRead
                ),
              ],
              // After the mutation, the refetch reports zero unread.
              NotificationsAggregate: { count: markedAsRead ? 0 : 2 },
              totalNotificationsAggregate: { count: 2 },
            },
          ],
        },
      }),
      markNotificationsAsRead: () => {
        markedAsRead = true;
        return {
          data: {
            updateUsers: {
              users: [{ username: TEST_USER, Notifications: [] }],
            },
          },
        };
      },
    });

    try {
      await page.goto('/notifications');

      await expect(
        page.getByRole('heading', { name: 'Notifications' })
      ).toBeVisible({ timeout: 30000 });

      await expect(
        page.getByText('You have 2 unread notifications')
      ).toBeVisible();

      const markReadResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/graphql') &&
          response.request().postData()?.includes('markNotificationsAsRead') ===
            true
      );
      await page.getByRole('button', { name: 'Mark all as read' }).click();
      expect((await markReadResponse).status()).toBe(200);

      // The refetched active tab now shows no unread notifications.
      await expect(
        page.getByText('You have 0 unread notifications')
      ).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
