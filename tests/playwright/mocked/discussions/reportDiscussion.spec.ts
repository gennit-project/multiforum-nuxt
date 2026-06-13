import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildChannel,
  buildDiscussion,
  buildDiscussionChannel,
  buildServerConfig,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

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

const rulesJSON = JSON.stringify([
  {
    summary: FORUM_RULE,
    detail: 'Keep the forum civil.',
  },
]);

test('reports a discussion with mocked GraphQL', async (
  { context, page },
  testInfo
) => {
  let reportVariables: ReportDiscussionVariables | null = null;

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
            DefaultModRole: {
              canReport: true,
              canHideDiscussion: true,
            },
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
        channels: [buildChannel({ uniqueName: TEST_CHANNEL, overrides: { rules: rulesJSON } })],
      },
    }),
    getChannel: () => ({
      data: {
        channels: [
          buildChannel({
            uniqueName: TEST_CHANNEL,
            overrides: {
              rules: rulesJSON,
              DefaultModRole: {
                canReport: true,
                canHideDiscussion: true,
              },
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
  });

  try {
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
