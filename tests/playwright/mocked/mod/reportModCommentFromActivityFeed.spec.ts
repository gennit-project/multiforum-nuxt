import { expect, test } from '../../helpers/testFixture';
import {
  buildIssue,
  buildModCommentActivityItem,
  buildModerationAction,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { getIssueDetailBaseMocks } from '../../helpers/issueDetailMocks';

// Workflow: "Verify Reporting from Issue Activity Feed"
//
// A moderator (channel admin "alice") opens an issue whose activity feed
// contains a comment authored by another moderation profile ("mod-bob"). The
// comment's context menu must offer "Report Mod Comment", which opens the
// BrokenRulesModal and submits a reportComment mutation for that comment.

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const ISSUE_NUMBER = 1;
const TARGET_MOD = 'mod-bob';
const ACTIVITY_COMMENT_ID = 'activity-comment-1';
const ACTIVITY_COMMENT_TEXT = 'A moderation comment that should be reportable.';
const FORUM_RULE = 'Be kind';

// A ModerationAction of type "comment" whose Comment is authored by a
// ModerationProfile (so it is reportable from the current moderator's view).
const modCommentActivityItem = buildModCommentActivityItem({
  commentId: ACTIVITY_COMMENT_ID,
  text: ACTIVITY_COMMENT_TEXT,
  modDisplayName: TARGET_MOD,
  channelUniqueName: TEST_CHANNEL,
  issueId: `issue-${ISSUE_NUMBER}`,
});

type ReportCommentVariables = {
  commentId?: string;
  selectedForumRules?: string[];
  selectedServerRules?: string[];
  reportText?: string;
  channelUniqueName?: string;
};

test('reports a mod-authored comment from the issue activity feed', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  let reportVariables: ReportCommentVariables | null = null;

  const issue = buildIssue({
    issueNumber: ISSUE_NUMBER,
    channelUniqueName: TEST_CHANNEL,
    title: 'Reported moderation comment',
    isOpen: true,
    activityFeed: [
      buildModerationAction({
        id: 'action-report',
        actionType: 'report',
        actionDescription: 'reported this comment',
        moderatorDisplayName: 'mod-alice',
      }),
      modCommentActivityItem as never,
    ],
    overrides: { relatedDiscussionId: 'discussion-1' },
  });

  await installGraphqlMocks(page, {
    ...getIssueDetailBaseMocks({ username: TEST_USER, channel: TEST_CHANNEL }),
    getIssue: () => ({ data: { issues: [issue] } }),
    reportComment: ({ body }) => {
      reportVariables = body.variables as ReportCommentVariables;
      return { data: { reportComment: { id: 'issue-2', issueNumber: 2 } } };
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

  // The activity-feed comment renders. Generous timeout: the issue route can pay
  // a cold Vite-compile cost on the first navigation of an isolated run.
  await expect(page.getByText(ACTIVITY_COMMENT_TEXT)).toBeVisible({
    timeout: 60_000,
  });

  // Open the comment context menu and choose "Report Mod Comment".
  await page.getByRole('button', { name: 'Comment actions' }).click();
  await page.getByRole('menuitem', { name: 'Report Mod Comment' }).click();

  // The BrokenRulesModal opens for a comment.
  await expect(page.getByTestId('report-comment-input')).toBeVisible();

  // Select a broken rule and explain the report.
  await page
    .getByTestId('forum-rules-section')
    .getByTestId('broken-rule-checkbox')
    .first()
    .check();
  await page
    .getByTestId('report-comment-input')
    .fill('This moderation comment violates the rules.');

  await page.getByRole('button', { name: 'Submit' }).click();

  // Success notification confirms the report was submitted.
  await expect(
    page.getByText('Your report was submitted successfully.')
  ).toBeVisible();

  // The reportComment mutation was called for the activity-feed comment.
  expect(reportVariables).toMatchObject({
    commentId: ACTIVITY_COMMENT_ID,
    selectedForumRules: [FORUM_RULE],
    reportText: 'This moderation comment violates the rules.',
  });
});
