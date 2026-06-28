import { test, expect } from '../../helpers/testFixture';
import { buildEvent } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

// Workflow: "Verify Unsubscribe Works for Events and Issues".
//
// Visiting an event/issue detail URL with ?action=unsubscribe while subscribed
// should auto-fire the unsubscribe mutation, show a confirmation toast, and
// strip the action param from the URL (so a refresh does not re-trigger it).

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';

test.describe('Auto-unsubscribe via ?action=unsubscribe', () => {
  const EVENT_ID = 'event-1';
  const EVENT_CHANNEL_ID = 'event-channel-1';

  const subscribedEvent = buildEvent({
    id: EVENT_ID,
    eventChannelId: EVENT_CHANNEL_ID,
    channelUniqueName: TEST_CHANNEL,
    title: 'Subscribed Event',
    posterUsername: 'bob',
    overrides: {
      SubscribedToNotifications: [{ username: TEST_USER }],
    },
  });

  test('auto-unsubscribes from an event and shows a toast', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: TEST_USER,
      email: 'alice@example.com',
      handlers: {
        ...createBaseHandlers({ username: TEST_USER, channelId: TEST_CHANNEL }),
        getEvent: () => ({ data: { events: [subscribedEvent] } }),
        getEventComments: () => ({
          data: {
            getEventComments: { Event: subscribedEvent, Comments: [] },
          },
        }),
        getEventRootCommentAggregate: () => ({
          data: {
            events: [{ id: EVENT_ID, CommentsAggregate: { count: 0 } }],
          },
        }),
        getEventChannelID: () => ({
          data: {
            eventChannels: [{ id: EVENT_CHANNEL_ID, archived: false }],
          },
        }),
        getEvents: () => ({
          data: { eventsAggregate: { count: 1 }, events: [subscribedEvent] },
        }),
        unsubscribeFromEvent: () => ({
          data: {
            unsubscribeFromEvent: {
              id: EVENT_ID,
              SubscribedToNotifications: [],
            },
          },
        }),
      },
    });

    const unsubscribeRequest = page.waitForResponse(
      (response) =>
        response.url().includes('/graphql') &&
        response.request().postData()?.includes('unsubscribeFromEvent') === true
    );

    await page.goto(
      `/forums/${TEST_CHANNEL}/events/${EVENT_ID}?action=unsubscribe`
    );

    // The composable fires the unsubscribe mutation automatically.
    expect((await unsubscribeRequest).status()).toBe(200);

    await expect(
      page.getByText('You have been unsubscribed from this event.')
    ).toBeVisible({ timeout: 30000 });

    // The action param is stripped so a refresh does not re-trigger it.
    await expect
      .poll(() => new URL(page.url()).searchParams.get('action'))
      .toBeNull();

    expect(diagnostics.pageErrors).toEqual([]);
  });
});
