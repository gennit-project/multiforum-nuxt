import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { EventCreateInput, EventUpdateInput } from '@/__generated__/graphql';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks, waitForGraphqlOperation } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_EVENT_TITLE = 'Test event title';
const TAG_ONE = 'trivia';
const TAG_TWO = 'music';

const seedAuthState = async (page: Page, username = 'cluse') => {
  await page.waitForFunction(
    () =>
      typeof (window as typeof window & {
        __SET_AUTH_STATE_DIRECT__?: unknown;
      }).__SET_AUTH_STATE_DIRECT__ === 'function'
  );
  await page.evaluate((username) => {
    (
      window as typeof window & {
        __SET_AUTH_STATE_DIRECT__?: (authState: {
          username: string;
        }) => void;
      }
    ).__SET_AUTH_STATE_DIRECT__?.({ username });
  }, username);
};

type CreateEventVariables = {
  input?: Array<{
    eventCreateInput: EventCreateInput;
    channelConnections: string[];
  }>;
};

type UpdateEventVariables = {
  updateEventInput?: EventUpdateInput;
  where?: { id: string };
  channelConnections?: string[];
  channelDisconnections?: string[];
};

type DeleteEventVariables = {
  id?: string;
};

type EventState = {
  id: string;
  title: string;
  description: string;
  deleted: boolean;
};

const buildEvent = (overrides: Partial<{
  id: string;
  title: string;
  description: string;
  posterUsername: string;
}> = {}) => ({
  __typename: 'Event',
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
  occurrenceIndex: null,
  EventSeries: null,
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
  Poster: buildUser({
    username: overrides.posterUsername || 'cluse',
    displayName: overrides.posterUsername || 'cluse',
  }),
});

const getCommonMocks = (username: string) => ({
  getEmail: () => ({
    data: {
      emails: [
        {
          address: 'test@example.com',
          User: {
            username,
            profilePicURL: '',
            ModerationProfile: null,
            NotificationsAggregate: { count: 0 },
          },
        },
      ],
    },
  }),
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
          Admins: [{ username }],
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

test('edits an event with mocked GraphQL', async ({ context, page }, testInfo) => {
  const UPDATED_TITLE = 'Updated event title';
  const UPDATED_DESCRIPTION = 'Updated event description';
  let updateVariables: UpdateEventVariables | null = null;

  const eventState: EventState = {
    id: 'event-1',
    title: TEST_EVENT_TITLE,
    description: 'Original description',
    deleted: false,
  };

  await installMockAuth(context, page, {
    username: 'cluse',
    email: 'test@example.com',
  });

  const diagnostics = await installGraphqlMocks(page, {
    ...getCommonMocks('cluse'),
    getEvent: () => ({
      data: {
        events: [buildEvent({
          id: eventState.id,
          title: eventState.title,
          description: eventState.description,
        })],
      },
    }),
    getEventComments: () => ({
      data: {
        getEventComments: {
          Event: buildEvent({
            id: eventState.id,
            title: eventState.title,
            description: eventState.description,
          }),
          Comments: [],
        },
      },
    }),
    getEventRootCommentAggregate: () => ({
      data: {
        events: [
          {
            id: eventState.id,
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
    updateEvents: ({ body }) => {
      updateVariables = body.variables as UpdateEventVariables;
      // Update the state based on mutation
      if (updateVariables.updateEventInput?.title) {
        eventState.title = updateVariables.updateEventInput.title;
      }
      if (updateVariables.updateEventInput?.description) {
        eventState.description = updateVariables.updateEventInput.description;
      }
      return {
        data: {
          updateEventWithChannelConnections: [buildEvent({
            id: eventState.id,
            title: eventState.title,
            description: eventState.description,
          })],
        },
      };
    },
  });

  try {
    // Navigate to edit page
    await page.goto(`/forums/${TEST_CHANNEL}/events/edit/${eventState.id}`);
    await expect(page.getByTestId('event-form')).toBeVisible();

    // Verify original title is shown
    const titleInput = page.getByTestId('title-input');
    await expect(titleInput).toHaveValue(TEST_EVENT_TITLE);

    // Update the title
    await titleInput.fill(UPDATED_TITLE);

    // Update the description if description input exists
    const descriptionInput = page.getByTestId('description-input');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(UPDATED_DESCRIPTION);
    }

    // Click save button
    const saveButton = page.getByTestId('event-form').getByRole('button', { name: 'Save' }).first();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for the mutation to be called
    await waitForGraphqlOperation(diagnostics.completedOperations, 'updateEvents');

    // Verify update mutation was called with correct data
    expect(updateVariables).not.toBeNull();
    expect(updateVariables!.updateEventInput?.title).toBe(UPDATED_TITLE);
    expect(updateVariables!.where?.id).toBe(eventState.id);

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

test('deletes an event with mocked GraphQL', async ({ context, page }, testInfo) => {
  let deleteVariables: DeleteEventVariables | null = null;

  const eventState: EventState = {
    id: 'event-1',
    title: TEST_EVENT_TITLE,
    description: 'Test description',
    deleted: false,
  };

  await installMockAuth(context, page, {
    username: 'cluse',
    email: 'test@example.com',
  });

  const diagnostics = await installGraphqlMocks(page, {
    ...getCommonMocks('cluse'),
    getEvent: () => {
      if (eventState.deleted) {
        return { data: { events: [] } };
      }
      return {
        data: {
          events: [buildEvent({
            id: eventState.id,
            title: eventState.title,
            description: eventState.description,
          })],
        },
      };
    },
    getEventComments: () => ({
      data: {
        getEventComments: {
          Event: buildEvent({
            id: eventState.id,
            title: eventState.title,
            description: eventState.description,
          }),
          Comments: [],
        },
      },
    }),
    getEventRootCommentAggregate: () => ({
      data: {
        events: [
          {
            id: eventState.id,
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
    getEvents: () => {
      if (eventState.deleted) {
        return {
          data: {
            eventsAggregate: { count: 0 },
            events: [],
          },
        };
      }
      return {
        data: {
          eventsAggregate: { count: 1 },
          events: [buildEvent({
            id: eventState.id,
            title: eventState.title,
            description: eventState.description,
          })],
        },
      };
    },
    deleteEvent: ({ body }) => {
      deleteVariables = body.variables as DeleteEventVariables;
      eventState.deleted = true;
      return {
        data: {
          deleteEvents: {
            nodesDeleted: 1,
            relationshipsDeleted: 1,
          },
        },
      };
    },
  });

  try {
    // Navigate to event detail page
    await page.goto(`/forums/${TEST_CHANNEL}/events/${eventState.id}`);
    await seedAuthState(page);

    // Click the event menu button
    const menuButton = page.getByTestId('event-menu-button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Click the delete option
    const deleteOption = page.getByTestId('event-menu-button-item-Delete');
    await expect(deleteOption).toBeVisible();
    await deleteOption.click({ noWaitAfter: true });

    // Confirm deletion in the modal
    const confirmButton = page.getByRole('button', { name: 'Delete' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Wait for the delete mutation to be called
    await waitForGraphqlOperation(diagnostics.completedOperations, 'deleteEvent');

    // Verify delete mutation was called with correct event ID
    expect(deleteVariables).not.toBeNull();
    expect(deleteVariables!.id).toBe(eventState.id);

    // Verify redirect to events list
    await expect(page).toHaveURL(new RegExp(`/forums/${TEST_CHANNEL}/events`));

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
