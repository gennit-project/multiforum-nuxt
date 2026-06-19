import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';

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
});
