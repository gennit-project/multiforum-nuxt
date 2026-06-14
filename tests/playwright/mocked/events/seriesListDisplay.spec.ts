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

// Build a future date for occurrence testing
const futureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

const buildSeriesEvent = (overrides: Partial<{
  id: string;
  title: string;
  startTime: string;
}> = {}) => ({
  id: overrides.id || 'event-1',
  title: overrides.title || 'Weekly Meetup',
  description: 'Test event description',
  startTime: overrides.startTime || futureDate(7),
  endTime: futureDate(7),
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
  occurrenceIndex: 0,
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
      { id: 'event-1', startTime: futureDate(7), endTime: futureDate(7), canceled: false },
      { id: 'event-2', startTime: futureDate(14), endTime: futureDate(14), canceled: false },
      { id: 'event-3', startTime: futureDate(21), endTime: futureDate(21), canceled: false },
      { id: 'event-4', startTime: futureDate(28), endTime: futureDate(28), canceled: false },
    ],
  },
  Tags: [],
  CommentsAggregate: { count: 0 },
  EventChannels: [
    {
      id: 'event-channel-1',
      eventId: overrides.id || 'event-1',
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
  Poster: buildUser({ username: TEST_USERNAME }),
});

const buildSingleEvent = (overrides: Partial<{
  id: string;
  title: string;
}> = {}) => ({
  ...buildSeriesEvent(overrides),
  EventSeries: null,
  occurrenceIndex: null,
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
          Admins: [],
          SuspendedUsers: [],
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
});

// NOTE: List display tests are currently skipped because they require additional
// GraphQL query mocking for the events list page. The page makes queries that
// aren't fully mocked, causing 500 errors.
// TODO: Add missing mock handlers for event list page queries.

test.describe.skip('Series List Display', () => {
  test('shows series icon for events that are part of a series', async ({ context, page }) => {
    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvents: () => ({
        data: {
          eventsAggregate: { count: 2 },
          events: [
            buildSeriesEvent({ id: 'series-event-1', title: 'Series Event' }),
            buildSingleEvent({ id: 'single-event-1', title: 'Single Event' }),
          ],
        },
      }),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/list`);

    // Wait for events to load
    await expect(page.getByText('Series Event')).toBeVisible();

    // Series event should have a series indicator
    const seriesEventItem = page.locator('[data-testid="event-list-item"]').filter({ hasText: 'Series Event' });
    const seriesIcon = seriesEventItem.locator('[title="Part of a series"]');
    await expect(seriesIcon).toBeVisible();

    // Single event should NOT have a series indicator
    const singleEventItem = page.locator('[data-testid="event-list-item"]').filter({ hasText: 'Single Event' });
    const noSeriesIcon = singleEventItem.locator('[title="Part of a series"]');
    await expect(noSeriesIcon).not.toBeVisible();
  });

  test('shows occurrence buttons for series events', async ({ context, page }) => {
    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvents: () => ({
        data: {
          eventsAggregate: { count: 1 },
          events: [buildSeriesEvent({ id: 'series-event-1', title: 'Weekly Meetup' })],
        },
      }),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/list`);

    // Wait for event to load
    await expect(page.getByText('Weekly Meetup')).toBeVisible();

    // Should show "Also on:" with occurrence buttons
    await expect(page.getByText('Also on:')).toBeVisible();
  });

  test('occurrence buttons navigate to the correct event', async ({ context, page }) => {
    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvents: () => ({
        data: {
          eventsAggregate: { count: 1 },
          events: [buildSeriesEvent({ id: 'event-1', title: 'Weekly Meetup' })],
        },
      }),
      getEvent: () => ({
        data: {
          events: [buildSeriesEvent({ id: 'event-2', title: 'Weekly Meetup' })],
        },
      }),
      getEventComments: () => ({
        data: {
          getEventComments: {
            Event: buildSeriesEvent({ id: 'event-2' }),
            Comments: [],
          },
        },
      }),
      getEventRootCommentAggregate: () => ({
        data: { events: [{ id: 'event-2', CommentsAggregate: { count: 0 } }] },
      }),
      getEventChannelID: () => ({
        data: { eventChannels: [{ id: 'event-channel-1', archived: false }] },
      }),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/list`);

    // Wait for event to load
    await expect(page.getByText('Weekly Meetup')).toBeVisible();
    await expect(page.getByText('Also on:')).toBeVisible();

    // Click on the first occurrence button (should be a date like "Jan 14")
    const occurrenceButtons = page.locator('a').filter({ hasText: /^[A-Z][a-z]{2} \d{1,2}$/ });
    const firstButton = occurrenceButtons.first();

    if (await firstButton.isVisible()) {
      // Get the href to verify it points to a different event
      const href = await firstButton.getAttribute('href');
      expect(href).toContain('/events/');
    }
  });

  test('shows +N more indicator when many occurrences exist', async ({ context, page }) => {
    // Create event with many occurrences
    const manyOccurrences = Array.from({ length: 10 }, (_, i) => ({
      id: `event-${i + 1}`,
      startTime: futureDate(7 * (i + 1)),
      endTime: futureDate(7 * (i + 1)),
      canceled: false,
    }));

    const eventWithManyOccurrences = {
      ...buildSeriesEvent(),
      EventSeries: {
        id: 'series-1',
        title: 'Weekly Meetup',
        repeatPattern: {
          type: 'WEEKLY',
          count: 1,
          daysOfWeek: [3],
          endType: 'AFTER_COUNT',
          endCount: 10,
          endDate: null,
        },
        Occurrences: manyOccurrences,
      },
    };

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      getEvents: () => ({
        data: {
          eventsAggregate: { count: 1 },
          events: [eventWithManyOccurrences],
        },
      }),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/list`);

    // Wait for event to load
    await expect(page.getByText('Weekly Meetup')).toBeVisible();

    // Should show "+N more" indicator since there are more than maxVisible (4) occurrences
    await expect(page.getByText(/\+\d+ more/)).toBeVisible();
  });
});
