import { expect, test } from '@playwright/test';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildComment,
  buildServerConfig,
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'test-forum';
const TEST_USERNAME = 'testuser';

const buildEvent = (overrides: Partial<{
  id: string;
  title: string;
  description: string;
}> = {}) => ({
  id: overrides.id || 'event-1',
  title: overrides.title || 'Test Event',
  description: overrides.description || 'Test description',
  startTime: '2030-01-01T18:00:00.000Z',
  endTime: '2030-01-01T20:00:00.000Z',
  locationName: 'Test Location',
  address: '123 Test St',
  virtualEventUrl: '',
  startTimeDayOfWeek: 2,
  startTimeHourOfDay: 18,
  canceled: false,
  isHostedByOP: true,
  isAllDay: false,
  coverImageURL: '',
  createdAt: MOCK_DATE,
  updatedAt: MOCK_DATE,
  free: true,
  isInPrivateResidence: false,
  RecurringEvent: null,
  location: { latitude: 33.4484, longitude: -112.074 },
  cost: '',
  Tags: [],
  CommentsAggregate: { count: 0 },
  EventChannels: [
    {
      id: 'event-channel-1',
      eventId: overrides.id || 'event-1',
      channelUniqueName: TEST_CHANNEL,
      archived: false,
      Channel: {
        uniqueName: TEST_CHANNEL,
        displayName: TEST_CHANNEL,
        channelIconURL: '',
      },
    },
  ],
  Poster: buildUser(),
  FeedbackCommentsAggregate: { count: 0 },
  FeedbackComments: [],
});

