import { test, expect } from '../../helpers/testFixture';
import {
  createSuperUpvoteState,
  createSuperUpvoteHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';

const CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';

// Workflow under test (giving a super upvote):
//  - upvote a discussion posted by another user (alice)
//  - the super upvote button appears
//  - clicking it opens the super upvote modal
//  - filling + submitting the form records the super upvote
//  - the super upvote button shows active styling ("Undo")
//  - undoing the super upvote removes the active styling
test('user can give and undo a super upvote on another user\'s discussion', async ({
  page,
  setupMockedPage,
}) => {
  const state = createSuperUpvoteState({
    channelId: CHANNEL,
    discussionId: DISCUSSION_ID,
    authorUsername: 'alice',
    actorUsername: 'cluse',
  });

  const { diagnostics } = await setupMockedPage({
    username: 'cluse',
    handlers: createSuperUpvoteHandlers(state),
  });

  await page.goto(`/forums/${CHANNEL}/discussions/${DISCUSSION_ID}`);

  const upvoteButton = page.getByTestId('upvote-discussion-button').first();
  const superUpvoteButton = page
    .getByTestId('super-upvote-discussion-button')
    .first();

  // Before upvoting, the super upvote affordance is not available.
  await expect(upvoteButton).toBeVisible();
  await expect(superUpvoteButton).toHaveCount(0);

  // Upvote alice's discussion. Register the response listener *before* the
  // click (Promise.all) so a fast GraphQL POST can't resolve before we start
  // listening — the "click then waitForResponse" ordering races and, when the
  // response lands first, waitForResponse waits for a POST that never comes and
  // times out (the source of this test's flakiness).
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/graphql') &&
        response.request().method() === 'POST'
    ),
    upvoteButton.click(),
  ]);

  // The super upvote button now appears, in its inactive state. Give it a
  // generous timeout for cold-start CI where the mutation round-trip is slow.
  await expect(superUpvoteButton).toBeVisible({ timeout: 15_000 });
  await expect(superUpvoteButton).not.toContainText('Undo');

  // Open the super upvote modal.
  await superUpvoteButton.click();
  const textInput = page.getByTestId('super-upvote-text-input');
  await expect(textInput).toBeVisible();

  // Fill out and submit the thank-you note.
  await textInput.fill('Thanks for the thoughtful post, alice!');
  await page.getByTestId('super-upvote-submit').click();

  // The button shows active styling (renders the "Undo" affordance).
  await expect(superUpvoteButton).toContainText('Undo');

  // Undo the super upvote.
  await superUpvoteButton.click();

  // Active styling is gone.
  await expect(superUpvoteButton).not.toContainText('Undo');
  // ...but the regular upvote (and therefore the super upvote button) remains.
  await expect(superUpvoteButton).toBeVisible();

  expect(diagnostics.pageErrors).toEqual([]);
});
