<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useRouter } from 'nuxt/app';
import { config } from '@/config';
import { useAppTheme } from '@/composables/useTheme';
import type { Event } from '@/__generated__/graphql';

// Type for Google Maps markers - can be legacy or advanced markers
type GoogleMapMarker = google.maps.Marker | google.maps.marker.AdvancedMarkerElement;

export interface MarkerData {
  marker: GoogleMapMarker | null; // Can be legacy or advanced markers, null during initialization
  events: { [key: string]: Event };
  numberOfEvents: number;
}

export interface MarkerMap {
  markers: { [key: string]: MarkerData };
  infowindow?: google.maps.InfoWindow;
}

const props = defineProps({
  colorLocked: {
    type: Boolean,
    required: true,
  },
  events: {
    type: Array as () => Event[],
    default: () => [],
  },
  previewIsOpen: {
    type: Boolean,
    default: false,
  },
  useMobileStyles: {
    type: Boolean,
    required: true,
  },
});

const { theme: appTheme } = useAppTheme();
const currentTheme = ref('light');
onMounted(() => {
  currentTheme.value = appTheme.value;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isDark = document.documentElement.classList.contains('dark');
        currentTheme.value = isDark ? 'dark' : 'light';
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
});

const emit = defineEmits([
  'openPreview',
  'lockColors',
  'highlightEvent',
  'unHighlight',
  'setMarkerData',
]);

const router = useRouter();
const loader = new Loader({
  apiKey: config.googleMapsApiKey,
  version: 'weekly',
});

const mobileMapDiv = ref<HTMLElement | null>(null);
const desktopMapDiv = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const markerClusterer = ref<MarkerClusterer | null>(null);

let markerMap: MarkerMap = {
  markers: {},
};

