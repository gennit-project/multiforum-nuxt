import { expect, test } from '@playwright/test';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const SUSPENDED_USER = 'cluse';
const ISSUE_NUMBER = 42;
const emptyConnection = {
  edges: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
  },
  totalCount: 0,
};

// Build a suspension that will be returned by getUserActiveSuspensions
const buildActiveSuspension = () => ({
  __typename: 'Suspension',
  id: 'suspension-1',
  channelUniqueName: TEST_CHANNEL,
  suspendedUntil: '2030-12-31T00:00:00.000Z',
  suspendedIndefinitely: false,
  RelatedIssue: {
    __typename: 'Issue',
    issueNumber: ISSUE_NUMBER,
  },
});

// Build a suspension object for channel-level queries (getUserSuspensionInChannel)
// The SuspendedUsers relationship returns Suspension nodes directly, not User nodes
const buildChannelSuspension = () => ({
  __typename: 'Suspension' as const,
  id: 'suspension-1',
  channelUniqueName: TEST_CHANNEL,
  createdAt: MOCK_DATE,
  username: SUSPENDED_USER,
  suspendedUntil: '2030-12-31T00:00:00.000Z',
  suspendedIndefinitely: false,
  RelatedIssueConnection: emptyConnection,
  SuspendedModConnection: emptyConnection,
  SuspendedUserConnection: emptyConnection,
  RelatedIssue: {
    __typename: 'Issue' as const,
    issueNumber: ISSUE_NUMBER,
  },
});

const buildChannelSuspensionSummary = () => ({
  __typename: 'Suspension' as const,
  id: 'suspension-1',
  channelUniqueName: TEST_CHANNEL,
  createdAt: MOCK_DATE,
  username: SUSPENDED_USER,
  suspendedUntil: '2030-12-31T00:00:00.000Z',
  suspendedIndefinitely: false,
  RelatedIssueConnection: emptyConnection,
  SuspendedModConnection: emptyConnection,
  SuspendedUserConnection: emptyConnection,
});

async function waitForGraphqlOperation(
  operations: Array<{ operationName: string }>,
  operationName: string
) {
  await expect
    .poll(
      () =>
        operations.some(operation => operation.operationName === operationName),
      { timeout: 10000 }
    )
    .toBe(true);
}

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
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
          overrides: { eventsEnabled: true },
        }),
      ],
    },
  }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          DiscussionChannelsAggregate: { count: 0 },
        },
      ],
    },
  }),
  getChannelTags: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, Tags: [] }],
    },
  }),
  getChannelNames: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, displayName: TEST_CHANNEL }],
    },
  }),
  getTags: () => ({
    data: { tags: [] },
  }),
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [],
          SuspendedUsers: [],
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
});

