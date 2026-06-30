import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RoleSection from '@/components/admin/RoleSection.vue';
import RolesSettingsPage from './roles.vue';

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

  return mount(RolesSettingsPage, {
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

describe('admin roles settings page', () => {
  it('renders a role section for each defined default role', () => {
    const wrapper = mountWith({
      serverConfigs: [
        {
          DefaultServerRole: { name: 'user', description: '' },
          DefaultModRole: { name: 'mod', description: '' },
          DefaultSuspendedRole: { name: 'suspended', description: '' },
        },
      ],
    });

    expect(wrapper.findAllComponents(RoleSection)).toHaveLength(3);
  });

  it('shows the server suspensions management section', () => {
    const wrapper = mountWith({
      serverConfigs: [{ DefaultServerRole: { name: 'user', description: '' } }],
    });

    expect(wrapper.text()).toContain('View Suspended Users');
  });
});
