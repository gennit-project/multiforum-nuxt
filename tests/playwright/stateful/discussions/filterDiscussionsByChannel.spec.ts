import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';

const DISCUSSION_LIST = '/discussions/';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';
const SEARCH_TERM = 'Example topic 1';

test('filters discussions by channel', async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await page.goto(DISCUSSION_LIST, { waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: SEARCH_TERM })).toBeVisible({ timeout: 30_000 });

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
