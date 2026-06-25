import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RoleSection from '@/components/admin/RoleSection.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (state: { result?: unknown; error?: unknown }) => {
  mockedUseQuery.mockReturnValue({
    result: ref(state.result ?? null),
    error: ref(state.error ?? null),
  });
  const Page = (await import('./roles.vue')).default;
  return shallowMount(Page);
};

describe('forum roles page', () => {
  it('renders a role section for each defined default role', async () => {
    const wrapper = await mountWith({
      result: {
        serverConfigs: [
          { DefaultServerRole: { name: 'user' }, DefaultModRole: { name: 'mod' } },
        ],
      },
    });
    expect(wrapper.findAllComponents(RoleSection)).toHaveLength(2);
  });

  it('shows a fallback message when the server config cannot load', async () => {
    const wrapper = await mountWith({ error: new Error('boom') });
    expect(wrapper.text()).toContain('Could not find the server config data.');
  });
});
