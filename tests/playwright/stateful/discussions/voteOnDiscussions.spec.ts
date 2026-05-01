import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const CATS_FORUM = '/forums/cats/discussions';
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

const createDiscussion = async (page: Page, title: string) => {
  await page.goto('/discussions/create');
  await page.getByTestId('title-input').fill(title);
  await page.getByTestId('channel-input').click();
  await page.getByText('cats', { exact: true }).click();
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page).toHaveURL(/\/forums\/cats\/discussions\/.+/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
};

test('can upvote and downvote discussions', async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    const title = `Test discussion voting ${Date.now()}`;
    await createDiscussion(page, title);
    const upvoteButton = page.getByTestId('upvote-discussion-button');
    await expect(upvoteButton).toContainText('1');

    await upvoteButton.click();
    await expect(upvoteButton).toContainText('0');
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});

test("user 2 can upvote another user's discussion", async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await page.goto(CATS_FORUM);
    await expect(page.getByText('Example topic 1', { exact: true })).toBeVisible();
    await page.getByText('Example topic 1', { exact: true }).click();

    const upvoteButton = page.getByTestId('upvote-discussion-button');
    await expect(upvoteButton).toContainText('1');
    await upvoteButton.click();
    await expect(upvoteButton).toContainText('2');
    await upvoteButton.click();
    await expect(upvoteButton).toContainText('1');
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
