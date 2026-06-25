import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: '' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: { loading?: boolean; issues?: unknown[] }) => {
  const { loading = false, issues = [] } = opts;
  mockedUseQuery.mockReturnValue({
    result: ref({ issues }),
    error: ref(null),
    loading: ref(loading),
    refetch: vi.fn(),
  });
  const Page = (await import('./closed.vue')).default;
  return shallowMount(Page);
};

describe('admin closed issues page', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('renders an item per closed issue', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });

  it('renders no issues while the query is loading', async () => {
    const wrapper = await mountWith({ loading: true, issues: [{ id: 'i1' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(0);
  });
});
