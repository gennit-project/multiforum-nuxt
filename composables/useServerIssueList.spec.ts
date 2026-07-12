import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h, nextTick, ref, reactive } from 'vue';
import { mount } from '@vue/test-utils';

const hState = vi.hoisted(() => ({
  route: {
    params: { forumId: 'cats' as string | undefined },
    query: {} as Record<string, unknown>,
    path: '/admin/issues',
  },
  router: { replace: vi.fn() },
  isAuthenticated: null as unknown as { value: boolean },
  selectedIssueNumber: null as unknown as { value: number | null },
  setSelectedIssueSelection: vi.fn(),
  clearSelectedIssueSelection: vi.fn(),
  refetch: vi.fn(),
  queryResult: null as unknown as {
    value: { getSiteWideIssueList: { issues: Array<{ id: string }> } };
  },
  queryLoading: null as unknown as { value: boolean },
  queryError: null as unknown as { value: Error | null },
  queryCalls: [] as Array<{
    variables: { value: Record<string, unknown> };
    options: Record<string, unknown>;
  }>,
}));

hState.isAuthenticated = ref(true);
hState.selectedIssueNumber = ref<number | null>(null);
hState.queryResult = ref({
  getSiteWideIssueList: { issues: [{ id: 'issue-1' }] },
});
hState.queryLoading = ref(false);
hState.queryError = ref<Error | null>(null);

const route = reactive(hState.route);

vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => hState.router,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (
    _doc: unknown,
    variables: { value: Record<string, unknown> },
    options: Record<string, unknown>
  ) => {
    hState.queryCalls.push({ variables, options });
    return {
      result: hState.queryResult,
      error: hState.queryError,
      loading: hState.queryLoading,
      refetch: hState.refetch,
    };
  },
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => hState.isAuthenticated,
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    selectedIssueNumber: hState.selectedIssueNumber,
    setSelectedIssueSelection: hState.setSelectedIssueSelection,
    clearSelectedIssueSelection: hState.clearSelectedIssueSelection,
  }),
}));

vi.mock('pinia', () => ({
  storeToRefs: (store: { selectedIssueNumber: typeof hState.selectedIssueNumber }) => ({
    selectedIssueNumber: store.selectedIssueNumber,
  }),
}));

vi.mock('@/utils', () => ({
  getChannelLabel: (channels: string[]) =>
    channels.length ? channels.join(', ') : 'All Forums',
}));

vi.mock('@/utils/issueSortOptions', () => ({
  issueSortValues: {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    MOST_REPORTS: 'mostReports',
  },
  defaultIssueSort: 'newest',
  getIssueSortFromQuery: (query: Record<string, unknown>) => {
    return query.sort === 'oldest' || query.sort === 'mostReports'
      ? String(query.sort)
      : 'newest';
  },
  getIssueSortLabel: (value: string) => `label:${value}`,
}));

vi.mock('@/utils/routerUtils', () => ({
  updateFilters: vi.fn(),
}));

const mountComposable = async (options: {
  isOpen: boolean;
  scopedToForum?: boolean;
}) => {
  const { useServerIssueList } = await import('./useServerIssueList');
  let api!: ReturnType<typeof useServerIssueList>;

  const wrapper = mount(
    defineComponent({
      setup() {
        api = useServerIssueList(options);
        return () => h('div');
      },
    })
  );

  return { wrapper, api };
};

beforeEach(() => {
  vi.clearAllMocks();
  route.params = { forumId: 'cats' };
  route.query = {};
  route.path = '/admin/issues';
  hState.isAuthenticated.value = true;
  hState.selectedIssueNumber.value = null;
  hState.queryResult.value = {
    getSiteWideIssueList: { issues: [{ id: 'issue-1' }] },
  };
  hState.queryLoading.value = false;
  hState.queryError.value = null;
  hState.queryCalls = [];
});

