import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';

import DiscussionFilterBar from '@/components/discussion/list/DiscussionFilterBar.vue';

// Let the real useFilterBar run against a mocked route/router.
const route = createMockRoute({ name: 'DiscussionList' });
const router = createMockRouter();
vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));
vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());

const heavyStubs = {
  SearchableForumList: true,
  SearchableTagList: true,
  SortButtons: true,
  FilterChip: true,
  PrimaryButton: true,
  ChannelIcon: true,
  TagIcon: true,
  FilterIcon: true,
  SearchIcon: true,
  SearchBar: true,
};

const mountBar = () =>
  mountWithDefaults(DiscussionFilterBar, {
    props: { isForumScoped: true },
    global: { stubs: heavyStubs },
  });

describe('DiscussionFilterBar', () => {
  it('renders the filter toggle button', () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="discussion-filter-button"]').exists()
    ).toBe(true);
  });

  it('hides the search bar until the search toggle is clicked', async () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="discussion-filter-search-bar"]').exists()
    ).toBe(false);
    await wrapper.get('[data-testid="discussion-search-button"]').trigger('click');
    expect(
      wrapper.find('[data-testid="discussion-filter-search-bar"]').exists()
    ).toBe(true);
  });

  it('reveals the filters section when the filter toggle is clicked', async () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="show-archived-discussions"]').exists()
    ).toBe(false);
    await wrapper.get('[data-testid="discussion-filter-button"]').trigger('click');
    expect(
      wrapper.find('[data-testid="show-archived-discussions"]').exists()
    ).toBe(true);
  });
});
