<script setup lang="ts">
<<<<<<< HEAD
  import { ref, computed, watch } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { useRouter, useRoute } from "nuxt/app";
  import EventPreview from "../list/EventPreview.vue";
  import EventList from "../list/EventList.vue";
  import EventMap, { type MarkerMap } from "./Map.vue";
  import PreviewContainer from "../list/PreviewContainer.vue";
  import CloseButton from "../../CloseButton.vue";
  import ErrorBanner from "../../ErrorBanner.vue";
  import LoadingSpinner from "../../LoadingSpinner.vue";
  import EventFilterBar from "../list/filters/EventFilterBar.vue";
  import TimeShortcuts from "../list/filters/TimeShortcuts.vue";
  import { GET_EVENTS } from "@/graphQLData/event/queries";
  import getEventWhere from "../list/filters/getEventWhere";
  import { getFilterValuesFromParams } from "../list/filters/getEventFilterValuesFromParams";
  import { chronologicalOrder, reverseChronologicalOrder } from "../list/filters/filterStrings";
  import { timeShortcutValues } from "../list/filters/eventSearchOptions";
  import placeIcon from "@/assets/images/place-icon.svg";
  import highlightedPlaceIcon from "@/assets/images/highlighted-place-icon.svg";
  import type { Event as EventData } from "@/__generated__/graphql";
  import type { SearchEventValues } from "@/types/Event";
  import type { Ref, PropType } from "vue";
=======
import { ref, computed, watch } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRouter, useRoute } from "nuxt/app";
import { useDisplay } from "vuetify";
import EventPreview from "../list/EventPreview.vue";
import EventList from "../list/EventList.vue";
import EventMap, { type MarkerMap } from "./Map.vue";
import PreviewContainer from "../list/PreviewContainer.vue";
import CloseButton from "../../CloseButton.vue";
import ErrorBanner from "../../ErrorBanner.vue";
import LoadingSpinner from "../../LoadingSpinner.vue";
import EventFilterBar from "../list/filters/EventFilterBar.vue";
import TimeShortcuts from "../list/filters/TimeShortcuts.vue";
import { GET_EVENTS } from "@/graphQLData/event/queries";
import getEventWhere from "../list/filters/getEventWhere";
import { getFilterValuesFromParams } from "../list/filters/getEventFilterValuesFromParams";
import {
  chronologicalOrder,
  reverseChronologicalOrder,
} from "../list/filters/filterStrings";
import { timeShortcutValues } from "../list/filters/eventSearchOptions";
import placeIcon from "@/assets/images/place-icon.svg";
import highlightedPlaceIcon from "@/assets/images/highlighted-place-icon.svg";
import type { Event as EventData } from "@/__generated__/graphql";
import type { SearchEventValues } from "@/types/Event";
import type { Ref, PropType } from "vue";
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const props = defineProps({
  selectedTags: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
  selectedChannels: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
  channelId: {
    type: String,
    default: "",
  },
  searchInput: {
    type: String,
    default: "",
  },
});

defineEmits([
  "filterByTag",
  "filterByChannel",
  "highlightEvent",
  "openPreview",
  "unhighlight",
]);

<<<<<<< HEAD
  const mdAndUp = ref(true);
  if (import.meta.client) {
    mdAndUp.value = window.innerWidth >= 768;
    window.addEventListener("resize", () => {
      mdAndUp.value = window.innerWidth >= 768;
    });
  }
  const route = useRoute();
  const router = useRouter();
  const showOnlineOnly = route.name === "events-list-search";
  const showInPersonOnly = route.name === "map-search-eventId" || route.name === "map-search";
=======
const { mdAndUp } = useDisplay();
const route = useRoute();
const router = useRouter();
const showOnlineOnly = route.name === "events-list-search";
const showInPersonOnly =
  route.name === "map-search-eventId" || route.name === "map-search";
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const filterValues: Ref<SearchEventValues> = ref(
  getFilterValuesFromParams({
    route: route,
    channelId: props.channelId,
    showOnlineOnly,
    showInPersonOnly,
  })
);

