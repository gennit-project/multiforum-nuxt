import { expect, test } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';

const DISCUSSION_LIST = '/discussions/';
const CHANNEL_VIEW = '/forums/phx_music/discussions/';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';

test.describe('Filter discussions by text', () => {
  test('filters sitewide discussions by text', async (
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
      await page.goto(DISCUSSION_LIST);
      await page.getByTestId('discussion-search-button').click();
      await page
        .getByTestId('discussion-filter-search-bar')
        .locator('input')
        .fill('topic 1');
      await page.keyboard.press('Enter');
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"] li')
      ).toHaveCount(1);
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"]')
      ).toContainText('topic 1');
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test('filters channel discussions by text', async (
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
      await page.goto(CHANNEL_VIEW);
      await page.getByTestId('discussion-search-button').click();
      await page
        .getByTestId('discussion-filter-search-bar')
        .locator('input')
        .fill('topic 3');
      await page.keyboard.press('Enter');
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"] li')
      ).toHaveCount(1);
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"]')
      ).toContainText('topic 3');
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });
});
