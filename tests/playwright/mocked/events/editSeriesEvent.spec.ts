import { expect, test } from '@playwright/test';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_USERNAME = 'testuser';
const TEST_EVENT_ID = 'event-1';

const buildSeriesEvent = (overrides: Partial<{
  id: string;
  title: string;
  occurrenceIndex: number;
}> = {}) => ({
  id: overrides.id || TEST_EVENT_ID,
  title: overrides.title || 'Weekly Meetup',
  description: 'Test event description',
  startTime: '2030-01-01T18:00:00.000Z',
  endTime: '2030-01-01T20:00:00.000Z',
  locationName: 'Test Location',
  address: '123 Test St',
  virtualEventUrl: '',
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
  location: { latitude: 33.4484, longitude: -112.074 },
  cost: '',
  occurrenceIndex: overrides.occurrenceIndex ?? 0,
  RecurringEvent: null,
  EventSeries: {
    id: 'series-1',
    title: 'Weekly Meetup',
    repeatPattern: {
      type: 'WEEKLY',
      count: 1,
      daysOfWeek: [3],
      endType: 'AFTER_COUNT',
      endCount: 4,
      endDate: null,
    },
    Occurrences: [
      { id: 'event-1', startTime: '2030-01-01T18:00:00.000Z', endTime: '2030-01-01T20:00:00.000Z', canceled: false },
      { id: 'event-2', startTime: '2030-01-08T18:00:00.000Z', endTime: '2030-01-08T20:00:00.000Z', canceled: false },
      { id: 'event-3', startTime: '2030-01-15T18:00:00.000Z', endTime: '2030-01-15T20:00:00.000Z', canceled: false },
      { id: 'event-4', startTime: '2030-01-22T18:00:00.000Z', endTime: '2030-01-22T20:00:00.000Z', canceled: false },
    ],
  },
  Tags: [],
  CommentsAggregate: { count: 0 },
  EventChannels: [
    {
      id: 'event-channel-1',
      eventId: overrides.id || TEST_EVENT_ID,
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
  Poster: buildUser({ username: TEST_USERNAME }),
});

const getCommonMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: {
      users: [buildBasicUser({ username, displayName: username })],
    },
  }),
  getUser: () => ({
    data: {
      users: [{ username, notifyOnReplyToEventByDefault: true }],
    },
  }),
  getUserActiveSuspensions: () => ({
    data: { users: [{ username, Suspensions: [] }] },
  }),
  getUserFavorites: () => ({
    data: {
      users: [{ username, FavoriteChannels: [], Collections: [] }],
    },
  }),
  GetUserFavoriteChannels: () => ({
    data: { users: [{ username, FavoriteChannels: [] }] },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: { users: [{ username, Collections: [] }] },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({ serverName: 'Listical', enableEvents: true }),
      ],
    },
  }),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({ uniqueName: TEST_CHANNEL, overrides: { eventsEnabled: true } }),
      ],
    },
  }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, DiscussionChannelsAggregate: { count: 0 } }],
    },
  }),
  getChannelTags: () => ({
    data: { channels: [{ uniqueName: TEST_CHANNEL, Tags: [] }] },
  }),
  getChannelNames: () => ({
    data: { channels: [{ uniqueName: TEST_CHANNEL, displayName: TEST_CHANNEL }] },
  }),
  getTags: () => ({ data: { tags: [] } }),
  getSitewideTagCounts: () => ({ data: { tags: [] } }),
  getTagsInChannel: () => ({ data: { tags: [] } }),
  getIssue: () => ({ data: { issues: [] } }),
  getUserSuspensionInChannel: () => ({
    data: { channels: [{ uniqueName: TEST_CHANNEL, SuspendedUsers: [] }] },
  }),
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [{ displayName: username }],
          SuspendedUsers: [],
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
});

// NOTE: Edit tests are currently skipped because they require complex auth setup
// with ownership verification. The mock auth system needs enhancement to properly
// set usernameVar on page load for RequireAuth ownership checks to work.
// TODO: Fix test-auth.client.ts plugin to properly sync auth state for ownership checks.

