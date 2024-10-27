<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRouter, useRoute } from "vue-router";
import { useDisplay } from "vuetify";

import EventPreview from "../list/EventPreview.vue";
import EventList from "../list/EventList.vue";
import EventMap from "./Map.vue";
import PreviewContainer from "../list/PreviewContainer.vue";
import CloseButton from "../../CloseButton.vue";
import ErrorBanner from "../../ErrorBanner.vue";
import EventFilterBar from "../list/filters/EventFilterBar.vue";
import TimeShortcuts from "../list/filters/TimeShortcuts.vue";
import { GET_EVENTS } from "@/graphQLData/event/queries";
import getEventWhere from "../list/filters/getEventWhere";
import { getFilterValuesFromParams } from "../list/filters/getFilterValuesFromParams";
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
import { themeVar } from "@/cache";

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

const { mdAndUp } = useDisplay();
const route = useRoute();
const router = useRouter();
const showOnlineOnly = route.name === "events-list-search";
const showInPersonOnly =
  route.name === "map-search-eventId" || route.name === "map-search";

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
  (query) => {
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
} = useQuery(GET_EVENTS, {
  limit: 25,
  offset: 0,
  where: eventWhere,
  resultsOrder: resultsOrder,
});

onGetEventResult((value) => {
  if (!value.data || value.data.events.length === 0) {
    return;
  }
  const defaultSelectedEvent = value.data.events[0].id;
  sendToPreview(defaultSelectedEvent.id, "");
});

const sendToPreview = (eventId: string, eventLocationId: string) => {
  if (eventId) {
    const escapedEventLocationId = eventLocationId
      ? CSS.escape(eventLocationId)
      : "";
    router.push({
      name: "map-search-eventId",
      params: { eventId },
      hash: `#${escapedEventLocationId}`,
      query: route.query,
    });
  }
};

const theme = computed(() => {
  return themeVar() || "dark";
});

// Data functions and properties from `data` and `methods` section
// const highlightedMarker = ref(null);
const mobileMarkerMap = ref<any>({});
const desktopMarkerMap = ref<any>({});
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
  router.replace({
    query: {
      ...existingQuery,
      ...params,
    },
  });
};

const filterByChannel = (channel: string) => {
  const alreadySelected = filterValues.value.channels.includes(channel);
  if (alreadySelected) {
    filterValues.value.channels = filterValues.value.channels.filter(
      (c) => c !== channel
    );
  } else {
    filterValues.value.channels.push(channel);
  }
  updateFilters({ channels: channel });
};

const filterByTag = (tag: string) => {
  const alreadySelected = filterValues.value.tags.includes(tag);
  if (alreadySelected) {
    filterValues.value.tags = filterValues.value.tags.filter((t) => t !== tag);
  } else {
    filterValues.value.tags.push(tag);
  }
  updateFilters({ tags: tag });
};

const setMarkerData = (data: any) => {
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

const highlightEventOnMap = ({
  eventId,
  eventLocationId,
  eventData,
  clickedMapMarker,
  markerMap,
  map,
}: any) => {
  if (eventId) {
    if (
      markerMap[eventLocationId] &&
      markerMap[eventLocationId].events[eventId]
    ) {
      selectedEvent.value = markerMap[eventLocationId].events[eventId];
    } else if (eventData) {
      selectedEvent.value = eventData;
    } else {
      throw new Error("Could not find the event data.");
    }
  }

  if (markerMap[eventLocationId]) {
    markerMap[eventLocationId].marker.setIcon({
      url: highlightedPlaceIcon,
      scaledSize: { width: 20, height: 20 },
    });

    const openSpecificInfowindow = () => {
      const eventTitle =
        markerMap[eventLocationId].events[highlightedEventId.value].title;
      const eventLocation =
        markerMap[eventLocationId].events[highlightedEventId.value]
          .locationName;

      let infowindowContent = `<b>${eventTitle}</b>`;

      if (eventLocation) {
        infowindowContent = `<div data-testid="infowindow" style="text-align:center"><b>${eventTitle}</b></div></div><div style="text-align:center">at ${eventLocation}</div>`;
      }
      markerMap.infowindow.setContent(infowindowContent);
      markerMap.infowindow.open({
        anchor: markerMap[eventLocationId].marker,
        map,
        shouldFocus: false,
      });
    };

    const numberOfEvents = markerMap[eventLocationId].numberOfEvents;

    const openGenericInfowindow = () => {
      markerMap.infowindow.setContent(`${numberOfEvents} events`);
      markerMap.infowindow.open({
        anchor: markerMap[eventLocationId].marker,
        map,
        shouldFocus: false,
      });
    };

    const eventTitle =
      markerMap[eventLocationId].events[highlightedEventId.value]?.title;
    const eventLocation =
      markerMap[eventLocationId].events[highlightedEventId.value]?.locationName;

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
      const defaultEventId = Object.keys(markerMap[eventLocationId].events)[0];
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
      const selectedEventsObject = markerMap[eventLocationId].events;
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
  sendToPreview(eventId, eventLocationId);
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
};

const unhighlightEventOnMap = (markerMap: any) => {
  if (!colorLocked.value) {
    if (markerMap.infowindow) {
      markerMap.infowindow.close();
    }

    if (markerMap[highlightedEventLocationId.value]) {
      markerMap[highlightedEventLocationId.value].marker.setIcon({
        url: placeIcon,
        scaledSize: { width: 20, height: 20 },
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
      desktopMarkerMap.value[highlightedEventLocationId.value].numberOfEvents;
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
    <div
      class="fixed top-0 w-full h-34 mt-12 bg-gray-800 text-white flex items-center justify-center z-10"
    >
      <div class="w-full flex justify-center z-10 bg-gray-100 dark:bg-gray-900">
        <div class="flex max-w-7xl my-4">
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

    <div
      v-if="isClientSide && mdAndUp"
      class="flex flex-grow bg-white dark:bg-black"
    >
      <div class="w-1/2">
        <div class="space-y-4">
          <div v-if="eventLoading">Loading...</div>
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

      <div class="w-1/2 h-screen bg-gray-300 dark:bg-black p-4 fixed right-0">
        <div v-if="eventLoading">Loading...</div>
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
          :theme="theme"
          @highlight-event="highlightEvent"
          @open-preview="openPreview"
          @lock-colors="colorLocked = true"
          @set-marker-data="setMarkerData"
        />
      </div>
    </div>
    <div
      v-else-if="eventResult && eventResult.events"
      id="mapViewMobileWidth"
      class="p-4 mt-52"
    >
      <div class="event-map-container">
        <EventMap
          v-if="eventResult.events.length > 0"
          :events="eventResult.events"
          :preview-is-open="eventPreviewIsOpen || multipleEventPreviewIsOpen"
          :color-locked="colorLocked"
          :use-mobile-styles="true"
          :theme="theme"
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

    <EventPreview
      :top-layer="true"
      :is-open="eventPreviewIsOpen && !multipleEventPreviewIsOpen"
      @close-preview="closeEventPreview"
    />
    <PreviewContainer
      :is-open="multipleEventPreviewIsOpen"
      :header="'Events at this Location'"
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
  </div>
</template>

<style>
.event-map-container {
  position: relative;
  width: 50vw;
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
