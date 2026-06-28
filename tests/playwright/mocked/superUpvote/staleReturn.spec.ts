import { test, expect } from '../../helpers/testFixture';
import {
  createSuperUpvoteState,
  createSuperUpvoteHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';

const CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';

// Regression test for the original bug: after a super upvote the button looked
// inactive (and could not be undone) because the frontend overwrote its cache
// with the exact list the *createScratchpadEntry mutation* returned, and that
// response can lag behind the just-committed write (read-after-write gap),
// omitting the actor.
//
// The mutation response below is deliberately stale (empty superUpvotedByUsers),
// but the super upvote IS committed to the backing state — so any independent
// query (e.g. an auth-hydration-driven refetch of the discussion) reflects the
// actor, exactly as a real backend would once the write has landed. The button
// must end up active.
test('super upvote goes active even when the mutation returns a stale list', async ({
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
  // The create still commits the super upvote to the backing state (so reads
  // are eventually consistent), but its OWN returned superUpvotedByUsers is
  // stale and omits the actor — the read-after-write gap being simulated.
  handlers.createScratchpadEntry = ({ body }) => {
    const v = (body.variables ?? {}) as Record<string, string>;
    if (!state.superUpvoters.includes(state.actorUsername)) {
      state.superUpvoters.push(state.actorUsername);
    }
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