describe('useServerIssueList', () => {
  it('uses the forum id and cache-and-network fetches in forum scope', async () => {
    route.query = {
      channels: ['dogs'],
      showOnlyServerRuleViolations: 'true',
      filterCreatedByMe: 'true',
    };

    const { wrapper } = await mountComposable({
      isOpen: true,
      scopedToForum: true,
    });
    const firstCall = hState.queryCalls[0]!;
    wrapper.unmount();

    expect({
      variables: firstCall.variables.value,
      fetchPolicy: firstCall.options.fetchPolicy,
    }).toEqual({
      variables: {
        searchInput: '',
        selectedChannels: ['cats'],
        startDate: null,
        endDate: null,
        showOnlyServerRuleViolations: false,
        isOpen: true,
        filterCreatedByMe: true,
        filterIAmOP: false,
        filterIReported: false,
        options: { sort: 'newest' },
      },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('drops involvement filters from query variables when the viewer is unauthenticated', async () => {
    hState.isAuthenticated.value = false;
    route.query = {
      filterCreatedByMe: 'true',
      filterIAmOP: 'true',
      filterIReported: 'true',
    };

    const { wrapper } = await mountComposable({ isOpen: false });
    const firstCall = hState.queryCalls[0]!;
    wrapper.unmount();

    expect(firstCall.variables.value).toMatchObject({
      filterCreatedByMe: false,
      filterIAmOP: false,
      filterIReported: false,
      isOpen: false,
      selectedChannels: [],
      showOnlyServerRuleViolations: true,
    });
  });

  it('syncs route query changes back into state and refetches', async () => {
    const { wrapper, api } = await mountComposable({ isOpen: true });

    route.query = {
      channels: ['cats', 'dogs'],
      searchInput: 'spam',
      sort: 'oldest',
      filterIReported: 'true',
    };
    await nextTick();

    expect({
      selectedChannels: api.selectedChannels.value,
      searchInput: api.searchInput.value,
      selectedSort: api.selectedSort.value,
      filterIReported: api.filterIReported.value,
      refetchVariables: hState.refetch.mock.calls.at(-1)?.[0],
    }).toEqual({
      selectedChannels: ['cats', 'dogs'],
      searchInput: 'spam',
      selectedSort: 'oldest',
      filterIReported: true,
      refetchVariables: {
        searchInput: 'spam',
        selectedChannels: ['cats', 'dogs'],
        startDate: null,
        endDate: null,
        showOnlyServerRuleViolations: true,
        isOpen: true,
        filterCreatedByMe: false,
        filterIAmOP: false,
        filterIReported: true,
        options: { sort: 'oldest' },
      },
    });

    wrapper.unmount();
  });

  it('clears the selected issue when the forum changes in forum scope', async () => {
    const { wrapper } = await mountComposable({
      isOpen: true,
      scopedToForum: true,
    });

    route.params = { forumId: 'dogs' };
    await nextTick();
    wrapper.unmount();

    expect(hState.clearSelectedIssueSelection).toHaveBeenCalledTimes(1);
  });

  it('delegates filter updates and issue selection through the shared helpers', async () => {
    const { updateFilters } = await import('@/utils/routerUtils');
    const { wrapper, api } = await mountComposable({ isOpen: true });

    api.updateSearchInput('abuse');
    api.updateSort('mostReports');
    api.updateShowOnlyServerRuleViolations(false);
    api.toggleSelectedChannel('cats');
    api.updateInvolvementFilter({ key: 'filterCreatedByMe', value: true });
    api.handleSelectIssue({
      issueNumber: 7,
      title: 'Needs review',
      channelId: 'cats',
    });
    wrapper.unmount();

    expect({
      searchCall: (updateFilters as ReturnType<typeof vi.fn>).mock.calls[0]?.[0],
      sortCall: (updateFilters as ReturnType<typeof vi.fn>).mock.calls[1]?.[0],
      ruleCall: (updateFilters as ReturnType<typeof vi.fn>).mock.calls[2]?.[0],
      channelCall: (updateFilters as ReturnType<typeof vi.fn>).mock.calls[3]?.[0],
      involvementCall: (updateFilters as ReturnType<typeof vi.fn>).mock.calls[4]?.[0],
      selectionCall: hState.setSelectedIssueSelection.mock.calls[0]?.[0],
    }).toEqual({
      searchCall: {
        router: hState.router,
        route,
        params: { searchInput: 'abuse' },
      },
      sortCall: {
        router: hState.router,
        route,
        params: { sort: 'mostReports' },
      },
      ruleCall: {
        router: hState.router,
        route,
        params: { showOnlyServerRuleViolations: false },
      },
      channelCall: {
        router: hState.router,
        route,
        params: { channels: ['cats'] },
      },
      involvementCall: {
        router: hState.router,
        route,
        params: { filterCreatedByMe: true },
      },
      selectionCall: {
        issueNumber: 7,
        title: 'Needs review',
        channelId: 'cats',
      },
    });
  });
});
