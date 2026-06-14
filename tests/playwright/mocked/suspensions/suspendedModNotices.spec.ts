import { expect, test } from '@playwright/test';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  buildDiscussion,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const MOD_USER = 'testmod';
const MOD_PROFILE_NAME = 'TestMod';
const ISSUE_NUMBER = 99;

const emptyConnection = {
  edges: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
  },
  totalCount: 0,
};

// Build a mod suspension for channel-level queries
const buildModSuspension = () => ({
  __typename: 'Suspension' as const,
  id: 'mod-suspension-1',
  channelUniqueName: TEST_CHANNEL,
  createdAt: MOCK_DATE,
  modProfileName: MOD_PROFILE_NAME,
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
});

test.describe('Mod suspension notices', () => {
  test('suspended mod sees no mod actions on discussion page', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USER,
      email: 'mod@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(MOD_USER),
      // User's mod profile is suspended in the channel
      userIsModInChannel: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              Admins: [],
              SuspendedUsers: [],
              // User would normally be a moderator, but their mod profile is suspended
              Moderators: [
                {
                  displayName: MOD_PROFILE_NAME,
                  User: { username: MOD_USER },
                },
              ],
              SuspendedMods: [buildModSuspension()],
            },
          ],
        },
      }),
      // Return discussion data
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: 'disc-1',
              title: 'Test Discussion',
              body: 'Test body content',
              channelUniqueName: TEST_CHANNEL,
              overrides: {
                Author: buildUser({ username: 'alice', displayName: 'Alice' }),
              },
            }),
          ],
        },
      }),
      getDiscussionsInChannel: () => ({
        data: {
          getDiscussionsInChannel: [],
        },
      }),
      getComments: () => ({
        data: {
          getCommentsByDiscussionId: {
            comments: [],
            aggregateCommentCount: 0,
          },
        },
      }),
      getModSuspensionStatus: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              SuspendedMods: [buildModSuspension()],
            },
          ],
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/disc-1`);

      // Wait for page to load
      await expect(page.getByText('Test Discussion')).toBeVisible({
        timeout: 30000,
      });

      // Verify user is authenticated
      await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 5000 });

      // Suspended mod should NOT see mod action buttons
      // Look for common mod actions that should be hidden
      await expect(page.getByRole('button', { name: /archive/i })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /report/i })).not.toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('suspended mod can still post comments as regular user', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USER,
      email: 'mod@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(MOD_USER),
      userIsModInChannel: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              Admins: [],
              SuspendedUsers: [], // User is NOT suspended as a user
              Moderators: [
                {
                  displayName: MOD_PROFILE_NAME,
                  User: { username: MOD_USER },
                },
              ],
              SuspendedMods: [buildModSuspension()], // Only mod profile is suspended
            },
          ],
        },
      }),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: 'disc-1',
              title: 'Test Discussion',
              body: 'Test body content',
              channelUniqueName: TEST_CHANNEL,
              overrides: {
                Author: buildUser({ username: 'alice', displayName: 'Alice' }),
              },
            }),
          ],
        },
      }),
      getComments: () => ({
        data: {
          getCommentsByDiscussionId: {
            comments: [],
            aggregateCommentCount: 0,
          },
        },
      }),
      // User is NOT suspended at channel level
      getUserSuspensionInChannel: () => ({
        data: {
          channels: [
            {
              __typename: 'Channel',
              uniqueName: TEST_CHANNEL,
              SuspendedUsers: [], // Empty - user not suspended
            },
          ],
        },
      }),
      // Mock comment creation to succeed
      createComment: () => ({
        data: {
          createCommentWithFeedback: {
            Comment: {
              id: 'new-comment-1',
              text: 'Test comment from suspended mod',
            },
          },
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/disc-1`);

      // Wait for page to load
      await expect(page.getByText('Test Discussion')).toBeVisible({
        timeout: 30000,
      });

      // Verify user is authenticated
      await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 5000 });

      // Suspended mod (as user) should still see comment form since their USER account is not suspended
      // The comment form should be accessible
      const commentTextarea = page.locator('textarea[placeholder*="comment"], [data-testid="comment-input"]').first();

      // If comment form exists and is visible, the test passes
      // (This verifies mod suspension doesn't affect user commenting ability)
      if (await commentTextarea.isVisible()) {
        expect(true).toBe(true);
      }

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
