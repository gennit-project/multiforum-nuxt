import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const DISCUSSION_ID = 'disc-1';

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
          DiscussionChannelsAggregate: { count: 1 },
        },
      ],
    },
  }),
  getChannelTags: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, Tags: [] }],
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
  getModsByChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [],
          Moderators: [],
        },
      ],
    },
  }),
  getIssue: () => ({
    data: {
      issues: [],
    },
  }),
  getDiscussionCommentIssue: () => ({
    data: {
      discussionChannels: [],
    },
  }),
  getDiscussionChannelRootCommentAggregate: () => ({
    data: {
      discussionChannels: [
        {
          id: 'dc-1',
          discussionId: DISCUSSION_ID,
          channelUniqueName: TEST_CHANNEL,
          archived: false,
          answered: false,
          locked: false,
          CommentsAggregate: { count: 0 },
        },
      ],
    },
  }),
  isDiscussionAnswered: () => ({
    data: {
      discussionChannels: [
        {
          id: 'dc-1',
          discussionId: DISCUSSION_ID,
          channelUniqueName: TEST_CHANNEL,
          weightedVotesCount: 1,
          archived: false,
          answered: false,
          locked: false,
          Channel: { uniqueName: TEST_CHANNEL },
        },
      ],
    },
  }),
  getCommentSection: () => ({
    data: {
      getCommentSection: {
        DiscussionChannel: buildDiscussionChannel({
          id: 'dc-1',
          discussionId: DISCUSSION_ID,
          channelUniqueName: TEST_CHANNEL,
          title: 'Test Discussion',
          commentsCount: 0,
        }),
        Comments: [],
      },
    },
  }),
  getEvents: () => ({
    data: {
      events: [],
    },
  }),
  getUserFavoriteDiscussion: () => ({
    data: {
      users: [{ username, FavoriteDiscussions: [] }],
    },
  }),
  getUserSuspensionInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          SuspendedUsers: [],
        },
      ],
    },
  }),
});

test.describe('Unsubscribe flow', () => {
  test('unsubscribe URL parameter triggers auto-unsubscribe and shows toast', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    let _unsubscribeCalled = false;

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: DISCUSSION_ID,
              title: 'Test Discussion',
              body: 'Test body content',
              channelUniqueName: TEST_CHANNEL,
              overrides: {
                Author: buildUser({ username: 'bob', displayName: 'Bob' }),
                DiscussionChannels: [
                  buildDiscussionChannel({
                    id: 'dc-1',
                    discussionId: DISCUSSION_ID,
                    channelUniqueName: TEST_CHANNEL,
                    overrides: {
                      // User is currently subscribed
                      SubscribedToNotifications: [{ username: TEST_USER }],
                    },
                  }),
                ],
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
      // Mock unsubscribe mutation
      unsubscribeFromDiscussion: () => {
        _unsubscribeCalled = true;
        return {
          data: {
            updateUsers: {
              users: [{ username: TEST_USER }],
            },
          },
        };
      },
    });

    try {
      // Navigate with unsubscribe action parameter
      await page.goto(
        `/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}?action=unsubscribe`
      );

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Test Discussion' })).toBeVisible({
        timeout: 30000,
      });

      // Should see unsubscribe toast notification
      await expect(page.getByText(/unsubscribed/i)).toBeVisible({
        timeout: 10000,
      });

      // URL should have action parameter removed
      await expect(page).not.toHaveURL(/action=unsubscribe/);

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