// Watch route to update filter values when route changes
watch(
  () => route.query,
  () => {
    filterValues.value = getFilterValuesFromParams({
      route,
      channelId: props.channelId,
      showOnlineOnly,
      showInPersonOnly,
    });
  }
);

const resultsOrder = computed(() => {
  return filterValues.value.timeShortcut === timeShortcutValues.PAST_EVENTS
    ? reverseChronologicalOrder
    : chronologicalOrder;
});

const eventWhere = computed(() => {
  return getEventWhere({
    filterValues: filterValues.value,
    showMap: false,
    channelId: props.channelId,
    onlineOnly: false,
  });
});

const {
  error: eventError,
  result: eventResult,
  loading: eventLoading,
  onResult: onGetEventResult,
} = useQuery(
  GET_EVENTS,
  {
    limit: 25,
    offset: 0,
    where: eventWhere,
    resultsOrder: resultsOrder,
  },
  {
    fetchPolicy: "cache-first",
  }
);

onGetEventResult((value) => {
  if (!value.data || value.data.events.length === 0) {
    return;
  }
  const defaultSelectedEvent = value.data.events[0].id;
  sendToPreview(defaultSelectedEvent.id, "");
});

const sendToPreview = async (eventId: string, eventLocationId: string) => {
  if (eventId) {
    const escapedEventLocationId = eventLocationId
      ? CSS.escape(eventLocationId)
      : "";
    await router.push({
      name: "map-search-eventId",
      params: { eventId },
      hash: `#${escapedEventLocationId}`,
      query: route.query,
    });
  }
};

// Data functions and properties from `data` and `methods` section
// const highlightedMarker = ref(null);
const mobileMarkerMap = ref<MarkerMap>({ markers: {} });
const desktopMarkerMap = ref<MarkerMap>({ markers: {} });
const mobileMap = ref<any>({});
const desktopMap = ref<any>({});
const colorLocked = ref(false);
const eventPreviewIsOpen = ref(false);
const highlightedEventId = ref("");
const highlightedEventLocationId = ref("");
const multipleEventPreviewIsOpen = ref(false);
const selectedEvent = ref<EventData | null>(null);
const selectedEvents = ref<EventData[]>([]);

const updateFilters = (params: SearchEventValues) => {
  const existingQuery = route.query;
  const cleanedParams: Record<string, string> = {};

  for (const key in params) {
    const value = params[key as keyof SearchEventValues];
    if (value) {
      cleanedParams[key] = value as string;
    }
  }
  router.replace({
    query: {
      ...existingQuery,
      ...cleanedParams,
    },
  });
};

const filterByChannel = (channel: string) => {
  const alreadySelected = filterValues.value.channels?.includes(channel);
  if (alreadySelected) {
    if (!filterValues.value.channels) {
      // I know we already checked this in the if-statement above, but this
      // is just to fix a TypeScript error.
      return;
    }
    filterValues.value.channels = filterValues.value.channels.filter(
      (c) => c !== channel
    );
  } else {
    if (!filterValues.value.channels) {
      filterValues.value.channels = [];
    }
    filterValues.value.channels.push(channel);
  }
  updateFilters({ channels: [channel] });
};

const filterByTag = (tag: string) => {
  const alreadySelected = filterValues.value.tags?.includes(tag);
  if (alreadySelected) {
    if (!filterValues.value.tags) {
      // I know we already checked this in the if-statement above, but this
      // is just to fix a TypeScript error.
      return;
    }
    filterValues.value.tags = filterValues.value.tags.filter((t) => t !== tag);
  } else {
    if (!filterValues.value.tags) {
      filterValues.value.tags = [];
    }
    filterValues.value.tags.push(tag);
  }
  updateFilters({ tags: [tag] });
};

type SetMarkerDataInput = {
  map: any;
  markerMap: MarkerMap;
};

const setMarkerData = (data: SetMarkerDataInput) => {
  mobileMap.value = data.map;
  mobileMarkerMap.value = data.markerMap;

  desktopMap.value = data.map;
  desktopMarkerMap.value = data.markerMap;
};

// const updateMapCenter = (placeData: any) => {
//   const coords = {
//     lat: placeData.geometry.location.lat(),
//     lng: placeData.geometry.location.lng(),
//   };

