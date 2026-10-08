import { expect, test } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import {
  buildBasicUser,
  buildServerPermissionsConfig,
} from '../../helpers/graphqlFixtures';
import { expectNoAxeViolations } from '../../helpers/axe';
import type { GraphQLHandlers } from '../../helpers/mockGraphql';

const TEST_USER = 'cluse';

type MembershipState = {
  admins: string[];
  moderators: string[];
  pendingAdminInvites: string[];
  pendingModInvites: string[];
};

const buildUser = (username: string) =>
  buildBasicUser({
    username,
    displayName: username.replaceAll('_', ' '),
    profilePicURL: '',
  });

const buildMembershipConfig = (state: MembershipState) =>
  buildServerPermissionsConfig({
    serverName: 'Playwright Test Server',
    SuperAdmins: [buildUser(TEST_USER)],
    Admins: state.admins.map(buildUser),
    Moderators: state.moderators.map((displayName) => ({
      __typename: 'ModerationProfile',
      displayName,
    })),
    PendingAdminInvites: state.pendingAdminInvites.map(buildUser),
    PendingModInvites: state.pendingModInvites.map(buildUser),
  });

const installMembershipHandlers = (
  state: MembershipState
): GraphQLHandlers => ({
  ...createBaseHandlers({ username: TEST_USER }),
  getServerConfig: () => ({
    data: { serverConfigs: [buildMembershipConfig(state)] },
  }),
  GetModChannelRoles: () => ({ data: { modChannelRoles: [] } }),
  InviteServerAdmin: ({ body }) => {
    const username = String(body.variables?.inviteeUsername ?? '');
    if (username.startsWith('missing')) {
      return {
        errors: [{ message: `No user exists with username "${username}".` }],
      };
    }
    state.pendingAdminInvites.push(username);
    return { data: { inviteServerAdmin: true } };
  },
  InviteServerMod: ({ body }) => {
    const username = String(body.variables?.inviteeUsername ?? '');
    if (username.startsWith('missing')) {
      return {
        errors: [{ message: `No user exists with username "${username}".` }],
      };
    }
    state.pendingModInvites.push(username);
    return { data: { inviteServerMod: true } };
  },
  CancelInviteServerAdmin: ({ body }) => {
    const username = String(body.variables?.inviteeUsername ?? '');
    state.pendingAdminInvites = state.pendingAdminInvites.filter(
      (pending) => pending !== username
    );
    return { data: { cancelInviteServerAdmin: true } };
  },
  CancelInviteServerMod: ({ body }) => {
    const username = String(body.variables?.inviteeUsername ?? '');
    state.pendingModInvites = state.pendingModInvites.filter(
      (pending) => pending !== username
    );
    return { data: { cancelInviteServerMod: true } };
  },
  RemoveServerAdmin: ({ body }) => {
    const username = String(body.variables?.username ?? '');
    state.admins = state.admins.filter((admin) => admin !== username);
    return {
      data: {
        updateServerConfigs: {
          serverConfigs: [buildMembershipConfig(state)],
        },
      },
    };
  },
  RemoveServerModerator: ({ body }) => {
    const displayName = String(body.variables?.displayName ?? '');
    state.moderators = state.moderators.filter(
      (moderator) => moderator !== displayName
    );
    return {
      data: {
        updateServerConfigs: {
          serverConfigs: [buildMembershipConfig(state)],
        },
      },
    };
  },
});

test('renders populated membership sections as bounded scrollable lists', async ({
  page,
  setupMockedPage,
}) => {
  const state: MembershipState = {
    admins: Array.from({ length: 16 }, (_, index) => `admin_${index + 1}`),
    moderators: Array.from(
      { length: 16 },
      (_, index) => `Moderator ${index + 1}`
    ),
    pendingAdminInvites: ['pending_admin_1', 'pending_admin_2'],
    pendingModInvites: ['pending_mod_1', 'pending_mod_2'],
  };
  await setupMockedPage({
    username: TEST_USER,
    handlers: installMembershipHandlers(state),
  });

  await page.goto('/admin/suspensions/server-membership', {
    waitUntil: 'domcontentloaded',
  });

  const currentAdmins = page.getByTestId('current-admin-list');
  const currentMods = page.getByTestId('current-mod-list');
  await expect(currentAdmins).toContainText('admin 16');
  await expect(currentMods).toContainText('Moderator 16');
  await expect(page.getByTestId('pending-admin-invite-list')).toBeVisible();
  await expect(page.getByTestId('pending-mod-invite-list')).toBeVisible();
  await expect
    .poll(() =>
      currentAdmins.evaluate((element) => ({
        overflowY: getComputedStyle(element).overflowY,
        isScrollable: element.scrollHeight > element.clientHeight,
      }))
    )
    .toEqual({ overflowY: 'auto', isScrollable: true });
  await expect
    .poll(() =>
      currentMods.evaluate((element) => ({
        overflowY: getComputedStyle(element).overflowY,
        isScrollable: element.scrollHeight > element.clientHeight,
      }))
    )
    .toEqual({ overflowY: 'auto', isScrollable: true });
  await expectNoAxeViolations(page);
});

