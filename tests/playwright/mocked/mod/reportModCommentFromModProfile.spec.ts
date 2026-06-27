import { test, expect } from '../../helpers/testFixture';
import { buildComment, MOCK_DATE } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import {
  DEFAULT_MOD_ROLE,
  DEFAULT_RULES_JSON,
} from '../../helpers/moderationFixtures';

// Workflow: "Verify Reporting from Mod Profile Comments Page"
//
// A moderator ("alice") visits another moderation profile's comments page
// (`/mod/[modId]/comments`), opens a comment's context menu, reports it, and a
// reportComment mutation is submitted for that comment.

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const TARGET_MOD = 'mod-bob';
const COMMENT_ID = 'mod-comment-1';
const COMMENT_TEXT = 'A comment authored by the moderation profile.';
const FORUM_RULE = 'Be kind';

// Shape mirrors GET_MOD_COMMENTS' AuthoredComments selection: a Comment whose
// author is a ModerationProfile, plus the extra fields Comment.vue renders.
const modAuthoredComment = {
  ...buildComment({
    comment: { id: COMMENT_ID, text: COMMENT_TEXT, parentCommentId: null },
    comments: [{ id: COMMENT_ID, text: COMMENT_TEXT, parentCommentId: null }],
    channelUniqueName: TEST_CHANNEL,
  }),
  CommentAuthor: { __typename: 'ModerationProfile', displayName: TARGET_MOD },
  deleted: false,
  GivesFeedbackOnDiscussion: null,
  GivesFeedbackOnEvent: null,
  GivesFeedbackOnComment: null,
  Issue: null,
};

const modProfile = {
  __typename: 'ModerationProfile',
  displayName: TARGET_MOD,
  createdAt: MOCK_DATE,
  AuthoredCommentsAggregate: { count: 1 },
  AuthoredIssuesAggregate: { count: 0 },
  ActivityFeedAggregate: { count: 0 },
  AuthoredComments: [modAuthoredComment],
  AuthoredIssues: [],
};

type ReportCommentVariables = {
  commentId?: string;
  selectedForumRules?: string[];
  selectedServerRules?: string[];
  reportText?: string;
  channelUniqueName?: string | null;
};

test('reports a comment from a moderation profile comments page', async ({
  page,
  setupMockedPage,
}) => {
  let reportVariables: ReportCommentVariables | null = null;

  await setupMockedPage({
    username: TEST_USER,
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: TEST_USER,
        channelId: TEST_CHANNEL,
        isModerator: true,
        moderatorDisplayName: TEST_USER,
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
        data: { serverConfigs: [{ rules: DEFAULT_RULES_JSON }] },
      }),
      getChannelRules: () => ({
        data: {
          channels: [{ uniqueName: TEST_CHANNEL, rules: DEFAULT_RULES_JSON }],
        },
      }),
      getMod: () => ({ data: { moderationProfiles: [modProfile] } }),
      getModComments: () => ({
        data: {
          moderationProfiles: [
            { displayName: TARGET_MOD, AuthoredComments: [modAuthoredComment] },
          ],
        },
      }),
      getModContributions: () => ({ data: { getModContributions: [] } }),
      reportComment: ({ body }) => {
        reportVariables = body.variables as ReportCommentVariables;
        return { data: { reportComment: { id: 'issue-1', issueNumber: 1 } } };
      },
    },
  });

  await page.goto(`/mod/${TARGET_MOD}/comments`);

  // Generous timeout for a possible cold Vite-compile on first navigation.
  await expect(page.getByText(COMMENT_TEXT)).toBeVisible({ timeout: 60_000 });

  // Open the comment context menu and choose Report.
  await page.getByTestId('commentMenu').first().click();
  await page.getByTestId('commentMenu-item-Report').click();

  // The report modal opens for a comment.
  await expect(page.getByTestId('report-comment-input')).toBeVisible();

  await page
    .getByTestId('forum-rules-section')
    .getByTestId('broken-rule-checkbox')
    .first()
    .check();
  await page
    .getByTestId('report-comment-input')
    .fill('This moderation comment violates the rules.');

  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText('Your report was submitted successfully.')
  ).toBeVisible();

  expect(reportVariables).toMatchObject({
    commentId: COMMENT_ID,
    selectedForumRules: [FORUM_RULE],
    reportText: 'This moderation comment violates the rules.',
  });
});
