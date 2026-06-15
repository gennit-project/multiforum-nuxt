import { test, expect } from '../../helpers/testFixture';
import {
  createDiscussionHandlers,
  createDiscussionState,
} from '../../helpers/mockedDiscussionHandlers';

const TEST_CHANNEL = 'cats';
const TEST_DISCUSSION = 'Test discussion title';
const TEST_BODY = 'Test description';
const UPDATED_BODY = 'Test description 2';
const TAG_ONE = 'trivia';
const TAG_TWO = 'music';
const TAG_THREE = 'newYears';

test('creates, edits and deletes a discussion', async ({
  page,
  setupMockedPage,
}) => {
  const state = createDiscussionState();

  const { diagnostics } = await setupMockedPage({
    handlers: {
      ...createDiscussionHandlers(state, {
        channelId: TEST_CHANNEL,
        username: 'cluse',
      }),
      // Override getTags to provide the test tags
      getTags: () => ({
        data: {
          tags: [{ text: TAG_ONE }, { text: TAG_TWO }, { text: TAG_THREE }],
        },
      }),
    },
  });

  await page.goto('/discussions/create');
  await expect(
    page.getByText("You don't have permission to see this page")
  ).toHaveCount(0);

  await page.getByTestId('title-input').fill(TEST_DISCUSSION);
  await page.getByTestId('body-input').fill(TEST_BODY);

  const channelPicker = page.getByTestId('channel-input');
  await channelPicker.click();
  await page.getByText(TEST_CHANNEL, { exact: true }).click();
  await expect(channelPicker).toContainText(TEST_CHANNEL);
  await page.getByTestId('title-input').click();
  await expect(page.getByLabel('Type to search...')).toHaveCount(0);

  const tagPicker = page.getByTestId('tag-picker');
  await tagPicker.click();
  await page.getByText(TAG_ONE, { exact: true }).click();
  await page.getByText(TAG_TWO, { exact: true }).click();
  await expect(tagPicker).toContainText(TAG_ONE);
  await expect(tagPicker).toContainText(TAG_TWO);

  await page.getByRole('button', { name: 'Save' }).first().click();

  // Get the created discussion ID from state - we know it exists after creation
  const createdDiscussion = state.discussions[0]!;
  await expect(page).toHaveURL(
    `/forums/${TEST_CHANNEL}/discussions/${createdDiscussion.id}`
  );
  await expect(
    page.getByRole('heading', { name: TEST_DISCUSSION })
  ).toBeVisible();
  await expect(page.getByText(TEST_BODY)).toBeVisible();

  await page.goto(
    `/forums/${TEST_CHANNEL}/discussions/edit/${createdDiscussion.id}`
  );
  await expect(page).toHaveURL(
    `/forums/${TEST_CHANNEL}/discussions/edit/${createdDiscussion.id}`
  );

  const bodyInput = page.getByTestId('body-input');
  await expect(bodyInput).toBeVisible();
  await bodyInput.fill(UPDATED_BODY);

  await tagPicker.click();
  await page.getByText(TAG_THREE, { exact: true }).click();
  await page.getByText(TAG_ONE, { exact: true }).click();
  await expect(tagPicker).toContainText(TAG_TWO);
  await expect(tagPicker).toContainText(TAG_THREE);
  await expect(tagPicker).not.toContainText(TAG_ONE);

  await page.getByRole('button', { name: 'Save' }).first().click();
  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${createdDiscussion.id}`);
  await expect(page.getByText(UPDATED_BODY)).toBeVisible();

  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Delete').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/discussions`);

  expect(diagnostics.pageErrors).toEqual([]);
});
