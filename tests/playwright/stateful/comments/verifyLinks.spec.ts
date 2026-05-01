import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_TITLE = 'Example topic 1';
const DISCUSSION_LIST_URL = '/discussions/';
const CATS_ISSUES_URL = '/forums/cats/issues';

const createCommentText = (prefix: string) => `${prefix} ${Date.now()}`;

const openFirstSeededDiscussion = async (page: Page) => {
  await page.goto(DISCUSSION_LIST_URL);
  await expect(page.getByText(DISCUSSION_TITLE, { exact: true })).toBeVisible();
  await page.getByText(DISCUSSION_TITLE, { exact: true }).click();
};

const createComment = async (page: Page, text: string) => {
  const addComment = page.getByTestId('addComment');
  await expect(addComment).toBeVisible({ timeout: 10_000 });
  await addComment.click();
  await page.getByTestId('texteditor-textarea').fill(text);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
};

const openCommentMenu = async (page: Page, text: string) => {
  const comment = page.getByTestId('comment').filter({ hasText: text }).first();
  await expect(comment).toBeVisible();
  await comment.getByTestId('commentMenu').click();
};

const clickForumRulesCheckbox = async (page: Page) => {
  await page
    .locator('h3:has-text("Forum rules")')
    .locator('xpath=..')
    .locator('input[type="checkbox"]')
    .first()
    .check();
};

test('verifies navigation links between archived comment, issue, and original context', async ({
  context,
  page,
  request,
}, testInfo) => {
  const token = await installMockAuth(context, page);
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

  const commentText = createCommentText('Test comment for link verification');

  try {
    await openFirstSeededDiscussion(page);
    await createComment(page, commentText);

    await openCommentMenu(page, commentText);
    await page.getByText('Archive', { exact: true }).click();

    await expect(page.getByText('Archive Comment')).toBeVisible();
    await clickForumRulesCheckbox(page);
    await page.getByTestId('report-discussion-input').fill(
      'Testing link verification'
    );
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('This comment has been archived')).toBeVisible();
    await expect(page.getByText('View related issue')).toBeVisible();

    const discussionUrl = page.url();

    await page.getByText('View related issue').click();
    await expect(page.getByText('Issue Details')).toBeVisible();

    const issueUrl = page.url();
    const discussionUrlWithoutHash = discussionUrl.split('#')[0] ?? discussionUrl;

    await page.getByTestId('original-post-container').getByText('Context').click();
    await expect(page).toHaveURL(discussionUrlWithoutHash);
    await expect(page.getByText('This comment has been archived')).toBeVisible();

    await page.goto(issueUrl);
    await page.getByText('Unarchive', { exact: true }).click();
    await expect(page.getByText('Unarchive Comment')).toBeVisible();
    await page.getByTestId('report-discussion-input').fill(
      'Unarchiving for test cleanup'
    );
    await page.getByRole('button', { name: 'Unarchive' }).click();

    await page.getByTestId('original-post-container').getByText('Context').click();
    await expect(page.getByText(commentText, { exact: true })).toBeVisible();
    await expect(page.getByText('This comment has been archived')).toHaveCount(0);
  } finally {
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
  }
});

test('verifies links between reported comment feedback, issue, and original comment', async ({
  context,
  page,
  request,
}, testInfo) => {
  const token = await installMockAuth(context, page);
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

  const commentText = createCommentText('Test comment for feedback link verification');
  const feedbackText = 'Test feedback for link verification';

  try {
    await openFirstSeededDiscussion(page);
    await createComment(page, commentText);

    await openCommentMenu(page, commentText);
    await page.getByText('Give Feedback', { exact: true }).click();

    await expect(page.getByText('Give Feedback')).toBeVisible();
    await page.getByRole('textbox').fill(feedbackText);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Feedback submitted successfully')).toBeVisible();

    await page
      .getByText(feedbackText, { exact: true })
      .locator('..')
      .getByTestId('feedbackMenu')
      .click();
    await page.getByText('Report', { exact: true }).click();

    await expect(page.getByText('Report Feedback')).toBeVisible();
    await clickForumRulesCheckbox(page);
    await page.getByTestId('report-discussion-input').fill(
      'Testing feedback link verification'
    );
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.goto(CATS_ISSUES_URL);
    await page.getByText('Feedback on comment', { exact: true }).click();
    await expect(page.getByText('Issue Details')).toBeVisible();

    const issueUrl = page.url();

    await page.getByTestId('original-post-container').getByText('Context').click();
    await expect(page.getByText(feedbackText, { exact: true })).toBeVisible();

    await page.getByText('View in discussion', { exact: true }).click();
    await expect(page.getByText(commentText, { exact: true })).toBeVisible();

    await page.goto(issueUrl);
    await page.getByText('Archive', { exact: true }).click();
    await expect(page.getByText('Archive Feedback')).toBeVisible();
    await page.getByTestId('report-discussion-input').fill(
      'Archiving for test cleanup'
    );
    await page.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText('Content archived successfully')).toBeVisible();
  } finally {
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
  }
});
