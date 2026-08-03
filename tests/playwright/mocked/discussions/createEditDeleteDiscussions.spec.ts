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
  await expect(channelPicker).toHaveAttribute(
    'aria-label',
    new RegExp(TEST_CHANNEL)
  );
  await page.getByTestId('title-input').click();
  await expect(page.getByLabel('Type to search...')).toHaveCount(0);

  const tagPicker = page.getByTestId('tag-picker');
  await tagPicker.click();
  await page.getByText(TAG_ONE, { exact: true }).click();
  await page.getByText(TAG_TWO, { exact: true }).click();
  await expect(tagPicker).toHaveAttribute('aria-label', new RegExp(TAG_ONE));
  await expect(tagPicker).toHaveAttribute('aria-label', new RegExp(TAG_TWO));

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
  await expect(tagPicker).toHaveAttribute('aria-label', new RegExp(TAG_TWO));
  await expect(tagPicker).toHaveAttribute('aria-label', new RegExp(TAG_THREE));
  await expect(tagPicker).not.toHaveAttribute('aria-label', new RegExp(TAG_ONE));

  await page.getByRole('button', { name: 'Save' }).first().click();
  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${createdDiscussion.id}`);
  await expect(page.getByText(UPDATED_BODY)).toBeVisible();

  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Delete').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/discussions`);

  expect(diagnostics.pageErrors).toEqual([]);
});

test('requires and submits a flair in the channel-scoped form', async ({
  page,
  setupMockedPage,
}) => {
  const state = createDiscussionState();
  await setupMockedPage({
    handlers: {
      ...createDiscussionHandlers(state, {
        channelId: TEST_CHANNEL,
        username: 'cluse',
      }),
      getChannelDiscussionFlairConfig: () => ({
        data: {
          getChannelDiscussionFlairConfig: {
            channelUniqueName: TEST_CHANNEL,
            flairRequired: true,
            flairs: [
              {
                id: 'question',
                channelUniqueName: TEST_CHANNEL,
                displayName: 'Question',
                color: '#2563EB',
                order: 0,
                archived: false,
              },
            ],
          },
        },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/discussions/create`);
  await page.getByTestId('title-input').fill(TEST_DISCUSSION);

  const saveButton = page.getByRole('button', { name: 'Save' }).first();
  await expect(saveButton).toBeDisabled();
  await page.getByRole('button', { name: 'Select Question flair' }).click();
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(page).toHaveURL(
    `/forums/${TEST_CHANNEL}/discussions/discussion-1`
  );
  expect(state.lastChannelFlairSelections).toEqual([
    { channelUniqueName: TEST_CHANNEL, flairIds: ['question'] },
  ]);
});

test('shows, hydrates, and clears an existing optional flair', async ({
  page,
  setupMockedPage,
}) => {
  const state = createDiscussionState();
  state.discussions = [
    {
      id: 'discussion-with-flair',
      discussionChannelId: 'discussion-channel-with-flair',
      title: TEST_DISCUSSION,
      body: TEST_BODY,
      tags: [],
      flairs: [
        {
          id: 'question',
          channelUniqueName: TEST_CHANNEL,
          displayName: 'Question',
          color: '#2563EB',
          order: 0,
          archived: false,
        },
      ],
      deleted: false,
    },
  ];

  await setupMockedPage({
    handlers: {
      ...createDiscussionHandlers(state, {
        channelId: TEST_CHANNEL,
        username: 'cluse',
      }),
      getChannelDiscussionFlairConfig: () => ({
        data: {
          getChannelDiscussionFlairConfig: {
            channelUniqueName: TEST_CHANNEL,
            flairRequired: false,
            flairs: [
              {
                id: 'question',
                channelUniqueName: TEST_CHANNEL,
                displayName: 'Question',
                color: '#2563EB',
                order: 0,
                archived: false,
              },
            ],
          },
        },
      }),
    },
  });

  const discussionPath =
    `/forums/${TEST_CHANNEL}/discussions/discussion-with-flair`;
  await page.goto(discussionPath);
  await expect(page.getByTestId('discussion-flair')).toHaveText('Question');

  await page.goto(
    `/forums/${TEST_CHANNEL}/discussions/edit/discussion-with-flair`
  );
  const selectedFlair = page.getByRole('button', {
    name: 'Remove Question flair',
  });
  await expect(selectedFlair).toHaveAttribute('aria-pressed', 'true');
  await selectedFlair.click();
  await page.getByRole('button', { name: 'Save' }).first().click();

  await expect(page).toHaveURL(discussionPath);
  expect(state.lastChannelFlairSelections).toEqual([
    { channelUniqueName: TEST_CHANNEL, flairIds: [] },
  ]);
  await expect(page.getByTestId('discussion-flair')).toHaveCount(0);
});

test('requires flair selections independently in the sitewide form', async ({
  page,
  setupMockedPage,
}) => {
  const state = createDiscussionState();
  const flairByChannel = {
    cats: { id: 'cat-question', displayName: 'Cat question', required: true },
    dogs: { id: 'dog-topic', displayName: 'Dog topic', required: true },
    birds: { id: 'bird-note', displayName: 'Bird note', required: false },
  };
  await setupMockedPage({
    handlers: {
      ...createDiscussionHandlers(state, {
        channelId: TEST_CHANNEL,
        username: 'cluse',
      }),
      getChannelNames: () => ({
        data: {
          channels: Object.keys(flairByChannel).map((uniqueName) => ({
            uniqueName,
            displayName: uniqueName,
            channelIconURL: '',
            description: '',
          })),
        },
      }),
      getChannelDiscussionFlairConfig: ({ body }) => {
        const channelUniqueName = String(body.variables?.channelUniqueName);
        const flair =
          flairByChannel[channelUniqueName as keyof typeof flairByChannel];
        return {
          data: {
            getChannelDiscussionFlairConfig: {
              channelUniqueName,
              flairRequired: flair.required,
              flairs: [
                {
                  id: flair.id,
                  channelUniqueName,
                  displayName: flair.displayName,
                  color: '#2563EB',
                  order: 0,
                  archived: false,
                },
              ],
            },
          },
        };
      },
    },
  });

  await page.goto('/discussions/create');
  await page.getByTestId('title-input').fill(TEST_DISCUSSION);
  const channelPicker = page.getByTestId('channel-input');
  await channelPicker.click();
  await page.getByText('cats', { exact: true }).click();
  await page.getByText('dogs', { exact: true }).click();
  await page.getByText('birds', { exact: true }).click();
  await page.getByTestId('title-input').click();

  const saveButton = page.getByRole('button', { name: 'Save' }).first();
  await expect(saveButton).toBeDisabled();
  await page.getByRole('button', { name: 'Select Cat question flair' }).click();
  await expect(saveButton).toBeDisabled();
  await page.getByRole('button', { name: 'Select Dog topic flair' }).click();
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(page).toHaveURL('/forums/cats/discussions/discussion-1');
  expect(state.lastChannelFlairSelections).toEqual([
    { channelUniqueName: 'cats', flairIds: ['cat-question'] },
    { channelUniqueName: 'dogs', flairIds: ['dog-topic'] },
  ]);
});
