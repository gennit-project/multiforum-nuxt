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
const EVENT_TITLE = 'Event to archive';
const FORUM_RULE = 'Be kind';

type ArchiveEventVariables = {
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
  description: 'A mocked event to archive',
  posterUsername: 'offender',
  overrides: {
    virtualEventUrl: 'https://example.com/event',
    locationName: 'Online',
    address: '',
  },
});

test('archives an event with mocked GraphQL', async ({
  page,
  setupMockedPage,
}) => {
  let archiveVariables: ArchiveEventVariables | null = null;

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
      archiveEvent: ({ body }) => {
        archiveVariables = body.variables as ArchiveEventVariables;

        return {
          data: {
            archiveEvent: {
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
  await page.getByTestId('event-menu-button-item-Archive').click();
  await expect(page.getByText('Archive Event')).toBeVisible();
  await page
    .getByTestId('forum-rules-section')
    .getByTestId('broken-rule-checkbox')
    .first()
    .check();
  await page
    .getByTestId('report-event-input')
    .fill('This event violates our community guidelines.');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText('The event was reported and archived successfully.')
  ).toBeVisible();
  expect(archiveVariables).toEqual({
    eventId: EVENT_ID,
    selectedForumRules: [FORUM_RULE],
    selectedServerRules: [],
    reportText: 'This event violates our community guidelines.',
    channelUniqueName: TEST_CHANNEL,
  });
  expect(diagnostics.pageErrors).toEqual([]);
});
