import { expect, test } from '@playwright/test';
import type { Browser, Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const CATS_DISCUSSIONS = '/forums/cats/discussions';
const CATS_DISCUSSION_CREATE = '/forums/cats/discussions/create';
const CATS_EVENT_CREATE = '/forums/cats/events/create';
const CATS_SUSPENDED_USERS = '/forums/cats/edit/suspended-users';

const AUTHOR_USERNAME = 'cluse';
const AUTHOR_EMAIL = 'catherine.luse@gmail.com';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';

type Diagnostics = {
  pageErrors: string[];
  consoleErrors: string[];
  graphqlRequests: Array<{
    operationName: string;
    variables?: Record<string, unknown>;
  }>;
};

const createDiagnostics = (): Diagnostics => ({
  pageErrors: [],
  consoleErrors: [],
  graphqlRequests: [],
});

const registerDiagnostics = (page: Page, diagnostics: Diagnostics) => {
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

const attachDiagnostics = async (
  testInfo: TestInfo,
  diagnostics: Diagnostics
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

type SuspensionScenario = {
  authorContext: Awaited<ReturnType<Browser['newContext']>>;
  modContext: Awaited<ReturnType<Browser['newContext']>>;
  authorPage: Page;
  modPage: Page;
  discussionTitle: string;
  authorDiagnostics: Diagnostics;
  modDiagnostics: Diagnostics;
};

const clickForumRulesCheckbox = async (page: Page) => {
  await page
    .locator('h3:has-text("Forum rules")')
    .locator('xpath=..')
    .locator('input[type="checkbox"]')
    .first()
    .check();
};

const createDiscussion = async (page: Page, title: string) => {
  await page.goto(CATS_DISCUSSION_CREATE);
  await expect(page.getByTestId('title-input')).toBeVisible();
  await page.getByTestId('title-input').fill(title);
  await page.getByTestId('body-input').fill('This discussion triggers a suspension.');
  await page.getByRole('button', { name: /create/i }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
};

const suspendAuthor = async (page: Page, discussionTitle: string) => {
  await page.goto(CATS_DISCUSSIONS);
  await expect(page.getByText(discussionTitle, { exact: true })).toBeVisible();
  await page.getByText(discussionTitle, { exact: true }).click();
  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Archive and Suspend').click();
  await expect(page.getByText('Suspend Author')).toBeVisible();
  await clickForumRulesCheckbox(page);
  await page.locator('select').selectOption({ label: 'One Week' });
  await page.getByTestId('report-discussion-input').fill(
    'Suspension for permissions test.'
  );
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(
    page.getByText('Archived the post and suspended the author.')
  ).toBeVisible();
};

const setupSuspensionScenario = async (
  browser: Browser,
  request: Parameters<typeof resetStatefulBackendData>[0],
  titlePrefix: string
): Promise<SuspensionScenario> => {
  const authorContext = await browser.newContext();
  const modContext = await browser.newContext();
  const authorPage = await authorContext.newPage();
  const modPage = await modContext.newPage();
  const authorDiagnostics = createDiagnostics();
  const modDiagnostics = createDiagnostics();

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

  const discussionTitle = `${titlePrefix} ${Date.now()}`;
  await createDiscussion(authorPage, discussionTitle);
  await suspendAuthor(modPage, discussionTitle);

  return {
    authorContext,
    modContext,
    authorPage,
    modPage,
    discussionTitle,
    authorDiagnostics,
    modDiagnostics,
  };
};

test.describe('Suspended user permissions enforcement', () => {
  test('suspended user cannot create a discussion and receives notification', async ({
    browser,
    request,
  }, testInfo) => {
    const scenario = await setupSuspensionScenario(
      browser,
      request,
      'Discussion suspension test'
    );

    try {
      await scenario.authorPage.goto(CATS_DISCUSSION_CREATE);
      const blockedDiscussionTitle = `Blocked discussion ${Date.now()}`;
      await scenario.authorPage.getByTestId('title-input').fill(
        blockedDiscussionTitle
      );
      await scenario.authorPage.getByTestId('body-input').fill(
        'This discussion should be blocked by the suspension notice.'
      );
      await scenario.authorPage.getByRole('button', { name: /create/i }).click();
      await expect(
        scenario.authorPage.getByText(
          'You are suspended in this forum and cannot create discussions.'
        )
      ).toBeVisible();
      await expect(
        scenario.authorPage.getByText(/View Issue #\d+/)
      ).toBeVisible();
    } finally {
      await scenario.authorContext.close();
      await scenario.modContext.close();
      await attachDiagnostics(testInfo, {
        pageErrors: [
          ...scenario.authorDiagnostics.pageErrors,
          ...scenario.modDiagnostics.pageErrors,
        ],
        consoleErrors: [
          ...scenario.authorDiagnostics.consoleErrors,
          ...scenario.modDiagnostics.consoleErrors,
        ],
        graphqlRequests: [
          ...scenario.authorDiagnostics.graphqlRequests,
          ...scenario.modDiagnostics.graphqlRequests,
        ],
      });
    }
  });

  test('suspended user cannot create a comment', async ({ browser, request }, testInfo) => {
    const scenario = await setupSuspensionScenario(
      browser,
      request,
      'Comment suspension test'
    );

    try {
      await scenario.authorPage.goto(CATS_DISCUSSIONS);
      await scenario.authorPage.getByText(scenario.discussionTitle, {
        exact: true,
      }).click();
      await expect(
        scenario.authorPage.getByText(/Comments \(\d+\)/)
      ).toBeVisible();

      await scenario.authorPage.getByTestId('addComment').click();
      await scenario.authorPage.getByTestId('texteditor-textarea').fill(
        'This comment should be blocked.'
      );
      await scenario.authorPage.getByTestId('createCommentButton').click();

      await expect(
        scenario.authorPage.getByText(
          'You are suspended in this forum and cannot comment.'
        )
      ).toBeVisible();
    } finally {
      await scenario.authorContext.close();
      await scenario.modContext.close();
      await attachDiagnostics(testInfo, {
        pageErrors: [
          ...scenario.authorDiagnostics.pageErrors,
          ...scenario.modDiagnostics.pageErrors,
        ],
        consoleErrors: [
          ...scenario.authorDiagnostics.consoleErrors,
          ...scenario.modDiagnostics.consoleErrors,
        ],
        graphqlRequests: [
          ...scenario.authorDiagnostics.graphqlRequests,
          ...scenario.modDiagnostics.graphqlRequests,
        ],
      });
    }
  });

  test('suspended user cannot create an event', async ({ browser, request }, testInfo) => {
    const scenario = await setupSuspensionScenario(
      browser,
      request,
      'Event suspension test'
    );

    try {
      await scenario.authorPage.goto(CATS_EVENT_CREATE);
      await expect(scenario.authorPage.getByTestId('event-form')).toBeVisible();
      await scenario.authorPage.getByTestId('title-input').fill(
        `Blocked event ${Date.now()}`
      );
      await scenario.authorPage.getByRole('button', { name: /create/i }).click();

      await expect(
        scenario.authorPage.getByText(
          'You are suspended in this forum and cannot create events.'
        )
      ).toBeVisible();
    } finally {
      await scenario.authorContext.close();
      await scenario.modContext.close();
      await attachDiagnostics(testInfo, {
        pageErrors: [
          ...scenario.authorDiagnostics.pageErrors,
          ...scenario.modDiagnostics.pageErrors,
        ],
        consoleErrors: [
          ...scenario.authorDiagnostics.consoleErrors,
          ...scenario.modDiagnostics.consoleErrors,
        ],
        graphqlRequests: [
          ...scenario.authorDiagnostics.graphqlRequests,
          ...scenario.modDiagnostics.graphqlRequests,
        ],
      });
    }
  });

  test('unsuspended user can create content again', async ({ browser, request }, testInfo) => {
    const scenario = await setupSuspensionScenario(
      browser,
      request,
      'Unsuspend test discussion'
    );

    try {
      await scenario.modPage.goto(CATS_SUSPENDED_USERS);
      await expect(
        scenario.modPage.getByText(AUTHOR_USERNAME, { exact: true })
      ).toBeVisible();
      await scenario.modPage.getByText('Related Issue', { exact: true }).click();
      await expect(scenario.modPage.getByText('Issue Details')).toBeVisible();
      await scenario.modPage.getByRole('button', { name: 'Unsuspend Author' }).click();
      await expect(scenario.modPage.getByText('Unsuspend Author')).toBeVisible();
      await scenario.modPage.getByTestId('report-discussion-input').fill(
        'Cleanup after permissions test.'
      );
      await scenario.modPage.getByRole('button', { name: 'Submit' }).click();
      await expect(
        scenario.modPage.getByText('The author was unsuspended.')
      ).toBeVisible();

      await scenario.authorPage.goto(CATS_DISCUSSION_CREATE);
      const recoveredDiscussion = `Recovered discussion ${Date.now()}`;
      await scenario.authorPage.getByTestId('title-input').fill(
        recoveredDiscussion
      );
      await scenario.authorPage.getByTestId('body-input').fill(
        'This discussion should succeed after unsuspension.'
      );
      await scenario.authorPage.getByRole('button', { name: /create/i }).click();
      await expect(
        scenario.authorPage.getByText(recoveredDiscussion, { exact: true })
      ).toBeVisible();
    } finally {
      await scenario.authorContext.close();
      await scenario.modContext.close();
      await attachDiagnostics(testInfo, {
        pageErrors: [
          ...scenario.authorDiagnostics.pageErrors,
          ...scenario.modDiagnostics.pageErrors,
        ],
        consoleErrors: [
          ...scenario.authorDiagnostics.consoleErrors,
          ...scenario.modDiagnostics.consoleErrors,
        ],
        graphqlRequests: [
          ...scenario.authorDiagnostics.graphqlRequests,
          ...scenario.modDiagnostics.graphqlRequests,
        ],
      });
    }
  });
});
