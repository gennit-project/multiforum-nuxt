import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';

const DISCUSSION_TITLE =
  'Test discussion for link verification ' + Date.now();
const DISCUSSION_BODY =
  'This is a test discussion for verifying links.';
const ARCHIVE_REASON = 'Testing discussion link verification';

test('verifies navigation links between archived discussion, issue, and original context', async ({
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

  page.on('request', async (requestEvent) => {
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

    const operationName =
      body?.operationName ??
      body?.query?.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/)?.[2] ??
      'UnknownOperation';

    diagnostics.graphqlRequests.push({
      operationName,
      variables: body?.variables,
    });
  });

  try {
    await page.goto('/discussions/create');
    await expect(
      page.getByText("You don't have permission to see this page")
    ).toHaveCount(0);

    await page.getByTestId('title-input').fill(DISCUSSION_TITLE);
    await page.getByTestId('body-input').fill(DISCUSSION_BODY);

    const channelPicker = page.getByTestId('channel-input');
    await channelPicker.click();
    await page.getByText('cats', { exact: true }).click();
    await expect(channelPicker).toContainText('cats');
    await page.getByTestId('title-input').click();
    await expect(page.getByLabel('Type to search...')).toHaveCount(0);

    const tagPicker = page.getByTestId('tag-picker');
    await tagPicker.click();
    await page.getByText('trivia', { exact: true }).click();
    await expect(tagPicker).toContainText('trivia');

    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page).toHaveURL(/\/forums\/cats\/discussions\/.+/);
    await expect(page.getByRole('heading', { name: DISCUSSION_TITLE })).toBeVisible();

    const originalDiscussionUrl = page.url();

    await page.getByTestId('discussion-menu-button').click();
    await page.getByTestId('discussion-menu-button-item-Archive').click();
    await expect(page.getByText('Archive Discussion')).toBeVisible();
    await page
      .locator('h3:has-text("Forum rules")')
      .locator('xpath=..')
      .locator('input[type="checkbox"]')
      .first()
      .check();
    await page.getByTestId('report-discussion-input').fill(ARCHIVE_REASON);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByTestId('archived-discussion-banner')).toBeVisible();
    await expect(
      page.getByTestId('archived-discussion-banner').getByText('View related issue')
    ).toBeVisible();

    await page
      .getByTestId('archived-discussion-banner')
      .getByText('View related issue')
      .click();
    await expect(page.getByText('Issue Details')).toBeVisible();

    const issueUrl = page.url();

    await page.getByTestId('original-post-container').getByText(DISCUSSION_TITLE).click();
    await expect(page).toHaveURL(originalDiscussionUrl);
    await expect(page.getByTestId('archived-discussion-banner')).toBeVisible();

    await page.goto(issueUrl);
    await page.getByRole('button', { name: 'Unarchive' }).first().click();
    await expect(page.getByText('Unarchive Discussion')).toBeVisible();
    await page.getByRole('textbox').fill('Unarchiving for test cleanup');
    await page.getByRole('button', { name: 'Unarchive' }).click();

    await page.getByTestId('original-post-container').getByText(DISCUSSION_TITLE).click();
    await expect(page.getByTestId('archived-discussion-banner')).toHaveCount(0);
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
