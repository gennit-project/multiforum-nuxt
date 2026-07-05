import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import IssueFilterBar from '@/components/admin/IssueFilterBar.vue';

const h = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  refetch: vi.fn(),
  setSelectedIssueSelection: vi.fn(),
  selectedIssueNumber: null as unknown as { value: number | null },
  isAuthenticated: null as unknown as { value: boolean },
  updateFilters: vi.fn(),
}));

h.selectedIssueNumber = ref<number | null>(null);
h.isAuthenticated = ref<boolean>(true);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: '' },
    path: '/admin/issues/closed',
    query: h.query,
  }),
  useRouter: () => ({ push: h.routerPush, replace: h.routerReplace }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/utils/routerUtils', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  updateFilters: h.updateFilters,
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    setSelectedIssueSelection: h.setSelectedIssueSelection,
  }),
}));

vi.mock('pinia', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  storeToRefs: () => ({
    selectedIssueNumber: h.selectedIssueNumber,
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => h.isAuthenticated,
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: { loading?: boolean; issues?: unknown[] }) => {
  const { loading = false, issues = [] } = opts;
  mockedUseQuery.mockReturnValue({
    result: ref({ getSiteWideIssueList: { issues } }),
    error: ref(null),
    loading: ref(loading),
    refetch: h.refetch,
  });
  const Page = (await import('./closed.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        IssueFilterBar: {
          name: 'IssueFilterBar',
          props: [
            'searchInput',
            'selectedChannels',
            'channelLabel',
            'startDate',
            'endDate',
            'showOnlyServerRuleViolations',
            'selectedSort',
            'selectedSortLabel',
            'showInvolvementFilters',
            'filterCreatedByMe',
            'filterIAmOP',
            'filterIReported',
            'searchPlaceholder',
            'searchTestId',
          ],
          emits: [
            'update-search-input',
            'toggle-selected-channel',
            'update:startDate',
            'update:endDate',
            'update:showOnlyServerRuleViolations',
            'update:sort',
            'update:involvementFilter',
          ],
          template: '<div class="issue-filter-bar" />',
        },
        ModIssueListItem: {
          name: 'ModIssueListItem',
          props: ['issue'],
          emits: ['select'],
          template: '<li class="issue-item" />',
        },
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.query = {};
  h.selectedIssueNumber.value = null;
  h.isAuthenticated.value = true;
});

describe('admin closed issues page', () => {
  it('queries the site-wide issue list for closed issues', async () => {
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value.isOpen).toBe(false);
  });

  it('passes the closed-issue search placeholder to the filter bar', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(
      wrapper.getComponent(IssueFilterBar).props('searchPlaceholder')
    ).toBe('Search closed issues');
  });

  it('passes the closed-issue search test id to the filter bar', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(wrapper.getComponent(IssueFilterBar).props('searchTestId')).toBe(
      'closed-issue-search-input'
    );
  });

  it('renders an item per closed issue', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });

  it('renders no issues while the query is loading', async () => {
    const wrapper = await mountWith({ loading: true, issues: [{ id: 'i1' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(0);
  });

  it('shows the involvement filters when authenticated', async () => {
    h.isAuthenticated.value = true;
    const wrapper = await mountWith({ issues: [] });
    expect(
      wrapper.getComponent(IssueFilterBar).props('showInvolvementFilters')
    ).toBe(true);
  });

  it('passes an active involvement filter into the closed-issues query', async () => {
    h.query.filterIReported = 'true';
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value.filterIReported).toBe(true);
  });

  it('updates the route filters when an involvement filter is toggled', async () => {
    const wrapper = await mountWith({ issues: [] });
    await wrapper
      .getComponent(IssueFilterBar)
      .vm.$emit('update:involvementFilter', {
        key: 'filterCreatedByMe',
        value: true,
      });
    expect(h.updateFilters).toHaveBeenCalledWith({
      router: { push: h.routerPush, replace: h.routerReplace },
      route: {
        params: { forumId: '' },
        path: '/admin/issues/closed',
        query: h.query,
      },
      params: { filterCreatedByMe: true },
    });
  });
});
