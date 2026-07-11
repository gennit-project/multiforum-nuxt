import { test, expect } from '../../helpers/testFixture';
import {
  createSuperUpvoteState,
  createSuperUpvoteHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';

const CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';

// Regression: the emoji "React" button opens a FloatingDropdown containing the
// emoji picker. The picker's own v-click-outside handler used to fire on the
// very click that opened the dropdown, closing it again immediately, so the
// picker never appeared. See plugins/click-outside.client.ts.
test('clicking the React button opens the emoji picker', async ({
  page,
  setupMockedPage,
}) => {
  const state = createSuperUpvoteState({
    channelId: CHANNEL,
    discussionId: DISCUSSION_ID,
    authorUsername: 'alice',
    actorUsername: 'cluse',
  });
  await setupMockedPage({
    username: 'cluse',
    handlers: createSuperUpvoteHandlers(state),
  });

  await page.goto(`/forums/${CHANNEL}/discussions/${DISCUSSION_ID}`);

  const reactButton = page.getByTestId('emoji-button').first();
  await expect(reactButton).toBeVisible();
  await expect(reactButton).toHaveAttribute('aria-expanded', 'false');

  await reactButton.click();

  // The regression: the emoji picker's own v-click-outside used to fire on the
  // opening click and close the dropdown again immediately. The dropdown's open
  // state is reflected on the trigger via aria-expanded; assert it opens AND
  // stays open a beat later (rather than snapping back to false). This is
  // independent of the emoji-data CDN, which is blocked in the sandbox.
  await expect(reactButton).toHaveAttribute('aria-expanded', 'true');
  await page.waitForTimeout(600);
  await expect(reactButton).toHaveAttribute('aria-expanded', 'true');
});
