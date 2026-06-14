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
const DISCUSSION_TITLE = 'Discussion to archive and suspend';
const FORUM_RULE = 'Be kind';

type ArchiveDiscussionVariables = {
  discussionId?: string;
  selectedForumRules?: string[];
  selectedServerRules?: string[];
  reportText?: string;
  channelUniqueName?: string;
};

type SuspendUserVariables = {
  issueID?: string;
  suspendUntil?: string | null;
  suspendIndefinitely?: boolean;
  explanation?: string;
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

test('archives a discussion and suspends user with mocked GraphQL', async (
  { context, page },
  testInfo
) => {
  let archiveVariables: ArchiveDiscussionVariables | null = null;
  let suspendVariables: SuspendUserVariables | null = null;

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
            overrides: {
              Author: buildUser({ username: 'offender' }),
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
    archiveDiscussion: ({ body }) => {
      archiveVariables = body.variables as ArchiveDiscussionVariables;

      return {
        data: {
          archiveDiscussion: {
            id: 'issue-from-archive',
            issueNumber: 1,
          },
        },
      };
    },
    suspendUser: ({ body }) => {
      suspendVariables = body.variables as SuspendUserVariables;

      return {
        data: {
          suspendUser: {
            success: true,
          },
        },
      };
    },
    isOriginalPosterSuspended: () => ({
      data: {
        isOriginalPosterSuspended: false,
      },
    }),
  });

  try {
    await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);

    // Click the discussion menu button
    await page.getByTestId('discussion-menu-button').click();

    // Click the Archive and Suspend option
    await page.getByTestId('discussion-menu-button-item-Archive and Suspend').click();

    // Verify the modal is open - it should show the suspend author title
    await expect(page.getByText('Suspend Author')).toBeVisible();

    // Select a broken rule
    await page
      .getByTestId('forum-rules-section')
      .getByTestId('broken-rule-checkbox')
      .first()
      .check();

    // The default suspension length is "Two Weeks" - verify it's selected
    await expect(page.locator('select')).toHaveValue('two_weeks');

    // Fill in the report text
    await page
      .getByTestId('report-discussion-input')
      .fill('Repeated violations of community guidelines.');

    // Submit the form
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success notification appears
    await expect(
      page.getByText('Archived the post and suspended the author.')
    ).toBeVisible();

    // Verify archiveDiscussion was called with correct variables
    expect(archiveVariables).toEqual({
      discussionId: DISCUSSION_ID,
      selectedForumRules: [FORUM_RULE],
      selectedServerRules: [],
      reportText: 'Repeated violations of community guidelines.',
      channelUniqueName: TEST_CHANNEL,
    });

    // Verify suspendUser was called with correct variables
    expect(suspendVariables).not.toBeNull();
    expect(suspendVariables).toMatchObject({
      issueID: 'issue-from-archive',
      suspendIndefinitely: false,
    });
    // suspendUntil should be a date string (two weeks from now)
    expect(suspendVariables!.suspendUntil).toBeTruthy();
    expect(typeof suspendVariables!.suspendUntil).toBe('string');

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