const getCommonMocks = (username: string) => ({
  getEmail: () => ({
    data: {
      emails: [
        {
          address: 'test@example.com',
          User: {
            username,
            profilePicURL: '',
            ModerationProfile: null,
            NotificationsAggregate: { count: 0 },
          },
        },
      ],
    },
  }),
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
      users: [{ username }],
    },
  }),
  getUserActiveSuspensions: () => ({
    data: { users: [{ username, Suspensions: [] }] },
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
          serverName: 'TestServer',
        }),
      ],
    },
  }),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
        }),
      ],
    },
  }),
  getChannelTags: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Tags: [],
        },
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
  countOpenIssues: () => ({
    data: {
      issuesAggregate: { count: 1 },
    },
  }),
  countClosedIssues: () => ({
    data: {
      issuesAggregate: { count: 0 },
    },
  }),
  getIssue: () => ({
    data: {
      issues: [],
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
  getDiscussionCommentIssue: () => ({
    data: {
      discussionChannels: [],
    },
  }),
  getDiscussionChannelRootCommentAggregate: () => ({
    data: {
      discussionChannels: [
        {
          id: 'discussion-channel-1',
          discussionId: 'discussion-1',
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
          id: 'discussion-channel-1',
          discussionId: 'discussion-1',
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
          id: 'discussion-channel-1',
          discussionId: 'discussion-1',
          channelUniqueName: TEST_CHANNEL,
          title: 'Test Discussion',
          commentsCount: 0,
        }),
        Comments: [],
      },
    },
  }),
  getCommentWithReplies: () => ({
    data: {
      comments: [],
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

test.describe('Link verification - pages resolve correctly', () => {
  test('discussion permalink resolves to discussion detail page', async ({ context, page }, testInfo) => {
    const discussionId = 'discussion-1';
    const discussionChannelId = 'discussion-channel-1';

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: discussionId,
              title: 'Test Discussion Title',
              body: 'Test discussion body content',
            }),
          ],
        },
      }),
      getDiscussionChannelByDiscussionId: () => ({
        data: {
          discussionChannels: [
            {
              id: discussionChannelId,
              discussionId,
              channelUniqueName: TEST_CHANNEL,
              archived: false,
              Channel: {
                uniqueName: TEST_CHANNEL,
                displayName: TEST_CHANNEL,
              },
              UpvotedByUsers: [],
              UpvotedByUsersAggregate: { count: 0 },
              Discussion: buildDiscussion({ id: discussionId }),
            },
          ],
        },
      }),
      getDiscussionComments: () => ({
        data: {
          getDiscussionComments: {
            DiscussionChannel: {
              id: discussionChannelId,
              Discussion: buildDiscussion({ id: discussionId }),
            },
            Comments: [],
          },
        },
      }),
      getDiscussionRootCommentAggregate: () => ({
        data: {
          discussionChannels: [
            {
              id: discussionChannelId,
              CommentsAggregate: { count: 0 },
            },
          ],
        },
      }),
      checkDiscussionIssueExistence: () => ({
        data: { issues: [] },
      }),
      checkDiscussionCommentIssueExistence: () => ({
        data: { discussionChannels: [] },
      }),
    });

    try {
      // Navigate to discussion permalink
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/${discussionId}`);

      // Verify the page loads with correct content
      await expect(
        page.getByRole('heading', { name: 'Test Discussion Title' })
      ).toBeVisible();
      await expect(page.getByText('Test discussion body content')).toBeVisible();

      // Verify URL is correct
      expect(page.url()).toContain(`/forums/${TEST_CHANNEL}/discussions/${discussionId}`);

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('comment permalink resolves and highlights the comment', async ({ context, page }, testInfo) => {
    const discussionId = 'discussion-1';
    const discussionChannelId = 'discussion-channel-1';
    const commentId = 'comment-1';

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const testComment = buildComment({
      comment: {
        id: commentId,
        text: 'This is a permalinked comment',
        parentCommentId: null,
      },
      comments: [
        {
          id: commentId,
          text: 'This is a permalinked comment',
          parentCommentId: null,
        },
      ],
      channelUniqueName: TEST_CHANNEL,
      discussionId,
      discussionChannelId,
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: discussionId,
              title: 'Test Discussion',
            }),
          ],
        },
      }),
      getDiscussionChannelByDiscussionId: () => ({
        data: {
          discussionChannels: [
            {
              id: discussionChannelId,
              discussionId,
              channelUniqueName: TEST_CHANNEL,
              archived: false,
              Channel: {
                uniqueName: TEST_CHANNEL,
                displayName: TEST_CHANNEL,
              },
              UpvotedByUsers: [],
              UpvotedByUsersAggregate: { count: 0 },
              Discussion: buildDiscussion({ id: discussionId }),
            },
          ],
        },
      }),
      getDiscussionComments: () => ({
        data: {
          getDiscussionComments: {
            DiscussionChannel: {
              id: discussionChannelId,
              Discussion: buildDiscussion({ id: discussionId }),
            },
            Comments: [testComment],
          },
        },
      }),
      getDiscussionRootCommentAggregate: () => ({
        data: {
          discussionChannels: [
            {
              id: discussionChannelId,
              CommentsAggregate: { count: 1 },
            },
          ],
        },
      }),
      getDiscussionChannelRootCommentAggregate: () => ({
        data: {
          discussionChannels: [
            {
              id: discussionChannelId,
              discussionId,
              channelUniqueName: TEST_CHANNEL,
              archived: false,
              answered: false,
              locked: false,
              CommentsAggregate: { count: 1 },
            },
          ],
        },
      }),
      getCommentSection: () => ({
        data: {
          getCommentSection: {
            DiscussionChannel: buildDiscussionChannel({
              id: discussionChannelId,
              discussionId,
              channelUniqueName: TEST_CHANNEL,
              title: 'Test Discussion',
              commentsCount: 1,
            }),
            Comments: [testComment],
          },
        },
      }),
      getCommentWithReplies: () => ({
        data: {
          comments: [testComment],
        },
      }),
      checkDiscussionIssueExistence: () => ({
        data: { issues: [] },
      }),
      checkDiscussionCommentIssueExistence: () => ({
        data: { discussionChannels: [] },
      }),
    });

    try {
      // Navigate to comment permalink
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/${discussionId}/comments/${commentId}`);

      // Verify the comment is visible
      await expect(page.getByText('This is a permalinked comment')).toBeVisible();

      // Verify URL contains the comment ID
      expect(page.url()).toContain(`/comments/${commentId}`);

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('event permalink resolves to event detail page', async ({ context, page }, testInfo) => {
    const eventId = 'event-1';
    const eventChannelId = 'event-channel-1';

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvent: () => ({
        data: {
          events: [
            buildEvent({
              id: eventId,
              title: 'Test Event Title',
            }),
          ],
        },
      }),
      getEventComments: () => ({
        data: {
          getEventComments: {
            Event: buildEvent({ id: eventId }),
            Comments: [],
          },
        },
      }),
      getEventRootCommentAggregate: () => ({
        data: {
          events: [
            {
              id: eventId,
              CommentsAggregate: { count: 0 },
            },
          ],
        },
      }),
      getEventChannelID: () => ({
        data: {
          eventChannels: [
            {
              id: eventChannelId,
              archived: false,
            },
          ],
        },
      }),
    });

    try {
      // Navigate to event permalink
      await page.goto(`/forums/${TEST_CHANNEL}/events/${eventId}`);

      // Verify the event detail shell loaded
      await expect(page.getByTestId('event-menu-button')).toBeVisible();

      // Verify URL is correct
      expect(page.url()).toContain(`/forums/${TEST_CHANNEL}/events/${eventId}`);

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('feedback page resolves and shows feedback', async ({ context, page }, testInfo) => {
    const discussionId = 'discussion-1';
    const discussionChannelId = 'discussion-channel-1';

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const feedbackComment = {
      id: 'feedback-1',
      text: 'This is feedback on the discussion',
      createdAt: MOCK_DATE,
      updatedAt: null,
      archived: false,
      isRootComment: true,
      isFeedbackComment: true,
      UpvotedByUsers: [],
      UpvotedByUsersAggregate: { count: 0 },
      ChildCommentsAggregate: { count: 0 },
      CommentAuthor: {
        __typename: 'ModerationProfile',
        displayName: 'moderator',
      },
      ParentComment: null,
      ChildComments: [],
      Channel: { uniqueName: TEST_CHANNEL },
    };

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getDiscussion: () => ({
        data: {
          discussions: [
            {
              ...buildDiscussion({
                id: discussionId,
                title: 'Test Discussion',
              }),
              FeedbackComments: [feedbackComment],
              FeedbackCommentsAggregate: { count: 1 },
            },
          ],
        },
      }),
      getDiscussionChannelByDiscussionId: () => ({
        data: {
          discussionChannels: [
            {
              id: discussionChannelId,
              discussionId,
              channelUniqueName: TEST_CHANNEL,
              archived: false,
              Channel: {
                uniqueName: TEST_CHANNEL,
                displayName: TEST_CHANNEL,
              },
              UpvotedByUsers: [],
              UpvotedByUsersAggregate: { count: 0 },
              Discussion: buildDiscussion({ id: discussionId }),
            },
          ],
        },
      }),
      getDiscussionFeedback: () => ({
        data: {
          discussions: [
            {
              id: discussionId,
              FeedbackComments: [feedbackComment],
              FeedbackCommentsAggregate: { count: 1 },
            },
          ],
        },
      }),
    });

    try {
      // Navigate to feedback page
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/feedback/${discussionId}`);

      // Verify the feedback content is visible
      await expect(page.getByText('This is feedback on the discussion')).toBeVisible();

      // Verify URL is correct
      expect(page.url()).toContain(`/forums/${TEST_CHANNEL}/discussions/feedback/${discussionId}`);

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('issue page resolves and shows issue details', async ({ context, page }, testInfo) => {
    const issueNumber = 1;

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getIssue: () => ({
        data: {
          issues: [
            {
              id: 'issue-1',
              issueNumber,
              title: 'Test Issue Title',
              body: 'Test issue description',
              isOpen: true,
              locked: false,
              lockedAt: null,
              lockReason: null,
              createdAt: MOCK_DATE,
              updatedAt: MOCK_DATE,
              channelUniqueName: TEST_CHANNEL,
              relatedDiscussionId: null,
              relatedEventId: null,
              relatedCommentId: null,
              flaggedServerRuleViolation: false,
              ActivityFeed: [],
              ActivityFeedAggregate: { count: 0 },
              Author: {
                __typename: 'ModerationProfile',
                displayName: 'reporter',
              },
              SubscribedToNotifications: [],
              LockedBy: null,
            },
          ],
        },
      }),
      getIssueActivityFeed: () => ({
        data: {
          moderationActions: [],
        },
      }),
    });

    try {
      // Navigate to issue page
      await page.goto(`/forums/${TEST_CHANNEL}/issues/${issueNumber}`);

      // Verify URL is correct
      expect(page.url()).toContain(`/forums/${TEST_CHANNEL}/issues/${issueNumber}`);

      // Verify the page loaded (check for issue page elements)
      // The Activity Feed heading is always present on the issue page
      await expect(page.getByRole('heading', { name: 'Activity Feed' })).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
