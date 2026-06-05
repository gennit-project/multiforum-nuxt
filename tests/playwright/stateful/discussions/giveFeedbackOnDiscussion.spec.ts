import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_TITLE = 'Example topic 1';
const CHANNEL_DISCUSSION_LIST = '/forums/cats/discussions/';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';

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

const openSeededDiscussion = async (page: Page) => {
  await page.goto(CHANNEL_DISCUSSION_LIST, { waitUntil: 'networkidle' });
  const discussionLink = page.getByRole('link', { name: DISCUSSION_TITLE });
  await expect(discussionLink).toBeVisible({ timeout: 30_000 });
  await discussionLink.click();
  await page.waitForLoadState('networkidle');
};

// TODO: The feedback UI has changed significantly - this test needs to be rewritten
// to match the new UI flow where clicking "Feedback" opens a menu with "Give Feedback" option
test.skip('can create, edit, permalink, and delete feedback on a discussion', async (
  {
    context,
    page,
    request,
  },
  testInfo
) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:3000',
  });
  await resetStatefulBackendData(request, token);

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

  const initialFeedback = 'Test feedback for discussion';
  const editedFeedback = 'Edited test feedback for discussion';

  try {
    await openSeededDiscussion(page);

    // Click the Feedback button to open menu, then click Give Feedback
    await page.getByRole('button', { name: 'Feedback' }).click();
    await page.getByRole('menuitem', { name: 'Give Feedback' }).click();

    // Create initial feedback - wait for modal to appear
    await expect(page.getByTestId('texteditor-textarea')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('texteditor-textarea').fill(initialFeedback);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(initialFeedback, { exact: true })).toBeVisible();

    // Edit the feedback
    await page.getByTestId('feedback-comment-menu').click();
    await page.getByText('Edit', { exact: true }).first().click();
    await page.getByTestId('texteditor-textarea').fill(editedFeedback);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(editedFeedback, { exact: true })).toBeVisible();

    // Copy permalink and verify
    await page.getByTestId('feedback-comment-menu').click();
    await page.getByText('Copy Link', { exact: true }).first().click();
    const copiedLink = await page.evaluate(() => navigator.clipboard.readText());
    await page.goto(copiedLink, { waitUntil: 'networkidle' });
    await expect(page.getByText(editedFeedback, { exact: true })).toBeVisible();
    await expect(page.getByText('Permalinked')).toBeVisible();

    // Delete the feedback
    await page.getByTestId('feedback-comment-menu').click();
    await page.getByText('Delete', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Comment not found')).toBeVisible();
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
