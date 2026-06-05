import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';
import { openSeededDiscussion, createComment } from '../../helpers/statefulTestHelpers';

const CHANNEL_DISCUSSION_LIST = '/forums/cats/discussions/';
const DISCUSSION_TITLE = 'Example topic 1';
const MOD_USERNAME = 'cluse';
const MOD_EMAIL = 'catherine.luse@gmail.com';

test('creates, edits, and deletes a root comment', async (
  { context, page, request },
  testInfo
) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await openSeededDiscussion({
      page,
      channelUrl: CHANNEL_DISCUSSION_LIST,
      discussionTitle: DISCUSSION_TITLE,
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

    await page.getByTestId('comment').filter({ hasText: editedText }).first().getByTestId('commentMenu').click();
    await page.getByTestId('commentMenu-item-Delete').first().click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(editedText, { exact: true })).toHaveCount(0);
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
