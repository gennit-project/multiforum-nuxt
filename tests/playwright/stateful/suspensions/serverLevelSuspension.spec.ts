import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const CATS_FORUM = '/forums/cats/discussions';
const CHANNEL_CREATION_FORM = '/forums/create';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';
const AUTHOR_USERNAME = 'cluse';
const AUTHOR_EMAIL = 'catherine.luse@gmail.com';

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

const registerDiagnostics = (page: Page, diagnostics: ReturnType<typeof createDiagnostics>) => {
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
};

const createDiagnostics = () => ({
  pageErrors: [] as string[],
  consoleErrors: [] as string[],
  graphqlRequests: [] as Array<{
    operationName: string;
    variables?: Record<string, unknown>;
  }>,
});

const createDiscussion = async (page: Page, title: string) => {
  await page.goto(CATS_FORUM);
  await expect(page.getByText('Create Discussion', { exact: true })).toBeVisible();
  await page.getByText('Create Discussion', { exact: true }).click();
  await page.getByTestId('title-input').fill(title);
  await page.getByTestId('body-input').fill('This discussion triggers a suspension.');
  await page.getByTestId('channel-input').click();
  await page.getByText('cats', { exact: true }).click();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
};

const suspendAuthor = async (page: Page, discussionTitle: string) => {
  await page.goto(CATS_FORUM);
  await expect(page.getByText(discussionTitle, { exact: true })).toBeVisible();
  await page.getByText(discussionTitle, { exact: true }).click();
  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Archive and Suspend').click();
  await expect(page.getByText('Suspend Author')).toBeVisible();
  await page
    .locator('h3:has-text("Forum rules")')
    .locator('xpath=..')
    .locator('input[type="checkbox"]')
    .first()
    .check();
  await page.locator('select').selectOption({ label: 'Two Weeks' });
  await page.getByTestId('report-discussion-input').fill(
    'Suspension for forum creation test.'
  );
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(
    page.getByText('Archived the post and suspended the author.')
  ).toBeVisible();
};

test('suspended user cannot create a forum and can create one after unsuspension', async ({
  browser,
  request,
}, testInfo) => {
  const authorDiagnostics = createDiagnostics();
  const modDiagnostics = createDiagnostics();

  const authorContext = await browser.newContext();
  const modContext = await browser.newContext();
  try {
    const authorPage = await authorContext.newPage();
    const modPage = await modContext.newPage();

    registerDiagnostics(authorPage, authorDiagnostics);
    registerDiagnostics(modPage, modDiagnostics);

    const token = await installMockAuth(authorContext, authorPage, {
      username: AUTHOR_USERNAME,
      email: AUTHOR_EMAIL,
    });
    await installMockAuth(modContext, modPage, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    await resetStatefulBackendData(request, token);

    const triggerDiscussion = `Forum creation suspension test ${Date.now()}`;
    await createDiscussion(authorPage, triggerDiscussion);

    await suspendAuthor(modPage, triggerDiscussion);

    await authorPage.goto(CHANNEL_CREATION_FORM);
    const blockedForumName = `blocked_forum_${Date.now()}`;
    await authorPage.getByTestId('title-input').fill(blockedForumName);
    await authorPage.getByRole('button', { name: /create/i }).click();
    await expect(
      authorPage.getByText('You have an active suspension and cannot create forums.')
    ).toBeVisible();
    await expect(authorPage.getByText(/View Issue #\d+/)).toBeVisible();

    await modPage.goto('/forums/cats/edit/suspended-users');
    await expect(modPage.getByText(AUTHOR_USERNAME, { exact: true })).toBeVisible();
    await modPage.getByText('Related Issue', { exact: true }).click();
    await expect(modPage.getByText('Issue Details')).toBeVisible();
    await modPage.getByRole('button', { name: 'Unsuspend Author' }).click();
    await expect(modPage.getByText('Unsuspend Author')).toBeVisible();
    await modPage.getByTestId('report-discussion-input').fill(
      'Cleanup after forum creation test.'
    );
    await modPage.getByRole('button', { name: 'Submit' }).click();
    await expect(modPage.getByText('The author was unsuspended.')).toBeVisible();

    await authorPage.goto(CHANNEL_CREATION_FORM);
    const forumName = `testforum_${Date.now()}`;
    await authorPage.getByTestId('title-input').fill(forumName);
    await authorPage.getByRole('button', { name: /create/i }).click();
    await expect(authorPage).toHaveURL(new RegExp(`/forums/${forumName}/discussions`));
  } finally {
    await authorContext.close();
    await modContext.close();
    await attachDiagnostics(testInfo, {
      pageErrors: [...authorDiagnostics.pageErrors, ...modDiagnostics.pageErrors],
      consoleErrors: [
        ...authorDiagnostics.consoleErrors,
        ...modDiagnostics.consoleErrors,
      ],
      graphqlRequests: [
        ...authorDiagnostics.graphqlRequests,
        ...modDiagnostics.graphqlRequests,
      ],
    });
  }
});
