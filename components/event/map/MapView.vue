<script setup lang="ts">
import { ref, computed } from "vue";
import type { Ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import EventPreview from "../list/EventPreview.vue";
import EventList from "../list/EventList.vue";
import PreviewContainer from "../list/PreviewContainer.vue";
import CloseButton from "../../buttons/CloseButton.vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import ErrorBanner from "../../ErrorBanner.vue";
import {
  chronologicalOrder,
  reverseChronologicalOrder,
} from "../list/filters/filterStrings";
import { timeShortcutValues } from "../list/filters/eventSearchOptions";
import EventFilterBar from "../list/filters/EventFilterBar.vue";
import TimeShortcuts from "../list/filters/TimeShortcuts.vue";
import TwoSeparatelyScrollingPanes from "@/components/TwoSeparatelyScrollingPanes.vue";
import gql from "graphql-tag";
import type { Event as EventData } from "@/src/__generated__/graphql";
import placeIcon from "@/assets/images/place-icon.svg";
import highlightedPlaceIcon from "@/assets/images/highlighted-place-icon.svg";
import type { SearchEventValues } from "@/types/Event";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import getEventWhere from "../list/filters/getEventWhere";
import { GET_EVENTS } from "@/graphQLData/event/queries";

// Client-side rendering for EventMap
let EventMap: any;
if (import.meta.client) {
  EventMap = defineAsyncComponent(() => import("./Map.vue"));
}

// Setup function
const { mdAndUp } = useDisplay();
const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  return typeof route.params.channelId === "string"
    ? route.params.channelId
    : "";
});
const showOnlineOnly = route.name === "SearchEventsList";
const showInPersonOnly =
  route.name === "MapEventPreview" || route.name === "MapView";

const filterValues: Ref<SearchEventValues> = ref(
  getFilterValuesFromParams({
    route: route,
    channelId: channelId.value,
    showOnlineOnly,
    showInPersonOnly,
  })
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
    channelId: channelId.value,
    onlineOnly: false,
  });
});

const {
  error: eventError,
  result: eventResult,
  loading: eventLoading,
  onResult: onGetEventResult,
  fetchMore,
} = useQuery(GET_EVENTS, {
  limit: 25,
  offset: 0,
  where: eventWhere,
  resultsOrder: resultsOrder,
});

onGetEventResult((value) => {
  // If the preview pane is blank, fill it with the details
  // of the first result, if there is one.
  if (!value.data || value.data.events.length === 0) {
    return;
  }
  const defaultSelectedEvent = value.data.events[0].id;

  sendToPreview(defaultSelectedEvent, "");
});

const previewIsOpen = ref(false);
const sendToPreview = (eventId: string, eventLocationId: string) => {
  if (eventId) {
    const escapedEventLocationId = eventLocationId
      ? CSS.escape(eventLocationId)
      : "";

    if (!channelId.value) {
      router.push({
        name: "MapEventPreview",
        params: {
          eventId,
        },
        hash: `#${escapedEventLocationId}`,
        query: route.query,
      });
    } else {
      router.push({
        name: "SearchEventPreview",
        params: {
          eventId,
        },
        hash: `#${escapedEventLocationId}`,
        query: route.query,
      });
    }
  }
};

const loadMore = () => {
  fetchMore({
    variables: {
      offset: eventResult.value.events.length,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;

      return {
        ...previousResult,
        events: [...previousResult.events, ...fetchMoreResult.events],
      };
    },
  });
};

const createEventPath = computed(() => {
  return channelId.value
    ? `/channels/c/${channelId.value}/events/create`
    : "/events/create";
});

const GET_THEME = gql`
  query GetTheme {
    theme @client
  }
`;

const { result } = useQuery(GET_THEME);

const theme = computed(() => {
  return result.value?.theme || "light";
});

// State and data management
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

// Method definitions
const updateFilters = (params: SearchEventValues) => {
  const existingQuery = route.query;
  // Updating the URL params causes the events
  // to be refetched by the EventListView
  // and MapView components
  router.replace({
    // @ts-ignore
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
      (c: string) => c !== channel
    );
  } else {
    filterValues.value.channels.push(channel);
  }
  updateFilters({ channels: channel });
};

const filterByTag = (tag: string) => {
  const alreadySelected = filterValues.value.tags.includes(tag);

  if (alreadySelected) {
    filterValues.value.tags = filterValues.value.tags.filter(
      (t: string) => t !== tag
    );
  } else {
    filterValues.value.tags.push(tag);
  }
  updateFilters({ tags: tag });
};

