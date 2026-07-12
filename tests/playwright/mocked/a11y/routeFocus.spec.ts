import { test, expect } from '../../helpers/testFixture';
import {
  createSuperUpvoteState,
  createSuperUpvoteHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';

// After a client-side navigation, keyboard focus should move to the main
// content region so keyboard/screen-reader users start on the new page's
// content instead of the (now-detached) link they activated. Navigate between
// two static pages that both render the default layout (#main-content).
test('moves focus to main content after client-side navigation', async ({
  page,
  setupMockedPage,
}) => {
  const state = createSuperUpvoteState({
    channelId: 'cats',
    discussionId: 'discussion-1',
    authorUsername: 'alice',
    actorUsername: 'cluse',
  });
  await setupMockedPage({
    username: 'cluse',
    handlers: createSuperUpvoteHandlers(state),
  });

  await page.goto('/about');
  await expect(page.locator('#main-content')).toBeAttached();

  // Client-side navigate via the in-layout footer link to another
  // main-content page.
  await page.locator('a[href="/terms-of-use"]').first().click();

  await expect(page).toHaveURL(/\/terms-of-use$/);
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id), {
      timeout: 5000,
    })
    .toBe('main-content');
});
