import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';

const h = vi.hoisted(() => ({
  query: { showOnlyServerRuleViolations: '', searchInput: '' } as Record<string, string>,
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  refetch: vi.fn(),
  setSelectedIssueSelection: vi.fn(),
  selectedIssueNumber: null as unknown as { value: number | null },
  updateFilters: vi.fn(),
}));

h.selectedIssueNumber = ref<number | null>(null);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: '' }, path: '/admin/issues', query: h.query }),
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

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: { loading?: boolean; issues?: unknown[] }) => {
  const { loading = false, issues = [] } = opts;
  mockedUseQuery.mockReturnValue({
    result: ref({ issues }),
    error: ref(null),
    loading: ref(loading),
    refetch: h.refetch,
  });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        SearchBar: {
          name: 'SearchBar',
          emits: ['update-search-input'],
          template: '<button class="search-bar" @click="$emit(\'update-search-input\', \'needle\')" />',
        },
        ModIssueListItem: {
          name: 'ModIssueListItem',
          props: ['issue'],
          emits: ['select'],
          template: '<li class="issue-item" @click="$emit(\'select\', { issueNumber: 9, title: \'Issue\', channelId: \'cats\' })" />',
        },
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.query.showOnlyServerRuleViolations = '';
  h.query.searchInput = '';
  h.selectedIssueNumber.value = null;
});

describe('admin server issues index page', () => {
  it('defaults the server-rule-violations checkbox to checked', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect((wrapper.get('[data-testid="show-only-server-rule-violations"]').element as HTMLInputElement).checked).toBe(true);
  });

  it('unchecks the filter when the query opts out', async () => {
    h.query.showOnlyServerRuleViolations = 'false';
    const wrapper = await mountWith({ issues: [] });
    expect((wrapper.get('[data-testid="show-only-server-rule-violations"]').element as HTMLInputElement).checked).toBe(false);
  });

  it('updates the filters when the checkbox changes', async () => {
    const wrapper = await mountWith({ issues: [] });
    await wrapper.get('[data-testid="show-only-server-rule-violations"]').setValue(false);
    expect(h.updateFilters).toHaveBeenCalledWith({
      router: { push: h.routerPush, replace: h.routerReplace },
      route: { params: { forumId: '' }, path: '/admin/issues', query: h.query },
      params: { showOnlyServerRuleViolations: false },
    });
  });

  it('updates the filters when the search bar emits a new value', async () => {
    const wrapper = await mountWith({ issues: [] });
    await wrapper.get('.search-bar').trigger('click');
    expect(h.updateFilters).toHaveBeenCalledWith({
      router: { push: h.routerPush, replace: h.routerReplace },
      route: { params: { forumId: '' }, path: '/admin/issues', query: h.query },
      params: { searchInput: 'needle' },
    });
  });

  it('renders an item per issue', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
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
});
