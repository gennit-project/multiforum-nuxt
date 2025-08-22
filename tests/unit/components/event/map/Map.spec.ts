import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Map from '@/components/event/map/Map.vue';
import type { Event } from '@/__generated__/graphql';

// Mock the Google Maps API and MarkerClusterer
const mockMap = {
  fitBounds: vi.fn(),
  getZoom: vi.fn().mockReturnValue(10),
  setZoom: vi.fn(),
};

const mockMarker = {
  getPosition: vi.fn().mockReturnValue({}),
  addListener: vi.fn(),
  setMap: vi.fn(),
  setIcon: vi.fn(),
  getMap: vi.fn().mockReturnValue({}), // Mock getMap to return a map object
};

const mockBounds = {
  extend: vi.fn(),
  isEmpty: vi.fn().mockReturnValue(false),
};

const mockInfoWindow = vi.fn();

const mockMarkerClusterer = {
  clearMarkers: vi.fn(),
};

// Mock Google Maps
global.google = {
  maps: {
    Map: vi.fn().mockImplementation(() => mockMap),
    Marker: vi.fn().mockImplementation(() => mockMarker),
    LatLngBounds: vi.fn().mockImplementation(() => mockBounds),
    LatLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    InfoWindow: vi.fn().mockImplementation(() => mockInfoWindow),
    event: {
      clearInstanceListeners: vi.fn(),
    },
    ControlPosition: {
      RIGHT_TOP: 1,
    },
  },
} as any;

// Mock MarkerClusterer
vi.mock('@googlemaps/markerclusterer', () => ({
  MarkerClusterer: vi.fn().mockImplementation(() => mockMarkerClusterer),
}));

// Mock the loader
vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue({}),
  })),
}));

// Mock config
vi.mock('@/config', () => ({
  config: {
    googleMapsApiKey: 'test-key',
  },
}));

// Mock theme composable
vi.mock('@/composables/useTheme', () => ({
  useAppTheme: () => ({
    theme: { value: 'light' },
  }),
}));

// Mock router
const mockRouter = {
  currentRoute: {
    value: {
      fullPath: '/test',
    },
  },
};
vi.mock('nuxt/app', () => ({
  useRouter: () => mockRouter,
}));

describe('Map with Clustering', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Event 1',
      location: {
        latitude: 33.4255,
        longitude: -111.94,
      },
    } as Event,
    {
      id: '2', 
      title: 'Event 2',
      location: {
        latitude: 33.4256, // Very close to first event
        longitude: -111.941,
      },
    } as Event,
    {
      id: '3',
      title: 'Event 3', 
      location: {
        latitude: 34.0522, // Different location
        longitude: -118.2437,
      },
    } as Event,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DOM elements
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock MutationObserver
    global.MutationObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock document
    Object.defineProperty(document, 'documentElement', {
      writable: true,
      configurable: true,
      value: {
        classList: {
          contains: vi.fn().mockReturnValue(false),
        },
      },
    });
  });

  it('should initialize MarkerClusterer with events', async () => {
    const { MarkerClusterer } = await import('@googlemaps/markerclusterer');
    
    const wrapper = mount(Map, {
      props: {
        events: mockEvents,
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    // Wait for component to mount and async renderMap to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verify MarkerClusterer was called
    expect(MarkerClusterer).toHaveBeenCalled();
    
    // Verify map was created
    expect(global.google.maps.Map).toHaveBeenCalled();
    
    // Verify markers were created for each event + 1 test marker
    expect(global.google.maps.Marker).toHaveBeenCalledTimes(mockEvents.length + 1);
  });

  it('should create MarkerClusterer with correct configuration', async () => {
    const { MarkerClusterer } = await import('@googlemaps/markerclusterer');
    
    const wrapper = mount(Map, {
      props: {
        events: mockEvents,
        colorLocked: false,
        previewIsOpen: false,
        useMobileStyles: false,
      },
    });

    // Wait for component to mount and async renderMap to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verify MarkerClusterer was called with correct parameters
    expect(MarkerClusterer).toHaveBeenCalledWith(
      expect.objectContaining({
        markers: expect.any(Array),
        map: expect.any(Object),
        onClusterClick: expect.any(Function),
      })
    );
    
    // Verify the correct number of markers were passed
    const call = (MarkerClusterer as any).mock.calls[0];
    const config = call[0];
    expect(config.markers).toHaveLength(mockEvents.length);
  });
});