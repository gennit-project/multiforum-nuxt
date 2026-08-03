import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, reactive, ref } from 'vue';
import MapView from '@/components/event/map/MapView.vue';

const h = vi.hoisted(() => ({
  route: {
    path: '/map/search',
    name: 'map-search',
    query: {} as Record<string, unknown>,
    params: {} as Record<string, unknown>,
  },
  push: vi.fn(),
  replace: vi.fn(),
  result: null as unknown as {
    value: { events: unknown[]; eventsAggregate: { count: number } };
  },
  loading: null as unknown as { value: boolean },
  error: null as unknown as { value: null | { message: string } },
  onResultCb: null as
    null | ((value: { data?: { events: Array<{ id: string }> } }) => void),
  mdAndUp: null as unknown as { value: boolean },
  queryVariables: null as null | {
    where: { value: unknown };
    resultsOrder: { value: unknown };
  },
  mapsCapability: null as unknown as { value: unknown },
  mapsAvailable: null as unknown as { value: boolean },
  mapsCapabilityLoading: null as unknown as { value: boolean },
  mapsCapabilityError: null as unknown as { value: unknown },
}));

vi.mock('@headlessui/vue', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
}));

vi.mock('@/composables/useDisplay', () => ({
  useDisplay: () => ({ mdAndUp: h.mdAndUp }),
}));

vi.mock('@/composables/useInstanceSetupStatus', () => ({
  useInstanceCapability: () => ({
    capability: h.mapsCapability,
    available: h.mapsAvailable,
    loading: h.mapsCapabilityLoading,
    error: h.mapsCapabilityError,
  }),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push, replace: h.replace }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (
    _query: unknown,
    variables: NonNullable<typeof h.queryVariables>
  ) => {
    h.queryVariables = variables;
    void variables.where.value;
    void variables.resultsOrder.value;
    return {
      result: h.result,
      loading: h.loading,
      error: h.error,
      onResult: (cb: typeof h.onResultCb) => {
        h.onResultCb = cb;
      },
    };
  },
}));

h.result = ref({ events: [] as unknown[], eventsAggregate: { count: 0 } });
h.loading = ref(false);
h.error = ref(null);
h.mdAndUp = ref(true);
h.mapsCapability = ref({
  configured: true,
  enabled: true,
  requiredEnvVarsMissing: [],
  setupUrl: '/admin/setup#maps',
  docsPath: '/roles/admins/map-setup',
});
h.mapsAvailable = ref(true);
h.mapsCapabilityLoading = ref(false);
h.mapsCapabilityError = ref(null);
h.route = reactive(h.route);

const EventFilterBar = {
  name: 'EventFilterBar',
  template: '<div class="event-filter-bar"><slot /></div>',
};
const TimeShortcuts = {
  name: 'TimeShortcuts',
  template: '<div class="time-shortcuts" />',
};
const LoadingSpinner = {
  name: 'LoadingSpinner',
  template: '<div class="spinner" />',
};
const ErrorBanner = {
  name: 'ErrorBanner',
  props: ['text'],
  template: '<div class="error">{{ text }}</div>',
};
const EventPreview = {
  name: 'EventPreview',
  props: ['isOpen'],
  emits: ['close-preview'],
  template: '<div class="preview" :data-open="isOpen" />',
};
const PreviewContainer = {
  name: 'PreviewContainer',
  props: ['isOpen', 'header', 'topLayer'],
  emits: ['close-preview'],
  template:
    '<div class="preview-container" :data-open="isOpen" :data-header="header"><slot /></div>',
};
const CloseButton = {
  name: 'CloseButton',
  emits: ['click'],
  template: '<button class="close-button" @click="$emit(\'click\')" />',
};
const EventList = {
  name: 'EventList',
  props: [
    'events',
    'selectedTags',
    'selectedChannels',
    'highlightedEventId',
    'highlightedEventLocationId',
  ],
  emits: [
    'filter-by-tag',
    'filter-by-channel',
    'highlight-event',
    'open-preview',
    'unhighlight',
  ],
  template: '<div class="event-list" />',
};
const EventMap = {
  name: 'EventMap',
  props: ['events', 'colorLocked', 'previewIsOpen', 'useMobileStyles'],
  emits: ['highlight-event', 'open-preview', 'lock-colors', 'set-marker-data'],
  template: '<div class="event-map" />',
};
const MapUnavailable = {
  name: 'MapUnavailable',
  props: ['setupUrl', 'statusUnavailable'],
  template: '<div class="map-unavailable" />',
};

