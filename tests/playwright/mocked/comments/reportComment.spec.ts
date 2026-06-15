import { test, expect } from '../../helpers/testFixture';
import {
  buildChannel,
  buildComment,
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
  type MockCommentState,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import {
  DEFAULT_MOD_ROLE,
  DEFAULT_RULES_JSON,
} from '../../helpers/moderationFixtures';

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

test('reports a comment with mocked GraphQL', async ({ page, setupMockedPage }) => {
  let reportVariables: ReportCommentVariables | null = null;

  const { diagnostics } = await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'alice',
        channelId: TEST_CHANNEL,
        discussionsCount: 1,
        isModerator: true,
        moderatorDisplayName: 'alice',
        serverConfigOverrides: {
          rules: DEFAULT_RULES_JSON,
          DefaultModRole: DEFAULT_MOD_ROLE,
          DefaultElevatedModRole: DEFAULT_MOD_ROLE,
        },
        channelOverrides: {
          rules: DEFAULT_RULES_JSON,
          DefaultModRole: DEFAULT_MOD_ROLE,
          ElevatedModRole: DEFAULT_MOD_ROLE,
        },
      }),
      getServerRules: () => ({
        data: {
          serverConfigs: [{ rules: DEFAULT_RULES_JSON }],
        },
      }),
      getChannelRules: () => ({
        data: {
          channels: [
            buildChannel({
              uniqueName: TEST_CHANNEL,
              overrides: { rules: DEFAULT_RULES_JSON },
            }),
          ],
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
      getUserFavoriteComment: () => ({
        data: { getUserFavoriteComment: false },
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
    },
  });

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
});
