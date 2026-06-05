import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_TITLE = 'Example topic 1';
const CATS_FORUM = '/forums/cats/discussions';
const ADMIN_ISSUES = '/admin/issues';
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

const openSeededDiscussion = async (page: Page) => {
  await page.goto(CATS_FORUM, { waitUntil: 'networkidle' });
  // Use getByRole('link') to avoid strict mode violation when title appears in multiple places
  const discussionLink = page.getByRole('link', { name: DISCUSSION_TITLE });
  await expect(discussionLink).toBeVisible({ timeout: 30_000 });

  // Get the full discussion URL and navigate directly to avoid split-view issues
  const href = await discussionLink.getAttribute('href');
  if (href && href.includes('selectedDiscussionId')) {
    // Extract discussionId from query param and navigate to full detail page
    const url = new URL(href, page.url());
    const discussionId = url.searchParams.get('selectedDiscussionId');
    await page.goto(`/forums/cats/discussions/${discussionId}`, { waitUntil: 'networkidle' });
  } else if (href) {
    await page.goto(href, { waitUntil: 'networkidle' });
  } else {
    await discussionLink.click();
    await page.waitForLoadState('networkidle');
  }
};

const clickRuleCheckbox = async (page: Page, headingText: string) => {
  const rulesSection = page.locator(`h3:has-text("${headingText}")`).locator('xpath=..');

  // Check if section is collapsed (has "Show X" button) and expand it
  const showButton = rulesSection.getByRole('button', { name: `Show ${headingText}` });
  if (await showButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await showButton.click();
  }

  await rulesSection.locator('input[type="checkbox"]').first().check();
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

test.describe('Report discussion', () => {
  test('reports a discussion to the admin issues list', async (
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
      await openSeededDiscussion(page);

      await page.getByTestId('discussion-menu-button').click();
      await page.getByTestId('discussion-menu-button-item-Report').click();
      await expect(page.getByText('Report Discussion')).toBeVisible();
      await clickRuleCheckbox(page, 'Server Rules');
      await page.getByTestId('report-discussion-input').fill(
        'This is a test report for a sitewide rule violation'
      );
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(
        page.getByText('Your report was submitted successfully.')
      ).toBeVisible();

      await page.goto(ADMIN_ISSUES);
      await expect(page.getByTestId('issue-list')).toContainText(
        DISCUSSION_TITLE
      );
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test('reports a discussion to the channel issues list', async (
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
      await openSeededDiscussion(page);

      await page.getByTestId('discussion-menu-button').click();
      await page.getByTestId('discussion-menu-button-item-Report').click();
      await expect(page.getByText('Report Discussion')).toBeVisible();
      await clickRuleCheckbox(page, 'Forum rules');
      await page.getByTestId('report-discussion-input').fill(
        'This is a test report for a forum rule violation'
      );
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(
        page.getByText('Your report was submitted successfully.')
      ).toBeVisible();

      await page.goto(CHANNEL_ISSUES);
      await expect(page.getByTestId('issue-list')).toContainText(
        DISCUSSION_TITLE
      );
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });
});
