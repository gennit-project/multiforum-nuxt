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
  clearSelectedIssueSelection: vi.fn(),
  selectedIssueNumber: null as unknown as { value: number | null },
  isAuthenticated: null as unknown as { value: boolean },
  updateFilters: vi.fn(),
}));

h.selectedIssueNumber = ref<number | null>(null);
h.isAuthenticated = ref<boolean>(true);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    path: '/forums/cats/issues/closed',
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
    clearSelectedIssueSelection: h.clearSelectedIssueSelection,
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
            'showInvolvementFilters',
            'showChannelFilter',
            'showServerRuleViolationsFilter',
            'searchPlaceholder',
            'searchTestId',
          ],
          emits: ['update:involvementFilter'],
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

describe('forum closed issues page', () => {
  it('queries closed issues scoped to the current forum channel', async () => {
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value).toMatchObject({
      isOpen: false,
      selectedChannels: ['cats'],
    });
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

  it('hides the channel filter in forum scope', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(wrapper.getComponent(IssueFilterBar).props('showChannelFilter')).toBe(
      false
    );
  });

  it('shows an empty-state message when there are no closed issues', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(wrapper.text()).toContain('There are no closed issues.');
  });

  it('renders an item per closed issue', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });

  it('renders no issues while the query is loading', async () => {
    const wrapper = await mountWith({ loading: true, issues: [{ id: 'i1' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(0);
  });

  it('passes an active involvement filter into the query', async () => {
    h.query.filterIReported = 'true';
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value.filterIReported).toBe(true);
  });
});
