import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_USERNAME = 'testuser';

type CreateEventSeriesVariables = {
  input?: {
    title?: string;
    channelConnections?: string[];
    occurrences?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
};

const getCommonMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: {
      users: [
        buildBasicUser({
          username,
          displayName: username,
        }),
      ],
    },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          username,
          notifyOnReplyToEventByDefault: true,
        },
      ],
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
    data: {
      users: [{ username, FavoriteChannels: [] }],
    },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: {
      users: [{ username, Collections: [] }],
    },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({
          serverName: 'Listical',
          enableEvents: true,
        }),
      ],
    },
  }),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
          overrides: { eventsEnabled: true },
        }),
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
  getChannelTags: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, Tags: [] }],
    },
  }),
  getChannelNames: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, displayName: TEST_CHANNEL }],
    },
  }),
  getTags: () => ({ data: { tags: [] } }),
  getSitewideTagCounts: () => ({ data: { tags: [] } }),
  getTagsInChannel: () => ({ data: { tags: [] } }),
  getIssue: () => ({ data: { issues: [] } }),
  getUserSuspensionInChannel: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, SuspendedUsers: [] }],
    },
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

test.describe('Create Series Event', () => {
  test('can create event with multiple manual dates', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Fill in title
    await page.getByTestId('title-input').fill('Multi-date Event');

    // Switch to multiple dates mode
    await page.getByTestId('date-mode-multiple').click();

    // Should see the occurrences list with one occurrence
    await expect(page.getByTestId('occurrence-0-start-date')).toBeVisible();

    // Add another occurrence
    await page.getByTestId('add-occurrence-button').click();
    await expect(page.getByTestId('occurrence-1-start-date')).toBeVisible();

    // Verify both occurrences are visible
    await expect(page.getByTestId('occurrence-0-start-date')).toBeVisible();
    await expect(page.getByTestId('occurrence-1-start-date')).toBeVisible();
  });

  test('creates an expo-hours series from multiple date ranges', async ({
    context,
    page,
  }) => {
    let createVariables: CreateEventSeriesVariables | null = null;

    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
      createEventSeries: ({ body }) => {
        createVariables = body.variables as CreateEventSeriesVariables;
        return {
          data: {
            createEventSeriesWithChannelConnections: {
              id: 'series-1',
              Occurrences: [{ id: 'event-1' }],
            },
          },
        };
      },
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
    await expect(page.getByTestId('event-form')).toBeVisible();
    await page.getByTestId('title-input').fill('Annual Expo');
    await page.getByTestId('date-mode-dateRange').click();

    // Wednesday: noon–7:30pm.
    await page.getByTestId('group-0-start-date').fill('2030-03-06');
    await page.getByTestId('group-0-end-date').fill('2030-03-06');
    await page.getByTestId('group-0-start-time').click();
    await page
      .locator('.touch-scroll-y:visible')
      .getByText('12:00 PM', { exact: true })
      .click();
    await page.getByTestId('group-0-end-time').click();
    await page
      .locator('.touch-scroll-y:visible')
      .getByText('7:30 PM', { exact: true })
      .click();

    // Thursday–Saturday: 9am–5pm (the defaults).
    await page.getByTestId('add-date-range-button').click();
    await page.getByTestId('group-1-start-date').fill('2030-03-07');
    await page.getByTestId('group-1-end-date').fill('2030-03-09');

    // Sunday: 9am–noon.
    await page.getByTestId('add-date-range-button').click();
    await page.getByTestId('group-2-start-date').fill('2030-03-10');
    await page.getByTestId('group-2-end-date').fill('2030-03-10');
    await page.getByTestId('group-2-end-time').click();
    await page
      .locator('.touch-scroll-y:visible')
      .getByText('12:00 PM', { exact: true })
      .click();

    await expect(page.getByTestId('date-range-occurrence-count')).toHaveText(
      'Creates 5 events.'
    );

    await page
      .getByTestId('event-form')
      .getByRole('button', { name: 'Save' })
      .first()
      .click();
    await expect.poll(() => createVariables).not.toBeNull();

    const input = createVariables!.input;
    const occurrenceTimes = input?.occurrences?.map((occurrence) => ({
      start: occurrence.startTime.slice(0, 16),
      end: occurrence.endTime.slice(0, 16),
    }));

    expect({
      title: input?.title,
      channels: input?.channelConnections,
      occurrenceTimes,
    }).toEqual({
      title: 'Annual Expo',
      channels: [TEST_CHANNEL],
      occurrenceTimes: [
        { start: '2030-03-06T12:00', end: '2030-03-06T19:30' },
        { start: '2030-03-07T09:00', end: '2030-03-07T17:00' },
        { start: '2030-03-08T09:00', end: '2030-03-08T17:00' },
        { start: '2030-03-09T09:00', end: '2030-03-09T17:00' },
        { start: '2030-03-10T09:00', end: '2030-03-10T12:00' },
      ],
    });
  });

  test('can create event with recurring pattern', async ({ context, page }) => {
    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Fill in title
    await page.getByTestId('title-input').fill('Weekly Recurring Event');

    // Switch to recurring mode
    await page.getByTestId('date-mode-recurring').click();

    // Verify repeat pattern picker is visible
    await expect(page.getByTestId('repeat-type-weekly')).toBeVisible();

    // Select Monday and Wednesday
    await page.getByTestId('day-of-week-1').click();
    await page.getByTestId('day-of-week-3').click();

    // Verify days are selected (have orange background)
    await expect(page.getByTestId('day-of-week-1')).toHaveClass(
      /bg-orange-500/
    );
    await expect(page.getByTestId('day-of-week-3')).toHaveClass(
      /bg-orange-500/
    );

    // Set end count
    await page.getByTestId('end-type-after_count').click();
    const endCountInput = page.getByTestId('end-count');
    await expect(endCountInput).toBeVisible();
  });

  test('shows occurrence preview when configuring recurring pattern', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: TEST_USERNAME,
      email: 'test@example.com',
    });

    await installGraphqlMocks(page, {
      ...getCommonMocks(TEST_USERNAME),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Switch to recurring mode
    await page.getByTestId('date-mode-recurring').click();

    // Select some days
    await page.getByTestId('day-of-week-1').click(); // Monday

    // Preview should mention the recurrence pattern (use more specific locator)
    await expect(page.locator('p:has-text("Repeats every")')).toBeVisible();
  });
});
