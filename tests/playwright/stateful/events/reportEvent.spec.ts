import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const EVENT_TITLE = 'Test free/virtual event';
const CATS_FORUM_EVENTS = '/forums/cats/events';
const CHANNEL_ISSUES = '/forums/cats/issues';
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
  await page.goto(CATS_FORUM_EVENTS, { waitUntil: 'networkidle' });
  const eventLink = page.getByRole('button', {
    name: new RegExp(EVENT_TITLE),
  });
  await expect(eventLink).toBeVisible({ timeout: 30_000 });
  await eventLink.click();
  await expect(page.getByTestId('event-menu-button')).toBeVisible({
    timeout: 30_000,
  });
};

const clickRuleCheckbox = async (page: Page, headingText: string) => {
  await page
    .locator(`h3:has-text("${headingText}")`)
    .locator('xpath=..')
    .locator('input[type="checkbox"]')
    .first()
    .check();
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

test('reports an event successfully', async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await openSeededEvent(page);

    await page.getByTestId('event-menu-button').click();
    await page.getByTestId('event-menu-button-item-Report').click();
    await expect(page.getByText('Report Event')).toBeVisible();
    await clickRuleCheckbox(page, 'Forum rules');
    await page.getByTestId('report-event-input').fill(
      'This is a test report for integration testing purposes.'
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(
      page.getByText('Your report was submitted successfully.')
    ).toBeVisible();

    await page.goto(CHANNEL_ISSUES);
    await expect(page.getByTestId('issue-list')).toContainText(EVENT_TITLE);
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
