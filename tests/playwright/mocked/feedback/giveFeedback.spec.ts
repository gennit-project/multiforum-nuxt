import { test, expect } from '../../helpers/testFixture';
import type { Page } from '@playwright/test';
import {
  MOCK_DATE,
  buildChannel,
  buildComment,
  buildDiscussion,
  buildDiscussionChannel,
  buildEvent,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { FEEDBACK_MOD_ROLE } from '../../helpers/moderationFixtures';
import { waitForGraphqlOperation } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'test-forum';
const TEST_USERNAME = 'testuser';
const TEST_MOD_PROFILE = 'testmod';
const FEEDBACK_TEXT = 'This is test feedback for the content.';

type AddFeedbackVariables = {
  discussionId?: string;
  eventId?: string;
  commentId?: string;
  text?: string;
  modProfileName?: string;
  channelId?: string;
};

const seedModProfile = async (page: Page) => {
  await page.waitForFunction(
    () =>
      typeof (
        window as typeof window & {
          __SET_AUTH_STATE_DIRECT__?: unknown;
        }
      ).__SET_AUTH_STATE_DIRECT__ === 'function'
  );
  await page.evaluate(
    ({ username, modProfileName }) => {
      (
        window as typeof window & {
          __SET_AUTH_STATE_DIRECT__?: (userData: {
            username: string;
            modProfileName: string;
          }) => void;
        }
      ).__SET_AUTH_STATE_DIRECT__?.({ username, modProfileName });
    },
    { username: TEST_USERNAME, modProfileName: TEST_MOD_PROFILE }
  );
};

const getFeedbackHandlers = (username: string, modProfileName: string) => ({
  ...createBaseHandlers({
    username,
    channelId: TEST_CHANNEL,
    discussionsCount: 1,
    serverConfigOverrides: {
      DefaultModRole: FEEDBACK_MOD_ROLE,
      DefaultElevatedModRole: FEEDBACK_MOD_ROLE,
    },
    channelOverrides: {
      feedbackEnabled: true,
      DefaultModRole: FEEDBACK_MOD_ROLE,
      ElevatedModRole: FEEDBACK_MOD_ROLE,
    },
  }),
  getEmail: () => ({
    data: {
      emails: [
        {
          address: 'test@example.com',
          User: {
            username,
            profilePicURL: '',
            ModerationProfile: {
              displayName: modProfileName,
            },
            NotificationsAggregate: { count: 0 },
          },
        },
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
            DefaultModRole: FEEDBACK_MOD_ROLE,
            ElevatedModRole: FEEDBACK_MOD_ROLE,
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
  getModsByChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [],
          Moderators: [
            {
              displayName: modProfileName,
              createdAt: MOCK_DATE,
              ModChannelRoles: [FEEDBACK_MOD_ROLE],
              User: {
                username,
              },
            },
          ],
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
  test('gives feedback on a discussion', async ({ page, setupMockedPage }) => {
    const discussionId = 'discussion-1';
    const discussionChannelId = 'discussion-channel-1';
    let feedbackVariables: AddFeedbackVariables | null = null;

    const { diagnostics } = await setupMockedPage({
      username: TEST_USERNAME,
      email: 'test@example.com',
      modProfileName: TEST_MOD_PROFILE,
      handlers: {
        ...getFeedbackHandlers(TEST_USERNAME, TEST_MOD_PROFILE),
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
      },
    });

    // Navigate to discussion detail page
    await page.goto(`/forums/${TEST_CHANNEL}/discussions/${discussionId}`);
    await seedModProfile(page);

    // Click the feedback menu button (thumbs down / flag icon)
    const feedbackMenuButton = page.getByRole('button', {
      name: 'Feedback',
    });
    await expect(feedbackMenuButton).toBeVisible();
    await feedbackMenuButton.click();

    // Click "Give Feedback" option
    const giveFeedbackOption = page.getByText('Give Feedback');
    await expect(giveFeedbackOption).toBeVisible();
    await giveFeedbackOption.click({ noWaitAfter: true });

    // Fill in feedback text in the modal
    const feedbackInput = page.getByRole('textbox', {
      name: 'How can the author improve their post?',
    });
    await expect(feedbackInput).toBeVisible();
    await feedbackInput.fill(FEEDBACK_TEXT);
    await seedModProfile(page);

    // Submit the feedback
    const submitButton = page.getByRole('button', { name: 'Submit' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for mutation to complete
    await waitForGraphqlOperation(
      diagnostics.completedOperations,
      'addFeedbackCommentToDiscussion'
    );

    // Verify mutation was called with correct variables
    expect(feedbackVariables).not.toBeNull();
    expect(feedbackVariables!.text).toBe(FEEDBACK_TEXT);
    expect(feedbackVariables!.discussionId).toBe(discussionId);
    expect(feedbackVariables!.modProfileName).toBe(TEST_MOD_PROFILE);

    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('gives feedback on an event', async ({ page, setupMockedPage }) => {
    const eventId = 'event-1';
    const eventChannelId = 'event-channel-1';
    let feedbackVariables: AddFeedbackVariables | null = null;

    const mockEvent = buildEvent({
      id: eventId,
      eventChannelId,
      channelUniqueName: TEST_CHANNEL,
      title: 'Test Event',
    });

    const { diagnostics } = await setupMockedPage({
      username: TEST_USERNAME,
      email: 'test@example.com',
      modProfileName: TEST_MOD_PROFILE,
      handlers: {
        ...getFeedbackHandlers(TEST_USERNAME, TEST_MOD_PROFILE),
        getEvent: () => ({
          data: {
            events: [mockEvent],
          },
        }),
        getEventComments: () => ({
          data: {
            getEventComments: {
              Event: mockEvent,
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
      },
    });

    // Navigate to event detail page
    await page.goto(`/forums/${TEST_CHANNEL}/events/${eventId}`);
    await seedModProfile(page);

    // Click the event menu button
    const menuButton = page.getByTestId('event-menu-button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Click "Give Feedback" option
    const giveFeedbackOption = page.getByTestId(
      'event-menu-button-item-Give Feedback'
    );
    await expect(giveFeedbackOption).toBeVisible();
    await giveFeedbackOption.click({ noWaitAfter: true });

    // Fill in feedback text in the modal
    const feedbackInput = page.getByRole('textbox', {
      name: 'How can the author improve their post?',
    });
    await expect(feedbackInput).toBeVisible();
    await feedbackInput.fill(FEEDBACK_TEXT);
    await seedModProfile(page);

    // Submit the feedback
    const submitButton = page.getByRole('button', { name: 'Submit' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for mutation to complete
    await waitForGraphqlOperation(
      diagnostics.completedOperations,
      'addFeedbackCommentToEvent'
    );

    // Verify mutation was called with correct variables
    expect(feedbackVariables).not.toBeNull();
    expect(feedbackVariables!.text).toBe(FEEDBACK_TEXT);
    expect(feedbackVariables!.eventId).toBe(eventId);
    expect(feedbackVariables!.modProfileName).toBe(TEST_MOD_PROFILE);

    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('gives feedback on a comment', async ({ page, setupMockedPage }) => {
    const discussionId = 'discussion-1';
    const discussionChannelId = 'discussion-channel-1';
    const commentId = 'comment-1';
    let feedbackVariables: AddFeedbackVariables | null = null;

    const testComment = buildComment({
      comment: {
        id: commentId,
        text: 'This is a test comment',
        parentCommentId: null,
      },
      comments: [
        {
          id: commentId,
          text: 'This is a test comment',
          parentCommentId: null,
        },
      ],
      channelUniqueName: TEST_CHANNEL,
      discussionId,
      discussionChannelId,
    });

    const { diagnostics } = await setupMockedPage({
      username: TEST_USERNAME,
      email: 'test@example.com',
      modProfileName: TEST_MOD_PROFILE,
      handlers: {
        ...getFeedbackHandlers(TEST_USERNAME, TEST_MOD_PROFILE),
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
      },
    });

    // Navigate to discussion detail page with comment
    await page.goto(`/forums/${TEST_CHANNEL}/discussions/${discussionId}`);
    await seedModProfile(page);

    // Wait for comment to load
    await expect(page.getByText('This is a test comment')).toBeVisible();

    // Click the comment feedback menu button (thumbs down / flag icon on comment)
    const feedbackMenuButton = page.getByTestId(
      'comment-thumbs-down-menu-button'
    );
    await expect(feedbackMenuButton).toBeVisible();
    await feedbackMenuButton.click();

    // Click "Give Feedback" option
    const giveFeedbackOption = page.getByText('Give Feedback');
    await expect(giveFeedbackOption).toBeVisible();
    await giveFeedbackOption.click();

    // Fill in feedback text in the modal
    const feedbackInput = page.getByRole('textbox', {
      name: 'How can the author improve their post?',
    });
    await expect(feedbackInput).toBeVisible();
    await feedbackInput.fill(FEEDBACK_TEXT);
    await seedModProfile(page);

    // Submit the feedback
    const submitButton = page.getByRole('button', { name: 'Submit' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for mutation to complete
    await waitForGraphqlOperation(
      diagnostics.completedOperations,
      'addFeedbackCommentToComment'
    );

    // Verify mutation was called with correct variables
    expect(feedbackVariables).not.toBeNull();
    expect(feedbackVariables!.text).toBe(FEEDBACK_TEXT);
    expect(feedbackVariables!.commentId).toBe(commentId);
    expect(feedbackVariables!.modProfileName).toBe(TEST_MOD_PROFILE);

    expect(diagnostics.pageErrors).toEqual([]);
  });
});
