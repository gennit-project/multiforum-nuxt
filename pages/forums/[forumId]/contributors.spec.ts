import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ChannelContributionChart from '@/components/charts/ChannelContributionChart.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (contributors: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ getChannelContributions: contributors }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./contributors.vue')).default;
  return shallowMount(Page);
};

describe('contributors page', () => {
  it('shows the empty state when there are no contributors', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No results in the selected time period');
  });

  it('renders a contribution chart per contributor', async () => {
    const wrapper = await mountWith([
      { username: 'alice', dayData: [] },
      { username: 'bob', dayData: [] },
    ]);
    expect(wrapper.findAllComponents(ChannelContributionChart)).toHaveLength(2);
  });
});
