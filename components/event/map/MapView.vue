<script lang="ts">
import { defineComponent, PropType, ref, Ref, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import EventPreview from "../list/EventPreview.vue";
import EventList from "../list/EventList.vue";
import EventMap from "./Map.vue";
import PreviewContainer from "../list/PreviewContainer.vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import CloseButton from "../../buttons/CloseButton.vue";
import { useRoute } from "vue-router";
import { GET_EVENTS } from "@/graphQLData/event/queries";
import getEventWhere from "../list/filters/getEventWhere";
import { SearchEventValues } from "@/types/Event";
import { getFilterValuesFromParams } from "../list/filters/getFilterValuesFromParams";
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
import { Event as EventData } from "@/src/__generated__/graphql";
import placeIcon from "@/assets/images/place-icon.svg"
import highlightedPlaceIcon from "@/assets/images/highlighted-place-icon.svg"

export default defineComponent({
  name: "MapView",
  components: {
    CloseButton,
    ErrorBanner,
    EventFilterBar,
    EventList,
    EventMap,
    EventPreview,
    PreviewContainer,
    TimeShortcuts,
    TwoSeparatelyScrollingPanes,
  },
  // The SearchEvent component writes to the query
  // params, while the MapView and EventListView
  // components consume the query params.
  props: {
    selectedTags: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
    selectedChannels: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
    channelId: {
      type: String,
      default: "",
    },
    searchInput: {
      type: String,
      default: "",
    },
  },
  setup() {
    const { smAndDown } = useDisplay();
    const route = useRoute();
    const router = useRouter();
    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const backToChannel = computed(() => {
      if (typeof route.query.backToChannel === "string") {
        return route.query.backToChannel;
      }
      return "";
    });
    const showOnlineOnly = route.name === "SearchEventsList";
    const showInPersonOnly = route.name === "MapEventPreview" || route.name === "MapView";

    const filterValues: Ref<SearchEventValues> = ref(
      getFilterValuesFromParams({
        route: route,
        channelId: channelId.value,
        showOnlineOnly,
        showInPersonOnly,
      }),
    );

    const resultsOrder = computed(() => {
      if (filterValues.value.timeShortcut === timeShortcutValues.PAST_EVENTS) {
        return reverseChronologicalOrder;
      }
      return chronologicalOrder;
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
      refetch: refetchEvents,
      onResult: onGetEventResult,
      fetchMore,
    } = useQuery(GET_EVENTS, {
      limit: 25,
      offset: 0,
      where: eventWhere,
      resultsOrder: resultsOrder,
    });

    const reachedEndOfResults = ref(false);

    onGetEventResult((value) => {
      // If the preview pane is blank, fill it with the details
      // of the first result, if there is one.
      if (!value.data || value.data.events.length === 0) {
        return;
      }
      const defaultSelectedEvent = value.data.events[0].id;

      sendToPreview(defaultSelectedEvent.id, "");
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

    const createEventPath = channelId.value
      ? `/channels/c/${channelId.value}/events/create`
      : "/events/create";

    const { mdAndUp } = useDisplay();

    const GET_THEME = gql`
      query GetTheme {
        theme @client
      }
    `;

    const { result } = useQuery(GET_THEME);

    const theme = computed(() => {
      const theme = result.value?.theme || "light";
      return theme;
    });

    return {
      backToChannel,
      createEventPath,
      route,
      router,
      smAndDown,
      eventError,
      eventLoading,
      eventResult,
      filterValues,
      getFilterValuesFromParams,
      loadedEventCount: ref(0),
      mdAndUp,
      resultsOrder,
      eventWhere,
      loadMore,
      previewIsOpen,
      reachedEndOfResults,
      refetchEvents,
      resultCount: ref(0),
      showMap: ref(false),
      sendToPreview,
      showOnlineOnly,
      showInPersonOnly,
      theme,
    };
  },
  data() {
    return {
      highlightedMarker: null,
      mobileMarkerMap: {} as any,
      desktopMarkerMap: {} as any,
      mobileMap: {} as any,
      desktopMap: {} as any,
      colorLocked: false,
      eventPreviewIsOpen: false,
      highlightedEventId: "",
      highlightedEventLocationId: "",
      multipleEventPreviewIsOpen: false,
      selectedEvent: null as EventData | null,
      selectedEvents: [],
    };
  },
  created() {
    this.$watch("$route.query", () => {
      this.filterValues = getFilterValuesFromParams({
        route: this.route,
        channelId: this.channelId,
        showOnlineOnly: this.showOnlineOnly,
        showInPersonOnly: this.showInPersonOnly,
      });
    });
  },
  methods: {
    updateFilters(params: SearchEventValues) {
      const existingQuery = this.$route.query;
      // Updating the URL params causes the events
      // to be refetched by the EventListView
      // and MapView components
      this.$router.replace({
        query: {
          ...existingQuery,
          ...params,
        },
      });
    },
    filterByChannel(channel: string) {
      const alreadySelected = this.filterValues.channels.includes(channel);

      if (alreadySelected) {
        this.filterValues.channels = this.filterValues.channels.filter(
          (c: string) => c !== channel,
        );
      } else {
        this.filterValues.channels.push(channel);
      }
      this.updateFilters({ channels: channel });
    },
    filterByTag(tag: string) {
      const alreadySelected = this.filterValues.tags.includes(tag);

      if (alreadySelected) {
        this.filterValues.tags = this.filterValues.tags.filter(
          (t: string) => t !== tag,
        );
      } else {
        this.filterValues.tags.push(tag);
      }
      this.updateFilters({ tags: tag });
    },
    setMarkerData(data: any) {
      this.mobileMap = data.map;
      this.mobileMarkerMap = data.markerMap;

      // Keep desktop and mobile maps consistent
      this.desktopMap = data.map;
      this.desktopMarkerMap = data.markerMap;
    },
    updateMapCenter(placeData: any) {
      const coords = {
        lat: placeData.geometry.location.lat(),
        lng: placeData.geometry.location.lng(),
      };

      this.mobileMap.setCenter(coords);
      this.desktopMap.setCenter(coords);
    },
    highlightEventOnMap({
      eventId,
      eventLocationId,
      eventData,
      clickedMapMarker,
      markerMap,
      map,
    }: any) {
      if (eventId) {
        if (
          markerMap[eventLocationId] &&
          markerMap[eventLocationId].events[eventId]
        ) {
          this.selectedEvent = markerMap[eventLocationId].events[eventId];
        } else if (eventData) {
          this.selectedEvent = eventData;
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
            markerMap[eventLocationId].events[this.highlightedEventId].title;
          const eventLocation =
            markerMap[eventLocationId].events[this.highlightedEventId]
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
          markerMap[eventLocationId].events[this.highlightedEventId]?.title;
        const eventLocation =
          markerMap[eventLocationId].events[this.highlightedEventId]
            ?.locationName;

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
            }),
          );
          openGenericInfowindow();
        }

        // If the user mouses over a map marker with a single event,
        // open a specific infowindow.
        else if (clickedMapMarker && numberOfEvents === 1) {
          const defaultEventId = Object.keys(
            markerMap[eventLocationId].events,
          )[0];
          this.highlightedEventId = defaultEventId;

          // Dispatch a custom event to indicate InfoWindow is open
          // so the Cypress test can wait for it to open
          window.dispatchEvent(
            new CustomEvent("SpecificInfoWindowOpen", {
              detail: {
                eventTitle,
                eventLocation,
              },
            }),
          );
          openSpecificInfowindow();
        }

        // If the user mouses over an event list item in the event list,
        // always open a specific infowindow.
        else if (eventId) {
          this.highlightedEventId = eventId;

          // Dispatch a custom event to indicate InfoWindow is open
          // so the Cypress test can wait for it to open
          window.dispatchEvent(
            new CustomEvent("SpecificInfoWindowOpen", {
              detail: {
                eventTitle,
                eventLocation,
              },
            }),
          );
          openSpecificInfowindow();
        }

        if (numberOfEvents > 1) {
          const selectedEventsObject = markerMap[eventLocationId].events;
          const getArrayFromObject = (obj: any) => {
            const ary = [];

            for (let key in obj) {
              ary.push(obj[key]);
            }

            return ary;
          };
          const selectedEventsArray = getArrayFromObject(selectedEventsObject);

          this.selectedEvents = selectedEventsArray;
        }
      }
    },
    highlightEvent(
      eventLocationId: string,
      eventId: string,
      eventData: EventData,
      clickedMapMarker: boolean | false,
    ) {
      this.sendToPreview(eventId, eventLocationId);

      this.highlightedEventLocationId = eventLocationId;

      // Keep desktop and mobile maps in sync
      this.highlightEventOnMap({
        eventId,
        eventLocationId,
        eventData,
        clickedMapMarker,
        markerMap: this.mobileMarkerMap,
        map: this.mobileMap,
      });
      this.highlightEventOnMap({
        eventId,
        eventLocationId,
        eventData,
        clickedMapMarker,
        markerMap: this.desktopMarkerMap,
        map: this.desktopMap,
      });
    },
    unhighlightEventOnMap(markerMap: any) {
      if (!this.colorLocked) {
        if (markerMap.infowindow) {
          markerMap.infowindow.close();
        }

        if (markerMap[this.highlightedEventLocationId]) {
          markerMap[this.highlightedEventLocationId].marker.setIcon({
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            url: placeIcon,
            scaledSize: { width: 20, height: 20 },
          });
        }
        this.highlightedEventId = "";
        this.highlightedEventLocationId = "";
      }
    },
    unhighlight() {
      // Keep desktop and mobile map markers consistent
      this.unhighlightEventOnMap(this.mobileMarkerMap);
      this.unhighlightEventOnMap(this.desktopMarkerMap);
    },
    closeEventPreview() {
      this.eventPreviewIsOpen = false;

      if (!this.multipleEventPreviewIsOpen) {
        this.colorLocked = false;
      }
      this.unhighlight();
    },
    closeMultipleEventPreview() {
      this.multipleEventPreviewIsOpen = false;
      this.colorLocked = false;
      this.unhighlight();
    },
    openPreview(event: EventData, openedFromMap: boolean | false) {
      if (openedFromMap) {
        // When opening from a map, count how
        // many events are at the clicked location.
        // If there is one event, open the preview for
        // that event. If there is more than one,
        // open a preview for multiple events.
        const eventsAtClickedLocation =
          // We assume desktop and mobile marker maps are in sync.
          this.desktopMarkerMap[this.highlightedEventLocationId].numberOfEvents;

        if (eventsAtClickedLocation > 1) {
          this.multipleEventPreviewIsOpen = true;
        } else {
          this.eventPreviewIsOpen = true;
        }
      } else {
        // If opened from a list,
        // always preview a specific event.
        this.eventPreviewIsOpen = true;
      }
      this.selectedEvent = event;
      this.colorLocked = true;
    },
  },
});
</script>
<template>
  <div class="h-full bg-gray-100 dark:bg-gray-900">
    <div
      v-if="mdAndUp"
      id="mapViewFullScreen"
    >
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

              <div v-if="eventLoading">
                Loading...
              </div>
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
                @filterByTag="filterByTag"
                @filterByChannel="filterByChannel"
                @highlightEvent="highlightEvent"
                @open-preview="openPreview"
                @unhighlight="unhighlight"
              />
            </div>
          </div>
        </template>
        <template #rightpane>
          <div style="right: 0; width: 50vw">
            <div class="event-map-container">
              <div v-if="eventLoading">
                Loading...
              </div>
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
                @highlightEvent="highlightEvent"
                @open-preview="openPreview"
                @lockColors="colorLocked = true"
                @setMarkerData="setMarkerData"
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
          @highlightEvent="highlightEvent"
          @open-preview="openPreview"
          @lockColors="colorLocked = true"
          @setMarkerData="setMarkerData"
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
            @filterByTag="filterByTag"
            @filterByChannel="filterByChannel"
            @highlightEvent="highlightEvent"
            @open-preview="openPreview"
            @unhighlight="unhighlight"
          />
        </div>
      </div>
    </div>

    <EventPreview
      :top-layer="true"
      :is-open="eventPreviewIsOpen && !multipleEventPreviewIsOpen"
      @closePreview="closeEventPreview"
    />
    <PreviewContainer
      :is-open="multipleEventPreviewIsOpen"
      :header="'Events at this Location'"
      @closePreview="closeMultipleEventPreview"
    >
      <EventList
        v-if="selectedEvents"
        class="overflow-auto overscroll-auto"
        :events="selectedEvents"
        :result-count="selectedEvents.length"
        :channel-id="channelId"
        :highlighted-event-id="highlightedEventId"
        :show-map="true"
        @highlightEvent="highlightEvent"
        @open-preview="openPreview"
      />
      <div class="flex flex-shrink-0 justify-end px-4 py-4">
        <CloseButton @click="closeMultipleEventPreview" />
      </div>
      <PreviewContainer
        :is-open="multipleEventPreviewIsOpen && eventPreviewIsOpen"
        :top-layer="true"
        @closePreview="closeEventPreview"
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
