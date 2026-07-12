import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick, reactive } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';

import { MilesOrKm } from '@/components/event/list/filters/eventSearchOptions';

import EventFilterBar from '@/components/event/list/filters/EventFilterBar.vue';

const route = reactive(createMockRoute({ name: 'EventList' }));
const router = createMockRouter();
vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));

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
  CheckBox: true,
};

// Slot-rendering stubs so the filter controls (which live deep inside
// SearchBar/LocationSearchBar -> client-only -> Popper #content) actually mount
// and can emit the events the bar wires its update handlers to.
const openStubs = {
  ...heavyStubs,
  LocationSearchBar: {
    name: 'LocationSearchBar',
    emits: ['update-location-input'],
    template: '<div><slot /></div>',
  },
  Popper: {
    name: 'Popper',
    template: '<div><slot /><slot name="content" /></div>',
  },
  'client-only': { template: '<div><slot /></div>' },
  ClientOnly: { template: '<div><slot /></div>' },
  SelectCanceled: {
    name: 'SelectCanceled',
    emits: ['update-show-canceled'],
    template: '<div />',
  },
  SelectFree: {
    name: 'SelectFree',
    emits: ['update-show-only-free'],
    template: '<div />',
  },
  SearchBar: {
    name: 'SearchBar',
    props: ['initialValue'],
    emits: ['update-search-input'],
    template: '<div><slot /></div>',
  },
  GenericButton: {
    name: 'GenericButton',
    inheritAttrs: true,
    props: ['text'],
    template: '<button>{{ text }}</button>',
  },
  FilterChip: {
    name: 'FilterChip',
    template: '<div><slot /><slot name="content" /></div>',
  },
  SearchableForumList: {
    name: 'SearchableForumList',
    props: ['selectedChannels', 'featuredForums'],
    emits: ['toggle-selection'],
    template: '<div />',
  },
  SearchableTagList: {
    name: 'SearchableTagList',
    props: ['selectedTags'],
    emits: ['toggle-selection'],
    template: '<div />',
  },
  CheckBox: {
    name: 'CheckBox',
    props: ['checked'],
    emits: ['input'],
    template: '<input type="checkbox" />',
  },
};

const mountBar = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(EventFilterBar, {
    props: { allowHidingMainFilters: true, ...props },
    global: { stubs: heavyStubs },
  });

// Mount with the filters open and a channel scope (so the location/distance
// controls render).
const mountOpen = () =>
  mountWithDefaults(EventFilterBar, {
    props: {
      allowHidingMainFilters: true,
      showMainFiltersByDefault: true,
      toggleShowArchivedEnabled: true,
    },
    global: { stubs: openStubs },
  });

const lastReplaceQuery = () => {
  const calls = router.replace.mock.calls;
  return (calls.at(-1)?.[0] as { query: Record<string, unknown> })?.query ?? {};
};

