import { expect, test } from '@playwright/test';
import type { EventCreateInput } from '@/__generated__/graphql';
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
const TEST_EVENT_TITLE = 'Test event title';
const TAG_ONE = 'trivia';
const TAG_TWO = 'music';

type CreateEventVariables = {
  input?: Array<{
    eventCreateInput: EventCreateInput;
    channelConnections: string[];
  }>;
};

const buildEvent = (overrides: Partial<{
  id: string;
  title: string;
  description: string;
}> = {}) => ({
  id: overrides.id || 'event-1',
  title: overrides.title || TEST_EVENT_TITLE,
  description: overrides.description || 'Test description',
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
  RecurringEvent: null,
  location: { latitude: 33.4484, longitude: -112.074 },
  cost: '',
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
  FeedbackCommentsAggregate: { count: 0 },
  FeedbackComments: [],
  Poster: buildUser(),
});

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
          Tags: [{ text: TAG_ONE }, { text: TAG_TWO }],
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
      tags: [{ text: TAG_ONE }, { text: TAG_TWO }],
    },
  }),
  getSitewideTagCounts: () => ({
    data: {
      tags: [
        { text: TAG_ONE, EventsAggregate: { count: 1 } },
        { text: TAG_TWO, EventsAggregate: { count: 0 } },
      ],
    },
  }),
  getTagsInChannel: () => ({
    data: {
      tags: [{ text: TAG_ONE }, { text: TAG_TWO }],
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

test('creates an event with mocked GraphQL', async ({ context, page }, testInfo) => {
  let createVariables: CreateEventVariables | null = null;

  await installMockAuth(context, page, {
    username: 'cluse',
    email: 'test@example.com',
  });

  const diagnostics = await installGraphqlMocks(page, {
    ...getCommonMocks('cluse'),
    createEvent: ({ body }) => {
      createVariables = body.variables as CreateEventVariables;
      return {
        data: {
          createEventWithChannelConnections: [buildEvent()],
        },
      };
    },
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
            id: 'event-1',
            CommentsAggregate: { count: 0 },
          },
        ],
      },
    }),
    getEventChannelID: () => ({
      data: {
        eventChannels: [
          {
            id: 'event-channel-1',
            archived: false,
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
  });

  try {
    await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
    await expect(page.getByTestId('event-form')).toBeVisible();
    await page.getByTestId('title-input').fill(TEST_EVENT_TITLE);

    // Click save and wait for mutation to be called
    const saveButton = page.getByTestId('event-form').getByRole('button', { name: 'Save' }).first();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for the mutation to be called (check that variables were captured)
    await expect(async () => {
      expect(createVariables).not.toBeNull();
    }).toPass({ timeout: 10000 });

    // Verify create mutation was called with correct data
    expect(createVariables).not.toBeNull();
    // Use non-null assertion since we verified above
    const vars = createVariables!;
    expect(vars.input?.[0]?.eventCreateInput?.title).toBe(TEST_EVENT_TITLE);
    expect(vars.input?.[0]?.channelConnections).toContain(TEST_CHANNEL);

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
  }
});

test('validates required fields on event form', async ({ context, page }, testInfo) => {
  await installMockAuth(context, page, {
    username: 'cluse',
    email: 'test@example.com',
  });

  const diagnostics = await installGraphqlMocks(page, {
    ...getCommonMocks('cluse'),
  });

  try {
    await page.goto(`/forums/${TEST_CHANNEL}/events/create`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Submit button should be disabled when title is empty
    const submitButton = page.getByTestId('event-form').getByRole('button', { name: 'Save' }).first();
    await expect(submitButton).toBeDisabled();

    // Fill title - button should become enabled
    await page.getByTestId('title-input').fill(TEST_EVENT_TITLE);
    await expect(submitButton).toBeEnabled();

    // Clear title - button should become disabled again
    await page.getByTestId('title-input').fill('');
    await expect(submitButton).toBeDisabled();

    expect(diagnostics.pageErrors).toEqual([]);
  } finally {
    await testInfo.attach('graphql-operations.json', {
      body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
      contentType: 'application/json',
    });
  }
});
