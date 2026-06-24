import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import UserContributionChart from '@/components/charts/UserContributionChart.vue';

const h = vi.hoisted(() => ({
  // useQuery is called twice: [0] GET_USER, [1] GET_USER_CONTRIBUTIONS.
  userResult: null as unknown,
  contributionsResult: null as unknown,
  loading: null as unknown,
  index: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => {
    const i = h.index.n++;
    return i === 0
      ? { result: h.userResult }
      : { result: h.contributionsResult, loading: h.loading };
  },
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { username: 'alice' } }) }));
vi.mock('@/stores/uiStore', () => ({ useUIStore: () => ({ theme: 'light' }) }));

const mountChart = () =>
  mount(UserContributionChart, {
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        GithubContributionChart: {
          name: 'GithubContributionChart',
          props: ['darkMode', 'contributionData', 'loading', 'year', 'minYear', 'maxYear'],
          emits: ['day-select', 'year-select'],
          template: '<div class="chart" />',
        },
        ContributionChartSkeleton: true,
      },
    },
  });

const chart = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'GithubContributionChart' });

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.userResult = ref({ users: [{ createdAt: '2019-06-01T00:00:00Z' }] });
  h.contributionsResult = ref({ getUserContributions: [] });
  h.loading = ref(false);
});

describe('UserContributionChart data', () => {
  it('passes the minimum year from the account creation date', () => {
    const wrapper = mountChart();

    expect(chart(wrapper).props('minYear')).toBe(2019);
  });

  it('defaults minYear to three years ago without a creation date', () => {
    h.userResult = ref({ users: [] });
    const wrapper = mountChart();

    expect(chart(wrapper).props('minYear')).toBe(new Date().getFullYear() - 3);
  });

  it('passes through the day count', () => {
    h.contributionsResult = ref({
      getUserContributions: [{ date: '2024-01-01', count: 5, activities: [] }],
    });
    const wrapper = mountChart();

    expect(chart(wrapper).props('contributionData')[0].count).toBe(5);
  });

  it('falls back to the activity length when count is zero', () => {
    h.contributionsResult = ref({
      getUserContributions: [{ date: '2024-01-01', count: 0, activities: [{}, {}, {}] }],
    });
    const wrapper = mountChart();

    expect(chart(wrapper).props('contributionData')[0].count).toBe(3);
  });

  it('returns no contributions when the result is not an array', () => {
    h.contributionsResult = ref({ getUserContributions: 'nope' });
    const wrapper = mountChart();

    expect(chart(wrapper).props('contributionData')).toEqual([]);
  });
});

describe('UserContributionChart year selection', () => {
  it('updates the displayed year on year-select', async () => {
    const wrapper = mountChart();

    await chart(wrapper).vm.$emit('year-select', 2021);

    expect(chart(wrapper).props('year')).toBe(2021);
  });
});
