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

// The component reads config.serverName when calling the invite/cancel/remove
// mutations. config derives serverName from import.meta.env, which is undefined
// under Vitest, so mock it to a stable value.
vi.mock('@/config', () => ({
  config: { serverName: 'TestServer' },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (fn: any) => {
    const source = fn?.loc?.source?.body || '';
    let mutateFn = inviteServerAdmin;
    if (source.includes('CancelInviteServerAdmin')) mutateFn = cancelInviteServerAdmin;
    if (source.includes('RemoveServerAdmin')) mutateFn = removeServerAdmin;
    if (source.includes('InviteServerMod')) mutateFn = inviteServerMod;
    if (source.includes('CancelInviteServerMod')) mutateFn = cancelInviteServerMod;
    if (source.includes('RemoveServerModerator')) mutateFn = removeServerModerator;
    return {
      mutate: mutateFn,
      loading: ref(false),
      error: ref(null),
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

  const serverConfigWithPending = {
    ...serverConfig,
    PendingAdminInvites: [
      { username: 'bob', displayName: 'Bob', profilePicURL: '' },
    ],
    PendingModInvites: [
      { username: 'carol', displayName: 'Carol', profilePicURL: '' },
    ],
  };

  const mountWithPending = () =>
    mount(ServerMembershipEditor, {
      props: { serverConfig: serverConfigWithPending, onUpdated },
      global: { stubs: ['AvatarComponent', 'UsernameWithTooltip'] },
    });

  it('renders a pending admin invite with a (pending) label', () => {
    const wrapper = mountWithPending();

    expect(wrapper.text()).toContain('bob');
  });

  it('marks pending invites with a (pending) badge', () => {
    const wrapper = mountWithPending();

    expect(wrapper.text()).toContain('(pending)');
  });

  it('renders a pending mod invite', () => {
    const wrapper = mountWithPending();

    expect(wrapper.text()).toContain('carol');
  });

  it('cancels a pending admin invite', async () => {
    const wrapper = mountWithPending();

    // The first column (Server Admins) lists the pending admin invite "bob".
    const cancelButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Cancel');
    await cancelButtons[0].trigger('click');

    expect(cancelInviteServerAdmin).toHaveBeenCalledWith({
      serverName: 'TestServer',
      inviteeUsername: 'bob',
    });
  });

  it('cancels a pending mod invite', async () => {
    const wrapper = mountWithPending();

    // Second Cancel button belongs to the Server Moderators column ("carol").
    const cancelButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Cancel');
    await cancelButtons[1].trigger('click');

    expect(cancelInviteServerMod).toHaveBeenCalledWith({
      serverName: 'TestServer',
      inviteeUsername: 'carol',
    });
  });
});
