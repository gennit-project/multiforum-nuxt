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
  } = {}
) => {
  const resultRef = ref(
    options.resultValue === undefined ? dashboardResult : options.resultValue
  );
  const loadingRef = ref(options.loading || false);
  const refetch = vi.fn();

  mockedUseQuery.mockReturnValue({
    result: resultRef,
    loading: loadingRef,
    error: ref(null),
    refetch,
  });
  const Page = (await import('./dashboard.vue')).default;
  const wrapper = mount(Page, {
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  });
  return { wrapper, resultRef, loadingRef, refetch };
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
});
