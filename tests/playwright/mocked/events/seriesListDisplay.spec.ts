import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildChannel,
  buildEvent,
  buildServerConfig,
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

type Occurrence = { id: string; startTime: string; endTime: string; canceled: boolean };

const defaultOccurrences = (): Occurrence[] => [
  { id: 'event-1', startTime: futureDate(7), endTime: futureDate(7), canceled: false },
  { id: 'event-2', startTime: futureDate(14), endTime: futureDate(14), canceled: false },
  { id: 'event-3', startTime: futureDate(21), endTime: futureDate(21), canceled: false },
  { id: 'event-4', startTime: futureDate(28), endTime: futureDate(28), canceled: false },
];

const seriesData = (occurrences: Occurrence[]) => ({
  id: 'series-1',
  title: 'Weekly Meetup',
  repeatPattern: {
    type: 'WEEKLY',
    count: 1,
    daysOfWeek: [3],
    endType: 'AFTER_COUNT',
    endCount: occurrences.length,
    endDate: null,
  },
  Occurrences: occurrences,
});

// The GET_EVENTS list query is normalized by Apollo, which needs __typename on
// each object to key it in the cache. Detail queries (getEvent) render a single
// object fine without it, but a list whose items lack __typename comes back as
// empty objects (undefined id/startTime). Stamp __typename onto the event and
// the nested objects the list query selects.
const withTypenames = (event: Record<string, any>) => ({
  ...event,
  __typename: 'Event',
  EventChannels: (event.EventChannels ?? []).map((ec: Record<string, any>) => ({
    ...ec,
    __typename: 'EventChannel',
    Channel: ec.Channel ? { ...ec.Channel, __typename: 'Channel' } : ec.Channel,
  })),
  Poster: event.Poster ? { ...event.Poster, __typename: 'User' } : event.Poster,
  EventSeries: event.EventSeries
    ? {
        ...event.EventSeries,
        __typename: 'EventSeries',
        Occurrences: (event.EventSeries.Occurrences ?? []).map(
          (occ: Record<string, any>) => ({ ...occ, __typename: 'Event' })
        ),
      }
    : event.EventSeries,
});

// Build on the shared buildEvent fixture (the shape proven to render in the
// other event list tests), then layer the series fields on via overrides so the
// list item resolves a real id/date and shows the series UI.
const buildSeriesEvent = (overrides: Partial<{
  id: string;
  title: string;
  startTime: string;
  occurrences: Occurrence[];
}> = {}) =>
  // Merge the series fields outside buildEvent's typed `overrides` (the shared
  // EventFixture types occurrenceIndex/EventSeries as null), into the loosely
  // typed withTypenames input.
  withTypenames({
    ...buildEvent({
      id: overrides.id ?? 'event-1',
      title: overrides.title ?? 'Weekly Meetup',
      channelUniqueName: TEST_CHANNEL,
      posterUsername: TEST_USERNAME,
    }),
    occurrenceIndex: 0,
    EventSeries: seriesData(overrides.occurrences ?? defaultOccurrences()),
    ...(overrides.startTime
      ? { startTime: overrides.startTime, endTime: overrides.startTime }
      : {}),
  });

const buildSingleEvent = (overrides: Partial<{
  id: string;
  title: string;
}> = {}) =>
  withTypenames(
    buildEvent({
      id: overrides.id ?? 'event-1',
      title: overrides.title ?? 'Single Event',
      channelUniqueName: TEST_CHANNEL,
      posterUsername: TEST_USERNAME,
    })
  );

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

// NOTE: Still skipped, but the original blockers are now fixed in this file:
//   - route corrected to /forums/:forumId/events (the forum events page is
//     pages/forums/[forumId]/events/index.vue → EventListView → GET_EVENTS)
//   - list-item selector corrected to the dynamic data-testid="event-list-item-<title>"
//   - fixtures rebuilt on the shared buildEvent, then stamped with __typename
//     (the GET_EVENTS result is normalized by Apollo; without __typename the list
//     items come back as empty objects with undefined id/startTime)
//   - duplicate-title waits use .first() (the title renders in several spots)
// With those, the series UI does render (verified: the "Also on:" occurrence
// buttons appear). What remains is local flakiness: the forum events-list page
// intermittently fails to hydrate under `nuxt dev` in mocked runs (blank page,
// no console/page error), so a reliable green pass could not be confirmed in this
// environment. Re-enable and verify in CI, where the dev server is more stable.
// TODO: confirm green in CI, then remove .skip.
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

    await page.goto(`/forums/${TEST_CHANNEL}/events`);

    // Wait for events to load
    await expect(page.getByText('Series Event').first()).toBeVisible();

    // Series event should have a series indicator
    const seriesEventItem = page.locator('[data-testid^="event-list-item-"]').filter({ hasText: 'Series Event' });
    const seriesIcon = seriesEventItem.locator('[title="Part of a series"]');
    await expect(seriesIcon).toBeVisible();

    // Single event should NOT have a series indicator
    const singleEventItem = page.locator('[data-testid^="event-list-item-"]').filter({ hasText: 'Single Event' });
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

    await page.goto(`/forums/${TEST_CHANNEL}/events`);

    // Wait for event to load
    await expect(page.getByText('Weekly Meetup').first()).toBeVisible();

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

    await page.goto(`/forums/${TEST_CHANNEL}/events`);

    // Wait for event to load
    await expect(page.getByText('Weekly Meetup').first()).toBeVisible();
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

    await page.goto(`/forums/${TEST_CHANNEL}/events`);

    // Wait for event to load
    await expect(page.getByText('Weekly Meetup').first()).toBeVisible();

    // Should show "+N more" indicator since there are more than maxVisible (4) occurrences
    await expect(page.getByText(/\+\d+ more/)).toBeVisible();
  });
});
