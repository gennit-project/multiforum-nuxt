import { expect, test } from '@playwright/test';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  buildUser,
  buildDiscussion,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks, waitForGraphqlOperation } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'test-forum';
const TEST_USERNAME = 'testuser';
const TEST_MOD_PROFILE = 'testmod';
const FEEDBACK_TEXT = 'This is test feedback for the content.';

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

type AddFeedbackVariables = {
  discussionId?: string;
  eventId?: string;
  commentId?: string;
  text?: string;
  modProfileName?: string;
  channelId?: string;
};

const getCommonMocks = (username: string, modProfileName: string) => ({
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
          overrides: {
            feedbackEnabled: true,
          },
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
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [],
          SuspendedUsers: [],
          Moderators: [
            {
              displayName: modProfileName,
            },
          ],
          SuspendedMods: [],
        },
      ],
    },
  }),
  getModProfile: () => ({
    data: {
      moderationProfiles: [
        {
          displayName: modProfileName,
        },
      ],
    },
  }),
});

test.describe('Give feedback flows', () => {
  test('gives feedback on a discussion', async ({ context, page }, testInfo) => {
    const discussionId = 'discussion-1';
    const discussionChannelId = 'discussion-channel-1';
    let feedbackVariables: AddFeedbackVariables | null = null;

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME, TEST_MOD_PROFILE),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: discussionId,
              title: 'Test Discussion',
              body: 'Test body content',
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
                feedbackEnabled: true,
              },
              UpvotedByUsers: [],
              UpvotedByUsersAggregate: { count: 0 },
              Discussion: buildDiscussion({
                id: discussionId,
              }),
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
        data: {
          issues: [],
        },
      }),
      checkDiscussionCommentIssueExistence: () => ({
        data: {
          discussionChannels: [],
        },
      }),
      addFeedbackCommentToDiscussion: ({ body }) => {
        feedbackVariables = body.variables as AddFeedbackVariables;
        return {
          data: {
            createComments: {
              comments: [
                {
                  id: 'feedback-comment-1',
                  text: feedbackVariables.text,
                  isFeedbackComment: true,
                  isRootComment: true,
                  createdAt: MOCK_DATE,
                  Channel: { uniqueName: TEST_CHANNEL },
                  CommentAuthor: {
                    displayName: TEST_MOD_PROFILE,
                  },
                },
              ],
            },
          },
        };
      },
    });

    try {
      // Navigate to discussion detail page
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/${discussionId}`);

      // Wait for discussion to load
      await expect(page.getByText('Test Discussion')).toBeVisible();

      // Click the feedback menu button (thumbs down / flag icon)
      const feedbackMenuButton = page.getByTestId('discussion-thumbs-down-menu-button');
      await expect(feedbackMenuButton).toBeVisible();
      await feedbackMenuButton.click();

      // Click "Give Feedback" option
      const giveFeedbackOption = page.getByText('Give Feedback');
      await expect(giveFeedbackOption).toBeVisible();
      await giveFeedbackOption.click();

      // Fill in feedback text in the modal
      const feedbackInput = page.getByTestId('feedback-input');
      await expect(feedbackInput).toBeVisible();
      await feedbackInput.fill(FEEDBACK_TEXT);

      // Submit the feedback
      const submitButton = page.getByRole('button', { name: 'Submit' });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // Wait for mutation to complete
      await waitForGraphqlOperation(diagnostics.completedOperations, 'addFeedbackCommentToDiscussion');

      // Verify mutation was called with correct variables
      expect(feedbackVariables).not.toBeNull();
      expect(feedbackVariables!.text).toBe(FEEDBACK_TEXT);
      expect(feedbackVariables!.discussionId).toBe(discussionId);
      expect(feedbackVariables!.modProfileName).toBe(TEST_MOD_PROFILE);

      // Verify success notification
      await expect(page.getByText('Feedback submitted')).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
      await testInfo.attach('page-errors.json', {
        body: Buffer.from(JSON.stringify(diagnostics.pageErrors, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('gives feedback on an event', async ({ context, page }, testInfo) => {
    const eventId = 'event-1';
    const eventChannelId = 'event-channel-1';
    let feedbackVariables: AddFeedbackVariables | null = null;

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME, TEST_MOD_PROFILE),
      getEvent: () => ({
        data: {
          events: [
            buildEvent({
              id: eventId,
              title: 'Test Event',
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
      addFeedbackCommentToEvent: ({ body }) => {
        feedbackVariables = body.variables as AddFeedbackVariables;
        return {
          data: {
            createComments: {
              comments: [
                {
                  id: 'feedback-comment-1',
                  text: feedbackVariables.text,
                  isFeedbackComment: true,
                  isRootComment: true,
                  createdAt: MOCK_DATE,
                  Channel: { uniqueName: TEST_CHANNEL },
                  CommentAuthor: {
                    displayName: TEST_MOD_PROFILE,
                  },
                },
              ],
            },
          },
        };
      },
    });

    try {
      // Navigate to event detail page
      await page.goto(`/forums/${TEST_CHANNEL}/events/${eventId}`);

      // Wait for event to load
      await expect(page.getByText('Test Event')).toBeVisible();

      // Click the event menu button
      const menuButton = page.getByTestId('event-menu-button');
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Click "Give Feedback" option
      const giveFeedbackOption = page.getByTestId('event-menu-button-item-Give Feedback');
      await expect(giveFeedbackOption).toBeVisible();
      await giveFeedbackOption.click();

      // Fill in feedback text in the modal
      const feedbackInput = page.getByTestId('feedback-input');
      await expect(feedbackInput).toBeVisible();
      await feedbackInput.fill(FEEDBACK_TEXT);

      // Submit the feedback
      const submitButton = page.getByRole('button', { name: 'Submit' });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // Wait for mutation to complete
      await waitForGraphqlOperation(diagnostics.completedOperations, 'addFeedbackCommentToEvent');

      // Verify mutation was called with correct variables
      expect(feedbackVariables).not.toBeNull();
      expect(feedbackVariables!.text).toBe(FEEDBACK_TEXT);
      expect(feedbackVariables!.eventId).toBe(eventId);
      expect(feedbackVariables!.modProfileName).toBe(TEST_MOD_PROFILE);

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
      await testInfo.attach('page-errors.json', {
        body: Buffer.from(JSON.stringify(diagnostics.pageErrors, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('gives feedback on a comment', async ({ context, page }, testInfo) => {
    const discussionId = 'discussion-1';
    const discussionChannelId = 'discussion-channel-1';
    const commentId = 'comment-1';
    let feedbackVariables: AddFeedbackVariables | null = null;

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    const testComment = {
      id: commentId,
      text: 'This is a test comment',
      createdAt: MOCK_DATE,
      updatedAt: null,
      archived: false,
      isRootComment: true,
      isFeedbackComment: false,
      UpvotedByUsers: [],
      UpvotedByUsersAggregate: { count: 0 },
      ChildCommentsAggregate: { count: 0 },
      FeedbackCommentsAggregate: { count: 0 },
      FeedbackComments: [],
      CommentAuthor: {
        __typename: 'User',
        username: 'otheruser',
        displayName: 'Other User',
        profilePicURL: '',
        ChannelRoles: [],
      },
      ParentComment: null,
      ChildComments: [],
      Channel: { uniqueName: TEST_CHANNEL },
    };

    const diagnostics = await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME, TEST_MOD_PROFILE),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: discussionId,
              title: 'Test Discussion',
              body: 'Test body content',
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
                feedbackEnabled: true,
              },
              UpvotedByUsers: [],
              UpvotedByUsersAggregate: { count: 0 },
              Discussion: buildDiscussion({
                id: discussionId,
              }),
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
      checkDiscussionIssueExistence: () => ({
        data: {
          issues: [],
        },
      }),
      checkDiscussionCommentIssueExistence: () => ({
        data: {
          discussionChannels: [],
        },
      }),
      addFeedbackCommentToComment: ({ body }) => {
        feedbackVariables = body.variables as AddFeedbackVariables;
        return {
          data: {
            createComments: {
              comments: [
                {
                  id: 'feedback-comment-1',
                  text: feedbackVariables.text,
                  isFeedbackComment: true,
                  isRootComment: true,
                  createdAt: MOCK_DATE,
                  Channel: { uniqueName: TEST_CHANNEL },
                  CommentAuthor: {
                    displayName: TEST_MOD_PROFILE,
                  },
                },
              ],
            },
          },
        };
      },
    });

    try {
      // Navigate to discussion detail page with comment
      await page.goto(`/forums/${TEST_CHANNEL}/discussions/${discussionId}`);

      // Wait for comment to load
      await expect(page.getByText('This is a test comment')).toBeVisible();

      // Click the comment feedback menu button (thumbs down / flag icon on comment)
      const feedbackMenuButton = page.getByTestId('comment-thumbs-down-menu-button');
      await expect(feedbackMenuButton).toBeVisible();
      await feedbackMenuButton.click();

      // Click "Give Feedback" option
      const giveFeedbackOption = page.getByText('Give Feedback');
      await expect(giveFeedbackOption).toBeVisible();
      await giveFeedbackOption.click();

      // Fill in feedback text in the modal
      const feedbackInput = page.getByTestId('feedback-input');
      await expect(feedbackInput).toBeVisible();
      await feedbackInput.fill(FEEDBACK_TEXT);

      // Submit the feedback
      const submitButton = page.getByRole('button', { name: 'Submit' });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // Wait for mutation to complete
      await waitForGraphqlOperation(diagnostics.completedOperations, 'addFeedbackCommentToComment');

      // Verify mutation was called with correct variables
      expect(feedbackVariables).not.toBeNull();
      expect(feedbackVariables!.text).toBe(FEEDBACK_TEXT);
      expect(feedbackVariables!.commentId).toBe(commentId);
      expect(feedbackVariables!.modProfileName).toBe(TEST_MOD_PROFILE);

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
      await testInfo.attach('page-errors.json', {
        body: Buffer.from(JSON.stringify(diagnostics.pageErrors, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
