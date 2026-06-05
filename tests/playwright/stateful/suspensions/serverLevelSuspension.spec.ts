import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { resetStatefulBackendData } from '../../helpers/statefulBackend';
import {
  createDiagnosticsCollector,
  registerDiagnostics,
  attachDiagnostics,
  mergeDiagnostics,
} from '../../helpers/diagnostics';

const CATS_FORUM = '/forums/cats/discussions';
const CHANNEL_CREATION_FORM = '/forums/create';
const MOD_USERNAME = 'alice';
const MOD_EMAIL = 'the.rinnovator@gmail.com';
const AUTHOR_USERNAME = 'cluse';
const AUTHOR_EMAIL = 'catherine.luse@gmail.com';

const createDiscussion = async (page: Page, title: string) => {
  await page.goto(CATS_FORUM);
  await expect(page.getByText('Create Discussion', { exact: true })).toBeVisible();
  await page.getByText('Create Discussion', { exact: true }).click();
  await page.getByTestId('title-input').fill(title);
  await page.getByTestId('body-input').fill('This discussion triggers a suspension.');
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page).toHaveURL(/\/forums\/cats\/discussions\/.+/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
};

const suspendAuthor = async (page: Page, discussionTitle: string) => {
  await page.goto(CATS_FORUM);
  await expect(page.getByText(discussionTitle, { exact: true })).toBeVisible();
  await page.getByText(discussionTitle, { exact: true }).click();
  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Archive and Suspend').click();
  await expect(page.getByText('Suspend Author')).toBeVisible();
  await page
    .locator('h3:has-text("Forum rules")')
    .locator('xpath=..')
    .locator('input[type="checkbox"]')
    .first()
    .check();
  await page.locator('select').selectOption({ label: 'Two Weeks' });
  await page.getByTestId('report-discussion-input').fill(
    'Suspension for forum creation test.'
  );
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(
    page.getByText('Archived the post and suspended the author.')
  ).toBeVisible();
};

test('suspended user cannot create a forum and can create one after unsuspension', async ({
  browser,
  request,
}, testInfo) => {
  const authorDiagnostics = createDiagnosticsCollector();
  const modDiagnostics = createDiagnosticsCollector();

  const authorContext = await browser.newContext();
  const modContext = await browser.newContext();
  try {
    const authorPage = await authorContext.newPage();
    const modPage = await modContext.newPage();

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

    const triggerDiscussion = `Forum creation suspension test ${Date.now()}`;
    await createDiscussion(authorPage, triggerDiscussion);

    await suspendAuthor(modPage, triggerDiscussion);

    await authorPage.goto(CHANNEL_CREATION_FORM);
    const blockedForumName = `blocked_forum_${Date.now()}`;
    await authorPage.getByTestId('title-input').fill(blockedForumName);
    await authorPage.getByRole('button', { name: /create/i }).click();
    await expect(
      authorPage.getByText('You have an active suspension and cannot create forums.')
    ).toBeVisible();
    await expect(authorPage.getByText(/View Issue #\d+/)).toBeVisible();

    await modPage.goto('/forums/cats/edit/suspended-users');
    await expect(modPage.getByText(AUTHOR_USERNAME, { exact: true })).toBeVisible();
    await modPage.getByText('Related Issue', { exact: true }).click();
    await expect(modPage.getByText('Issue Details')).toBeVisible();
    await modPage.getByRole('button', { name: 'Unsuspend Author' }).click();
    await expect(modPage.getByText('Unsuspend Author')).toBeVisible();
    await modPage.getByTestId('report-discussion-input').fill(
      'Cleanup after forum creation test.'
    );
    await modPage.getByRole('button', { name: 'Submit' }).click();
    await expect(modPage.getByText('The author was unsuspended.')).toBeVisible();

    await authorPage.goto(CHANNEL_CREATION_FORM);
    const forumName = `testforum_${Date.now()}`;
    await authorPage.getByTestId('title-input').fill(forumName);
    await authorPage.getByRole('button', { name: /create/i }).click();
    await expect(authorPage).toHaveURL(new RegExp(`/forums/${forumName}/discussions`));
  } finally {
    await authorContext.close();
    await modContext.close();
    await attachDiagnostics(
      testInfo,
      mergeDiagnostics(authorDiagnostics, modDiagnostics)
    );
  }
});
