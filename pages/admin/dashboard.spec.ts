import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'vue-router';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseRoute = useRoute as unknown as ReturnType<typeof vi.fn>;
const mockedUseRouter = useRouter as unknown as ReturnType<typeof vi.fn>;

const dashboardResult = {
  getServerHealthDashboard: {
    startDate: '2026-05-27',
    endDate: '2026-06-26',
    generatedAt: '2026-06-26T12:00:00Z',
    summary: {
      activeChannelCount: 2,
      discussionCount: 5,
      commentCount: 12,
      eventCount: 1,
      downloadCount: 3,
      voteCount: 44,
      openIssueCount: 4,
      issueOpenedCount: 6,
      issueClosedCount: 2,
      moderationActionCount: 8,
      archivedContentCount: 1,
      lockedContentCount: 1,
      suspensionCount: 1,
      medianOpenIssueAgeDays: 5,
    },
    timeSeries: [
      {
        date: '2026-06-25',
        discussions: 2,
        comments: 6,
        events: 1,
        downloads: 1,
        issuesOpened: 1,
        moderationActions: 3,
      },
    ],
    channelHealth: [
      {
        id: 'general',
        channelUniqueName: 'general',
        displayName: 'General',
        channelIconURL: null,
        discussionCount: 4,
        commentCount: 10,
        eventCount: 1,
        downloadCount: 2,
        voteCount: 30,
        uniqueContributorCount: 6,
        openIssueCount: 3,
        issueOpenedCount: 4,
        moderationActionCount: 5,
        archivedContentCount: 1,
        lockedContentCount: 0,
        oldestOpenIssueAgeDays: 9,
        issuesPerHundredContributions: 26.6,
        activityScore: 15,
        healthLabel: 'Needs review',
      },
    ],
    issueAging: [
      { label: '<1 day', minDays: 0, maxDays: 0, count: 0 },
      { label: '8-30 days', minDays: 8, maxDays: 30, count: 3 },
    ],
    attentionItems: [
      {
        severity: 'WARNING',
        title: 'Stale open issues',
        description: 'general has 3 open issues; oldest is 9 days old.',
        channelUniqueName: 'general',
        metric: 'oldestOpenIssueAgeDays',
        value: 9,
      },
    ],
  },
};

const mountDashboard = async (
  options: {
    resultValue?: typeof dashboardResult | null;
    loading?: boolean;
    overviewResultValue?: typeof dashboardResult | null;
    channelResultValue?: typeof dashboardResult | null;
    overviewLoading?: boolean;
    channelLoading?: boolean;
  } = {}
) => {
  const getResultValue = (
    value: typeof dashboardResult | null | undefined
  ) => {
    if (value !== undefined) return value;
    return options.resultValue === undefined ? dashboardResult : options.resultValue;
  };
  const overviewResultRef = ref(
    getResultValue(options.overviewResultValue)
  );
  const channelResultRef = ref(
    getResultValue(options.channelResultValue)
  );
  const overviewLoadingRef = ref(options.overviewLoading ?? options.loading ?? false);
  const channelLoadingRef = ref(options.channelLoading ?? options.loading ?? false);
  const refetchOverview = vi.fn();
  const refetchChannelHealth = vi.fn();

  mockedUseQuery.mockReturnValueOnce({
    result: overviewResultRef,
    loading: overviewLoadingRef,
    error: ref(null),
    refetch: refetchOverview,
  });
  mockedUseQuery.mockReturnValueOnce({
    result: channelResultRef,
    loading: channelLoadingRef,
    error: ref(null),
    refetch: refetchChannelHealth,
  });
  const Page = (await import('./dashboard/index.vue')).default;
  const wrapper = mount(Page, {
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });
  return {
    wrapper,
    overviewResultRef,
    channelResultRef,
    overviewLoadingRef,
    channelLoadingRef,
    refetchOverview,
    refetchChannelHealth,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseRoute.mockReturnValue({
    query: {
      startDate: '2026-05-27',
      endDate: '2026-06-26',
    },
  });
  mockedUseRouter.mockReturnValue({
    replace: vi.fn(),
  });
});

describe('admin dashboard page', () => {
  it('renders summary metrics from the health dashboard query', async () => {
    const { wrapper } = await mountDashboard();

    expect(wrapper.text()).toContain('Server Dashboard');
    expect(wrapper.text()).toContain('Active Channels');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('Admin Open Issues');
    expect(wrapper.text()).toContain('4');
  });

  it('renders channel health issue pressure columns', async () => {
    const { wrapper } = await mountDashboard();

    expect(wrapper.text()).toContain('General');
    expect(wrapper.text()).toContain('Needs review');
    expect(wrapper.text()).toContain('Open Issues');
    expect(wrapper.text()).toContain('New Issues');
    expect(wrapper.text()).toContain('Stale Open');
    expect(wrapper.text()).toContain('Pressure');
    expect(wrapper.text()).toContain('9d');
    expect(wrapper.text()).toContain('26.6');
    expect(wrapper.html()).toContain('href="/admin/dashboard/general"');
  });

  it('updates query params when sorting the channel health table', async () => {
    const replace = vi.fn();
    mockedUseRouter.mockReturnValue({ replace });
    const { wrapper } = await mountDashboard();

    const staleHeader = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Stale Open'));
    expect(staleHeader).toBeTruthy();

    await staleHeader?.trigger('click');

    expect(replace).toHaveBeenCalledWith({
      query: {
        startDate: '2026-05-27',
        endDate: '2026-06-26',
        sort: 'oldestOpenIssueAgeDays',
        sortDirection: 'desc',
      },
    });
  });

  it('shows the initial dashboard skeleton when loading without cached data', async () => {
    const { wrapper } = await mountDashboard({
      resultValue: null,
      loading: true,
    });

    expect(wrapper.text()).toContain('Server Dashboard');
    expect(
      wrapper.find('[data-testid="dashboard-initial-loading"]').exists()
    ).toBe(true);
    expect(
      wrapper.findAll('[data-testid="channel-health-loading-row"]')
    ).toHaveLength(0);
  });

  it('renders cached channel rows immediately when loading has a current result', async () => {
    const { wrapper } = await mountDashboard({ loading: true });

    expect(wrapper.text()).toContain('General');
    expect(wrapper.text()).toContain('Needs review');
    expect(
      wrapper.find('[data-testid="dashboard-initial-loading"]').exists()
    ).toBe(false);
    expect(
      wrapper.findAll('[data-testid="channel-health-loading-row"]')
    ).toHaveLength(0);
  });

  it('keeps overview sections mounted when only sorted channel rows are loading', async () => {
    const { wrapper } = await mountDashboard({
      overviewResultValue: dashboardResult,
      channelResultValue: null,
      channelLoading: true,
    });

    expect(wrapper.text()).toContain('Active Channels');
    expect(wrapper.text()).toContain('Activity');
    expect(wrapper.text()).toContain('Issue Aging');
    expect(
      wrapper.find('[data-testid="dashboard-initial-loading"]').exists()
    ).toBe(false);
    expect(
      wrapper.findAll('[data-testid="channel-health-loading-row"]')
    ).toHaveLength(5);
  });
});