const stubs = {
  EventFilterBar,
  TimeShortcuts,
  LoadingSpinner,
  ErrorBanner,
  EventList,
  EventMap,
  MapUnavailable,
  EventPreview,
  PreviewContainer,
  CloseButton,
  'client-only': { template: '<div><slot /></div>' },
  ClientOnly: { template: '<div><slot /></div>' },
  NuxtPage: { template: '<div class="nuxt-page" />' },
};

const event = (id: string, title = `Event ${id}`) => ({
  id,
  title,
  locationName: 'Phoenix',
  location: { latitude: 33.4, longitude: -111.9 },
});

const markerData = (numberOfEvents = 1) => {
  const infowindow = {
    setContent: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  };
  return {
    infowindow,
    data: {
      map: { id: 'map' },
      markerMap: {
        markers: {
          loc1: {
            marker: { id: 'marker' },
            numberOfEvents,
            events: {
              '1': event('1', 'First'),
              ...(numberOfEvents > 1 ? { '2': event('2', 'Second') } : {}),
            },
          },
        },
        infowindow,
      },
    },
  };
};

const mountView = () =>
  mount(MapView, {
    props: {},
    global: { stubs, mocks: { $route: h.route } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(h.route, {
    path: '/map/search',
    name: 'map-search',
    query: {},
    params: {},
  });
  h.result.value = { events: [], eventsAggregate: { count: 0 } };
  h.loading.value = false;
  h.error.value = null;
  h.onResultCb = null;
  h.queryVariables = null;
  h.mdAndUp.value = true;
  h.mapsCapability.value = {
    configured: true,
    enabled: true,
    requiredEnvVarsMissing: [],
    setupUrl: '/admin/setup#maps',
    docsPath: '/roles/admins/map-setup',
  };
  h.mapsAvailable.value = true;
  h.mapsCapabilityLoading.value = false;
  h.mapsCapabilityError.value = null;
  vi.stubGlobal('CSS', { escape: (value: string) => value });
});

describe('MapView', () => {
  it('shows the loading spinner while events load', () => {
    h.loading.value = true;
    expect(mountView().findComponent(LoadingSpinner).exists()).toBe(true);
  });

  it('shows an error banner when the query errors', () => {
    h.error.value = { message: 'boom' };
    expect(mountView().findComponent(ErrorBanner).text()).toContain('boom');
  });

  it('renders the setup placeholder instead of the map when maps are unavailable', () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    h.mapsCapability.value = {
      configured: false,
      enabled: false,
      requiredEnvVarsMissing: ['VITE_GOOGLE_MAPS_API_KEY'],
      setupUrl: '/admin/setup#maps',
      docsPath: '/roles/admins/map-setup',
    };
    h.mapsAvailable.value = false;

    const wrapper = mountView();

    expect({
      map: wrapper.findComponent(EventMap).exists(),
      placeholder: wrapper.findComponent(MapUnavailable).exists(),
    }).toEqual({ map: false, placeholder: true });
  });

  it('routes to the online list from the map search header button', async () => {
    const wrapper = mountView();
    await wrapper.get('button').trigger('click');
    expect(h.push).toHaveBeenCalledWith({
      path: '/events/list/search',
      query: {},
    });
  });

  it('updates the route query when filtering by tag', async () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    await wrapper.findComponent(EventList).vm.$emit('filter-by-tag', 'music');
    expect(h.replace).toHaveBeenCalled();
  });

  it('updates the route query when filtering by channel', async () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    await wrapper
      .findComponent(EventList)
      .vm.$emit('filter-by-channel', 'cats');
    expect(h.replace).toHaveBeenCalled();
  });

  it('pushes the first event into the preview route when the query callback returns events', async () => {
    mountView();
    h.onResultCb?.({ data: { events: [event('1')] } });
    await Promise.resolve();
    expect(h.push).toHaveBeenCalledWith({
      name: 'map-search-eventId',
      params: { eventId: '1' },
      hash: '#',
      query: {},
    });
  });

  it.each([{ data: undefined }, { data: { events: [] } }])(
    'does not navigate when the query callback has no event',
    async (queryResult) => {
      mountView();
      h.onResultCb?.(queryResult);
      await Promise.resolve();
      expect(h.push).not.toHaveBeenCalled();
    }
  );

  it('recomputes filters when the route query changes', async () => {
    const wrapper = mountView();
    h.route.query = { tags: ['music'] };
    await nextTick();
    expect(wrapper.findComponent(EventList).props('selectedTags')).toEqual([
      'music',
    ]);
  });

  it('uses reverse chronological order for past events', () => {
    h.route.query = { timeShortcut: 'PAST_EVENTS' };
    mountView();
    expect(h.queryVariables?.resultsOrder.value).toEqual({
      startTime: 'DESC',
    });
  });

  it('opens the multiple-event preview when a map marker represents more than one event', async () => {
    h.result.value = {
      events: [event('1'), event('2')],
      eventsAggregate: { count: 2 },
    };
    const wrapper = mountView();

    await wrapper.findComponent(EventMap).vm.$emit('set-marker-data', {
      map: {},
      markerMap: {
        markers: {
          loc1: {
            marker: null,
            numberOfEvents: 2,
            events: {
              '1': event('1', 'First'),
              '2': event('2', 'Second'),
            },
          },
        },
        infowindow: {
          setContent: vi.fn(),
          open: vi.fn(),
          close: vi.fn(),
        },
      },
    });
    await wrapper
      .findComponent(EventMap)
      .vm.$emit(
        'highlight-event',
        'loc1',
        '',
        event('1', 'First'),
        true,
        false
      );
    await wrapper
      .findComponent(EventMap)
      .vm.$emit('open-preview', event('1', 'First'), true);

    expect(
      wrapper
        .findAllComponents(PreviewContainer)
        .some((node) => node.attributes('data-open') === 'true')
    ).toBe(true);
  });

  it('opens a specific info window and navigates when a single marker is clicked', async () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    const marker = markerData();
    const map = wrapper.findComponent(EventMap);
    await map.vm.$emit('set-marker-data', marker.data);
    await map.vm.$emit('highlight-event', 'loc1', '1', event('1'), true, true);
    expect({
      contentCalls: marker.infowindow.setContent.mock.calls.length,
      openCalls: marker.infowindow.open.mock.calls.length,
      route: h.push.mock.calls.at(-1)?.[0],
    }).toEqual({
      contentCalls: 2,
      openCalls: 2,
      route: {
        name: 'map-search-eventId',
        params: { eventId: '1' },
        hash: '#loc1',
        query: {},
      },
    });
  });

  it('uses supplied event data when a marker does not contain the event', async () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    const marker = markerData();
    const suppliedEvent = event('missing', 'Supplied');
    const map = wrapper.findComponent(EventMap);
    await map.vm.$emit('set-marker-data', marker.data);
    await map.vm.$emit(
      'highlight-event',
      'loc1',
      'missing',
      suppliedEvent,
      false,
      false
    );
    await wrapper
      .findComponent(EventList)
      .vm.$emit('open-preview', suppliedEvent);
    expect(wrapper.findComponent(EventPreview).attributes('data-open')).toBe(
      'true'
    );
  });

  it('locks marker colors while a preview is open and unlocks them when it closes', async () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    const map = wrapper.findComponent(EventMap);
    await map.vm.$emit('lock-colors');
    await map.vm.$emit('open-preview', event('1'), true);
    await wrapper.findComponent(EventPreview).vm.$emit('close-preview');
    expect(map.props('colorLocked')).toBe(false);
  });

  it('closes the multiple-event preview and its marker info window', async () => {
    h.result.value = {
      events: [event('1'), event('2')],
      eventsAggregate: { count: 2 },
    };
    const wrapper = mountView();
    const marker = markerData(2);
    const map = wrapper.findComponent(EventMap);
    await map.vm.$emit('set-marker-data', marker.data);
    await map.vm.$emit('highlight-event', 'loc1', '', event('1'), true, false);
    await map.vm.$emit('open-preview', event('1'), true);
    await wrapper.findComponent(CloseButton).vm.$emit('click');
    expect({
      previewOpen: wrapper.findComponent(PreviewContainer).props('isOpen'),
      closeCalls: marker.infowindow.close.mock.calls.length,
    }).toEqual({ previewOpen: false, closeCalls: 2 });
  });

  it('renders the mobile map when the viewport is below md', () => {
    h.mdAndUp.value = false;
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    expect(wrapper.findAllComponents(EventMap)).toHaveLength(1);
  });

  it('locks marker colors from the mobile map', async () => {
    h.mdAndUp.value = false;
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    const map = wrapper.findComponent(EventMap);
    await map.vm.$emit('lock-colors');
    expect(map.props('colorLocked')).toBe(true);
  });
});
