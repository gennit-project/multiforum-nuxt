import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_LIST = '/discussions/';
const DISCUSSION_TITLE = 'Example topic 1';

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
  await page.goto(DISCUSSION_LIST);
  await expect(page.getByText(DISCUSSION_TITLE, { exact: true })).toBeVisible();
  await page.getByText(DISCUSSION_TITLE, { exact: true }).click();
};

const createComment = async (page: Page, text: string) => {
  const addComment = page.getByTestId('addComment');
  await expect(addComment).toBeVisible({ timeout: 10_000 });
  await addComment.click();
  await page.getByTestId('texteditor-textarea').fill(text);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
};

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
    await openSeededDiscussion(page);

    const commentText = `Test comment ${Date.now()}`;
    await createComment(page, commentText);

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
    await openSeededDiscussion(page);

    const commentText = `Test comment ${Date.now()}`;
    await createComment(page, commentText);

    const voterContext = await browser.newContext();
    try {
      const voterPage = await voterContext.newPage();
      await installMockAuth(voterContext, voterPage, {
        username: 'alice',
        email: 'the.rinnovator@gmail.com',
      });

      await openSeededDiscussion(voterPage);
      const upvoteButton = voterPage.getByTestId('upvote-comment-button').first();
      await expect(upvoteButton).toContainText('1');
      await upvoteButton.click();
      await expect(upvoteButton).toContainText('2');
      await upvoteButton.click();
      await expect(upvoteButton).toContainText('1');
    } finally {
      await voterContext.close();
    }
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