const clearMarkers = () => {
  // Clear the marker clusterer first
  if (markerClusterer.value) {
    markerClusterer.value.clearMarkers();
    markerClusterer.value = null;
  }

  for (const key in markerMap.markers) {
    const markerData = markerMap.markers[key];
    if (!markerData) continue;
    const marker = markerData.marker;

    if (marker) {
      // Handle both legacy and advanced markers using type guards
      if ('setMap' in marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
      if ('map' in marker && marker.map !== undefined) {
        (marker as google.maps.marker.AdvancedMarkerElement).map = null;
      }
      google.maps.event.clearInstanceListeners(marker);
    }
  }
  markerMap = {
    markers: {},
  };
};

const renderMap = async () => {
  await loader.load();
  clearMarkers();
  if (map.value) map.value = null;

  const mapConfig = {
    center: { lat: 33.4255, lng: -111.94 },
    zoom: 7,
    mapTypeId: 'terrain',
    mapId: config.googleMapId,
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
  };

  map.value = new google.maps.Map(
    props.useMobileStyles ? mobileMapDiv.value! : desktopMapDiv.value!,
    mapConfig
  );

  const bounds = new google.maps.LatLngBounds();
  const infowindow = new google.maps.InfoWindow();
  const markers: google.maps.Marker[] = [];

  // First pass: group events by location and build markerMap
  props.events.forEach((event) => {
    if (!event.location) return;

    const eventLocationId = `${event.location.latitude}${event.location.longitude}`;

    if (markerMap.markers[eventLocationId]) {
      markerMap.markers[eventLocationId].events[event.id] = event;
      markerMap.markers[eventLocationId].numberOfEvents += 1;
    } else {
      markerMap.markers[eventLocationId] = {
        marker: null, // Will be created in second pass
        events: { [event.id]: event },
        numberOfEvents: 1,
      };
    }
  });

  // Second pass: create one marker per location with proper click handlers
  Object.keys(markerMap.markers).forEach((eventLocationId) => {
    const markerData = markerMap.markers[eventLocationId];
    if (!markerData) return;
    const eventsAtLocation = Object.values(markerData.events);
    const firstEvent = eventsAtLocation[0];

    if (!firstEvent?.location) return;

    const position = {
      lat: firstEvent.location.latitude,
      lng: firstEvent.location.longitude,
    };

    // Create marker title based on number of events
    const title =
      markerData.numberOfEvents === 1
        ? `Click to view event: ${firstEvent?.title || 'Untitled Event'}`
        : `Click to view ${markerData.numberOfEvents} events at this location`;

    // Create marker with map set - needed for event listeners to work properly
    const marker = new google.maps.Marker({
      position,
      title,
      map: map.value, // Set map so event listeners attach properly
    });

    bounds.extend(new google.maps.LatLng(position.lat, position.lng));

    // Set up click handlers at the marker/location level
    if (props.useMobileStyles) {
      marker.addListener('click', () => {
        if (markerData.numberOfEvents === 1 && firstEvent) {
          // Single event - open preview directly
          emit(
            'highlightEvent',
            eventLocationId,
            firstEvent.id,
            firstEvent,
            true,
            true
          );
          emit('openPreview', firstEvent, true);
        } else if (firstEvent) {
          // Multiple events - highlight location and open preview (MapView will handle showing list)
          emit('highlightEvent', eventLocationId, '', firstEvent, true, true);
          emit('openPreview', firstEvent, true);
        }
        emit('lockColors');
      });

      // Add hover functionality for mobile too
      marker.addListener('mouseover', () => {
        if (!props.colorLocked) {
          // Get current marker data from markerMap
          const currentMarkerData = markerMap.markers[eventLocationId];
          if (currentMarkerData) {
            // Show tooltip with event info on hover
            const content =
              currentMarkerData.numberOfEvents === 1
                ? `<div style="text-align:center"><b>${firstEvent?.title || 'Untitled Event'}</b>${firstEvent?.locationName ? `<br>at ${firstEvent.locationName}` : ''}</div>`
                : `<div style="text-align:center"><b>${currentMarkerData.numberOfEvents} events</b>${firstEvent?.locationName ? `<br>at ${firstEvent.locationName}` : ''}</div>`;

            infowindow.setContent(content);
            infowindow.open({
              anchor: marker,
              map: map.value,
              shouldFocus: false,
            });

            // For mouseover, just highlight the first event
            if (firstEvent) {
              emit(
                'highlightEvent',
                eventLocationId,
                firstEvent.id,
                firstEvent,
                true,
                false
              );
            }
          }
        }
      });

      marker.addListener('mouseout', () => {
        if (!props.colorLocked) {
          if (router.currentRoute.value.fullPath.includes(eventLocationId)) {
            emit('unHighlight');
          }
          infowindow.close();
        }
      });
    } else {
      marker.addListener('click', () => {
        if (markerData.numberOfEvents === 1 && firstEvent) {
          // Single event - open preview directly
          emit(
            'highlightEvent',
            eventLocationId,
            firstEvent.id,
            firstEvent,
            true,
            true
          );
          emit('openPreview', firstEvent, true);
        } else if (firstEvent) {
          // Multiple events - highlight location and open preview (MapView will handle showing list)
          emit('highlightEvent', eventLocationId, '', firstEvent, true, true);
          emit('openPreview', firstEvent, true);
        }
        emit('lockColors');
      });

      marker.addListener('mouseover', () => {
        if (!props.colorLocked) {
          // Get current marker data from markerMap
          const currentMarkerData = markerMap.markers[eventLocationId];
          if (currentMarkerData) {
            // Show tooltip with event info on hover
            const content =
              currentMarkerData.numberOfEvents === 1
                ? `<div style="text-align:center"><b>${firstEvent?.title || 'Untitled Event'}</b>${firstEvent?.locationName ? `<br>at ${firstEvent.locationName}` : ''}</div>`
                : `<div style="text-align:center"><b>${currentMarkerData.numberOfEvents} events</b>${firstEvent?.locationName ? `<br>at ${firstEvent.locationName}` : ''}</div>`;

            infowindow.setContent(content);
            infowindow.open({
              anchor: marker,
              map: map.value,
              shouldFocus: false,
            });

            // For mouseover, just highlight the first event
            if (firstEvent) {
              emit(
                'highlightEvent',
                eventLocationId,
                firstEvent.id,
                firstEvent,
                true,
                false
              );
            }
          }
        }
      });

      marker.addListener('mouseout', () => {
        if (!props.colorLocked) {
          if (router.currentRoute.value.fullPath.includes(eventLocationId)) {
            emit('unHighlight');
          }
          infowindow.close();
        }
      });
    }

    // Update markerMap with the created marker
    if (markerMap.markers[eventLocationId]) {
      markerMap.markers[eventLocationId].marker = marker;
    }
    markers.push(marker);
  });

  // First remove markers from map so clusterer can manage them properly
  markers.forEach((marker) => marker.setMap(null));

  // Cluster AFTER building markers. Pass map here.
  markerClusterer.value = new MarkerClusterer({
    markers,
    map: map.value!,
    onClusterClick: (event, cluster, clustererMap) => {
      const b = cluster.bounds;
      if (b) {
        clustererMap.fitBounds(b);
        const currentZoom = clustererMap.getZoom() || 0;
        const maxZoom = Math.min(currentZoom + 1, 18);
        setTimeout(() => clustererMap.setZoom(maxZoom), 200);
      }
    },
  });

  markerMap.infowindow = infowindow;

  // Test marker - create a simple test marker to see if events work
  const testMarker = new google.maps.Marker({
    position: { lat: 33.4255, lng: -111.94 },
    map: map.value,
    title: 'Test marker - should show console log on hover',
  });

  testMarker.addListener('mouseover', () => {
  });

  // fit and cap zoom
  if (!bounds.isEmpty()) {
    map.value.fitBounds(bounds);
    if ((map.value.getZoom() ?? 0) > 15) map.value.setZoom(15);
  }

  emit('setMarkerData', { markerMap, map: map.value });
};

onMounted(async () => {
  renderMap();
});

// Watch the theme value from the composable
watch(currentTheme, (newTheme, oldTheme) => {
  if (newTheme !== oldTheme) {
    renderMap();
  }
});

// Watch for mobile/desktop switch
watch(
  () => props.useMobileStyles,
  () => {
    renderMap();
  }
);
</script>

<template>
  <client-only>
    <div class="text-black">
      <p v-if="events.length === 0" class="mx-3">
        Could not find any events with a location.
      </p>
      <div
        v-else-if="useMobileStyles"
        ref="mobileMapDiv"
        class="mt-8 w-full"
        style="width: 100vw; height: 60vw; touch-action: pan-x pan-y"
      />
      <div
        v-else-if="!useMobileStyles"
        ref="desktopMapDiv"
        style="position: fixed; width: 50vw; height: 82vh; top: 170px; right: 0"
      />
    </div>
  </client-only>
</template>

<style>
.gm-style-iw > button {
  display: none !important;
}
</style>
