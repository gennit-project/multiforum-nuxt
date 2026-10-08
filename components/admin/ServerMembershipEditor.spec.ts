import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import ServerMembershipEditor from './ServerMembershipEditor.vue';
import WarningModal from '@/components/WarningModal.vue';

const inviteServerAdmin = vi.fn();
const cancelInviteServerAdmin = vi.fn();
const removeServerAdmin = vi.fn();
const inviteServerMod = vi.fn();
const cancelInviteServerMod = vi.fn();
const removeServerModerator = vi.fn();
const onUpdated = vi.fn();
// Injectable error refs: the admin column's error banner reflects any admin
// mutation error; the mod column's reflects any mod mutation error.
const mockAdminError = ref<{ message: string } | null>(null);
const mockModError = ref<{ message: string } | null>(null);

// config.serverName comes from import.meta.env (unset under vitest), so mock it
// to a stable value — the component passes config.serverName to the mutations.
vi.mock('@/config', () => ({
  config: { serverName: 'TestServer' },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (fn: any) => {
    const source = fn?.loc?.source?.body || '';
    let mutateFn = inviteServerAdmin;
    let errorRef = mockAdminError;
    if (source.includes('CancelInviteServerAdmin'))
      mutateFn = cancelInviteServerAdmin;
    if (source.includes('RemoveServerAdmin')) mutateFn = removeServerAdmin;
    if (source.includes('InviteServerMod')) {
      mutateFn = inviteServerMod;
      errorRef = mockModError;
    }
    if (source.includes('CancelInviteServerMod')) {
      mutateFn = cancelInviteServerMod;
      errorRef = mockModError;
    }
    if (source.includes('RemoveServerModerator')) {
      mutateFn = removeServerModerator;
      errorRef = mockModError;
    }
    return {
      mutate: mutateFn,
      loading: ref(false),
      error: errorRef,
      onError: vi.fn(),
    };
  },
}));