const setMarkerData = (data: any) => {
  mobileMap.value = data.map;
  mobileMarkerMap.value = data.markerMap;

  // Keep desktop and mobile maps consistent
  desktopMap.value = data.map;
  desktopMarkerMap.value = data.markerMap;
};

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

    // If the user mouses over a map marker with multiple events,
    // open a generic infowindow.
    if (clickedMapMarker && numberOfEvents > 1) {
      // Dispatch a custom event to indicate InfoWindow is open
      // so the Cypress test can wait for it to open
      window.dispatchEvent(
        new CustomEvent("GenericInfoWindowOpen", {
          detail: {
            numberOfEvents,
          },
        })
      );
      openGenericInfowindow();
    }

    // If the user mouses over a map marker with a single event,
    // open a specific infowindow.
    else if (clickedMapMarker && numberOfEvents === 1) {
      const defaultEventId = Object.keys(markerMap[eventLocationId].events)[0];
      highlightedEventId.value = defaultEventId;

      // Dispatch a custom event to indicate InfoWindow is open
      // so the Cypress test can wait for it to open
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

    // If the user mouses over an event list item in the event list,
    // always open a specific infowindow.
    else if (eventId) {
      highlightedEventId.value = eventId;

      // Dispatch a custom event to indicate InfoWindow is open
      // so the Cypress test can wait for it to open
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
      const selectedEventsArray = getArrayFromObject(selectedEventsObject);

      selectedEvents.value = selectedEventsArray;
    }
  }
};

const highlightEvent = (
  eventLocationId: string,
  eventId: string,
  eventData: EventData,
  clickedMapMarker: boolean | false
) => {
  sendToPreview(eventId, eventLocationId);

  highlightedEventLocationId.value = eventLocationId;

  // Keep desktop and mobile maps in sync
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
  // Keep desktop and mobile map markers consistent
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

const openPreview = (event: EventData, openedFromMap: boolean | false) => {
  if (openedFromMap) {
    // When opening from a map, count how
    // many events are at the clicked location.
    // If there is one event, open the preview for
    // that event. If there is more than one,
    // open a preview for multiple events.
    const eventsAtClickedLocation =
      // We assume desktop and mobile marker maps are in sync.
      desktopMarkerMap.value[highlightedEventLocationId.value].numberOfEvents;

    if (eventsAtClickedLocation > 1) {
      multipleEventPreviewIsOpen.value = true;
    } else {
      eventPreviewIsOpen.value = true;
    }
  } else {
    // If opened from a list,
    // always preview a specific event.
    eventPreviewIsOpen.value = true;
  }
  selectedEvent.value = event;
  colorLocked.value = true;
};
</script>

<template>
  <div class="h-full bg-gray-100 dark:bg-gray-900">
    <div v-if="mdAndUp" id="mapViewFullScreen">
      <TwoSeparatelyScrollingPanes
        class="mt-3"
        :show-right-pane-at-medium-screen-width="true"
      >
        <template #leftpane>
          <div class="flex justify-center rounded-lg">
            <div class="h-screen overflow-auto p-4">
              <EventFilterBar
                :show-map="true"
                :allow-hiding-main-filters="true"
                :show-main-filters-by-default="true"
              >
                <TimeShortcuts />
              </EventFilterBar>

              <div v-if="eventLoading">Loading...</div>
              <ErrorBanner
                v-else-if="eventError"
                class="block"
                :text="eventError.message"
              />
              <EventList
                v-else-if="eventResult && eventResult.events"
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
                :show-map="true"
                @filter-by-tag="filterByTag"
                @filter-by-channel="filterByChannel"
                @highlight-event="highlightEvent"
                @open-preview="openPreview"
                @unhighlight="unhighlight"
              />
            </div>
          </div>
        </template>
        <template #rightpane>
          <div style="right: 0; width: 50vw">
            <div class="event-map-container">
              <div v-if="eventLoading">Loading...</div>
              <ErrorBanner
                v-else-if="eventError"
                class="block"
                :text="eventError.message"
              />
              <EventMap
                v-else-if="
                  eventResult &&
                  eventResult.events &&
                  eventResult.events.length > 0
                "
                :key="eventResult.events.length"
                class="fixed"
                :events="eventResult.events"
                :preview-is-open="
                  eventPreviewIsOpen || multipleEventPreviewIsOpen
                "
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
        </template>
      </TwoSeparatelyScrollingPanes>
    </div>

    <div
      v-else-if="eventResult && eventResult.events"
      id="mapViewMobileWidth"
      class="p-4"
    >
      <div>
        <div>
          <TimeShortcuts />
        </div>
        <div class="event-map-container" />
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
          <EventFilterBar
            class="mt-6 w-full"
            :show-map="true"
            :allow-hiding-main-filters="true"
            :show-main-filters-by-default="true"
          />
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
        <router-view />
      </PreviewContainer>
    </PreviewContainer>
  </div>
</template>

<style>
.event-map-container {
  position: relative;
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
