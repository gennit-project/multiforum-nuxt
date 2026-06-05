import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';

const DISCUSSION_LIST = '/discussions/';
const CHANNEL_VIEW = '/forums/phx_music/discussions/';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';
const NEW_YEARS_TITLE = 'Example topic 2';
const TRIVIA_TITLE = 'Example topic 3';

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
      await page.goto(DISCUSSION_LIST, { waitUntil: 'networkidle' });
      await expect(page.getByRole('link', { name: NEW_YEARS_TITLE })).toBeVisible({ timeout: 30_000 });

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
      await page.goto(CHANNEL_VIEW, { waitUntil: 'networkidle' });
      await expect(page.getByRole('link', { name: TRIVIA_TITLE })).toBeVisible({ timeout: 30_000 });

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
