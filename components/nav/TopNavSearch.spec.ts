import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBar from '@/components/SearchBar.vue';
import { createMockRouter } from '@/tests/utils/mockRouter';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import TopNavSearch from '@/components/nav/TopNavSearch.vue';

const router = createMockRouter();

vi.mock('nuxt/app', () => ({
  useRouter: () => router,
}));

// getChannelLabel is the only real util used by the template's computeds.
vi.mock('@/utils', () => ({
  getChannelLabel: (channels: string[]) =>
    channels.length ? channels.join(', ') : 'All Forums',
}));

const mountSearch = () =>
  mountWithDefaults(TopNavSearch, {
    global: {
      stubs: {
        FilterChip: true,
        SearchableForumList: true,
        ChannelIcon: true,
        SearchIcon: true,
      },
    },
  });

const submitSearch = async (
  wrapper: ReturnType<typeof mountSearch>,
  value: string
) => {
  await wrapper.findComponent(SearchBar).vm.$emit('submit', value);
};

describe('TopNavSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pushes the discussions route for the default search type', async () => {
    const wrapper = mountSearch();
    await submitSearch(wrapper, 'cats');
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/discussions' })
    );
  });

  it('includes the trimmed search input in the route query', async () => {
    const wrapper = mountSearch();
    await submitSearch(wrapper, '  cats  ');
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ searchInput: 'cats' }),
      })
    );
  });

  it('marks the search as open in the route query', async () => {
    const wrapper = mountSearch();
    await submitSearch(wrapper, 'cats');
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ searchOpen: 'true' }),
      })
    );
  });
});
