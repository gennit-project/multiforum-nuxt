import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import SearchBar from '@/components/SearchBar.vue';
import CheckBox from '@/components/CheckBox.vue';

import DownloadFilterBar from '@/components/download/DownloadFilterBar.vue';

const route = createMockRoute({ name: 'DownloadList' });
const router = createMockRouter();
vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));

const heavyStubs = {
  SearchBar: true,
  FilterChip: true,
  SearchableTagList: true,
  SortButtons: true,
  PrimaryButton: true,
  TagIcon: true,
  FilterIcon: true,
  SearchIcon: true,
  CheckBox: true,
};

const mountBar = () =>
  mountWithDefaults(DownloadFilterBar, {
    props: {
      filterGroups: [
        { label: 'Type', key: 'type', options: [] },
      ] as unknown as never,
    },
    global: { stubs: heavyStubs },
  });

describe('DownloadFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the filter toggle button', () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="download-filter-button"]').exists()
    ).toBe(true);
  });

  it('hides the search bar until the search toggle is clicked', async () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="download-filter-search-bar"]').exists()
    ).toBe(false);
    await wrapper.get('[data-testid="download-search-button"]').trigger('click');
    expect(
      wrapper.find('[data-testid="download-filter-search-bar"]').exists()
    ).toBe(true);
  });

  it('reveals the archived-downloads filter when the filter toggle is clicked', async () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="show-archived-downloads"]').exists()
    ).toBe(false);
    await wrapper.get('[data-testid="download-filter-button"]').trigger('click');
    expect(
      wrapper.find('[data-testid="show-archived-downloads"]').exists()
    ).toBe(true);
  });

  it('replaces the route with a search-input filter from the search bar', async () => {
    const wrapper = mountBar();
    await wrapper.get('[data-testid="download-search-button"]').trigger('click');
    await wrapper.findComponent(SearchBar).vm.$emit('update-search-input', 'dogs');
    expect(router.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ searchInput: 'dogs' }),
      })
    );
  });

  it('replaces the route with the archived filter when the checkbox toggles', async () => {
    const wrapper = mountBar();
    await wrapper.get('[data-testid="download-filter-button"]').trigger('click');
    // updateShowArchived reads event.target.checked, so emit a synthetic event.
    await wrapper
      .findComponent(CheckBox)
      .vm.$emit('input', { target: { checked: true } });
    expect(router.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ showArchived: true }),
      })
    );
  });
});
