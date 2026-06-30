import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Map from '@/components/event/map/Map.vue';
import type { Event } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({
  fullPath: '/map/search',
  markerInstances: [] as Array<{
    listeners: Record<string, () => void>;
    map: unknown;
    title?: string;
  }>,
  markerElements: [] as Array<{
    listeners: Record<string, () => void>;
  }>,
  clusterConfig: null as null | {
    markers: unknown[];
    map: {
      fitBounds: ReturnType<typeof vi.fn>;
      getZoom: ReturnType<typeof vi.fn>;
      setZoom: ReturnType<typeof vi.fn>;
    };
    onClusterClick: (
      event: unknown,
      cluster: { bounds?: unknown },
      clustererMap: {
        fitBounds: ReturnType<typeof vi.fn>;
        getZoom: ReturnType<typeof vi.fn>;
        setZoom: ReturnType<typeof vi.fn>;
      }
    ) => void;
  },
  infoWindow: {
    setContent: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  },
  map: {
    fitBounds: vi.fn(),
    getZoom: vi.fn(() => 16),
    setZoom: vi.fn(),
  },
  bounds: {
    extend: vi.fn(),
    isEmpty: vi.fn(() => false),
  },
}));

vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(function () {
    return { load: vi.fn().mockResolvedValue(undefined) };
  }),
}));

vi.mock('@googlemaps/markerclusterer', () => ({
  MarkerClusterer: vi.fn().mockImplementation(function (config) {
    h.clusterConfig = config;
    return { clearMarkers: vi.fn() };
  }),
}));

vi.mock('@/config', () => ({
  config: {
    googleMapsApiKey: 'test-key',
    googleMapId: 'test-map-id',
  },
}));

vi.mock('@/composables/useTheme', () => ({
  useAppTheme: () => ({
    theme: { value: 'light' },
  }),
}));

vi.mock('nuxt/app', () => ({
  useRouter: () => ({
    currentRoute: {
      value: {
        get fullPath() {
          return h.fullPath;
        },
      },
    },
  }),
}));

const waitForMap = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

