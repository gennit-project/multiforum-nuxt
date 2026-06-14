import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_USERNAME = 'testuser';

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
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Tags: [],
        },
      ],
    },
  }),
  getChannelNames: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          displayName: TEST_CHANNEL,
        },
      ],
    },
  }),
  getTags: () => ({
    data: {
      tags: [],
    },
  }),
  getSitewideTagCounts: () => ({
    data: {
      tags: [],
    },
  }),
  getTagsInChannel: () => ({
    data: {
      tags: [],
    },
  }),
  getIssue: () => ({
    data: {
      issues: [],
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
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
});

test.describe('Event Date Modes', () => {
  test('displays date mode selector with three options', async ({
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
    await page.waitForLoadState('networkidle');

    // Check that all three date mode options are visible
    const singleModeButton = page.getByTestId('date-mode-single');
    const multipleModeButton = page.getByTestId('date-mode-multiple');
    const recurringModeButton = page.getByTestId('date-mode-recurring');

    await expect(singleModeButton).toBeVisible();
    await expect(multipleModeButton).toBeVisible();
    await expect(recurringModeButton).toBeVisible();

    // Single mode should be selected by default
    await expect(singleModeButton).toHaveClass(/border-orange-500/);
  });

  test('shows OccurrencesList when multiple dates mode is selected', async ({
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
    await page.waitForLoadState('networkidle');

    // Click on Multiple dates mode
    await page.getByTestId('date-mode-multiple').click();

    // Add occurrence button should be visible
    const addOccurrenceButton = page.getByTestId('add-occurrence-button');
    await expect(addOccurrenceButton).toBeVisible();

    // There should be at least one occurrence row
    const firstOccurrenceStartDate = page.getByTestId('occurrence-0-start-date');
    await expect(firstOccurrenceStartDate).toBeVisible();
  });

  test('shows DateRangeGroup when recurring mode is selected', async ({
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
    await page.waitForLoadState('networkidle');

    // Click on Recurring mode
    await page.getByTestId('date-mode-recurring').click();

    // Add date range button should be visible
    const addDateRangeButton = page.getByTestId('add-date-range-button');
    await expect(addDateRangeButton).toBeVisible();

    // There should be at least one date range group
    const firstGroupStartDate = page.getByTestId('group-0-start-date');
    await expect(firstGroupStartDate).toBeVisible();
  });

  test('can add and remove occurrences in multiple dates mode', async ({
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
    await page.waitForLoadState('networkidle');

    // Click on Multiple dates mode
    await page.getByTestId('date-mode-multiple').click();

    // Add another occurrence
    await page.getByTestId('add-occurrence-button').click();

    // Should have two occurrences now
    const occurrence0 = page.getByTestId('occurrence-0-start-date');
    const occurrence1 = page.getByTestId('occurrence-1-start-date');

    await expect(occurrence0).toBeVisible();
    await expect(occurrence1).toBeVisible();

    // Remove the second occurrence
    await page.getByTestId('remove-occurrence-1').click();

    // Should only have one occurrence now
    await expect(occurrence0).toBeVisible();
    await expect(occurrence1).not.toBeVisible();
  });
});