//   mobileMap.value.setCenter(coords);
//   desktopMap.value.setCenter(coords);
// };

type HighlightEventInput = {
  eventId: string;
  eventLocationId: string;
  eventData: EventData;
  clickedMapMarker: boolean;
  markerMap: MarkerMap;
  map: any;
};

const highlightEventOnMap = (input: HighlightEventInput) => {
  const {
    eventId,
    eventLocationId,
    eventData,
    clickedMapMarker,
    markerMap,
    map,
  } = input;
  if (eventId) {
    if (
      markerMap.markers[eventLocationId] &&
      markerMap.markers[eventLocationId].events &&
      markerMap.markers[eventLocationId].events[eventId]
    ) {
      selectedEvent.value = markerMap.markers[eventLocationId].events[eventId];
    } else if (eventData) {
      selectedEvent.value = eventData;
    } else {
      throw new Error("Could not find the event data.");
    }
  }

  if (markerMap.markers[eventLocationId]) {
    // Use bigger icons on mobile for easier tapping
    const isMobile = window.innerWidth < 768; 
    markerMap.markers[eventLocationId].marker.setIcon({
      url: highlightedPlaceIcon,
      scaledSize: { 
        width: isMobile ? 30 : 20, 
        height: isMobile ? 30 : 20, 
        equals: () => false 
      },
    });

    const openSpecificInfowindow = () => {
      const eventTitle =
        markerMap.markers[eventLocationId].events[highlightedEventId.value].title;
      const eventLocation =
        markerMap.markers[eventLocationId].events[highlightedEventId.value]
          .locationName;

      let infowindowContent = `<b>${eventTitle}</b>`;

      if (eventLocation) {
        infowindowContent = `<div data-testid="infowindow" style="text-align:center"><b>${eventTitle}</b></div></div><div style="text-align:center">at ${eventLocation}</div>`;
      }
      markerMap.infowindow?.setContent(infowindowContent);
      markerMap.infowindow?.open({
        anchor: markerMap.markers[eventLocationId].marker,
        map,
        shouldFocus: false,
      });
    };

    const numberOfEvents = markerMap.markers[eventLocationId].numberOfEvents;

    const openGenericInfowindow = () => {
      markerMap.infowindow?.setContent(`${numberOfEvents} events`);
      markerMap.infowindow?.open({
        anchor: markerMap.markers[eventLocationId].marker,
        map,
        shouldFocus: false,
      });
    };

    const eventTitle =
      markerMap.markers[eventLocationId].events[highlightedEventId.value]?.title;
    const eventLocation =
      markerMap.markers[eventLocationId].events[highlightedEventId.value]?.locationName;

    if (clickedMapMarker && numberOfEvents > 1) {
      window.dispatchEvent(
        new CustomEvent("GenericInfoWindowOpen", {
          detail: {
            numberOfEvents,
          },
        })
      );
      openGenericInfowindow();
    } else if (clickedMapMarker && numberOfEvents === 1) {
      const defaultEventId = Object.keys(markerMap.markers[eventLocationId].events)[0];
      highlightedEventId.value = defaultEventId;

      window.dispatchEvent(
        new CustomEvent("SpecificInfoWindowOpen", {
          detail: {
            eventTitle,
            eventLocation,
          },
        })
      );
      openSpecificInfowindow();
    } else if (eventId) {
      highlightedEventId.value = eventId;

      window.dispatchEvent(
        new CustomEvent("SpecificInfoWindowOpen", {
          detail: {
            eventTitle,
            eventLocation,
          },
        })
      );
      openSpecificInfowindow();
    }

    if (numberOfEvents > 1) {
      const selectedEventsObject = markerMap.markers[eventLocationId].events;
      const getArrayFromObject = (obj: any) => {
        const ary = [];
        for (const key in obj) {
          ary.push(obj[key]);
        }
        return ary;
      };
      selectedEvents.value = getArrayFromObject(selectedEventsObject);
    }
  }
};

