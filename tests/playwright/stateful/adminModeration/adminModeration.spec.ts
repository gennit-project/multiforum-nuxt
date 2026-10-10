import { expect, test, type Page } from '@playwright/test';
import { installMockAuth } from '../../helpers/mockAuth';
import { expectNoAxeViolations } from '../../helpers/axe';
import { seedAdminModerationScenario } from '../../helpers/statefulAdminModeration';

const ADMIN_USERNAME = 'cluse';
const ADMIN_EMAIL = 'catherine.luse@gmail.com';
const CHANNEL_UNIQUE_NAME = 'e2e_admin_moderation';
const TARGET_MOD_NAME = 'E2E Target Mod';
const TARGET_MOD_ACTIVITY_COMMENT =
  'Target moderator activity comment for suspension workflow.';

const waitForGraphQLOperation = (page: Page, operationName: string) =>
  page.waitForResponse((response) => {
    if (!response.url().endsWith('/graphql')) return false;
    const body = response.request().postDataJSON();
    return body?.operationName === operationName;
  });

test.describe('real backend admin moderation workflows', () => {
  test.beforeEach(() => {
    seedAdminModerationScenario();
  });

  test('follows a server user suspension to its issue and unsuspends the user', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
    });

    await page.goto('/admin/suspensions/suspended-users', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText('e2e_suspended_user').first()).toBeVisible();
    await expect(page.getByText(/Suspended indefinitely/i)).toBeVisible();
    await page.getByRole('link', { name: 'Related Issue' }).click();
    await expect(
      page.getByText('Reported discussion attached to a server suspension')
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Unsuspend Author' })
      .first()
      .click();
    const unsuspendResponsePromise = waitForGraphQLOperation(
      page,
      'unsuspendUser'
    );
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Submit' })
      .click();
    const unsuspendResponse = await unsuspendResponsePromise;
    expect(unsuspendResponse.ok()).toBe(true);
    expect((await unsuspendResponse.json()).errors).toBeUndefined();

    await page.goto('/admin/suspensions/suspended-users');
    await expect(
      page.getByText(/no active server-scoped user suspensions/i)
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('follows a server mod suspension to its issue and unsuspends the mod', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
    });

    await page.goto('/admin/suspensions/suspended-mods', {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.getByText('E2E Suspended Mod (e2e_suspended_mod_user)')
    ).toBeVisible();
    await page.getByRole('link', { name: 'Related Issue' }).click();
    await expect(
      page.getByText('Reported comment authored through a moderation profile.')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Unsuspend Mod' }).first().click();
    const unsuspendResponsePromise = waitForGraphQLOperation(
      page,
      'unsuspendMod'
    );
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Submit' })
      .click();
    const unsuspendResponse = await unsuspendResponsePromise;
    expect(unsuspendResponse.ok()).toBe(true);
    expect((await unsuspendResponse.json()).errors).toBeUndefined();

    await page.goto('/admin/suspensions/suspended-mods');
    await expect(
      page.getByText(/no active server-scoped mod suspensions/i)
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('suspends an issue target mod from their activity-feed comment menu', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
    });

    await page.goto(`/forums/${CHANNEL_UNIQUE_NAME}/issues/9103`, {
      waitUntil: 'domcontentloaded',
    });
    const activityItem = page
      .getByRole('listitem')
      .filter({ hasText: TARGET_MOD_ACTIVITY_COMMENT });
    await expect(activityItem).toBeVisible();

    await activityItem
      .getByRole('button', { name: 'Comment actions' })
      .click();
    await page.getByRole('menuitem', { name: 'Suspend Mod' }).click();

    await expect(
      page.getByRole('heading', { name: 'Suspend Mod' }).last()
    ).toBeVisible();
    const submitSuspension = page
      .getByRole('button', { name: 'Submit' })
      .last();
    await expect(submitSuspension).toBeVisible();

    const suspendResponsePromise = waitForGraphQLOperation(page, 'suspendMod');
    await submitSuspension.click();
    const suspendResponse = await suspendResponsePromise;
    expect(suspendResponse.ok()).toBe(true);
    expect((await suspendResponse.json()).errors).toBeUndefined();

    await page.goto(
      `/forums/${CHANNEL_UNIQUE_NAME}/edit/suspended-mods`,
      { waitUntil: 'domcontentloaded' }
    );
    await expect(
      page.getByText(`${TARGET_MOD_NAME} (e2e_target_mod_user)`)
    ).toBeVisible();
    await page.getByRole('link', { name: 'Related Issue' }).click();
    await expect(
      page.getByText('Channel report against E2E Target Mod')
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('validates, invites, cancels, and removes server members', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
    });

    await page.goto('/admin/suspensions/server-membership', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText('e2e_pending_admin')).toBeVisible();
    await expect(page.getByText('e2e_pending_mod')).toBeVisible();

    const modInput = page.getByRole('textbox', {
      name: 'Username to invite as server moderator',
    });
    await modInput.fill('e2e_missing_user');
    await page.getByRole('button', { name: 'Invite' }).nth(1).click();
    await expect(page.getByRole('alert')).toContainText(
      'No user exists with username "e2e_missing_user".'
    );
    await expect(modInput).toHaveValue('e2e_missing_user');

    await modInput.fill('e2e_valid_invitee');
    await page.getByRole('button', { name: 'Invite' }).nth(1).click();
    await expect(page.getByTestId('pending-mod-invite-list')).toContainText(
      'e2e_valid_invitee'
    );
    await page
      .getByTestId('pending-mod-invite-list')
      .getByText('e2e_valid_invitee', { exact: true })
      .locator('..')
      .locator('..')
      .getByRole('button', { name: 'Cancel' })
      .click();
    await page
      .getByRole('dialog', { name: 'Cancel invitation?' })
      .getByRole('button', { name: 'Cancel invitation' })
      .click();
    await expect(page.getByTestId('pending-mod-invite-list')).not.toContainText(
      'e2e_valid_invitee'
    );

    await page
      .getByTestId('current-mod-list')
      .getByRole('button', { name: 'Remove' })
      .click();
    await page
      .getByRole('dialog', { name: 'Remove server member?' })
      .getByRole('button', { name: 'Remove member' })
      .click();
    await expect(page.getByText('E2E Current Mod')).toBeHidden();

    await page
      .getByTestId('current-admin-list')
      .getByRole('button', { name: 'Remove' })
      .last()
      .click();
    await page
      .getByRole('dialog', { name: 'Remove server member?' })
      .getByRole('button', { name: 'Remove member' })
      .click();
    await expect(page.getByText('e2e_removable_admin')).toBeHidden();
    await expectNoAxeViolations(page);
  });
});
