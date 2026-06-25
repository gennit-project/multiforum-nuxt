import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import AboutAdminPage from './about.vue';
import ServerSidebar from '@/components/admin/ServerSidebar.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

describe('admin about page', () => {
  it('renders the server sidebar when the server config loads', () => {
    mockedUseQuery.mockReturnValue({
      result: ref({ serverConfigs: [{ rules: '[]', serverName: 'Test' }] }),
      error: ref(null),
    });
    const wrapper = shallowMount(AboutAdminPage);
    expect(wrapper.findComponent(ServerSidebar).exists()).toBe(true);
  });

  it('shows a fallback message when the server config fails to load', () => {
    mockedUseQuery.mockReturnValue({
      result: ref(null),
      error: ref(new Error('boom')),
    });
    const wrapper = shallowMount(AboutAdminPage);
    expect(wrapper.text()).toContain('Could not load server details.');
  });
});
