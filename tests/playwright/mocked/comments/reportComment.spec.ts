import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildChannel,
  buildComment,
  buildDiscussion,
  buildDiscussionChannel,
  buildServerConfig,
  buildUser,
  type MockCommentState,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-1';
const DISCUSSION_TITLE = 'Discussion with comment to report';
const COMMENT_ID = 'comment-to-report';
const COMMENT_TEXT = 'This comment violates the rules';
const FORUM_RULE = 'Be kind';

type ReportCommentVariables = {
  commentId?: string;
  selectedForumRules?: string[];
  selectedServerRules?: string[];
  reportText?: string;
  channelUniqueName?: string;
};

const rulesJSON = JSON.stringify([
  {
    summary: FORUM_RULE,
    detail: 'Keep the forum civil.',
  },
]);

const modRole = {
  name: 'Moderator',
  description: '',
  canReport: true,
  canHideComment: true,
  canHideDiscussion: true,
  canHideEvent: true,
  canLockChannel: false,
  canEditComments: true,
  canEditDiscussions: true,
  canEditEvents: true,
  canGiveFeedback: true,
  canOpenSupportTickets: true,
  canCloseSupportTickets: true,
  canSuspendUser: true,
  canArchiveImage: true,
  canDeleteWiki: true,
};

const mockComments: MockCommentState[] = [
  {
    id: COMMENT_ID,
    text: COMMENT_TEXT,
    parentCommentId: null,
  },
];

const buildCommentFixture = (comment: MockCommentState) =>
  buildComment({
    comment,
    comments: mockComments,
    channelUniqueName: TEST_CHANNEL,
    discussionId: DISCUSSION_ID,
    discussionChannelId: DISCUSSION_CHANNEL_ID,
  });

test('reports a comment with mocked GraphQL', async (
  { context, page },
  testInfo
) => {
  let reportVariables: ReportCommentVariables | null = null;

  await installMockAuth(context, page, {
    username: 'alice',
    email: 'alice@example.com',
  });
  const diagnostics = await installGraphqlMocks(page, {
    getBasicUserInfo: () => ({
      data: {
        users: [
          buildBasicUser({
            username: 'alice',
            displayName: 'alice',
          }),
        ],
      },
    }),
    getUser: () => ({
      data: {
        users: [
          {
            username: 'alice',
            notifyOnReplyToCommentByDefault: true,
          },
        ],
      },
    }),
    getUserActiveSuspensions: () => ({
      data: { users: [{ username: 'alice', Suspensions: [] }] },
    }),
    getUserFavorites: () => ({
      data: {
        users: [{ username: 'alice', FavoriteChannels: [], Collections: [] }],
      },
    }),
    GetUserFavoriteChannels: () => ({
      data: {
        users: [{ username: 'alice', FavoriteChannels: [] }],
      },
    }),
    GetUserChannelCollectionsWithChannels: () => ({
      data: {
        users: [{ username: 'alice', Collections: [] }],
      },
    }),
    getServerConfig: () => ({
      data: {
        serverConfigs: [
          buildServerConfig({
            serverName: 'Listical',
            rules: rulesJSON,
            DefaultModRole: modRole,
            DefaultElevatedModRole: modRole,
          }),
        ],
      },
    }),
    getServerRules: () => ({
      data: {
        serverConfigs: [buildServerConfig({ rules: rulesJSON })],
      },
    }),
    getChannelRules: () => ({
      data: {
        channels: [
          buildChannel({
            uniqueName: TEST_CHANNEL,
            overrides: { rules: rulesJSON },
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
              rules: rulesJSON,
              DefaultModRole: modRole,
              ElevatedModRole: modRole,
            },
          }),
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
        discussionChannels: [
          {
            id: DISCUSSION_CHANNEL_ID,
            Comments: [],
          },
        ],
      },
    }),
    getDiscussion: () => ({
      data: {
        discussions: [
          buildDiscussion({
            id: DISCUSSION_ID,
            discussionChannelId: DISCUSSION_CHANNEL_ID,
            channelUniqueName: TEST_CHANNEL,
            title: DISCUSSION_TITLE,
            commentsCount: 1,
            overrides: {
              Author: buildUser({ username: 'cluse' }),
            },
          }),
        ],
      },
    }),
    getCommentSection: () => ({
      data: {
        getCommentSection: {
          DiscussionChannel: buildDiscussionChannel({
            id: DISCUSSION_CHANNEL_ID,
            discussionId: DISCUSSION_ID,
            channelUniqueName: TEST_CHANNEL,
            title: DISCUSSION_TITLE,
            commentsCount: 1,
          }),
          Comments: mockComments.map((c) => ({
            ...buildCommentFixture(c),
            CommentAuthor: buildUser({ username: 'offender' }),
          })),
        },
      },
    }),
    getDiscussionChannelRootCommentAggregate: () => ({
      data: {
        discussionChannels: [
          {
            id: DISCUSSION_CHANNEL_ID,
            discussionId: DISCUSSION_ID,
            channelUniqueName: TEST_CHANNEL,
            archived: false,
            answered: false,
            locked: false,
            CommentsAggregate: { count: 1 },
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
    getEvents: () => ({
      data: { events: [] },
    }),
    isDiscussionAnswered: () => ({
      data: {
        discussionChannels: [
          {
            id: DISCUSSION_CHANNEL_ID,
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
    getUserFavoriteDiscussion: () => ({
      data: {
        users: [{ username: 'alice', FavoriteDiscussions: [] }],
      },
    }),
    getUserFavoriteComment: () => ({
      data: { getUserFavoriteComment: false },
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
            Moderators: [{ displayName: 'alice' }],
            SuspendedMods: [],
          },
        ],
      },
    }),
    reportComment: ({ body }) => {
      reportVariables = body.variables as ReportCommentVariables;

      return {
        data: {
          reportComment: {
            id: 'issue-1',
            issueNumber: 1,
          },
        },
      };
    },
  });

  try {
    await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);

    // Wait for the comment to be visible
    await expect(page.getByText(COMMENT_TEXT)).toBeVisible();

    // Click the comment menu button (using the ellipsis menu)
    await page.getByTestId('commentMenu').click();

    // Click the Report option in the menu
    await page.getByTestId('commentMenu-item-Report').click();

    // Verify the modal is open
    await expect(page.getByText('Report Comment')).toBeVisible();

    // Select a broken rule
    await page
      .getByTestId('forum-rules-section')
      .getByTestId('broken-rule-checkbox')
      .first()
      .check();

    // Fill in the report text
    await page
      .getByTestId('report-comment-input')
      .fill('This comment violates our community guidelines.');

    // Submit the report
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success notification appears
    await expect(
      page.getByText('Your report was submitted successfully.')
    ).toBeVisible();

    // Verify the mutation was called with correct variables
    expect(reportVariables).toEqual({
      commentId: COMMENT_ID,
      selectedForumRules: [FORUM_RULE],
      selectedServerRules: [],
      reportText: 'This comment violates our community guidelines.',
      channelUniqueName: TEST_CHANNEL,
    });
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
    await testInfo.attach('console-errors.json', {
      body: Buffer.from(JSON.stringify(diagnostics.consoleErrors, null, 2)),
      contentType: 'application/json',
    });
  }
});
