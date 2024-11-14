<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { Loader } from "@googlemaps/js-api-loader";
import { useRouter } from "vue-router";
import config from "@/config";
import nightModeMapStyles from "@/components/event/map/nightModeMapStyles";
import placeIcon from "@/assets/images/place-icon.svg";
// The Google map requires that the styles have to be set
// when the map is rendered and they can't change based on props.
// And if we render both mobile and desktop maps with the same map div,
// with the same ref, and just hide one with CSS, that doesn't work because
// all markers get painted on both maps twice. That's bad because if a
// map marker is highlighted, it calls the maps API excessively, and the markers
// appear to be un-highlighted due the duplicated and overlapping map
// markers. So the workaround is to create two different maps
// for desktop and mobile, which reference two different map divs.
interface Event {
  location: {
    latitude: number;
    longitude: number;
  };
  title: string;
  id: string;
}

interface MarkerMap {
  [key: string]: {
    marker: google.maps.Marker;
    events: { [key: string]: Event };
    numberOfEvents: number;
  };
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
  theme: {
    type: String,
    required: true,
  },
  useMobileStyles: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits([
  "openPreview",
  "lockColors",
  "highlightEvent",
  "unHighlight",
  "setMarkerData",
]);

const router = useRouter();
const loader = new Loader({
  apiKey: config.googleMapsApiKey,
  version: "weekly",
});

const mobileMapDiv = ref<HTMLElement | null>(null);
const desktopMapDiv = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);

let markerMap: MarkerMap = {};

const clearMarkers = () => {
  for (const key in markerMap) {
    const markerData = markerMap[key];
    const marker = markerData.marker;

    if (marker && marker.getMap() !== null) {
      marker.setMap(null);
      google.maps.event.clearInstanceListeners(marker);
    }
  }
  markerMap = {};
};

const renderMap = async () => {
  await loader.load();
  clearMarkers();

  const mapConfig = {
    center: { lat: 33.4255, lng: -111.94 },
    zoom: 7,
    mapTypeId: "terrain",
    styles: props.theme === "dark" ? nightModeMapStyles : [],
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
  };

  map.value = new google.maps.Map(
    props.useMobileStyles ? mobileMapDiv.value! : desktopMapDiv.value!,
    mapConfig
  );

  const bounds = new google.maps.LatLngBounds();
  const infowindow = new google.maps.InfoWindow();

  props.events.forEach((event) => {
    if (event.location) {
      const marker = new google.maps.Marker({
        title: `Click to view event: ${event.title}`,
        position: {
          lat: event.location.latitude,
          lng: event.location.longitude,
        },
        map: map.value,
        clickable: true,
        draggable: false,
        icon: {
          url: placeIcon,
          scaledSize: { width: 20, height: 20, equals: () => false },
        },
      });

      bounds.extend(marker.getPosition()!);

      const eventLocationId =
        event.location.latitude.toString() +
        event.location.longitude.toString();

      marker.addListener("click", () => {
        emit("openPreview", event, true);
        emit("lockColors");
      });

      marker.addListener("mouseover", () => {
        if (!props.colorLocked) {
          emit("highlightEvent", eventLocationId, event.id, event, true);
        }
      });

      marker.addListener("mouseout", () => {
        const unhighlight = () => {
          if (!props.colorLocked) {
            if (router.currentRoute.value.fullPath.includes(eventLocationId)) {
              emit("unHighlight");
            }

            marker.setIcon({
              url: placeIcon,
              scaledSize: { width: 20, height: 20 },
            });
            infowindow.close();
          }
        };
        unhighlight(marker);
      });

      const updateMarkerMap = () => {
        if (markerMap[eventLocationId]) {
          markerMap[eventLocationId].events[event.id] = event;
          markerMap[eventLocationId].numberOfEvents += 1;
          markerMap[eventLocationId].marker = marker;
        } else {
          markerMap[eventLocationId] = {
            marker,
            events: { [event.id]: event },
            numberOfEvents: 1,
          };
        }
      };

      updateMarkerMap();
    }
  });

  markerMap.infowindow = infowindow;

  map.value.fitBounds(bounds);
  if (map.value.getZoom() > 15) {
    map.value.setZoom(15);
  }

  emit("setMarkerData", {
    markerMap,
    map: map.value,
  });
};

onMounted(async () => {
  renderMap();
});

const theme = computed(() => props.theme);

watch(
  theme,
  () => {
    renderMap();
  },
  { immediate: true }
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
        style="width: 95vw; height: 50vw"
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
