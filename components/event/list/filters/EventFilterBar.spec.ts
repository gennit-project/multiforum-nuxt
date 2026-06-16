import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';

const route = createMockRoute({ name: 'EventList' });
const router = createMockRouter();
vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));
vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());

import EventFilterBar from '@/components/event/list/filters/EventFilterBar.vue';

const heavyStubs = {
  LocationSearchBar: true,
  SearchBar: true,
  GenericButton: true,
  FilterChip: true,
  SelectCanceled: true,
  SelectFree: true,
  SearchableForumList: true,
  SearchableTagList: true,
  PrimaryButton: true,
  ChannelIcon: true,
  TagIcon: true,
  FilterIcon: true,
  Popper: true,
};

const mountBar = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(EventFilterBar, {
    props: { allowHidingMainFilters: true, ...props },
    global: { stubs: heavyStubs },
  });

describe('EventFilterBar', () => {
  it('renders the main-filters toggle when hiding is allowed', () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="toggle-main-filters-button"]').exists()
    ).toBe(true);
  });

  it('labels the toggle "Show filters" while filters are hidden', () => {
    const wrapper = mountBar({ showMainFiltersByDefault: false });
    expect(
      wrapper.get('[data-testid="toggle-main-filters-button"]').text()
    ).toBe('Show filters');
  });

  it('flips the toggle label to "Hide filters" when clicked', async () => {
    const wrapper = mountBar({ showMainFiltersByDefault: false });
    await wrapper
      .get('[data-testid="toggle-main-filters-button"]')
      .trigger('click');
    expect(
      wrapper.get('[data-testid="toggle-main-filters-button"]').text()
    ).toBe('Hide filters');
  });
});
