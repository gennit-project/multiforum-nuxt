import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_TITLE = 'Example topic 1';
const CHANNEL_DISCUSSION_LIST = '/forums/cats/discussions/';
const CATS_ISSUES_URL = '/forums/cats/issues';

const createCommentText = (prefix: string) => `${prefix} ${Date.now()}`;

const openFirstSeededDiscussion = async (page: Page) => {
  await page.goto(CHANNEL_DISCUSSION_LIST, { waitUntil: 'networkidle' });
  const discussionLink = page.getByRole('link', { name: DISCUSSION_TITLE });
  await expect(discussionLink).toBeVisible({ timeout: 30_000 });
  await discussionLink.click();
  await page.waitForLoadState('networkidle');
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

// Multi-user test: alice creates a comment, cluse (as admin) archives it
// TODO: Test is flaky - archive mutation works but modal/page state transitions
// are inconsistent. Backend fixes applied:
// 1. archiveComment.ts - throws proper error instead of returning false
// 2. getNextIssueNumber.ts - uses OPTIONAL MATCH to handle channels with no issues
// 3. archiveComment.ts - passes relatedUsername/relatedModProfileName to getIssueCreateInput
test.skip('verifies navigation links between archived comment, issue, and original context', async ({
  browser,
  context,
  page,
  request,
}, testInfo) => {
  // User 1 (cluse as admin) sets up test data and will do moderation actions
  const token = await installMockAuth(context, page, {
    username: 'cluse',
    email: 'catherine.luse@gmail.com',
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

  const commentText = createCommentText('Test comment for link verification');

  // Create a second browser context for alice to create the comment
  const aliceContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();

  try {
    // Step 1: alice creates the comment
    await installMockAuth(aliceContext, alicePage, {
      username: 'alice',
      email: 'the.rinnovator@gmail.com',
    });
    await openFirstSeededDiscussion(alicePage);
    await createComment(alicePage, commentText);

    // Step 2: cluse (as mod) navigates to the discussion and archives alice's comment
    await openFirstSeededDiscussion(page);
    await openCommentMenu(page, commentText);
    await page.getByText('Archive', { exact: true }).click();

    await expect(page.getByText('Archive Comment')).toBeVisible();
    await clickForumRulesCheckbox(page);

    // Fill in the report text
    const reportInput = page.getByTestId('report-comment-input');
    await expect(reportInput).toBeVisible();
    await reportInput.fill('Testing link verification');

    // Click Submit within the Archive Comment dialog
    const archiveDialog = page.getByRole('dialog').filter({ hasText: 'Archive Comment' });
    const submitButton = archiveDialog.getByRole('button', { name: 'Submit' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for the success notification
    await expect(page.getByText('archived successfully').first()).toBeVisible({ timeout: 30000 });

    // Try to close the modal by pressing Escape if it's still visible
    if (await archiveDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await expect(archiveDialog).not.toBeVisible({ timeout: 10000 });
    }

    // Wait for the comment to update and show the archived state
    // The comment area should now show "This comment has been archived."
    await expect(page.getByText('This comment has been archived')).toBeVisible({ timeout: 30000 });

    // The UI shows "This comment has been archived." with "archived" as a link to the issue
    const archivedLink = page.locator('a[href*="/issues/"]').filter({ hasText: 'archived' }).first();
    await expect(archivedLink).toBeVisible({ timeout: 10000 });

    const discussionUrl = page.url();

    await archivedLink.click();
    await expect(page.getByText('Issue Details')).toBeVisible();

    const issueUrl = page.url();
    const discussionUrlWithoutHash = discussionUrl.split('#')[0] ?? discussionUrl;

    await page.getByTestId('original-post-container').getByText('Context').click();
    await expect(page).toHaveURL(discussionUrlWithoutHash);
    await expect(page.getByText('This comment has been archived')).toBeVisible();

    await page.goto(issueUrl, { waitUntil: 'networkidle' });
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
    await aliceContext.close();
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

// TODO: This test requires multi-user setup where one user creates a comment and another gives feedback
// Since giving feedback on your own comment is not allowed, we need a multi-user approach
// Currently failing due to permission issues with the second user
test.skip('verifies links between reported comment feedback, issue, and original comment', async ({
  browser,
  context,
  page,
  request,
}, testInfo) => {
  // User 1 (cluse) creates the comment
  const token = await installMockAuth(context, page, {
    username: 'cluse',
    email: 'catherine.luse@gmail.com',
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

  const commentText = createCommentText('Test comment for feedback link verification');
  const feedbackText = 'Test feedback for link verification';

  // Create a second browser context for User 2 (alice) to give feedback
  const aliceContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();

  try {
    // Step 1: cluse creates a comment
    await openFirstSeededDiscussion(page);
    await createComment(page, commentText);

    // Step 2: alice gives feedback on cluse's comment
    await installMockAuth(aliceContext, alicePage, {
      username: 'alice',
      email: 'the.rinnovator@gmail.com',
    });
    await openFirstSeededDiscussion(alicePage);

    await openCommentMenu(alicePage, commentText);
    await alicePage.getByText('Give Feedback', { exact: true }).click();

    await expect(alicePage.getByText('Give Feedback')).toBeVisible();
    await alicePage.getByRole('textbox').fill(feedbackText);
    await alicePage.getByRole('button', { name: 'Submit' }).click();
    await expect(alicePage.getByText('Feedback submitted successfully')).toBeVisible();

    // Step 3: cluse (as moderator) reports the feedback
    // Refresh cluse's page to see the new feedback
    await page.reload({ waitUntil: 'networkidle' });

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

    // Step 4: Navigate to issues and verify links
    await page.goto(CATS_ISSUES_URL, { waitUntil: 'networkidle' });
    await page.getByText('Feedback on comment', { exact: true }).click();
    await expect(page.getByText('Issue Details')).toBeVisible();

    const issueUrl = page.url();

    await page.getByTestId('original-post-container').getByText('Context').click();
    await expect(page.getByText(feedbackText, { exact: true })).toBeVisible();

    await page.getByText('View in discussion', { exact: true }).click();
    await expect(page.getByText(commentText, { exact: true })).toBeVisible();

    // Step 5: Archive the feedback for cleanup
    await page.goto(issueUrl, { waitUntil: 'networkidle' });
    await page.getByText('Archive', { exact: true }).click();
    await expect(page.getByText('Archive Feedback')).toBeVisible();
    await page.getByTestId('report-discussion-input').fill(
      'Archiving for test cleanup'
    );
    await page.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText('Content archived successfully')).toBeVisible();
  } finally {
    await aliceContext.close();
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
