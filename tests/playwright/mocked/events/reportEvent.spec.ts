import { expect, test } from '@playwright/test';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const EVENT_ID = 'event-1';
const EVENT_CHANNEL_ID = 'event-channel-1';
const EVENT_TITLE = 'Test free/virtual event';
const FORUM_RULE = 'Be kind';

type ReportEventVariables = {
  eventId?: string;
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

const buildEvent = () => ({
  id: EVENT_ID,
  title: EVENT_TITLE,
  description: 'A mocked event description',
  startTime: '2030-01-01T18:00:00.000Z',
  endTime: '2030-01-01T19:00:00.000Z',
  locationName: 'Online',
  address: '',
  virtualEventUrl: 'https://example.com/event',
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
  location: null,
  cost: '',
  Tags: [],
  CommentsAggregate: { count: 0 },
  EventChannels: [
    {
      id: EVENT_CHANNEL_ID,
      eventId: EVENT_ID,
      channelUniqueName: TEST_CHANNEL,
      archived: false,
      Channel: {
        uniqueName: TEST_CHANNEL,
        displayName: TEST_CHANNEL,
        channelIconURL: '',
      },
    },
  ],
  SubscribedToNotifications: [],
  SubscribedToEventUpdates: [],
  FeedbackCommentsAggregate: { count: 0 },
  FeedbackComments: [],
  Poster: {
    username: 'cluse',
    createdAt: MOCK_DATE,
    discussionKarma: 0,
    commentKarma: 0,
    ChannelRoles: [],
  },
});

test('reports an event with mocked GraphQL', async (
  { context, page },
  testInfo
) => {
  let reportVariables: ReportEventVariables | null = null;

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
            notifyOnReplyToEventByDefault: true,
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
    getEvent: () => ({
      data: {
        events: [buildEvent()],
      },
    }),
    getEventComments: () => ({
      data: {
        getEventComments: {
          Event: buildEvent(),
          Comments: [],
        },
      },
    }),
    getEventRootCommentAggregate: () => ({
      data: {
        events: [
          {
            id: EVENT_ID,
            CommentsAggregate: { count: 0 },
          },
        ],
      },
    }),
    getEventChannelID: () => ({
      data: {
        eventChannels: [
          {
            id: EVENT_CHANNEL_ID,
            archived: false,
          },
        ],
      },
    }),
    getChannelDownloadCount: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
            DiscussionChannelsAggregate: { count: 0 },
          },
        ],
      },
    }),
    getEvents: () => ({
      data: {
        eventsAggregate: { count: 1 },
        events: [buildEvent()],
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
    reportEvent: ({ body }) => {
      reportVariables = body.variables as ReportEventVariables;

      return {
        data: {
          reportEvent: {
            id: 'issue-1',
            issueNumber: 1,
          },
        },
      };
    },
  });

  try {
    await page.goto(`/forums/${TEST_CHANNEL}/events/${EVENT_ID}`);
    await page.getByTestId('event-menu-button').click();
    await page.getByTestId('event-menu-button-item-Report').click();
    await expect(page.getByText('Report Event')).toBeVisible();
    await page
      .locator(`h3:has-text("Forum rules for ${TEST_CHANNEL}")`)
      .locator('xpath=..')
      .locator('input[type="checkbox"]')
      .first()
      .check();
    await page
      .getByTestId('report-event-input')
      .fill('This is a mocked event report.');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(
      page.getByText('Your report was submitted successfully.')
    ).toBeVisible();
    expect(reportVariables).toEqual({
      eventId: EVENT_ID,
      selectedForumRules: [FORUM_RULE],
      selectedServerRules: [],
      reportText: 'This is a mocked event report.',
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