const highlightEvent = (
  eventLocationId: string,
  eventId: string,
  eventData: EventData,
  clickedMapMarker = false
) => {
  highlightedEventLocationId.value = eventLocationId;

  highlightEventOnMap({
    eventId,
    eventLocationId,
    eventData,
    clickedMapMarker,
    markerMap: mobileMarkerMap.value,
    map: mobileMap.value,
  });
  highlightEventOnMap({
    eventId,
    eventLocationId,
    eventData,
    clickedMapMarker,
    markerMap: desktopMarkerMap.value,
    map: desktopMap.value,
  });
  sendToPreview(eventId, eventLocationId);
};

const unhighlightEventOnMap = (markerMap: MarkerMap) => {
  if (!colorLocked.value) {
    markerMap.infowindow?.close();
    const locationId = highlightedEventLocationId.value;
    const markerData = markerMap.markers[locationId];
    
    if (markerData) {
      // Use bigger icons on mobile for easier tapping
      const isMobile = window.innerWidth < 768;
      markerData.marker?.setIcon({
        url: placeIcon,
        scaledSize: { 
          width: isMobile ? 30 : 20, 
          height: isMobile ? 30 : 20, 
          equals: () => false 
        },
      });
    }
    highlightedEventId.value = "";
    highlightedEventLocationId.value = "";
  }
};


const unhighlight = () => {
  unhighlightEventOnMap(mobileMarkerMap.value);
  unhighlightEventOnMap(desktopMarkerMap.value);
};

const closeEventPreview = () => {
  eventPreviewIsOpen.value = false;
  if (!multipleEventPreviewIsOpen.value) {
    colorLocked.value = false;
  }
  unhighlight();
};

const closeMultipleEventPreview = () => {
  multipleEventPreviewIsOpen.value = false;
  colorLocked.value = false;
  unhighlight();
};

const openPreview = (event: EventData, openedFromMap = false) => {
  if (openedFromMap) {
    const eventsAtClickedLocation =
      desktopMarkerMap.value.markers[highlightedEventLocationId.value].numberOfEvents;
    if (eventsAtClickedLocation > 1) {
      multipleEventPreviewIsOpen.value = true;
    } else {
      eventPreviewIsOpen.value = true;
    }
  } else {
    eventPreviewIsOpen.value = true;
  }
  selectedEvent.value = event;
  colorLocked.value = true;
};

const isClientSide = typeof window !== "undefined";

</script>

