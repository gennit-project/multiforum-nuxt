import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';
import {
  openSeededDiscussion,
  createComment,
  replyToComment,
  waitForGraphQL,
} from '../../helpers/statefulTestHelpers';

const CATS_CHANNEL_URL = '/forums/cats/discussions/';
const CATS_DISCUSSION_TITLE = 'Example topic 1';
const MOD_USERNAME = 'cluse';
const MOD_EMAIL = 'catherine.luse@gmail.com';

test.describe.serial('Comment operations', () => {
  // Reset database once for all tests in this file
  test.beforeAll(async ({ request }) => {
    const { createMockJwt } = await import('../../helpers/mockAuth');
    const token = createMockJwt(MOD_EMAIL, MOD_USERNAME);
    await resetStatefulBackendData(request, token);
  });

  test('creates, edits, and deletes a root comment', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await openSeededDiscussion({
        page,
        channelUrl: CATS_CHANNEL_URL,
        discussionTitle: CATS_DISCUSSION_TITLE,
      });

      const originalText = `Test comment ${Date.now()}`;
      await createComment({ page, text: originalText });

      const comment = page.getByTestId('comment').filter({ hasText: originalText }).first();
      await expect(comment).toBeVisible();
      await comment.getByTestId('commentMenu').click();
      await page.getByTestId('commentMenu-item-Edit').first().click();

      const editedText = `Updated comment ${Date.now()}`;
      await page.getByTestId('texteditor-textarea').fill(editedText);
      await page.getByText('Save', { exact: true }).click();
      await expect(page.getByText(editedText, { exact: true })).toBeVisible();

      await page
        .getByTestId('comment')
        .filter({ hasText: editedText })
        .first()
        .getByTestId('commentMenu')
        .click();
      await page.getByTestId('commentMenu-item-Delete').first().click();
      await page.getByRole('button', { name: 'Delete' }).click();
      await expect(page.getByText(editedText, { exact: true })).toHaveCount(0);
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test('creates nested comments at multiple levels', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await openSeededDiscussion({
        page,
        channelUrl: CATS_CHANNEL_URL,
        discussionTitle: CATS_DISCUSSION_TITLE,
      });

      const comment1 = `Nested test 1 ${Date.now()}`;
      const comment2 = `Nested test 2 ${Date.now()}`;
      const comment3 = `Nested test 3 ${Date.now()}`;

      await createComment({ page, text: comment1 });
      await replyToComment({ page, parentCommentText: comment1, replyText: comment2 });
      await replyToComment({ page, parentCommentText: comment2, replyText: comment3 });

      await expect(page.getByText(comment1, { exact: true })).toBeVisible();
      await expect(page.getByText(comment2, { exact: true })).toBeVisible();
      await expect(page.getByText(comment3, { exact: true })).toBeVisible();
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test('user can undo upvote on their own comment', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await openSeededDiscussion({
        page,
        channelUrl: CATS_CHANNEL_URL,
        discussionTitle: CATS_DISCUSSION_TITLE,
      });

      const commentText = `Vote test ${Date.now()}`;
      await createComment({ page, text: commentText });

      const upvoteButton = page.getByTestId('upvote-comment-button').first();
      await expect(upvoteButton).toContainText('1');
      await upvoteButton.click();
      await expect(upvoteButton).toContainText('0');
      await upvoteButton.click();
      await expect(upvoteButton).toContainText('1');
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test("another user can upvote a comment", async ({ browser, context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await openSeededDiscussion({
        page,
        channelUrl: CATS_CHANNEL_URL,
        discussionTitle: CATS_DISCUSSION_TITLE,
      });

      const commentText = `Cross-user vote test ${Date.now()}`;
      await createComment({ page, text: commentText });

      const voterContext = await browser.newContext();
      try {
        const voterPage = await voterContext.newPage();
        await installMockAuth(voterContext, voterPage, {
          username: 'alice',
          email: 'the.rinnovator@gmail.com',
        });

        await openSeededDiscussion({
          page: voterPage,
          channelUrl: CATS_CHANNEL_URL,
          discussionTitle: CATS_DISCUSSION_TITLE,
        });
        const upvoteButton = voterPage.getByTestId('upvote-comment-button').first();
        await expect(upvoteButton).toContainText('1');
        await upvoteButton.click();
        await waitForGraphQL(voterPage);
        await expect(upvoteButton).toContainText('2');
        await upvoteButton.click();
        await waitForGraphQL(voterPage);
        await expect(upvoteButton).toContainText('1');
      } finally {
        await voterContext.close();
      }
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });
});
