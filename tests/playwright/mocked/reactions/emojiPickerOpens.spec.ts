import { test, expect } from '../../helpers/testFixture';
import {
  createSuperUpvoteState,
  createSuperUpvoteHandlers,
} from '../../helpers/mockedSuperUpvoteHandlers';
import { expectNoAxeViolations } from '../../helpers/axe';

const CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';

const EMOJI_DATA = [
  {
    annotation: 'grinning face',
    emoji: '😀',
    group: 0,
    order: 1,
    shortcodes: ['grinning'],
    tags: ['face', 'grin'],
    version: 1,
  },
  {
    annotation: 'cat face',
    emoji: '🐱',
    group: 3,
    order: 2,
    tags: ['animal', 'cat'],
    version: 1,
  },
  {
    annotation: 'party popper',
    emoji: '🎉',
    group: 6,
    order: 3,
    shortcodes: ['tada'],
    tags: ['celebration', 'party'],
    version: 1,
  },
];

// Regression: the emoji "React" button opens a FloatingDropdown containing the
// emoji picker. The picker's own v-click-outside handler used to fire on the
// very click that opened the dropdown, closing it again immediately, so the
// picker never appeared. See plugins/click-outside.ts.
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
  await page.route(
    '**/emoji-picker-element-data@*/en/emojibase/data.json',
    async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        headers: { ETag: 'emoji-picker-test-data' },
        json: EMOJI_DATA,
      });
    }
  );
  await page.addInitScript(() => {
    localStorage.setItem(
      'multiforum:recent-emojis:cluse',
      JSON.stringify([{ annotation: 'red heart', unicode: '❤️' }])
    );
  });

  const handlers = createSuperUpvoteHandlers(state);
  const { diagnostics } = await setupMockedPage({
    username: 'cluse',
    handlers: {
      ...handlers,
      addEmojiToDiscussionChannel: () => ({
        data: {
          addEmojiToDiscussionChannel: {
            __typename: 'DiscussionChannel',
            id: state.discussionChannelId,
            emoji: JSON.stringify({ 'red heart': { '❤️': ['cluse'] } }),
          },
        },
      }),
    },
  });

  await page.goto(`/forums/${CHANNEL}/discussions/${DISCUSSION_ID}`);

  const reactButton = page.getByTestId('emoji-button').first();
  await expect(reactButton).toBeVisible();
  await expect(reactButton).toHaveAttribute('aria-expanded', 'false');

  await reactButton.click();

  await expect(reactButton).toHaveAttribute('aria-expanded', 'true');
  const searchInput = page.getByRole('searchbox', { name: 'Search emoji' });
  await expect(searchInput).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Recently used' })
  ).toBeVisible();

  await searchInput.fill('party');
  await expect(
    page.getByRole('button', { name: 'party popper' })
  ).toBeVisible();
  await searchInput.fill('');
  await expect(
    page.getByRole('heading', { name: 'Smileys and emotion' })
  ).toBeVisible();

  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: 'red heart' }).click();
  await expect(reactButton).toHaveAttribute('aria-expanded', 'false');
  await expect
    .poll(() => diagnostics.completedOperations)
    .toContainEqual({
      operationName: 'addEmojiToDiscussionChannel',
      variables: {
        discussionChannelId: state.discussionChannelId,
        emojiLabel: 'red heart',
        unicode: '❤️',
        username: 'cluse',
      },
    });
  await expect(reactButton).toBeFocused();
});
