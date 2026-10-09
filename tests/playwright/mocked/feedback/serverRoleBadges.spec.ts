import { test, expect } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';

const TEST_CHANNEL = 'test-forum';
const MOD_PROFILE = 'server-mod-mary';
const FEEDBACK_TEXT = 'Feedback written by a server moderator.';

const feedbackComment = ({
  discussionId,
  eventId,
}: {
  discussionId?: string;
  eventId?: string;
}) => ({
  id: 'feedback-comment-1',
  text: FEEDBACK_TEXT,
  archived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  Channel: { uniqueName: TEST_CHANNEL },
  CommentAuthor: {
    __typename: 'ModerationProfile',
    displayName: MOD_PROFILE,
  },
  FeedbackCommentsAggregate: { count: 0 },
  FeedbackComments: [],
  GivesFeedbackOnDiscussion: discussionId ? { id: discussionId } : null,
  GivesFeedbackOnEvent: eventId ? { id: eventId } : null,
});

const baseHandlers = () =>
  createBaseHandlers({
    username: 'alice',
    channelId: TEST_CHANNEL,
    serverConfigOverrides: {
      Admins: [],
      Moderators: [{ displayName: MOD_PROFILE }],
    },
  });

test('shows Server Mod on a discussion feedback comment', async ({
  page,
  setupMockedPage,
}) => {
  const discussionId = 'discussion-1';
  const comment = feedbackComment({ discussionId });

  await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    modProfileName: MOD_PROFILE,
    handlers: {
      ...baseHandlers(),
      getDiscussionFeedback: () => ({
        data: {
          discussions: [
            {
              id: discussionId,
              title: 'Discussion feedback badges',
              body: 'Discussion body',
              Author: { username: 'regular-author' },
              Album: null,
              DownloadableFiles: [],
              CrosspostedDiscussion: null,
              FeedbackCommentsAggregate: { count: 1 },
              FeedbackComments: [comment],
            },
          ],
        },
      }),
      getFeedbackOnComment: () => ({ data: { comments: [] } }),
    },
  });

  await page.goto(
    `/forums/${TEST_CHANNEL}/discussions/feedback/${discussionId}`
  );

  const feedback = page.locator('main').filter({ hasText: FEEDBACK_TEXT });
  await expect(feedback.getByText('Server Mod', { exact: true })).toBeVisible({
    timeout: 60_000,
  });
});

test('shows Server Mod on an event feedback comment', async ({
  page,
  setupMockedPage,
}) => {
  const eventId = 'event-1';
  const comment = feedbackComment({ eventId });

  await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    modProfileName: MOD_PROFILE,
    handlers: {
      ...baseHandlers(),
      getEventFeedback: () => ({
        data: {
          events: [
            {
              id: eventId,
              title: 'Event feedback badges',
              startTime: '2026-01-02T18:00:00.000Z',
              endTime: '2026-01-02T19:00:00.000Z',
              cost: null,
              free: true,
              FeedbackCommentsAggregate: { count: 1 },
              FeedbackComments: [comment],
            },
          ],
        },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/events/feedback/${eventId}`);

  const feedback = page.locator('main').filter({ hasText: FEEDBACK_TEXT });
  await expect(feedback.getByText('Server Mod', { exact: true })).toBeVisible({
    timeout: 60_000,
  });
});
