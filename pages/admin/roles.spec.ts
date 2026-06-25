import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RoleSection from '@/components/admin/RoleSection.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const RequireAuthStub = {
  template: '<div><slot name="has-auth" /></div>',
};

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (result: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(result),
    error: ref(null),
    loading: ref(false),
    refetch: vi.fn(),
  });
  const Page = (await import('./roles.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { RequireAuth: RequireAuthStub } },
  });
};

describe('admin server roles page', () => {
  it('renders a role section for each defined default role', async () => {
    const wrapper = await mountWith({
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

  it('shows the server suspensions management section', async () => {
    const wrapper = await mountWith({
      serverConfigs: [{ DefaultServerRole: { name: 'user', description: '' } }],
    });
    expect(wrapper.text()).toContain('View Suspended Users');
  });
});
