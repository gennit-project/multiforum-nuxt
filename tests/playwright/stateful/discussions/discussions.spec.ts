import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';
import { waitForGraphQL } from '../../helpers/statefulTestHelpers';

const DISCUSSION_LIST = '/discussions/';
const CHANNEL_VIEW = '/forums/phx_music/discussions/';
const CATS_FORUM = '/forums/cats/discussions';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';

const createDiscussion = async (page: Page, title: string) => {
  await page.goto('/discussions/create');
  await page.getByTestId('title-input').fill(title);
  await page.getByTestId('channel-input').click();
  await page.getByText('cats', { exact: true }).click();
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page).toHaveURL(/\/forums\/cats\/discussions\/.+/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
};

test.describe.serial('Discussion operations', () => {
  // Reset database once for all tests in this file
  test.beforeAll(async ({ request }) => {
    const { createMockJwt } = await import('../../helpers/mockAuth');
    const token = createMockJwt(MOD_EMAIL, MOD_USERNAME);
    await resetStatefulBackendData(request, token);
  });

  test('filters sitewide discussions by text', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
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

  test('filters channel discussions by text', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
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

  test('filters discussions by channel', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await page.goto(DISCUSSION_LIST, { waitUntil: 'networkidle' });
      await expect(
        page.getByRole('link', { name: 'Example topic 1' })
      ).toBeVisible({ timeout: 30_000 });

      await page.getByTestId('forum-filter-button').click();
      await page.getByTestId('forum-picker-cats').click();
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"] li')
      ).toHaveCount(1);
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"]')
      ).toContainText('Example topic 1');

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

  test('filters sitewide discussions by tag', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await page.goto(DISCUSSION_LIST, { waitUntil: 'networkidle' });
      await expect(
        page.getByRole('link', { name: 'Example topic 2' })
      ).toBeVisible({ timeout: 30_000 });

      await page.getByTestId('discussion-filter-button').click();
      await page.getByTestId('tag-filter-button').click();
      await page.getByTestId('tag-picker-newYears').click();
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"] li')
      ).toHaveCount(1);
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"]')
      ).toContainText('Example topic 2');

      await page.getByTestId('tag-picker-trivia').click();
      await expect(
        page.locator('ul[data-testid="sitewide-discussion-list"] li')
      ).toHaveCount(2);
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test('filters channel discussions by tag', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await page.goto(CHANNEL_VIEW, { waitUntil: 'networkidle' });
      await expect(
        page.getByRole('link', { name: 'Example topic 3' })
      ).toBeVisible({ timeout: 30_000 });

      await page.getByTestId('discussion-filter-button').click();
      await page.getByTestId('tag-filter-button').click();
      await page.getByTestId('tag-picker-trivia').click();
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"] li')
      ).toHaveCount(1);
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"]')
      ).toContainText('Example topic 3');

      await page.getByTestId('tag-picker-newYears').click();
      await expect(
        page.locator('ul[data-testid="channel-discussion-list"] li')
      ).toHaveCount(2);
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test('can upvote and undo upvote on own discussion', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
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

  test("can upvote another user's discussion", async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, {
      username: MOD_USERNAME,
      email: MOD_EMAIL,
    });
    const diagnostics = setupDiagnostics(page);

    try {
      await page.goto(CATS_FORUM, { waitUntil: 'networkidle' });
      const discussionLink = page.getByRole('link', { name: 'Example topic 1' });
      await expect(discussionLink).toBeVisible({ timeout: 30_000 });
      await discussionLink.click();
      // Wait for the discussion detail to load (shows as modal/panel with heading)
      await expect(page.getByRole('heading', { name: 'Example topic 1' })).toBeVisible();

      // Use last() to get the detail panel's upvote button (list shows first, detail shows second)
      const upvoteButton = page.getByTestId('upvote-discussion-button').last();
      await expect(upvoteButton).toContainText('1');
      await upvoteButton.click();
      await waitForGraphQL(page);
      await expect(upvoteButton).toContainText('2');
      await upvoteButton.click();
      await waitForGraphQL(page);
      await expect(upvoteButton).toContainText('1');
    } finally {
      await attachDiagnostics(testInfo, diagnostics);
    }
  });
});
