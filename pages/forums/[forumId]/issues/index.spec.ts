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
    path: '/forums/cats/issues',
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
  const Page = (await import('./index.vue')).default;
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
        NuxtLink: { template: '<a><slot /></a>' },
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

describe('forum issues index page', () => {
  it('queries open issues scoped to the current forum channel', async () => {
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value).toMatchObject({
      isOpen: true,
      selectedChannels: ['cats'],
    });
  });

  it('drops the server-rule-violations filter in forum scope', async () => {
    await mountWith({ issues: [] });
    expect(
      mockedUseQuery.mock.calls[0][1].value.showOnlyServerRuleViolations
    ).toBe(false);
  });

  it('refetches on mount so newly created issues appear', async () => {
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][2].fetchPolicy).toBe(
      'cache-and-network'
    );
  });

  it('hides the channel filter in forum scope', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(wrapper.getComponent(IssueFilterBar).props('showChannelFilter')).toBe(
      false
    );
  });

  it('hides the server-rule-violations filter in forum scope', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(
      wrapper
        .getComponent(IssueFilterBar)
        .props('showServerRuleViolationsFilter')
    ).toBe(false);
  });

  it('shows the empty state with a create link when there are no issues', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(wrapper.text()).toContain('There are no issues yet.');
  });

  it('renders an item per open issue', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });

  it('renders no issues while the query is loading', async () => {
    const wrapper = await mountWith({ loading: true, issues: [{ id: 'i1' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(0);
  });

  it('passes an active involvement filter into the query', async () => {
    h.query.filterCreatedByMe = 'true';
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value.filterCreatedByMe).toBe(true);
  });
});
