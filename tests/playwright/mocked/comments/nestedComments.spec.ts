import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import {
  createCommentState,
  createCommentHandlers,
  DEFAULT_COMMENT_CONFIG,
} from '../../helpers/mockedCommentHandlers';

const ROOT_COMMENT_TEXT = 'Root comment';
const REPLY_ONE = 'Reply level 1';
const REPLY_TWO = 'Reply level 2';
const REPLY_THREE = 'Reply level 3';

const clickInlineSave = async (scope: Page | Locator) => {
  const save = scope.getByText('Save', { exact: true }).last();
  await expect(save).toBeVisible();
  await save.click({ force: true });
};

test('creates nested comments at multiple levels', async ({ context, page }, testInfo) => {
  const state = createCommentState();

  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(
    page,
    createCommentHandlers(state, DEFAULT_COMMENT_CONFIG)
  );

  try {
    const discussionUrl = `/forums/${DEFAULT_COMMENT_CONFIG.channelId}/discussions/${DEFAULT_COMMENT_CONFIG.discussionId}`;

    await page.goto(discussionUrl);
    await expect(
      page.getByRole('heading', { name: DEFAULT_COMMENT_CONFIG.discussionTitle })
    ).toBeVisible();

    // Create root comment
    await page.getByTestId('addComment').click();
    await page.getByTestId('texteditor-textarea').fill(ROOT_COMMENT_TEXT);
    await page.getByTestId('createCommentButton').click();
    await page.goto(discussionUrl);
    const rootComment = page.getByTestId('comment').filter({
      hasText: ROOT_COMMENT_TEXT,
    });
    await expect(rootComment).toBeVisible();

    // Reply to root comment
    await rootComment.getByRole('button', { name: 'Reply' }).click();
    const firstReplyEditor = rootComment.getByTestId('texteditor-textarea').last();
    await expect(firstReplyEditor).toBeVisible();
    await firstReplyEditor.fill(REPLY_ONE);
    await clickInlineSave(rootComment);
    await page.goto(discussionUrl);
    const firstLevelComment = page.getByTestId('comment').filter({
      hasText: REPLY_ONE,
    });
    await expect(firstLevelComment).toBeVisible();

    // Reply to first level comment
    await firstLevelComment.getByRole('button', { name: 'Reply' }).first().click();
    const secondReplyEditor = firstLevelComment.getByTestId('texteditor-textarea').last();
    await expect(secondReplyEditor).toBeVisible();
    await secondReplyEditor.fill(REPLY_TWO);
    await clickInlineSave(firstLevelComment);
    await page.goto(discussionUrl);
    const secondLevelComment = page.getByTestId('comment').filter({
      hasText: REPLY_TWO,
    });
    await expect(secondLevelComment).toBeVisible();

    // Reply to second level comment
    await secondLevelComment.getByRole('button', { name: 'Reply' }).first().click();
    const thirdReplyEditor = secondLevelComment.getByTestId('texteditor-textarea').last();
    await expect(thirdReplyEditor).toBeVisible();
    await thirdReplyEditor.fill(REPLY_THREE);
    await clickInlineSave(secondLevelComment);
    await page.goto(discussionUrl);
    const thirdLevelComment = page.getByTestId('comment').filter({
      hasText: REPLY_THREE,
    });
    await expect(thirdLevelComment).toBeVisible();

    expect(diagnostics.pageErrors).toEqual([]);
  } finally {
    await testInfo.attach('graphql-operations.json', {
      body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
      contentType: 'application/json',
    });
  }
});
