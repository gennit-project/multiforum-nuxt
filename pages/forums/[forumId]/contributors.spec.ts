import { describe, it, expect, vi, beforeEach } from 'vitest';
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
let queryVariables: null | (() => unknown) = null;

const mountWith = async (
  contributors: unknown[],
  state: { loading?: boolean; error?: unknown } = {}
) => {
  mockedUseQuery.mockImplementation(
    (_query: unknown, variables: () => unknown) => {
      queryVariables = variables;
      variables();
      return {
        result: ref({ getChannelContributions: contributors }),
        loading: ref(state.loading ?? false),
        error: ref(state.error ?? null),
      };
    }
  );
  const Page = (await import('./contributors.vue')).default;
  return shallowMount(Page);
};

describe('contributors page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryVariables = null;
  });

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

  it('shows the loading state', async () => {
    const wrapper = await mountWith([], { loading: true });

    expect(wrapper.text()).toContain('Loading contributors...');
  });

  it('shows the query error', async () => {
    const wrapper = await mountWith([], { error: { message: 'Offline' } });

    expect(wrapper.text()).toContain('Error loading contributors: Offline');
  });

  it('selects an all-time contribution range', async () => {
    const wrapper = await mountWith([]);
    const initial = queryVariables?.() as {
      startDate: string;
      endDate: string;
    };
    wrapper
      .findComponent({ name: 'IconButtonDropdown' })
      .vm.$emit('select-period', 'null');
    const allTime = queryVariables?.() as {
      startDate: string;
      endDate: string;
    };
    await wrapper.vm.$nextTick();

    expect({
      startsEarlier: allTime.startDate < initial.startDate,
      sameEnd: allTime.endDate === initial.endDate,
    }).toEqual({ startsEarlier: true, sameEnd: true });
  });

  it('ignores invalid period selections', async () => {
    const wrapper = await mountWith([]);
    const initial = queryVariables?.();
    wrapper
      .findComponent({ name: 'IconButtonDropdown' })
      .vm.$emit('select-period', 12);

    expect(queryVariables?.()).toEqual(initial);
  });
});
