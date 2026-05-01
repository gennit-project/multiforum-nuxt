import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_LIST = '/discussions/';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';
const SEARCH_TERM = 'Example topic 1';

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

test('filters discussions by channel', async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await page.goto(DISCUSSION_LIST);
    await expect(page.getByText(SEARCH_TERM, { exact: true })).toBeVisible();

    await page.getByTestId('forum-filter-button').click();
    await page.getByTestId('forum-picker-cats').click();
    await expect(
      page.locator('ul[data-testid="sitewide-discussion-list"] li')
    ).toHaveCount(1);
    await expect(
      page.locator('ul[data-testid="sitewide-discussion-list"]')
    ).toContainText(SEARCH_TERM);

    await page.getByTestId('forum-picker-phx_music').click();
    await expect(
      page.locator('ul[data-testid="sitewide-discussion-list"] li')
    ).toHaveCount(3);

    await page.getByTestId('forum-picker-cats').click();
    await expect(
      page.locator('ul[data-testid="sitewide-discussion-list"] li')
    ).toHaveCount(2);
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