test('shows accessible validation errors for unknown admin and moderator usernames', async ({
  page,
  setupMockedPage,
}) => {
  const state: MembershipState = {
    admins: [TEST_USER],
    moderators: [],
    pendingAdminInvites: [],
    pendingModInvites: [],
  };
  const { diagnostics } = await setupMockedPage({
    username: TEST_USER,
    handlers: installMembershipHandlers(state),
  });
  await page.goto('/admin/suspensions/server-membership', {
    waitUntil: 'domcontentloaded',
  });

  const adminInput = page.getByRole('textbox', {
    name: 'Username to invite as server admin',
  });
  await adminInput.fill('missing_admin');
  await page.getByRole('button', { name: 'Invite' }).first().click();
  await expect(page.getByRole('alert')).toContainText(
    'No user exists with username "missing_admin".'
  );
  await expect(adminInput).toHaveValue('missing_admin');
  await expect(adminInput).toHaveAttribute('aria-invalid', 'true');

  const modInput = page.getByRole('textbox', {
    name: 'Username to invite as server moderator',
  });
  await modInput.fill('missing_mod');
  await page.getByRole('button', { name: 'Invite' }).nth(1).click();
  await expect(page.getByRole('alert').last()).toContainText(
    'No user exists with username "missing_mod".'
  );
  await expect(modInput).toHaveValue('missing_mod');
  await expect(modInput).toHaveAttribute('aria-invalid', 'true');
  await expect.poll(() => diagnostics.pageErrors).toEqual([]);
  await expectNoAxeViolations(page);
});

test('invites, cancels, and removes members through confirmed state changes', async ({
  page,
  setupMockedPage,
}) => {
  const state: MembershipState = {
    admins: [TEST_USER, 'removable_admin'],
    moderators: ['Mod Alice'],
    pendingAdminInvites: ['pending_admin'],
    pendingModInvites: ['pending_mod'],
  };
  await setupMockedPage({
    username: TEST_USER,
    handlers: installMembershipHandlers(state),
  });
  await page.goto('/admin/suspensions/server-membership', {
    waitUntil: 'domcontentloaded',
  });

  const modInput = page.getByRole('textbox', {
    name: 'Username to invite as server moderator',
  });
  await modInput.fill('new_mod');
  await page.getByRole('button', { name: 'Invite' }).nth(1).click();
  await expect(page.getByTestId('pending-mod-invite-list')).toContainText(
    'new_mod'
  );

  await page
    .getByTestId('pending-mod-invite-list')
    .getByRole('button', { name: 'Cancel' })
    .last()
    .click();
  const cancelDialog = page.getByRole('dialog', {
    name: 'Cancel invitation?',
  });
  await expect(cancelDialog).toContainText(
    'Cancel the pending server moderator invitation for u/new_mod?'
  );
  await cancelDialog.getByRole('button', { name: 'Cancel invitation' }).click();
  await expect(page.getByTestId('pending-mod-invite-list')).not.toContainText(
    'new_mod'
  );

  await page
    .getByTestId('current-mod-list')
    .getByRole('button', { name: 'Remove' })
    .click();
  const removeDialog = page.getByRole('dialog', {
    name: 'Remove server member?',
  });
  await expect(removeDialog).toContainText(
    'Remove Mod Alice from the current server moderators?'
  );
  await removeDialog.getByRole('button', { name: 'Remove member' }).click();
  await expect(page.getByTestId('current-mod-list')).toBeHidden();
  await expect(page.getByText('No server moderators configured.')).toBeHidden();
  await expectNoAxeViolations(page);
});
