import { test, expect } from '../../helpers/testFixture';
import {
  buildComment,
  buildEvent,
  buildUser,
  type MockCommentState,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

// Workflow: "Verify Badge Display Across Surfaces" — event comment sections.
//
// A comment authored by a server admin in an event's comment section shows the
// "Server Admin" badge (same Comment.vue / CommentHeader path as discussions).

const TEST_CHANNEL = 'cats';
const EVENT_ID = 'event-1';
const EVENT_CHANNEL_ID = 'event-channel-1';
const EVENT_TITLE = 'Event with a server admin comment';
const ADMIN_USER = 'admin-sam';
const COMMENT_ID = 'event-comment-admin';
const COMMENT_TEXT = 'An event comment authored by a server admin.';

const mockEvent = buildEvent({
  id: EVENT_ID,
  eventChannelId: EVENT_CHANNEL_ID,
  channelUniqueName: TEST_CHANNEL,
  title: EVENT_TITLE,
  description: 'A mocked event description',
  posterUsername: 'cluse',
});

const commentState: MockCommentState = {
  id: COMMENT_ID,
  text: COMMENT_TEXT,
  parentCommentId: null,
};

const adminComment = {
  ...buildComment({
    comment: commentState,
    comments: [commentState],
    channelUniqueName: TEST_CHANNEL,
  }),
  CommentAuthor: buildUser({ username: ADMIN_USER }),
};

test('shows a Server Admin badge on an event comment from a server admin', async ({
  page,
  setupMockedPage,
}) => {
  await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'alice',
        channelId: TEST_CHANNEL,
        serverConfigOverrides: {
          Admins: [{ username: ADMIN_USER }],
          Moderators: [],
        },
      }),
      getEvent: () => ({ data: { events: [mockEvent] } }),
      getEventComments: () => ({
        data: {
          getEventComments: {
            Event: mockEvent,
            Comments: [adminComment],
          },
        },
      }),
      getEventRootCommentAggregate: () => ({
        data: {
          events: [{ id: EVENT_ID, CommentsAggregate: { count: 1 } }],
        },
      }),
      getEventChannelID: () => ({
        data: { eventChannels: [{ id: EVENT_CHANNEL_ID, archived: false }] },
      }),
      getEvents: () => ({
        data: { eventsAggregate: { count: 1 }, events: [mockEvent] },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/events/${EVENT_ID}`);

  await expect(page.getByText(COMMENT_TEXT)).toBeVisible({ timeout: 60_000 });

  const comment = page
    .locator('[data-testid="comment"]')
    .filter({ hasText: COMMENT_TEXT });
  await expect(comment.getByText('Server Admin').first()).toBeVisible();
});
