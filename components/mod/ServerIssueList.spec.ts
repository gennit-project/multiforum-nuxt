import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ServerIssueList from '@/components/mod/ServerIssueList.vue';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import IssueFilterBar from '@/components/admin/IssueFilterBar.vue';
import { issueSortValues } from '@/utils/issueSortOptions';

const h = vi.hoisted(() => ({
  query: {
    showOnlyServerRuleViolations: '',
    searchInput: '',
    sort: '',
  } as Record<string, string>,
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
    path: '/admin/issues',
    query: h.query,
  }),
  useRouter: () => ({ push: h.routerPush, replace: h.routerReplace }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => h.isAuthenticated,
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

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const filterBarStub = {
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
};

const mountWith = async (
  opts: {
    loading?: boolean;
    issues?: unknown[];
    props?: Record<string, unknown>;
  } = {}
) => {
  const { loading = false, issues = [], props = { isOpen: true } } = opts;
  mockedUseQuery.mockReturnValue({
    result: ref({ getSiteWideIssueList: { issues } }),
    error: ref(null),
    loading: ref(loading),
    refetch: h.refetch,
  });
  return shallowMount(ServerIssueList, {
    props,
    global: {
      stubs: {
        IssueFilterBar: filterBarStub,
        ModIssueListItem: {
          name: 'ModIssueListItem',
          props: ['issue'],
          emits: ['select'],
          template:
            '<li class="issue-item" @click="$emit(\'select\', { issueNumber: 9, title: \'Issue\', channelId: \'cats\' })" />',
        },
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.query.showOnlyServerRuleViolations = '';
  h.query.searchInput = '';
  h.query.sort = '';
  delete h.query.startDate;
  delete h.query.endDate;
  delete h.query.channels;
  delete h.query.filterCreatedByMe;
  delete h.query.filterIAmOP;
  delete h.query.filterIReported;
  h.selectedIssueNumber.value = null;
  h.isAuthenticated.value = true;
});

describe('ServerIssueList', () => {
  it('queries the site-wide issue list with the open flag when isOpen is true', async () => {
    await mountWith({ props: { isOpen: true } });
    expect(mockedUseQuery.mock.calls[0][1].value.isOpen).toBe(true);
  });

  it('queries the site-wide issue list with the closed flag when isOpen is false', async () => {
    await mountWith({ props: { isOpen: false } });
    expect(mockedUseQuery.mock.calls[0][1].value.isOpen).toBe(false);
  });

  it('passes the default server-rule-violations state to the filter bar', async () => {
    const wrapper = await mountWith();
    expect(
      wrapper.getComponent(IssueFilterBar).props('showOnlyServerRuleViolations')
    ).toBe(true);
  });

  it('passes the opt-out server-rule-violations state to the filter bar', async () => {
    h.query.showOnlyServerRuleViolations = 'false';
    const wrapper = await mountWith();
    expect(
      wrapper.getComponent(IssueFilterBar).props('showOnlyServerRuleViolations')
    ).toBe(false);
  });

  it('updates the filters when the checkbox value changes', async () => {
    const wrapper = await mountWith();
    await wrapper
      .getComponent(IssueFilterBar)
      .vm.$emit('update:showOnlyServerRuleViolations', false);
    expect(h.updateFilters).toHaveBeenCalledWith({
      router: { push: h.routerPush, replace: h.routerReplace },
      route: { params: { forumId: '' }, path: '/admin/issues', query: h.query },
      params: { showOnlyServerRuleViolations: false },
    });
  });

  it('updates the filters when the search bar emits a new value', async () => {
    const wrapper = await mountWith();
    await wrapper
      .getComponent(IssueFilterBar)
      .vm.$emit('update-search-input', 'needle');
    expect(h.updateFilters).toHaveBeenCalledWith({
      router: { push: h.routerPush, replace: h.routerReplace },
      route: { params: { forumId: '' }, path: '/admin/issues', query: h.query },
      params: { searchInput: 'needle' },
    });
  });

  it('passes the default sort state to the filter bar', async () => {
    const wrapper = await mountWith();
    expect(wrapper.getComponent(IssueFilterBar).props('selectedSort')).toBe(
      issueSortValues.NEWEST
    );
  });

  it('passes the default sort label to the filter bar', async () => {
    const wrapper = await mountWith();
    expect(wrapper.getComponent(IssueFilterBar).props('selectedSortLabel')).toBe(
      'Newest'
    );
  });

  it('updates the route filters when the sort changes', async () => {
    const wrapper = await mountWith();
    await wrapper
      .getComponent(IssueFilterBar)
      .vm.$emit('update:sort', issueSortValues.OLDEST);
    expect(h.updateFilters).toHaveBeenCalledWith({
      router: { push: h.routerPush, replace: h.routerReplace },
      route: { params: { forumId: '' }, path: '/admin/issues', query: h.query },
      params: { sort: issueSortValues.OLDEST },
    });
  });

  it('renders an item per issue', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });

  it('renders no issues while the query is loading', async () => {
    const wrapper = await mountWith({ loading: true, issues: [{ id: 'i1' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(0);
  });

  it('stores the selected issue when a list item emits select', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }] });
    await wrapper.get('.issue-item').trigger('click');
    expect(h.setSelectedIssueSelection).toHaveBeenCalledWith({
      issueNumber: 9,
      title: 'Issue',
      channelId: 'cats',
    });
  });

  it('passes the selected channel filter into the issues query variables', async () => {
    h.query.channels = 'announcements';
    await mountWith();
    expect(mockedUseQuery.mock.calls[0][1].value.selectedChannels).toEqual([
      'announcements',
    ]);
  });

  it('passes the selected date range into the issues query variables', async () => {
    h.query.startDate = '2026-05-27';
    h.query.endDate = '2026-06-26';
    await mountWith();
    expect(mockedUseQuery.mock.calls[0][1].value.startDate).toBe('2026-05-27');
  });

  it('passes the selected sort into the issues query variables', async () => {
    h.query.sort = issueSortValues.OLDEST;
    await mountWith();
    expect(mockedUseQuery.mock.calls[0][1].value.options).toEqual({
      sort: issueSortValues.OLDEST,
    });
  });

  it('omits date bounds when no date filters are set', async () => {
    await mountWith();
    expect(mockedUseQuery.mock.calls[0][1].value.startDate).toBe(null);
  });

  it('shows the involvement filters in the bar when authenticated', async () => {
    h.isAuthenticated.value = true;
    const wrapper = await mountWith();
    expect(
      wrapper.getComponent(IssueFilterBar).props('showInvolvementFilters')
    ).toBe(true);
  });

  it('hides the involvement filters in the bar when unauthenticated', async () => {
    h.isAuthenticated.value = false;
    const wrapper = await mountWith();
    expect(
      wrapper.getComponent(IssueFilterBar).props('showInvolvementFilters')
    ).toBe(false);
  });

  it('passes an active involvement filter into the issues query variables', async () => {
    h.query.filterIReported = 'true';
    await mountWith();
    expect(mockedUseQuery.mock.calls[0][1].value.filterIReported).toBe(true);
  });

  it('forces involvement filters off in the query when unauthenticated', async () => {
    h.isAuthenticated.value = false;
    h.query.filterCreatedByMe = 'true';
    await mountWith();
    expect(mockedUseQuery.mock.calls[0][1].value.filterCreatedByMe).toBe(false);
  });

  it('updates the route filters when an involvement filter is toggled', async () => {
    const wrapper = await mountWith();
    await wrapper
      .getComponent(IssueFilterBar)
      .vm.$emit('update:involvementFilter', {
        key: 'filterCreatedByMe',
        value: true,
      });
    expect(h.updateFilters).toHaveBeenCalledWith({
      router: { push: h.routerPush, replace: h.routerReplace },
      route: { params: { forumId: '' }, path: '/admin/issues', query: h.query },
      params: { filterCreatedByMe: true },
    });
  });

  it('passes the closed-issue search placeholder to the filter bar', async () => {
    const wrapper = await mountWith({
      props: {
        isOpen: false,
        searchPlaceholder: 'Search closed issues',
        searchTestId: 'closed-issue-search-input',
      },
    });
    expect(wrapper.getComponent(IssueFilterBar).props('searchPlaceholder')).toBe(
      'Search closed issues'
    );
  });

  it('passes the closed-issue search test id to the filter bar', async () => {
    const wrapper = await mountWith({
      props: {
        isOpen: false,
        searchPlaceholder: 'Search closed issues',
        searchTestId: 'closed-issue-search-input',
      },
    });
    expect(wrapper.getComponent(IssueFilterBar).props('searchTestId')).toBe(
      'closed-issue-search-input'
    );
  });
});
