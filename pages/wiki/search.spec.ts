import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/components/discussion/list/getDiscussionFilterValuesFromParams', () => ({
  getFilterValuesFromParams: () => ({ searchInput: '', channels: [] }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (wikiPages: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({
      getSiteWideWikiList: {
        wikiPages,
        aggregateWikiPageCount: wikiPages.length,
      },
    }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./search.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLayout: { template: '<div><slot /></div>' } } },
  });
};

describe('wiki search page', () => {
  it('shows the empty message when no wiki pages match', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No wiki pages match your search.');
  });

  it('renders a result row per matching wiki page', async () => {
    const wrapper = await mountWith([
      { id: 'w1', title: 'Cats', slug: 'cats', channelUniqueName: 'cats', body: 'hi' },
      { id: 'w2', title: 'Dogs', slug: 'dogs', channelUniqueName: 'dogs', body: 'hi' },
    ]);
    expect(wrapper.findAll('[data-testid="wiki-search-results"] > li')).toHaveLength(
      2
    );
  });
});
