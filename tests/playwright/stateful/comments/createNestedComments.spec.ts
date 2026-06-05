import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';
import {
  openSeededDiscussion,
  createComment,
  replyToComment,
} from '../../helpers/statefulTestHelpers';

const CHANNEL_DISCUSSION_LIST = '/forums/cats/discussions/';
const DISCUSSION_TITLE = 'Example topic 1';
const MOD_USERNAME = 'cluse';
const MOD_EMAIL = 'catherine.luse@gmail.com';

test('creates nested comments at multiple levels', async ({ context, page, request }, testInfo) => {
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

    const comment1 = `Test comment 1 ${Date.now()}`;
    const comment2 = `Test comment 2 ${Date.now()}`;
    const comment3 = `Test comment 3 ${Date.now()}`;
    const comment4 = `Test comment 4 ${Date.now()}`;
    const comment5 = `Test comment 5 ${Date.now()}`;

    await createComment({ page, text: comment1 });
    await replyToComment({ page, parentCommentText: comment1, replyText: comment2 });
    await replyToComment({ page, parentCommentText: comment1, replyText: comment3 });
    await replyToComment({ page, parentCommentText: comment3, replyText: comment4 });
    await replyToComment({ page, parentCommentText: comment3, replyText: comment5 });

    await expect(page.getByText(comment1, { exact: true })).toBeVisible();
    await expect(page.getByText(comment2, { exact: true })).toBeVisible();
    await expect(page.getByText(comment3, { exact: true })).toBeVisible();
    await expect(page.getByText(comment4, { exact: true })).toBeVisible();
    await expect(page.getByText(comment5, { exact: true })).toBeVisible();
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
