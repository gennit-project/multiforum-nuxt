<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useRouter } from 'nuxt/app';
import { config } from '@/config';
import nightModeMapStyles from '@/components/event/map/nightModeMapStyles';
import placeIcon from '@/assets/images/place-icon.svg';
import { useAppTheme } from '@/composables/useTheme';
import type { Event } from '@/__generated__/graphql';

export interface MarkerData {
  marker: any; // Changed to any since we can have both legacy and advanced markers
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
    const marker = markerData.marker;

    if (marker) {
      // Handle both legacy and advanced markers
      if (marker.setMap) {
        marker.setMap(null);
      }
      if (marker.map) {
        marker.map = null;
      }
      google.maps.event.clearInstanceListeners(marker);
    }
  }
  markerMap = {
    markers: {},
  };
};

const getMapStyles = () => {
  return currentTheme.value === 'dark' ? nightModeMapStyles : [];
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

  props.events.forEach((event) => {
    if (!event.location) return;

    const position = {
      lat: event.location.latitude,
      lng: event.location.longitude,
    };

    // IMPORTANT: don't set map here; let the clusterer handle it.
    const marker = new google.maps.Marker({
      position,
      title: `Click to view event: ${event.title}`,
    });

    bounds.extend(new google.maps.LatLng(position.lat, position.lng));

    const eventLocationId = `${event.location.latitude}${event.location.longitude}`;

    if (props.useMobileStyles) {
      marker.addListener('click', () => {
        emit('highlightEvent', eventLocationId, event.id, event, true, true);
        emit('openPreview', event, true);
        emit('lockColors');
      });
    } else {
      marker.addListener('click', () => {
        emit('openPreview', event, true);
        emit('lockColors');
      });

      marker.addListener('mouseover', () => {
        if (!props.colorLocked) {
          emit('highlightEvent', eventLocationId, event.id, event, true, true);
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

    // keep your markerMap bookkeeping
    if (markerMap.markers[eventLocationId]) {
      markerMap.markers[eventLocationId].events[event.id] = event;
      markerMap.markers[eventLocationId].numberOfEvents += 1;
      markerMap.markers[eventLocationId].marker = marker;
    } else {
      markerMap.markers[eventLocationId] = {
        marker,
        events: { [event.id]: event },
        numberOfEvents: 1,
      };
    }

    markers.push(marker);
  });

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
