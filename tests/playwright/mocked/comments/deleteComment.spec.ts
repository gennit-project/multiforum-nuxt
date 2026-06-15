import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';
import {
  createCommentState,
  createCommentHandlers,
  DEFAULT_COMMENT_CONFIG,
} from '../../helpers/mockedCommentHandlers';

const ROOT_COMMENT_TEXT = 'Test comment to delete';

test('deletes a comment', async ({ context, page }, testInfo) => {
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

    // Create a comment first
    await page.getByTestId('addComment').click();
    await page.getByTestId('texteditor-textarea').fill(ROOT_COMMENT_TEXT);
    await page.getByTestId('createCommentButton').click();
    await waitForGraphqlOperation(diagnostics.completedOperations, 'createComment');
    await page.goto(discussionUrl);
    await expect(page.getByText(ROOT_COMMENT_TEXT)).toBeVisible();

    // Delete the comment
    const comment = page.getByTestId('comment').filter({
      hasText: ROOT_COMMENT_TEXT,
    });
    await comment.getByRole('button', { name: 'Comment actions' }).click();
    await page.getByTestId('commentMenu-item-Delete').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await waitForGraphqlOperation(diagnostics.completedOperations, 'deleteComment');
    await page.goto(discussionUrl);
    await expect(page.getByText(ROOT_COMMENT_TEXT)).toHaveCount(0);

    expect(diagnostics.pageErrors).toEqual([]);
  } finally {
    await testInfo.attach('graphql-operations.json', {
      body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
      contentType: 'application/json',
    });
  }
});