describe('ServerMembershipEditor', () => {
  beforeEach(() => {
    inviteServerAdmin
      .mockReset()
      .mockResolvedValue({ data: { inviteServerAdmin: true } });
    cancelInviteServerAdmin.mockReset().mockResolvedValue({});
    removeServerAdmin.mockReset().mockResolvedValue({});
    inviteServerMod
      .mockReset()
      .mockResolvedValue({ data: { inviteServerMod: true } });
    cancelInviteServerMod.mockReset().mockResolvedValue({});
    removeServerModerator.mockReset().mockResolvedValue({});
    onUpdated.mockReset();
    mockAdminError.value = null;
    mockModError.value = null;
  });

  const serverConfig = {
    Admins: [
      {
        username: 'alice',
        displayName: 'Alice',
        profilePicURL: '',
        commentKarma: 1,
        discussionKarma: 2,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ],
    Moderators: [
      {
        displayName: 'Mod Alice',
      },
    ],
  };

  const stubs = {
    AvatarComponent: true,
    UsernameWithTooltip: true,
    WarningModal: true,
  };

  it('renders current admins and moderators', () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig },
      global: {
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Server Admins');
    // Admin rows render through the stubbed UsernameWithTooltip.
    expect(wrapper.html()).toContain('alice');
    expect(wrapper.text()).toContain('Server Moderators');
    expect(wrapper.text()).toContain('Mod Alice');
  });

  // The account behind a mod profile is private; rows show the profile only.
  it('shows no linked account for a moderator', () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig },
      global: {
        stubs,
      },
    });

    expect(wrapper.text()).not.toMatch(/u\/|No linked user/);
  });

  it('invites a server admin by username', async () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig, onUpdated },
      global: {
        stubs,
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('bob');
    const inviteButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Invite');
    await inviteButtons[0].trigger('click');

    expect(inviteServerAdmin).toHaveBeenCalledWith({
      serverName: expect.any(String),
      inviteeUsername: 'bob',
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('invites a server moderator by username', async () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig, onUpdated },
      global: {
        stubs,
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[1].setValue('bob');
    const inviteButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Invite');
    await inviteButtons[1].trigger('click');

    expect(inviteServerMod).toHaveBeenCalledWith({
      serverName: expect.any(String),
      inviteeUsername: 'bob',
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  const mountEditor = (cfg: unknown) =>
    mount(ServerMembershipEditor, {
      props: { serverConfig: cfg, onUpdated },
      global: { stubs },
    });

  it('gives the admin invite input a distinct accessible name', () => {
    const wrapper = mountEditor(serverConfig);

    expect(wrapper.findAll('input')[0]!.attributes('aria-label')).toBe(
      'Username to invite as server admin'
    );
  });

  it('gives the moderator invite input a distinct accessible name', () => {
    const wrapper = mountEditor(serverConfig);

    expect(wrapper.findAll('input')[1]!.attributes('aria-label')).toBe(
      'Username to invite as server moderator'
    );
  });

  it('explains and disables admin management for restricted admins', () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig, canManageAdmins: false },
      global: { stubs },
    });
    const adminInput = wrapper.findAll('input')[0]!;
    const adminButtons = wrapper
      .findAll('button')
      .filter((button) => ['Invite', 'Remove'].includes(button.text()))
      .slice(0, 2);

    expect({
      help: wrapper
        .text()
        .includes(
          'Only a server super-admin can invite or remove server admins.'
        ),
      inputDisabled: adminInput.attributes('disabled') !== undefined,
      describedBy: adminInput.attributes('aria-describedby'),
      buttonsDisabled: adminButtons.map(
        (button) => button.attributes('disabled') !== undefined
      ),
    }).toEqual({
      help: true,
      inputDisabled: true,
      describedBy: 'admin-management-permission-help',
      buttonsDisabled: [true, true],
    });
  });

  // --- Remove existing members ---

  it('confirms before removing a server admin', async () => {
    const wrapper = mountEditor(serverConfig);

    const removeButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Remove');
    // First Remove belongs to the Server Admins column ("alice").
    await removeButtons[0].trigger('click');
    const callsBeforeConfirmation = removeServerAdmin.mock.calls.length;
    const modal = wrapper.findComponent(WarningModal);
    const modalState = {
      open: modal.props('open'),
      title: modal.props('title'),
      body: modal.props('body'),
    };
    modal.vm.$emit('primary-button-click');
    await flushPromises();

    expect({
      callsBeforeConfirmation,
      modalState,
      callsAfterConfirmation: removeServerAdmin.mock.calls,
      updateCount: onUpdated.mock.calls.length,
    }).toEqual({
      callsBeforeConfirmation: 0,
      modalState: {
        open: true,
        title: 'Remove server member?',
        body: 'Remove u/alice from the current server admins?',
      },
      callsAfterConfirmation: [
        [{ serverName: 'TestServer', username: 'alice' }],
      ],
      updateCount: 1,
    });
  });

  it('confirms before removing a server moderator by mod profile name', async () => {
    const wrapper = mountEditor(serverConfig);

    const removeButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Remove');
    // Second Remove belongs to the Server Moderators column ("Mod Alice").
    await removeButtons[1].trigger('click');
    const callsBeforeConfirmation = removeServerModerator.mock.calls.length;
    const modal = wrapper.findComponent(WarningModal);
    const modalBody = modal.props('body');
    modal.vm.$emit('primary-button-click');
    await flushPromises();

    expect({
      callsBeforeConfirmation,
      modalBody,
      callsAfterConfirmation: removeServerModerator.mock.calls,
    }).toEqual({
      callsBeforeConfirmation: 0,
      modalBody: 'Remove Mod Alice from the current server moderators?',
      callsAfterConfirmation: [
        [{ serverName: 'TestServer', displayName: 'Mod Alice' }],
      ],
    });
  });

  // --- Pending invites: display + cancel ---

  const serverConfigWithPending = {
    ...serverConfig,
    PendingAdminInvites: [
      { username: 'bob', displayName: 'Bob', profilePicURL: '' },
    ],
    PendingModInvites: [
      { username: 'carol', displayName: 'Carol', profilePicURL: '' },
    ],
  };

  it('marks pending invites with a (pending) badge', () => {
    const wrapper = mountEditor(serverConfigWithPending);

    expect(wrapper.text()).toContain('(pending)');
  });

  it('confirms before canceling a pending admin invite', async () => {
    const wrapper = mountEditor(serverConfigWithPending);

    const cancelButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Cancel');
    await cancelButtons[0].trigger('click');
    const callsBeforeConfirmation = cancelInviteServerAdmin.mock.calls.length;
    const modal = wrapper.findComponent(WarningModal);
    const modalBody = modal.props('body');
    modal.vm.$emit('primary-button-click');
    await flushPromises();

    expect({
      callsBeforeConfirmation,
      modalBody,
      callsAfterConfirmation: cancelInviteServerAdmin.mock.calls,
    }).toEqual({
      callsBeforeConfirmation: 0,
      modalBody: 'Cancel the pending server admin invitation for u/bob?',
      callsAfterConfirmation: [
        [{ serverName: 'TestServer', inviteeUsername: 'bob' }],
      ],
    });
  });

  it('confirms before canceling a pending mod invite', async () => {
    const wrapper = mountEditor(serverConfigWithPending);

    const cancelButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Cancel');
    await cancelButtons[1].trigger('click');
    const callsBeforeConfirmation = cancelInviteServerMod.mock.calls.length;
    const modal = wrapper.findComponent(WarningModal);
    const modalBody = modal.props('body');
    modal.vm.$emit('primary-button-click');
    await flushPromises();

    expect({
      callsBeforeConfirmation,
      modalBody,
      callsAfterConfirmation: cancelInviteServerMod.mock.calls,
    }).toEqual({
      callsBeforeConfirmation: 0,
      modalBody: 'Cancel the pending server moderator invitation for u/carol?',
      callsAfterConfirmation: [
        [{ serverName: 'TestServer', inviteeUsername: 'carol' }],
      ],
    });
  });

  // --- Error display ---

  it('shows an admin error message when an admin mutation fails', () => {
    mockAdminError.value = { message: 'That user does not exist' };
    const wrapper = mountEditor(serverConfig);

    const error = wrapper.get('#admin-invite-error');
    const input = wrapper.findAll('input')[0]!;

    expect({
      message: error.text(),
      role: error.attributes('role'),
      invalid: input.attributes('aria-invalid'),
      describedBy: input.attributes('aria-describedby'),
    }).toEqual({
      message: 'That user does not exist',
      role: 'alert',
      invalid: 'true',
      describedBy: 'admin-invite-error',
    });
  });

  it('shows a mod error message when a mod mutation fails', () => {
    mockModError.value = { message: 'That mod does not exist' };
    const wrapper = mountEditor(serverConfig);

    const error = wrapper.get('#mod-invite-error');
    const input = wrapper.findAll('input')[1]!;

    expect({
      message: error.text(),
      role: error.attributes('role'),
      invalid: input.attributes('aria-invalid'),
      describedBy: input.attributes('aria-describedby'),
    }).toEqual({
      message: 'That mod does not exist',
      role: 'alert',
      invalid: 'true',
      describedBy: 'mod-invite-error',
    });
  });

  // --- Empty states ---

  it('shows an empty state when there are no admins or invites', () => {
    const wrapper = mountEditor({ Admins: [], Moderators: [] });

    expect(wrapper.text()).toContain('No server admins configured');
  });
});