<template>
  <div class="flex flex-col">
    <client-only>
      <div
      :class="[
        mdAndUp ? 'fixed top-0' : '',
      ]"
        class="w-full h-34 mt-12 bg-gray-800 text-white flex items-center justify-center z-10"
      >
        <div
          class="w-full flex justify-center z-10 bg-gray-100 dark:bg-gray-900"
        >
          <div class="flex max-w-7xl mt-2">
            <EventFilterBar
              :show-map="true"
              :allow-hiding-main-filters="false"
              :show-main-filters-by-default="true"
            >
              <TimeShortcuts />
            </EventFilterBar>
          </div>
        </div>
      </div>

      <!-- Desktop View -->
      <div
        v-if="isClientSide && mdAndUp"
        class="flex flex-grow bg-white dark:bg-black"
      >
        <div class="w-1/2">
          <div class="space-y-4">
            <LoadingSpinner v-if="eventLoading" class="my-4 mx-auto" />
            <ErrorBanner
              v-else-if="eventError"
              class="block"
              :text="eventError.message"
            />
            <EventList
              v-else-if="eventResult && eventResult.events"
              key="highlightedEventId"
              class="mt-48 pt-0"
              :events="eventResult.events"
              :channel-id="channelId"
              :highlighted-event-location-id="highlightedEventLocationId"
              :highlighted-event-id="highlightedEventId"
              :search-input="filterValues.searchInput"
              :selected-tags="filterValues.tags"
              :selected-channels="filterValues.channels"
              :loaded-event-count="eventResult.events.length"
              :result-count="eventResult.eventsAggregate?.count"
              :show-map="true"
              @filter-by-tag="filterByTag"
              @filter-by-channel="filterByChannel"
              @highlight-event="highlightEvent"
              @open-preview="openPreview"
              @unhighlight="unhighlight"
            />
          </div>
        </div>

        <div class="w-1/2 h-screen bg-gray-300 dark:bg-black fixed right-0">
          <LoadingSpinner v-if="eventLoading" class="my-4 mx-auto" />
          <ErrorBanner
            v-else-if="eventError"
            class="block"
            :text="eventError.message"
          />
          <EventMap
            v-else-if="
              eventResult && eventResult.events && eventResult.events.length > 0
            "
            :key="eventResult.events.length"
            class="absolute inset-0"
            :events="eventResult.events"
            :preview-is-open="eventPreviewIsOpen || multipleEventPreviewIsOpen"
            :color-locked="colorLocked"
            :use-mobile-styles="false"
            @highlight-event="highlightEvent"
            @open-preview="openPreview"
            @lock-colors="colorLocked = true"
            @set-marker-data="setMarkerData"
          />
        </div>
      </div>
      
      <!-- Mobile View - Only render if NOT on desktop -->
      <template v-else>
        <LoadingSpinner v-if="eventLoading" class="my-4 mx-auto" />
        <ErrorBanner
          v-else-if="eventError"
          class="block"
          :text="eventError.message"
        />
        <div
          v-else-if="eventResult && eventResult.events"
          id="mapViewMobileWidth"
        >
          <div class="event-map-container w-full">
            <EventMap
              v-if="eventResult.events.length > 0"
              :events="eventResult.events"
              :preview-is-open="eventPreviewIsOpen || multipleEventPreviewIsOpen"
              :color-locked="colorLocked"
              :use-mobile-styles="true"
              @highlight-event="highlightEvent"
              @open-preview="openPreview"
              @lock-colors="colorLocked = true"
              @set-marker-data="setMarkerData"
            />
          </div>
          <div class="h-1/3 w-full">
            <div class="mx-auto">
              <EventList
                key="highlightedEventId"
                :events="eventResult.events"
                :channel-id="channelId"
                :highlighted-event-location-id="highlightedEventLocationId"
                :highlighted-event-id="highlightedEventId"
                :search-input="filterValues.searchInput"
                :selected-tags="filterValues.tags"
                :selected-channels="filterValues.channels"
                :loaded-event-count="eventResult.events.length"
                :result-count="eventResult.eventsAggregate?.count"
                @filter-by-tag="filterByTag"
                @filter-by-channel="filterByChannel"
                @highlight-event="highlightEvent"
                @open-preview="openPreview"
                @unhighlight="unhighlight"
              />
            </div>
          </div>
        </div>
      </template>

      <EventPreview
        :top-layer="true"
        :is-open="eventPreviewIsOpen && !multipleEventPreviewIsOpen"
        @close-preview="closeEventPreview"
      />
      <PreviewContainer
        :is-open="multipleEventPreviewIsOpen"
        :header="`Events at ${selectedEvent?.locationName || 'this Location'}`"
        @close-preview="closeMultipleEventPreview"
      >
        <EventList
          v-if="selectedEvents"
          class="overflow-auto overscroll-auto"
          :events="selectedEvents"
          :result-count="selectedEvents.length"
          :channel-id="channelId"
          :highlighted-event-id="highlightedEventId"
          :show-map="true"
          @highlight-event="highlightEvent"
          @open-preview="openPreview"
        />
        <div class="flex flex-shrink-0 justify-end px-4 py-4">
          <CloseButton @click="closeMultipleEventPreview" />
        </div>
        <PreviewContainer
          :is-open="multipleEventPreviewIsOpen && eventPreviewIsOpen"
          :top-layer="true"
          @close-preview="closeEventPreview"
        >
          <NuxtPage />
        </PreviewContainer>
      </PreviewContainer>
    </client-only>
  </div>
</template>

<style>
.event-map-container {
  position: relative;
  width: 100%;
}

.shortcut-buttons-wrapper {
  position: absolute;
  top: 0;
  z-index: 1;
  width: 100%;
  max-width: calc(
    100% - 1rem
  ); /* Adjusts the width to fit within the viewport */
  padding: 0 0.5rem; /* Adds padding on both sides */
  box-sizing: border-box;
}

.shortcut-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  border-radius: 4px;
}
</style>
