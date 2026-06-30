import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ServerMembershipPanel from './ServerMembershipPanel.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const RequireAuthStub = {
  template: '<div><slot name="has-auth" /></div>',
};

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = (result: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(result),
    error: ref(null),
    loading: ref(false),
    refetch: vi.fn(),
  });

  return mount(ServerMembershipPanel, {
    global: {
      stubs: {
        RequireAuth: RequireAuthStub,
        NuxtLink: { template: '<a><slot /></a>' },
        ServerMembershipEditor: true,
        ModChannelRolesEditor: true,
      },
    },
  });
};

describe('ServerMembershipPanel', () => {
  it('renders the server membership heading', () => {
    const wrapper = mountWith({
      serverConfigs: [{ DefaultServerRole: { name: 'user', description: '' } }],
    });

    expect(wrapper.text()).toContain('Server Membership');
  });

  it('links to the nested suspension sub-tabs', () => {
    const wrapper = mountWith({
      serverConfigs: [{ DefaultServerRole: { name: 'user', description: '' } }],
    });

    expect(wrapper.text()).toContain('View Suspended Users');
    expect(wrapper.text()).toContain('View Suspended Mods');
  });
});
