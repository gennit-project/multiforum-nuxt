import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  },
};

const mountDetail = async () => {
  const result = ref(dashboardResult);
  const loading = ref(false);
  const refetch = vi.fn();

  mockedUseQuery.mockReturnValue({
    result,
    loading,
    error: ref(null),
    refetch,
  });

  const Component = (await import('./ChannelHealthDetailView.vue')).default;
  const wrapper = mount(Component, {
    props: {
      channelUniqueName: 'general',
      audienceLabel: 'Admin dashboard',
      backHref: '/admin/dashboard',
      backLabel: 'Back to server dashboard',
    },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
        ClientOnly: {
          template: '<slot /><slot name="fallback" />',
        },
      },
    },
  });

  return { wrapper, refetch };
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

describe('ChannelHealthDetailView', () => {
  it('queries dashboard data scoped to one channel', async () => {
    await mountDetail();

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        value: {
          startDate: '2026-05-27',
          endDate: '2026-06-26',
          channelUniqueNames: ['general'],
          limit: 1,
        },
      }),
      expect.objectContaining({
        fetchPolicy: 'cache-and-network',
        prefetch: false,
      })
    );
  });

  it('renders the scoped metrics and charts', async () => {
    const { wrapper } = await mountDetail();

    expect(wrapper.text()).toContain('General');
    expect(wrapper.text()).toContain('Channel health detail for the admin dashboard.');
    expect(wrapper.text()).toContain('Contributions');
    expect(wrapper.text()).toContain('15');
    expect(wrapper.text()).toContain('Issue Aging');
    expect(wrapper.html()).toContain('href="/admin/dashboard"');
    expect(wrapper.html()).toContain('href="/forums/general"');
  });

  it('refetches the scoped dashboard when refresh is clicked', async () => {
    const { wrapper, refetch } = await mountDetail();

    await wrapper.get('button').trigger('click');

    expect(refetch).toHaveBeenCalledWith({
      startDate: '2026-05-27',
      endDate: '2026-06-26',
      channelUniqueNames: ['general'],
      limit: 1,
    });
  });
});
