import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const CHANNEL_DISCUSSION_LIST = '/forums/cats/discussions/';
const DISCUSSION_TITLE = 'Example topic 1';
const MOD_USERNAME = 'cluse';
const MOD_EMAIL = 'catherine.luse@gmail.com';

const attachDiagnostics = async (
  testInfo: TestInfo,
  diagnostics: {
    pageErrors: string[];
    consoleErrors: string[];
    graphqlRequests: Array<{
      operationName: string;
      variables?: Record<string, unknown>;
    }>;
  }
) => {
  await testInfo.attach('graphql-operations.json', {
    body: Buffer.from(JSON.stringify(diagnostics.graphqlRequests, null, 2)),
    contentType: 'application/json',
  });
  await testInfo.attach('page-errors.json', {
    body: Buffer.from(JSON.stringify(diagnostics.pageErrors, null, 2)),
    contentType: 'application/json',
  });
  await testInfo.attach('console-errors.json', {
    body: Buffer.from(JSON.stringify(diagnostics.consoleErrors, null, 2)),
    contentType: 'application/json',
  });
};

const setupDiagnostics = (page: Page) => {
  const diagnostics = {
    pageErrors: [] as string[],
    consoleErrors: [] as string[],
    graphqlRequests: [] as Array<{
      operationName: string;
      variables?: Record<string, unknown>;
    }>,
  };

  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(error.stack || error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on('request', (requestEvent) => {
    if (!requestEvent.url().includes('/graphql')) {
      return;
    }

    const body = requestEvent.postDataJSON?.() as
      | {
          operationName?: string;
          query?: string;
          variables?: Record<string, unknown>;
        }
      | undefined;

    diagnostics.graphqlRequests.push({
      operationName:
        body?.operationName ??
        body?.query?.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/)?.[2] ??
        'UnknownOperation',
      variables: body?.variables,
    });
  });

  return diagnostics;
};

const openSeededDiscussion = async (page: Page) => {
  await page.goto(CHANNEL_DISCUSSION_LIST, { waitUntil: 'networkidle' });
  const discussionLink = page.getByRole('link', { name: DISCUSSION_TITLE });
  await expect(discussionLink).toBeVisible({ timeout: 30_000 });
  await discussionLink.click();
  await page.waitForLoadState('networkidle');
};

const createComment = async (page: Page, text: string) => {
  const addComment = page.getByTestId('addComment');
  await expect(addComment).toBeVisible({ timeout: 10_000 });
  await addComment.click();
  await page.getByTestId('texteditor-textarea').fill(text);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
};

const replyToComment = async (page: Page, text: string, replyText: string) => {
  const comment = page.getByTestId('comment').filter({ hasText: text }).first();
  await expect(comment).toBeVisible();
  await comment.getByTestId('reply-comment-button').click();
  await page.getByTestId('texteditor-textarea').fill(replyText);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText(replyText, { exact: true })).toBeVisible();
};

test('creates nested comments at multiple levels', async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await openSeededDiscussion(page);

    const comment1 = `Test comment 1 ${Date.now()}`;
    const comment2 = `Test comment 2 ${Date.now()}`;
    const comment3 = `Test comment 3 ${Date.now()}`;
    const comment4 = `Test comment 4 ${Date.now()}`;
    const comment5 = `Test comment 5 ${Date.now()}`;

    await createComment(page, comment1);
    await replyToComment(page, comment1, comment2);
    await replyToComment(page, comment1, comment3);
    await replyToComment(page, comment3, comment4);
    await replyToComment(page, comment3, comment5);

    await expect(page.getByText(comment1, { exact: true })).toBeVisible();
    await expect(page.getByText(comment2, { exact: true })).toBeVisible();
    await expect(page.getByText(comment3, { exact: true })).toBeVisible();
    await expect(page.getByText(comment4, { exact: true })).toBeVisible();
    await expect(page.getByText(comment5, { exact: true })).toBeVisible();
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
