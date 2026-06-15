import { test, expect } from '../../helpers/testFixture';
import { buildChannel, buildEvent } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import {
  DEFAULT_MOD_ROLE,
  DEFAULT_RULES_JSON,
} from '../../helpers/moderationFixtures';

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

const mockEvent = buildEvent({
  id: EVENT_ID,
  eventChannelId: EVENT_CHANNEL_ID,
  channelUniqueName: TEST_CHANNEL,
  title: EVENT_TITLE,
  description: 'A mocked event description',
  posterUsername: 'cluse',
  overrides: {
    virtualEventUrl: 'https://example.com/event',
    locationName: 'Online',
    address: '',
  },
});

test('reports an event with mocked GraphQL', async ({
  page,
  setupMockedPage,
}) => {
  let reportVariables: ReportEventVariables | null = null;

  const { diagnostics } = await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'alice',
        channelId: TEST_CHANNEL,
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
      getEvents: () => ({
        data: {
          eventsAggregate: { count: 1 },
          events: [mockEvent],
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
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/events/${EVENT_ID}`);
  await page.getByTestId('event-menu-button').click();
  await page.getByTestId('event-menu-button-item-Report').click();
  await expect(page.getByText('Report Event')).toBeVisible();
  await page
    .getByTestId('forum-rules-section')
    .getByTestId('broken-rule-checkbox')
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
});
