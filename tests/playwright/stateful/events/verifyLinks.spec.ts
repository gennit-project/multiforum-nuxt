import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const EVENT_TITLE = 'Test free/virtual event';
const EVENT_LIST_URL = '/forums/cats/events';
const CATS_ISSUES_URL = '/forums/cats/issues';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';

const openSeededEvent = async (page: Page) => {
  await page.goto(EVENT_LIST_URL);
  await expect(page.getByText(EVENT_TITLE, { exact: true })).toBeVisible();
  await page.getByText(EVENT_TITLE, { exact: true }).click();
  await expect(page).toHaveURL(/\/forums\/cats\/events\/.+/);
};

const clickForumRulesCheckbox = async (page: Page) => {
  await page
    .locator('h3:has-text("Forum rules")')
    .locator('xpath=..')
    .locator('input[type="checkbox"]')
    .first()
    .check();
};

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

test('can archive and unarchive an event, and verify the issue appears in closed issues', async ({
  context,
  page,
  request,
}, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
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

  try {
    await openSeededEvent(page);

    await page.getByTestId('event-menu-button').click();
    await page.getByTestId('event-menu-button-item-Archive').click();
    await expect(page.getByText('Archive Event')).toBeVisible();
    await clickForumRulesCheckbox(page);
    await page.getByTestId('report-event-input').fill(
      'This is a test archive for a rule violation'
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(
      page.getByText('The event was reported and archived successfully.')
    ).toBeVisible();
    await expect(page.getByTestId('archived-event-banner')).toBeVisible();
    await expect(
      page
        .getByTestId('archived-event-banner')
        .getByRole('link', { name: 'archived' })
    ).toBeVisible();

    await page
      .getByTestId('archived-event-banner')
      .getByRole('link', { name: 'archived' })
      .click();
    await expect(page.getByText('Issue Details')).toBeVisible();

    const issueUrl = page.url();

    await page.getByTestId('original-post-container').getByText(EVENT_TITLE).click();
    await expect(page).toHaveURL(/\/forums\/cats\/events\/.+/);
    await expect(page.getByTestId('archived-event-banner')).toBeVisible();

    await page.goto(issueUrl);
    await page.getByText('Unarchive', { exact: true }).click();
    await expect(page.getByText('Unarchive Event')).toBeVisible();
    await page.getByRole('textbox').fill('This is a test unarchive');
    await page.getByRole('button', { name: 'Unarchive' }).click();
    await expect(
      page.getByText('The event was unarchived successfully.')
    ).toBeVisible();

    await page.getByTestId('original-post-container').getByText(EVENT_TITLE).click();
    await expect(page.getByTestId('archived-event-banner')).toHaveCount(0);

    await page.goto(EVENT_LIST_URL);
    await expect(page.getByText(EVENT_TITLE, { exact: true })).toBeVisible();
    await page.goto(CATS_ISSUES_URL);
    await expect(page.getByText(EVENT_TITLE)).toBeVisible();
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});

test('verifies links between reported event feedback, issue, and original event', async ({
  context,
  page,
  request,
}, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
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

  const feedbackText = 'Test feedback for event link verification';

  try {
    await openSeededEvent(page);

    await page.getByTestId('event-menu-button').click();
    await page.getByTestId('event-menu-button-item-Give Feedback').click();
    await expect(page.getByText('Give Semi-anonymous Feedback')).toBeVisible();
    await page.getByTestId('description-input').fill(feedbackText);
    await page
      .getByTestId('feedback-form-modal-primary-button')
      .click();
    await expect(
      page.getByText('Your feedback has been recorded. Thank you!')
    ).toBeVisible();

    await page.getByTestId('event-menu-button').click();
    await page.getByTestId('event-menu-button-item-View Feedback').click();
    await expect(page).toHaveURL(/\/forums\/cats\/events\/feedback\/.+/);

    await page.getByTestId('feedback-comment-menu').click();
    await page.getByTestId('feedback-comment-menu-item-Report').click();
    await expect(page.getByText('Report Feedback')).toBeVisible();
    await clickForumRulesCheckbox(page);
    await page.getByTestId('report-comment-input').fill(
      'Testing event feedback link verification'
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(
      page.getByText('Your report was submitted successfully.')
    ).toBeVisible();

    await page.goto(CATS_ISSUES_URL);
    await page.getByText('Feedback on event', { exact: true }).click();
    await expect(page.getByText('Issue Details')).toBeVisible();

    const issueUrl = page.url();

    await page
      .getByTestId('original-post-container')
      .getByText('View original feedback')
      .click();
    await expect(page.getByText(feedbackText, { exact: true })).toBeVisible();

    await page.getByText('View in event', { exact: true }).click();
    await expect(page).toHaveURL(/\/forums\/cats\/events\/feedback\/.+/);
    await expect(page.getByText(feedbackText, { exact: true })).toBeVisible();

    await page.goto(issueUrl);
    await page.getByText('Archive', { exact: true }).click();
    await expect(page.getByText('Archive Feedback')).toBeVisible();
    await page.getByTestId('report-comment-input').fill(
      'Archiving feedback for test'
    );
    await page.getByRole('button', { name: 'Archive' }).click();
    await expect(
      page.getByText('The content was reported and archived successfully.')
    ).toBeVisible();

    await page.goto(issueUrl);
    await page.getByText('Unarchive', { exact: true }).click();
    await expect(page.getByText('Unarchive Feedback')).toBeVisible();
    await page.getByTestId('report-comment-input').fill(
      'Unarchiving for test cleanup'
    );
    await page.getByRole('button', { name: 'Unarchive' }).click();
    await expect(
      page.getByText('The content was unarchived successfully.')
    ).toBeVisible();

    await page.goto(CATS_ISSUES_URL);
    await expect(page.getByText('Feedback on event', { exact: true })).toBeVisible();
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
