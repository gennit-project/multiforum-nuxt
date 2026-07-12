import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ServerMembershipEditor from './ServerMembershipEditor.vue';

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
    if (source.includes('CancelInviteServerAdmin')) mutateFn = cancelInviteServerAdmin;
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
    };
  },
}));

describe('ServerMembershipEditor', () => {
  beforeEach(() => {
    inviteServerAdmin.mockReset().mockResolvedValue({});
    cancelInviteServerAdmin.mockReset().mockResolvedValue({});
    removeServerAdmin.mockReset().mockResolvedValue({});
    inviteServerMod.mockReset().mockResolvedValue({});
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
        User: {
          username: 'alice',
        },
      },
    ],
  };

  it('renders current admins and moderators', () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig },
      global: {
        stubs: ['AvatarComponent', 'UsernameWithTooltip'],
      },
    });

    expect(wrapper.text()).toContain('Server Admins');
    expect(wrapper.text()).toContain('alice');
    expect(wrapper.text()).toContain('Server Moderators');
    expect(wrapper.text()).toContain('Mod Alice');
  });

  it('invites a server admin by username', async () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig, onUpdated },
      global: {
        stubs: ['AvatarComponent', 'UsernameWithTooltip'],
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
        stubs: ['AvatarComponent', 'UsernameWithTooltip'],
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

  const stubs = ['AvatarComponent', 'UsernameWithTooltip'];

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

  // --- Remove existing members ---

  it('removes a server admin', async () => {
    const wrapper = mountEditor(serverConfig);

    const removeButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Remove');
    // First Remove belongs to the Server Admins column ("alice").
    await removeButtons[0].trigger('click');

    expect(removeServerAdmin).toHaveBeenCalledWith({
      serverName: 'TestServer',
      username: 'alice',
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('removes a server moderator by mod profile name', async () => {
    const wrapper = mountEditor(serverConfig);

    const removeButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Remove');
    // Second Remove belongs to the Server Moderators column ("Mod Alice").
    await removeButtons[1].trigger('click');

    expect(removeServerModerator).toHaveBeenCalledWith({
      serverName: 'TestServer',
      displayName: 'Mod Alice',
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  // --- Pending invites: display + cancel ---

  const serverConfigWithPending = {
    ...serverConfig,
    PendingAdminInvites: [{ username: 'bob', displayName: 'Bob', profilePicURL: '' }],
    PendingModInvites: [{ username: 'carol', displayName: 'Carol', profilePicURL: '' }],
  };

  it('marks pending invites with a (pending) badge', () => {
    const wrapper = mountEditor(serverConfigWithPending);

    expect(wrapper.text()).toContain('(pending)');
  });

  it('cancels a pending admin invite', async () => {
    const wrapper = mountEditor(serverConfigWithPending);

    const cancelButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Cancel');
    await cancelButtons[0].trigger('click');

    expect(cancelInviteServerAdmin).toHaveBeenCalledWith({
      serverName: 'TestServer',
      inviteeUsername: 'bob',
    });
  });

  it('cancels a pending mod invite', async () => {
    const wrapper = mountEditor(serverConfigWithPending);

    const cancelButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Cancel');
    await cancelButtons[1].trigger('click');

    expect(cancelInviteServerMod).toHaveBeenCalledWith({
      serverName: 'TestServer',
      inviteeUsername: 'carol',
    });
  });

  // --- Error display ---

  it('shows an admin error message when an admin mutation fails', () => {
    mockAdminError.value = { message: 'That user does not exist' };
    const wrapper = mountEditor(serverConfig);

    expect(wrapper.text()).toContain('That user does not exist');
  });

  it('shows a mod error message when a mod mutation fails', () => {
    mockModError.value = { message: 'That mod does not exist' };
    const wrapper = mountEditor(serverConfig);

    expect(wrapper.text()).toContain('That mod does not exist');
  });

  // --- Empty states ---

  it('shows an empty state when there are no admins or invites', () => {
    const wrapper = mountEditor({ Admins: [], Moderators: [] });

    expect(wrapper.text()).toContain('No server admins configured');
  });
});
