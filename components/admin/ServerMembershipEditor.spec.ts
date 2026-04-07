import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ServerMembershipEditor from './ServerMembershipEditor.vue';

const addServerAdmin = vi.fn();
const removeServerAdmin = vi.fn();
const addServerModerator = vi.fn();
const removeServerModerator = vi.fn();
const onUpdated = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (fn: any) => {
    const source = fn?.loc?.source?.body || '';
    let mutateFn = addServerAdmin;
    if (source.includes('RemoveServerAdmin')) mutateFn = removeServerAdmin;
    if (source.includes('AddServerModerator')) mutateFn = addServerModerator;
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
    addServerAdmin.mockReset().mockResolvedValue({});
    removeServerAdmin.mockReset().mockResolvedValue({});
    addServerModerator.mockReset().mockResolvedValue({});
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

  it('adds a server admin by username', async () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig, onUpdated },
      global: {
        stubs: ['AvatarComponent', 'UsernameWithTooltip'],
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('bob');
    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');

    expect(addServerAdmin).toHaveBeenCalledWith({
      serverName: expect.any(String),
      username: 'bob',
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('adds a server moderator by mod profile display name', async () => {
    const wrapper = mount(ServerMembershipEditor, {
      props: { serverConfig, onUpdated },
      global: {
        stubs: ['AvatarComponent', 'UsernameWithTooltip'],
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[1].setValue('Mod Bob');
    const addButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Add');
    await addButtons[1].trigger('click');

    expect(addServerModerator).toHaveBeenCalledWith({
      serverName: expect.any(String),
      displayName: 'Mod Bob',
    });
    expect(onUpdated).toHaveBeenCalled();
  });
});
