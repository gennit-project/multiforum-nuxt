import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const EVENT_TITLE = 'Test free/virtual event';
const EVENT_LIST_URL = '/forums/cats/events';
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

const openSeededEvent = async (page: Page) => {
  await page.goto(EVENT_LIST_URL);
  await expect(page.getByText(EVENT_TITLE, { exact: true })).toBeVisible();
  await page.getByText(EVENT_TITLE, { exact: true }).click();
  await expect(page).toHaveURL(/\/forums\/cats\/events\/.+/);
};

test('can create, edit, permalink, and delete feedback on an event', async (
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

  const initialFeedback = 'Test feedback for event';
  const editedFeedback = 'Edited test feedback for event';

  try {
    await openSeededEvent(page);

    await page.getByTestId('event-menu-button').click();
    await page.getByTestId('event-menu-button-item-Give Feedback').click();
    await expect(page.getByText('Give Semi-anonymous Feedback')).toBeVisible();
    await page.getByTestId('description-input').fill(initialFeedback);
    await page.getByTestId('feedback-form-modal-primary-button').click();
    await expect(
      page.getByText('Your feedback has been recorded. Thank you!')
    ).toBeVisible();

    await page.getByTestId('event-menu-button').click();
    await page.getByTestId('event-menu-button-item-View Feedback').click();
    await expect(page.getByText(initialFeedback, { exact: true })).toBeVisible();

    await page.getByTestId('feedback-comment-menu').click();
    await page.getByTestId('feedback-comment-menu-item-Edit').click();
    await page.getByTestId('texteditor-textarea').fill(editedFeedback);
    await page.getByTestId('saveCommentButton').click();
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
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