test.describe.skip('Edit Series Event', () => {
  test('shows scope modal when editing series event', async ({ context, page }) => {
    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvent: () => ({
        data: { events: [buildSeriesEvent()] },
      }),
      getEventComments: () => ({
        data: {
          getEventComments: {
            Event: buildSeriesEvent(),
            Comments: [],
          },
        },
      }),
      getEventRootCommentAggregate: () => ({
        data: { events: [{ id: TEST_EVENT_ID, CommentsAggregate: { count: 0 } }] },
      }),
      getEventChannelID: () => ({
        data: { eventChannels: [{ id: 'event-channel-1', archived: false }] },
      }),
      updateEventInSeries: () => ({
        data: {
          updateEventInSeries: buildSeriesEvent({ title: 'Updated Title' }),
        },
      }),
    });

    // Navigate to edit page
    await page.goto(`/forums/${TEST_CHANNEL}/events/edit/${TEST_EVENT_ID}`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Change the title (a series-level field)
    await page.getByTestId('title-input').fill('Updated Title');

    // Submit the form
    const saveButton = page.getByTestId('event-form').getByRole('button', { name: 'Save' }).first();
    await saveButton.click();

    // Scope modal should appear
    const scopeModal = page.getByTestId('edit-scope-modal');
    await expect(scopeModal).toBeVisible();

    // Should show scope options
    await expect(page.getByText('This event only')).toBeVisible();
    await expect(page.getByText('This and following events')).toBeVisible();
    await expect(page.getByText('All events in series')).toBeVisible();
  });

  test('scope modal allows selecting THIS_ONLY', async ({ context, page }) => {
    let updateVariables: any = null;

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvent: () => ({
        data: { events: [buildSeriesEvent()] },
      }),
      getEventComments: () => ({
        data: {
          getEventComments: {
            Event: buildSeriesEvent(),
            Comments: [],
          },
        },
      }),
      getEventRootCommentAggregate: () => ({
        data: { events: [{ id: TEST_EVENT_ID, CommentsAggregate: { count: 0 } }] },
      }),
      getEventChannelID: () => ({
        data: { eventChannels: [{ id: 'event-channel-1', archived: false }] },
      }),
      updateEventInSeries: ({ body }) => {
        updateVariables = body.variables;
        return {
          data: {
            updateEventInSeries: buildSeriesEvent({ title: 'Updated Title' }),
          },
        };
      },
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/edit/${TEST_EVENT_ID}`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Change the title
    await page.getByTestId('title-input').fill('Updated Title');

    // Submit
    const saveButton = page.getByTestId('event-form').getByRole('button', { name: 'Save' }).first();
    await saveButton.click();

    // Scope modal should appear
    await expect(page.getByTestId('edit-scope-modal')).toBeVisible();

    // Select "This event only"
    await page.getByText('This event only').click();

    // Confirm
    const confirmButton = page.getByTestId('edit-scope-modal').getByRole('button', { name: 'Apply' });
    await confirmButton.click();

    // Wait for mutation
    await expect(async () => {
      expect(updateVariables).not.toBeNull();
    }).toPass({ timeout: 10000 });

    // Verify scope was THIS_ONLY
    expect(updateVariables.scope).toBe('THIS_ONLY');
  });

  test('scope modal allows selecting ALL_IN_SERIES', async ({ context, page }) => {
    let updateVariables: any = null;

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvent: () => ({
        data: { events: [buildSeriesEvent()] },
      }),
      getEventComments: () => ({
        data: {
          getEventComments: {
            Event: buildSeriesEvent(),
            Comments: [],
          },
        },
      }),
      getEventRootCommentAggregate: () => ({
        data: { events: [{ id: TEST_EVENT_ID, CommentsAggregate: { count: 0 } }] },
      }),
      getEventChannelID: () => ({
        data: { eventChannels: [{ id: 'event-channel-1', archived: false }] },
      }),
      updateEventInSeries: ({ body }) => {
        updateVariables = body.variables;
        return {
          data: {
            updateEventInSeries: buildSeriesEvent({ title: 'Updated Title' }),
          },
        };
      },
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/edit/${TEST_EVENT_ID}`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Change the title
    await page.getByTestId('title-input').fill('Updated Title');

    // Submit
    const saveButton = page.getByTestId('event-form').getByRole('button', { name: 'Save' }).first();
    await saveButton.click();

    // Scope modal should appear
    await expect(page.getByTestId('edit-scope-modal')).toBeVisible();

    // Select "All events in series"
    await page.getByText('All events in series').click();

    // Confirm
    const confirmButton = page.getByTestId('edit-scope-modal').getByRole('button', { name: 'Apply' });
    await confirmButton.click();

    // Wait for mutation
    await expect(async () => {
      expect(updateVariables).not.toBeNull();
    }).toPass({ timeout: 10000 });

    // Verify scope was ALL_IN_SERIES
    expect(updateVariables.scope).toBe('ALL_IN_SERIES');
  });
});
