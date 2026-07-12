import { test, expect } from '../../helpers/testFixture';
import {
  createReceivedSuperUpvoteState,
  createReceivedNotificationHandlers,
  createKudosPageHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';

const RECIPIENT = 'alice';

// Workflow under test (receiving a super upvote):
//  - the recipient sees a notification that their post was super upvoted, with a
//    working link to the post
//  - the notification offers "Show on profile" or "Ignore"
//  - "Ignore" marks the notification read
//  - "Show on profile" publishes the note (which then appears in the recipient's
//    Kudos section)

test('the recipient sees a super upvote notification with a working link to the post', async ({
  page,
  setupMockedPage,
}) => {
  const state = createReceivedSuperUpvoteState();
  await setupMockedPage({
    username: RECIPIENT,
    handlers: createReceivedNotificationHandlers(state),
  });

  await page.goto('/notifications');
  await expect(
    page.getByRole('heading', { name: 'Notifications' })
  ).toBeVisible({ timeout: 60000 });

  // Notification body links directly to the upvoted post.
  const postLink = page.locator(
    `a[href*="/forums/${state.channelId}/discussions/${state.discussionId}"]`
  );
  await expect(postLink.first()).toBeVisible();

  // The choice is offered inline.
  await expect(page.getByTestId('notification-show-on-profile')).toBeVisible();
  await expect(page.getByTestId('notification-ignore')).toBeVisible();
});

test('ignoring a super upvote notification marks it as read', async ({
  page,
  setupMockedPage,
}) => {
  const state = createReceivedSuperUpvoteState();
  await setupMockedPage({
    username: RECIPIENT,
    handlers: createReceivedNotificationHandlers(state),
  });

  await page.goto('/notifications');
  const ignoreButton = page.getByTestId('notification-ignore');
  await expect(ignoreButton).toBeVisible({ timeout: 30000 });

  await ignoreButton.click();

  // The action buttons disappear and the notification reads as "Read".
  await expect(page.getByTestId('notification-ignore')).toHaveCount(0);
  await expect(page.getByTestId('notification-list')).toContainText('Read');
});

test('showing a super upvote on profile publishes it', async ({
  page,
  setupMockedPage,
}) => {
  const state = createReceivedSuperUpvoteState();
  await setupMockedPage({
    username: RECIPIENT,
    handlers: createReceivedNotificationHandlers(state),
  });

  await page.goto('/notifications');
  const showButton = page.getByTestId('notification-show-on-profile');
  await expect(showButton).toBeVisible({ timeout: 30000 });

  await showButton.click();

  // The notification confirms the note is now public, and the action is gone.
  await expect(page.getByTestId('notification-showing-on-profile')).toBeVisible();
  await expect(page.getByTestId('notification-show-on-profile')).toHaveCount(0);
});

test('a published super upvote appears in the recipient\'s Kudos section', async ({
  page,
  setupMockedPage,
}) => {
  // Simulate the note already having been shown on the profile.
  const state = createReceivedSuperUpvoteState({ isPublic: true });
  const { diagnostics } = await setupMockedPage({
    username: RECIPIENT,
    handlers: createKudosPageHandlers(state),
  });

  await page.goto(`/u/${RECIPIENT}/kudos`);

  // The thank-you note is rendered in the Kudos page's entry list. The same
  // text also appears in the profile sidebar's kudos preview, which loads from
  // a separate query — so an unscoped getByText races between the two and trips
  // Playwright's strict mode once both have rendered. Scope to the main
  // scratchpad entry, which is the page's own content and always present.
  await expect(
    page.getByTestId('scratchpad-entry').getByText(state.noteText)
  ).toBeVisible({ timeout: 30000 });
  // It is shown as a public entry, not a pending one.
  await expect(page.getByText('Pending')).toHaveCount(0);

  expect(diagnostics.pageErrors).toEqual([]);
});
