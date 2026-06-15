import { test, expect } from '../../helpers/testFixture';
import {
  buildChannel,
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { DEFAULT_RULES_JSON } from '../../helpers/moderationFixtures';

const TEST_CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-1';
const DISCUSSION_TITLE = 'Example topic 1';
const FORUM_RULE = 'Be kind';

type ReportDiscussionVariables = {
  discussionId?: string;
  selectedForumRules?: string[];
  selectedServerRules?: string[];
  reportText?: string;
  channelUniqueName?: string;
};

test('reports a discussion with mocked GraphQL', async ({
  page,
  setupMockedPage,
}) => {
  let reportVariables: ReportDiscussionVariables | null = null;

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
          DefaultModRole: {
            canReport: true,
            canHideDiscussion: true,
          },
        },
        channelOverrides: {
          rules: DEFAULT_RULES_JSON,
          DefaultModRole: {
            canReport: true,
            canHideDiscussion: true,
          },
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
            }),
            Comments: [],
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
              CommentsAggregate: { count: 0 },
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
      reportDiscussion: ({ body }) => {
        reportVariables = body.variables as ReportDiscussionVariables;

        return {
          data: {
            reportDiscussion: {
              id: 'issue-1',
              issueNumber: 1,
            },
          },
        };
      },
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);
  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Report').click();
  await expect(page.getByText('Report Discussion')).toBeVisible();
  await page
    .getByTestId('forum-rules-section')
    .getByTestId('broken-rule-checkbox')
    .first()
    .check();
  await page
    .getByTestId('report-discussion-input')
    .fill('This is a mocked report flow.');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText('Your report was submitted successfully.')
  ).toBeVisible();
  expect(reportVariables).toEqual({
    discussionId: DISCUSSION_ID,
    selectedForumRules: [FORUM_RULE],
    selectedServerRules: [],
    reportText: 'This is a mocked report flow.',
    channelUniqueName: TEST_CHANNEL,
  });
  expect(diagnostics.pageErrors).toEqual([]);
});
