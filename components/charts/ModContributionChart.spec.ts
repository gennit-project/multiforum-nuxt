import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ModContributionChart from '@/components/charts/ModContributionChart.vue';

const h = vi.hoisted(() => ({
  // useQuery is called twice: [0] GET_MOD, [1] GET_MOD_CONTRIBUTIONS.
  modResult: null as unknown,
  contributionsResult: null as unknown,
  loading: null as unknown,
  index: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => {
    const i = h.index.n++;
    return i === 0
      ? { result: h.modResult }
      : { result: h.contributionsResult, loading: h.loading };
  },
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { modId: 'mod1' } }) }));
vi.mock('@/stores/uiStore', () => ({ useUIStore: () => ({ theme: 'light' }) }));

const mountChart = () =>
  mount(ModContributionChart, {
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
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const chart = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'GithubContributionChart' });

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.modResult = ref({ moderationProfiles: [{ createdAt: '2020-06-01T00:00:00Z' }] });
  h.contributionsResult = ref({ getModContributions: [] });
  h.loading = ref(false);
});

describe('ModContributionChart data', () => {
  it('passes the minimum year from the mod creation date', () => {
    const wrapper = mountChart();

    expect(chart(wrapper).props('minYear')).toBe(2020);
  });

  it('maps actionType onto the activity type', () => {
    h.contributionsResult = ref({
      getModContributions: [
        { date: '2024-01-01', count: 1, activities: [{ id: 'a1', actionType: 'archive', actionDescription: 'd' }] },
      ],
    });
    const wrapper = mountChart();

    expect(chart(wrapper).props('contributionData')[0].activities[0].type).toBe(
      'archive'
    );
  });

  it('falls back to the activity length when count is missing', () => {
    h.contributionsResult = ref({
      getModContributions: [{ date: '2024-01-01', activities: [{ id: 'a1' }, { id: 'a2' }] }],
    });
    const wrapper = mountChart();

    expect(chart(wrapper).props('contributionData')[0].count).toBe(2);
  });

  it('returns no contributions when the result is not an array', () => {
    h.contributionsResult = ref({ getModContributions: null });
    const wrapper = mountChart();

    expect(chart(wrapper).props('contributionData')).toEqual([]);
  });
});

describe('ModContributionChart selected day', () => {
  it('shows the empty-activity message for a zero-count day', async () => {
    const wrapper = mountChart();

    await chart(wrapper).vm.$emit('day-select', { date: '2024-01-01', count: 0, activities: [] });

    expect(wrapper.text()).toContain('No moderation activity');
  });

  it('shows the activity count for a non-zero day', async () => {
    const wrapper = mountChart();

    await chart(wrapper).vm.$emit('day-select', {
      date: '2024-01-01',
      count: 2,
      activities: [],
    });

    expect(wrapper.text()).toContain('2 activities on this day');
  });

  it('lists activity details', async () => {
    const wrapper = mountChart();

    await chart(wrapper).vm.$emit('day-select', {
      date: '2024-01-01',
      count: 1,
      activities: [{ id: 'a1', actionType: 'archive', actionDescription: 'Archived a post' }],
    });

    expect(wrapper.text()).toContain('Archived a post');
  });
});

describe('ModContributionChart year selection', () => {
  it('updates the displayed year on year-select', async () => {
    const wrapper = mountChart();

    await chart(wrapper).vm.$emit('year-select', 2022);

    expect(chart(wrapper).props('year')).toBe(2022);
  });
});
