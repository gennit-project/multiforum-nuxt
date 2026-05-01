import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_LIST = '/discussions/';
const CHANNEL_VIEW = '/forums/phx_music/discussions/';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';
const NEW_YEARS_TITLE = 'Example topic 2';
const TRIVIA_TITLE = 'Example topic 3';

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

test.describe('Filter discussions by tag', () => {
  test('filters sitewide discussions by tag', async (
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
      await page.goto(DISCUSSION_LIST);
      await expect(page.getByText(NEW_YEARS_TITLE, { exact: true })).toBeVisible();

      await page.getByTestId('discussion-filter-button').click();
      await page.getByTestId('tag-filter-button').click();
      await page.getByTestId('tag-picker-newYears').click();
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"] li')
      ).toHaveCount(1);
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"]')
      ).toContainText(NEW_YEARS_TITLE);

      await page.getByTestId('tag-picker-trivia').click();
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"] li')
      ).toHaveCount(2);
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"]')
      ).toContainText(NEW_YEARS_TITLE);
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"]')
      ).toContainText(TRIVIA_TITLE);
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test('filters channel discussions by tag', async ({ context, page, request }, testInfo) => {
    const token = await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    await resetStatefulBackendData(request, token);
    const diagnostics = setupDiagnostics(page);

    try {
      await page.goto(CHANNEL_VIEW);
      await expect(page.getByText(TRIVIA_TITLE, { exact: true })).toBeVisible();

      await page.getByTestId('discussion-filter-button').click();
      await page.getByTestId('tag-filter-button').click();
      await page.getByTestId('tag-picker-trivia').click();
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"] li')
      ).toHaveCount(1);
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"]')
      ).toContainText(TRIVIA_TITLE);

      await page.getByTestId('tag-picker-newYears').click();
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"] li')
      ).toHaveCount(2);
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"]')
      ).toContainText(NEW_YEARS_TITLE);
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"]')
      ).toContainText(TRIVIA_TITLE);
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });
});