test.describe('Channel-level suspension notices', () => {
  test('suspended user sees notice when creating a discussion', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: SUSPENDED_USER,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(SUSPENDED_USER),
      // Override getChannel to include suspension data (prevents cache overwrite race)
      getChannel: () => ({
        data: {
          channels: [
            buildChannel({
              uniqueName: TEST_CHANNEL,
              overrides: {
                eventsEnabled: true,
                SuspendedUsers: [buildChannelSuspensionSummary()],
              },
            }),
          ],
        },
      }),
      userIsModInChannel: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              Admins: [],
              SuspendedUsers: [buildChannelSuspensionSummary()],
              Moderators: [],
              SuspendedMods: [],
            },
          ],
        },
      }),
      // Return suspension data for channel-level check
      getUserSuspensionInChannel: () => ({
        data: {
          channels: [
            {
              __typename: 'Channel',
              uniqueName: TEST_CHANNEL,
              SuspendedUsers: [buildChannelSuspension()],
            },
          ],
        },
      }),
      // Also return for server-level check (used by some components)
      getUserActiveSuspensions: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: SUSPENDED_USER,
              Suspensions: [buildActiveSuspension()],
            },
          ],
        },
      }),
      // Mock mutation to prevent errors
      createDiscussion: () => ({
        data: { createDiscussionWithChannelConnections: [] },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/create`);
      await expect(page.getByTestId('title-input')).toBeVisible({
        timeout: 30000,
      });

      // Verify user is authenticated
      await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 5000 });

      // Wait for suspension query to complete before attempting submission.
      // It may have already finished by this point, so use mock diagnostics
      // instead of waiting only for future network responses.
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'getUserSuspensionInChannel'
      );

      await page.getByTestId('title-input').fill('Test blocked discussion');
      await page.getByTestId('body-input').fill('This should be blocked');

      // Click save to trigger submission attempt
      await page.getByRole('button', { name: 'Save' }).first().click();

      // Should see suspension notice with issue link
      await expect(
        page.getByText(/You are suspended.*cannot create discussions/i)
      ).toBeVisible({ timeout: 10000 });
      // SuspensionNotice renders "View Issue #N"
      await expect(page.getByText(/View Issue #42/)).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('suspended user sees notice when creating an event', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: SUSPENDED_USER,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(SUSPENDED_USER),
      // Override getChannel to include suspension data (prevents cache overwrite race)
      getChannel: () => ({
        data: {
          channels: [
            buildChannel({
              uniqueName: TEST_CHANNEL,
              overrides: {
                eventsEnabled: true,
                SuspendedUsers: [buildChannelSuspensionSummary()],
              },
            }),
          ],
        },
      }),
      userIsModInChannel: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              Admins: [],
              SuspendedUsers: [buildChannelSuspensionSummary()],
              Moderators: [],
              SuspendedMods: [],
            },
          ],
        },
      }),
      getUserSuspensionInChannel: () => ({
        data: {
          channels: [
            {
              __typename: 'Channel',
              uniqueName: TEST_CHANNEL,
              SuspendedUsers: [buildChannelSuspension()],
            },
          ],
        },
      }),
      getUserActiveSuspensions: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: SUSPENDED_USER,
              Suspensions: [buildActiveSuspension()],
            },
          ],
        },
      }),
      // Mock mutation to prevent errors
      createEvent: () => ({
        data: { createEventWithChannelConnections: [] },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
      await expect(page.getByTestId('title-input')).toBeVisible({
        timeout: 30000,
      });

      // Verify user is authenticated
      await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 5000 });

      // Wait for suspension query to complete before attempting submission.
      // It may have already finished by this point, so use mock diagnostics
      // instead of waiting only for future network responses.
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'getUserSuspensionInChannel'
      );

      await page.getByTestId('title-input').fill('Test blocked event');

      // Click save
      await page.getByRole('button', { name: 'Save' }).first().click();

      // Should see suspension notice
      await expect(
        page.getByText(/You are suspended.*cannot create events/i)
      ).toBeVisible({ timeout: 10000 });

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});

test.describe('Server-level suspension notices', () => {
  test('suspended user sees notice when creating a forum', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: SUSPENDED_USER,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(SUSPENDED_USER),
      // Server-level suspension check returns active suspension
      getUserActiveSuspensions: () => ({
        data: {
          users: [
            {
              __typename: 'User',
              username: SUSPENDED_USER,
              Suspensions: [buildActiveSuspension()],
            },
          ],
        },
      }),
      // Empty channel names for forum creation
      getChannelNames: () => ({
        data: { channels: [] },
      }),
      // Mock mutation to prevent errors (though we expect it to be blocked by suspension)
      createChannel: () => ({
        data: { createChannels: { channels: [] } },
      }),
    });

    try {
      await page.goto('/forums/create');
      await expect(page.getByTestId('title-input')).toBeVisible();

      // Verify user is authenticated
      await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 5000 });

      // Wait for suspension query to complete
      await waitForGraphqlOperation(diagnostics.completedOperations, 'getUserActiveSuspensions');

      await page.getByTestId('title-input').fill('test_blocked_forum');

      // Click save/create - this sets submitAttempted which triggers notice display
      await page.getByRole('button', { name: 'Save' }).click();

      // Should see server-level suspension notice
      await expect(
        page.getByText(/active suspension.*cannot create forums/i)
      ).toBeVisible({ timeout: 10000 });
      // SuspensionNotice renders "View Issue #N"
      await expect(page.getByText(/View Issue #42/)).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
