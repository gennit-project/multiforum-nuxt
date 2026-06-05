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
  // Navigate to the channel-scoped discussions list to avoid forum picker issues
  await page.goto(CHANNEL_DISCUSSION_LIST, { waitUntil: 'networkidle' });
  const discussionLink = page.getByRole('link', { name: DISCUSSION_TITLE });
  await expect(discussionLink).toBeVisible({ timeout: 30_000 });
  await discussionLink.click();
  // Wait for discussion detail and comments section to load
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
    await openSeededDiscussion(page);

    const originalText = `Test comment ${Date.now()}`;
    await createComment(page, originalText);

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
