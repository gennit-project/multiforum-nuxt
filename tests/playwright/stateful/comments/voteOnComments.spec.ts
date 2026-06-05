import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';
import {
  openSeededDiscussion,
  createComment,
  waitForGraphQL,
} from '../../helpers/statefulTestHelpers';

const CATS_CHANNEL_URL = '/forums/cats/discussions/';
const CATS_DISCUSSION_TITLE = 'Example topic 1';

test('User 1 can undo upvote on their own comment', async (
  { context, page, request },
  testInfo
) => {
  const token = await installMockAuth(context, page, {
    username: 'cluse',
    email: 'catherine.luse@gmail.com',
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await openSeededDiscussion({
      page,
      channelUrl: CATS_CHANNEL_URL,
      discussionTitle: CATS_DISCUSSION_TITLE,
    });

    const commentText = `Test comment ${Date.now()}`;
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

test("User 2 can upvote another user's comment", async (
  { browser, context, page, request },
  testInfo
) => {
  const token = await installMockAuth(context, page, {
    username: 'cluse',
    email: 'catherine.luse@gmail.com',
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await openSeededDiscussion({
      page,
      channelUrl: CATS_CHANNEL_URL,
      discussionTitle: CATS_DISCUSSION_TITLE,
    });

    const commentText = `Test comment ${Date.now()}`;
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
