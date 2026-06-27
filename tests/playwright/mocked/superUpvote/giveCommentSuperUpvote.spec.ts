import { test, expect } from '../../helpers/testFixture';
import {
  createCommentSuperUpvoteState,
  createCommentSuperUpvoteHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';

const CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';

// Same give/undo workflow as the discussion test, but for a COMMENT authored by
// another user (alice), exercising the comment vote container + the shared
// authoritative-cache fix.
test('user can give and undo a super upvote on another user\'s comment', async ({
  page,
  setupMockedPage,
}) => {
  const state = createCommentSuperUpvoteState({
    channelId: CHANNEL,
    discussionId: DISCUSSION_ID,
    commentAuthor: 'alice',
    actorUsername: 'cluse',
  });

  const { diagnostics } = await setupMockedPage({
    username: 'cluse',
    handlers: createCommentSuperUpvoteHandlers(state),
  });

  await page.goto(`/forums/${CHANNEL}/discussions/${DISCUSSION_ID}`);
  await page.waitForLoadState('networkidle');

  const upvoteButton = page.getByTestId('upvote-comment-button').first();
  const superUpvoteButton = page
    .getByTestId('super-upvote-comment-button')
    .first();

  // Before upvoting the comment, the super upvote affordance is not available.
  await expect(upvoteButton).toBeVisible();
  await expect(superUpvoteButton).toHaveCount(0);

  // Upvote alice's comment.
  await upvoteButton.click();
  await page.waitForResponse(
    (response) =>
      response.url().includes('/graphql') && response.request().method() === 'POST'
  );

  // The super upvote button appears, inactive.
  await expect(superUpvoteButton).toBeVisible();
  await expect(superUpvoteButton).not.toContainText('Undo');

  // Open the modal, fill, and submit.
  await superUpvoteButton.click();
  const textInput = page.getByTestId('super-upvote-text-input');
  await expect(textInput).toBeVisible();
  await textInput.fill('Thanks for the helpful comment, alice!');
  await page.getByTestId('super-upvote-submit').click();

  // Active styling appears...
  await expect(superUpvoteButton).toContainText('Undo');

  // ...and undo removes it (the comment upvote, and the button, remain).
  await superUpvoteButton.click();
  await expect(superUpvoteButton).not.toContainText('Undo');
  await expect(superUpvoteButton).toBeVisible();

  expect(diagnostics.pageErrors).toEqual([]);
});