describe('Map', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.fullPath = '/map/search';
    h.markerInstances = [];
    h.markerElements = [];
    h.clusterConfig = null;

    global.MutationObserver = vi.fn().mockImplementation(function () {
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
    }) as unknown as typeof MutationObserver;

    global.google = {
      maps: {
        Map: vi.fn().mockImplementation(function () {
          return h.map;
        }),
        LatLngBounds: vi.fn().mockImplementation(function () {
          return h.bounds;
        }),
        LatLng: vi.fn().mockImplementation(function (lat, lng) {
          return { lat, lng };
        }),
        InfoWindow: vi.fn().mockImplementation(function () {
          return h.infoWindow;
        }),
        event: {
          clearInstanceListeners: vi.fn(),
        },
        ControlPosition: {
          RIGHT_BOTTOM: 'RIGHT_BOTTOM',
        },
        ColorScheme: {
          LIGHT: 'LIGHT',
          DARK: 'DARK',
        },
        importLibrary: vi.fn().mockResolvedValue({
          AdvancedMarkerElement: vi.fn().mockImplementation(function (config) {
            const instance = {
              ...config,
              listeners: {} as Record<string, () => void>,
              addListener: vi.fn((name: string, cb: () => void) => {
                instance.listeners[name] = cb;
              }),
            };
            h.markerInstances.push(instance);
            return instance;
          }),
          PinElement: vi.fn().mockImplementation(function () {
            const element = {
              listeners: {} as Record<string, () => void>,
              addEventListener: vi.fn((name: string, cb: () => void) => {
                element.listeners[name] = cb;
              }),
            };
            h.markerElements.push(element);
            return { element };
          }),
        }),
      },
    } as any;

    vi.stubGlobal('setTimeout', vi.fn((cb: () => void) => {
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the empty-state message when no events are provided', () => {
    const wrapper = mount(Map, {
      props: {
        events: [],
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    expect(wrapper.text()).toContain('Could not find any events with a location.');
  });

  it('groups events by location before creating markers and emits the marker data', async () => {
    const events = [
      {
        id: 'e1',
        title: 'First',
        locationName: 'Phoenix',
        location: { latitude: 33.4, longitude: -111.9 },
      },
      {
        id: 'e2',
        title: 'Second',
        locationName: 'Phoenix',
        location: { latitude: 33.4, longitude: -111.9 },
      },
      {
        id: 'e3',
        title: 'Third',
        locationName: 'Tempe',
        location: { latitude: 33.5, longitude: -111.8 },
      },
    ] as Event[];

    const wrapper = mount(Map, {
      props: {
        events,
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    await waitForMap();

    const markerMap = wrapper.emitted('setMarkerData')?.[0]?.[0]?.markerMap;
    expect({
      markerCount: h.markerInstances.length,
      groupedLocations: Object.keys(markerMap.markers).length,
      eventsAtFirstLocation: markerMap.markers['33.4-111.9']?.numberOfEvents,
    }).toEqual({
      markerCount: 2,
      groupedLocations: 2,
      eventsAtFirstLocation: 2,
    });
  });

  it('emits preview events for a single-event marker click', async () => {
    const event = {
      id: 'e1',
      title: 'First',
      locationName: 'Phoenix',
      location: { latitude: 33.4, longitude: -111.9 },
    } as Event;

    const wrapper = mount(Map, {
      props: {
        events: [event],
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    await waitForMap();
    h.markerInstances[0]?.listeners['gmp-click']?.();

    expect({
      highlighted: wrapper.emitted('highlightEvent')?.[0],
      previewed: wrapper.emitted('openPreview')?.[0],
      locked: wrapper.emitted('lockColors')?.length,
    }).toEqual({
      highlighted: ['33.4-111.9', 'e1', event, true, true],
      previewed: [event, true],
      locked: 1,
    });
  });

  it('shows hover info and emits unHighlight on marker leave when the route is pinned to that location', async () => {
    const event = {
      id: 'e1',
      title: 'First',
      locationName: 'Phoenix',
      location: { latitude: 33.4, longitude: -111.9 },
    } as Event;
    h.fullPath = '/map/search#33.4-111.9';

    const wrapper = mount(Map, {
      props: {
        events: [event],
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    await waitForMap();
    h.markerElements[0]?.listeners.mouseenter?.();
    h.markerElements[0]?.listeners.mouseleave?.();

    expect({
      hovered: wrapper.emitted('highlightEvent')?.[0],
      closed: h.infoWindow.close.mock.calls.length,
      unhighlighted: wrapper.emitted('unHighlight')?.length,
    }).toEqual({
      hovered: ['33.4-111.9', 'e1', event, true, false],
      closed: 1,
      unhighlighted: 1,
    });
  });

  it('fits bounds and caps the zoom after creating the map', async () => {
    mount(Map, {
      props: {
        events: [
          {
            id: 'e1',
            title: 'First',
            locationName: 'Phoenix',
            location: { latitude: 33.4, longitude: -111.9 },
          } as Event,
        ],
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    await waitForMap();

    expect({
      fitBounds: h.map.fitBounds.mock.calls.length,
      setZoom: h.map.setZoom.mock.calls[0],
    }).toEqual({
      fitBounds: 1,
      setZoom: [15],
    });
  });

  it('zooms into the clicked cluster', async () => {
    mount(Map, {
      props: {
        events: [
          {
            id: 'e1',
            title: 'First',
            locationName: 'Phoenix',
            location: { latitude: 33.4, longitude: -111.9 },
          } as Event,
        ],
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    await waitForMap();
    h.clusterConfig?.map.fitBounds.mockClear();
    h.clusterConfig?.map.setZoom.mockClear();
    h.clusterConfig?.onClusterClick(
      {},
      { bounds: { north: 1 } },
      h.clusterConfig.map
    );

    expect({
      fitBounds: h.clusterConfig?.map.fitBounds.mock.calls[0],
      setZoom: h.clusterConfig?.map.setZoom.mock.calls[0],
    }).toEqual({
      fitBounds: [{ north: 1 }],
      setZoom: [17],
    });
  });
});
