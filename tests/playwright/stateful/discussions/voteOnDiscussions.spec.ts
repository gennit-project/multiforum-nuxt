import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import { setupDiagnostics, attachDiagnostics } from '../../helpers/diagnostics';

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

test('can upvote and downvote discussions', async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
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

test("user 2 can upvote another user's discussion", async ({ context, page, request }, testInfo) => {
  const token = await installMockAuth(context, page, {
    username: MOD_USERNAME,
    email: MOD_EMAIL,
  });
  await resetStatefulBackendData(request, token);
  const diagnostics = setupDiagnostics(page);

  try {
    await page.goto(CATS_FORUM);
    const discussionLink = page.getByRole('link', { name: 'Example topic 1' });
    await expect(discussionLink).toBeVisible();
    await discussionLink.click();

    const upvoteButton = page.getByTestId('upvote-discussion-button');
    await expect(upvoteButton).toContainText('1');
    await upvoteButton.click();
    await expect(upvoteButton).toContainText('2');
    await upvoteButton.click();
    await expect(upvoteButton).toContainText('1');
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
  }
});