beforeEach(() => {
  vi.clearAllMocks();
  route.params = {};
  route.query = {};
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

describe('EventFilterBar filter handlers', () => {
  beforeEach(() => {
    // A channel scope makes showLocationSearchBarAndDistanceButtons true so the
    // distance / cancel / free controls render.
    route.params = { forumId: 'cats' };
  });

  it('writes showCanceledEvents when the cancel filter is enabled', async () => {
    const wrapper = mountOpen();
    await wrapper
      .findComponent({ name: 'SelectCanceled' })
      .vm.$emit('update-show-canceled', true);
    expect(lastReplaceQuery()).toMatchObject({ showCanceledEvents: true });
  });

  it('clears showCanceledEvents when the cancel filter is disabled', async () => {
    const wrapper = mountOpen();
    await wrapper
      .findComponent({ name: 'SelectCanceled' })
      .vm.$emit('update-show-canceled', false);
    expect(router.replace).toHaveBeenCalled();
    expect(lastReplaceQuery()).not.toHaveProperty('showCanceledEvents');
  });

  it('writes showOnlyFreeEvents when the free filter is enabled', async () => {
    const wrapper = mountOpen();
    await wrapper
      .findComponent({ name: 'SelectFree' })
      .vm.$emit('update-show-only-free', true);
    expect(lastReplaceQuery()).toMatchObject({ showOnlyFreeEvents: true });
  });

  it('sets any-distance (radius 0 + address filter) for the 0 distance option', async () => {
    const wrapper = mountOpen();
    const anyDistance = wrapper.find('[data-testid="distance-0"]');
    expect(anyDistance.exists()).toBe(true);
    await anyDistance.trigger('click');
    expect(lastReplaceQuery()).toMatchObject({ radius: 0 });
  });

  it('sets a numeric radius for a non-zero distance option', async () => {
    const wrapper = mountOpen();
    const distanceButton = wrapper
      .findAll('[data-testid^="distance-"]')
      .find((b) => b.attributes('data-testid') !== 'distance-0');
    await distanceButton!.trigger('click');
    const query = lastReplaceQuery();
    expect(typeof query.radius).toBe('number');
    expect(query.radius).not.toBe(0);
  });

  it('updates filters from a location selection', async () => {
    const wrapper = mountOpen();
    await wrapper.findComponent({ name: 'LocationSearchBar' }).vm.$emit(
      'update-location-input',
      {
        name: 'Phoenix',
        formatted_address: 'Phoenix, AZ',
        lat: 33.4,
        lng: -112,
        referencePointAddress: 'Phoenix, AZ',
      }
    );
    expect(router.replace).toHaveBeenCalled();
  });

  it('clears showOnlyFreeEvents when the free filter is disabled', async () => {
    const wrapper = mountOpen();
    await wrapper
      .findComponent({ name: 'SelectFree' })
      .vm.$emit('update-show-only-free', false);
    expect(router.replace).toHaveBeenCalled();
  });

  it('writes searchInput when the search bar updates', async () => {
    const wrapper = mountOpen();
    await wrapper
      .findComponent({ name: 'SearchBar' })
      .vm.$emit('update-search-input', 'phoenix');
    expect(lastReplaceQuery()).toMatchObject({ searchInput: 'phoenix' });
  });

  it('writes showArchived when the archived checkbox is checked', async () => {
    const wrapper = mountOpen();
    await wrapper.findComponent({ name: 'CheckBox' }).vm.$emit('input', {
      target: { checked: true },
    });
    expect(lastReplaceQuery()).toMatchObject({ showArchived: true });
  });

  it('writes channels when a forum selection is toggled on', async () => {
    route.params = {};
    const wrapper = mountOpen();
    await wrapper
      .findComponent({ name: 'SearchableForumList' })
      .vm.$emit('toggle-selection', 'cats');
    expect(lastReplaceQuery()).toMatchObject({ channels: ['cats'] });
  });

  it('writes tags when a tag selection is toggled on', async () => {
    const wrapper = mountOpen();
    await wrapper
      .findComponent({ name: 'SearchableTagList' })
      .vm.$emit('toggle-selection', 'music');
    expect(lastReplaceQuery()).toMatchObject({ tags: ['music'] });
  });
});

describe('EventFilterBar computeds', () => {
  beforeEach(() => {
    route.params = {};
    route.query = {};
    route.name = 'EventList';
  });

  it('links to the channel-scoped create page when inside a forum', () => {
    route.params = { forumId: 'cats' };
    expect((mountBar().vm as unknown as { createEventLink: string }).createEventLink).toBe(
      '/forums/cats/events/create'
    );
  });

  it('links to the global create page outside a forum', () => {
    expect((mountBar().vm as unknown as { createEventLink: string }).createEventLink).toBe(
      '/events/create'
    );
  });

  it('flags in-person-only on a map-search route', () => {
    route.name = 'events-map-search';
    expect(
      (mountBar().vm as unknown as { showInPersonOnly: boolean | undefined }).showInPersonOnly
    ).toBe(true);
  });

  it('honors external filter visibility when provided', () => {
    expect(
      (
        mountBar({ externalShowMainFilters: true }).vm as unknown as {
          showMainFilters: boolean;
        }
      ).showMainFilters
    ).toBe(true);
  });

  it('labels the distance as "Any distance" when the radius is zero', () => {
    route.query = { radius: 0 };
    expect((mountBar().vm as unknown as { radiusLabel: string }).radiusLabel).toBe(
      'Any distance'
    );
  });

  it('labels the radius in kilometers when the km unit is selected', async () => {
    route.query = { radius: 80 };
    const wrapper = mountBar();
    (wrapper.vm as unknown as { selectedDistanceUnit: string }).selectedDistanceUnit =
      MilesOrKm.KM;
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as { radiusLabel: string }).radiusLabel).toContain('km');
  });
});

describe('EventFilterBar route hydration', () => {
  beforeEach(() => {
    route.params = {};
    route.query = {};
    route.name = 'EventList';
    route.path = '/events';
  });

  it('hydrates the search bar from the route query on mount', () => {
    route.query = { searchInput: 'phoenix' };
    const wrapper = mountOpen();
    expect(wrapper.findComponent({ name: 'SearchBar' }).props('initialValue')).toBe(
      'phoenix'
    );
  });

  it('hydrates the archived checkbox from the route query on mount', () => {
    route.query = { showArchived: 'true' };
    const wrapper = mountOpen();
    expect(wrapper.findComponent({ name: 'CheckBox' }).props('checked')).toBe(true);
  });

  it('updates the selected tags when the route query changes', async () => {
    const wrapper = mountOpen();
    route.query = { tags: ['music'] };
    await nextTick();
    expect(
      wrapper.findComponent({ name: 'SearchableTagList' }).props('selectedTags')
    ).toEqual(['music']);
  });

  it('shows featured forums on map-search routes', () => {
    route.name = 'events-map-search';
    route.path = '/events/map';
    const wrapper = mountOpen();
    expect(
      wrapper.findComponent({ name: 'SearchableForumList' }).props('featuredForums')
    ).toHaveLength(3);
  });
});
