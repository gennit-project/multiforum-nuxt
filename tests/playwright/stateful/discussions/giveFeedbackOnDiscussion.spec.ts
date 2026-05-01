import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_TITLE = 'Example topic 1';
const DISCUSSION_LIST_URL = '/discussions/';
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
  await page.goto(DISCUSSION_LIST_URL);
  await expect(page.getByText(DISCUSSION_TITLE, { exact: true })).toBeVisible();
  await page.getByText(DISCUSSION_TITLE, { exact: true }).click();
};

test('can create, edit, permalink, and delete feedback on a discussion', async (
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

    await page.getByTestId('downvote-discussion-button').click();
    await page
      .getByTestId('discussion-thumbs-down-menu-button-item-Give Feedback')
      .click();
    await expect(page.getByText('Give Semi-anonymous Feedback')).toBeVisible();
    await page.getByTestId('description-input').fill(initialFeedback);
    await page.getByTestId('feedback-form-modal-primary-button').click();
    await expect(
      page.getByText('Your feedback was submitted successfully.')
    ).toBeVisible();

    await expect(page.getByTestId('downvote-discussion-button')).toHaveClass(
      /bg-blue-500/
    );

    await page.getByTestId('downvote-discussion-button').click();
    await page
      .getByTestId('discussion-thumbs-down-menu-button-item-Edit Feedback')
      .click();
    await page.getByTestId('texteditor-textarea').fill(editedFeedback);
    await page.getByTestId('edit-feedback-modal-primary-button').click();
    await expect(page.getByText(editedFeedback, { exact: true })).toBeVisible();

    await page.getByTestId('downvote-discussion-button').click();
    await page
      .getByTestId('discussion-thumbs-down-menu-button-item-View Feedback')
      .click();
    await expect(page.getByText(editedFeedback, { exact: true })).toBeVisible();

    await page.getByTestId('feedback-comment-menu').click();
    await page.getByTestId('feedback-comment-menu-item-Copy Link').click();
    const copiedLink = await page.evaluate(() => navigator.clipboard.readText());
    await page.goto(copiedLink);
    await expect(page.getByText(editedFeedback, { exact: true })).toBeVisible();
    await expect(page.getByText('Permalinked')).toBeVisible();

    await page.getByTestId('feedback-comment-menu').click();
    await page.getByTestId('feedback-comment-menu-item-Delete').click();
    await page.getByTestId('delete-comment-modal-primary-button').click();
    await expect(page.getByText('Comment not found')).toBeVisible();

    await page.getByTestId('discussion-detail-back-link').click();
    await expect(page.getByText(DISCUSSION_TITLE, { exact: true })).toBeVisible();
    await expect(page.getByTestId('downvote-discussion-button')).not.toHaveClass(
      /bg-blue-500/
    );
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
