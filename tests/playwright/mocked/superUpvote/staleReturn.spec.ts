import { test, expect } from '../../helpers/testFixture';
import {
  createSuperUpvoteState,
  createSuperUpvoteHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';

const CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';

// Regression test for the original bug: after a super upvote the button looked
// inactive (and could not be undone) because the frontend overwrote its cache
// with the exact list the server returned. The server can return a stale list
// (read-after-write lag) that omits the actor. The frontend is now authoritative
// about the actor, so the button must go active regardless of the returned list.
test('super upvote goes active even when the backend returns a stale list', async ({
  page,
  setupMockedPage,
}) => {
  const state = createSuperUpvoteState({
    channelId: CHANNEL,
    discussionId: DISCUSSION_ID,
    authorUsername: 'alice',
    actorUsername: 'cluse',
    startUpvoted: true,
  });

  const handlers = createSuperUpvoteHandlers(state);
  // Simulate the backend read-after-write gap: the create succeeds but the
  // returned superUpvotedByUsers does NOT include the actor.
  handlers.createScratchpadEntry = ({ body }) => {
    const v = (body.variables ?? {}) as Record<string, string>;
    return {
      data: {
        createScratchpadEntry: {
          id: 'scratchpad-entry-1',
          createdAt: '2023-12-31T00:00:00.000Z',
          text: v.text ?? '',
          isPublic: false,
          sourceType: v.sourceType ?? 'discussion',
          sourceId: v.sourceId ?? state.discussionChannelId,
          sourceChannelUniqueName: v.sourceChannelUniqueName ?? state.channelId,
          discussionId: state.discussionId,
          Author: { username: 'cluse', displayName: 'cluse', profilePicURL: '' },
          Recipient: { username: 'alice' },
          superUpvotedByUsers: [],
          __typename: 'ScratchpadEntry',
        },
      },
    };
  };

  await setupMockedPage({ username: 'cluse', handlers });
  await page.goto(`/forums/${CHANNEL}/discussions/${DISCUSSION_ID}`);

  const superUpvoteButton = page
    .getByTestId('super-upvote-discussion-button')
    .first();
  await expect(superUpvoteButton).toBeVisible();
  await superUpvoteButton.click();
  await page.getByTestId('super-upvote-text-input').fill('Thanks alice!');
  await page.getByTestId('super-upvote-submit').click();
  await expect(superUpvoteButton).toContainText('Undo');
});
