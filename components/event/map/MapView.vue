<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRouter, useRoute } from 'nuxt/app';
import { useDisplay } from '@/composables/useDisplay';
import EventPreview from '../list/EventPreview.vue';
import EventList from '../list/EventList.vue';
import type { MarkerMap } from './Map.vue';
import PreviewContainer from '../list/PreviewContainer.vue';
import CloseButton from '../../CloseButton.vue';
import ErrorBanner from '../../ErrorBanner.vue';
import LoadingSpinner from '../../LoadingSpinner.vue';
import EventFilterBar from '../list/filters/EventFilterBar.vue';
import TimeShortcuts from '../list/filters/TimeShortcuts.vue';
import { GET_EVENTS } from '@/graphQLData/event/queries';
import getEventWhere from '@/utils/getEventWhere';
import { getEventFilterValuesFromParams } from '@/utils/getEventFilterValuesFromParams';
import {
  chronologicalOrder,
  reverseChronologicalOrder,
} from '../list/filters/filterStrings';
import { timeShortcutValues } from '../list/filters/eventSearchOptions';
import {
  toggleArrayItem,
  cleanQueryParams,
  buildInfowindowContent,
} from '@/utils/eventMap';
import type { Event as EventData, EventOptions } from '@/__generated__/graphql';
import type { SearchEventValues } from '@/types/Event';
import type { Ref, PropType } from 'vue';
import { isEventSearchRoute } from '@/utils/isEventSearchRoute';
import { useInstanceCapability } from '@/composables/useInstanceSetupStatus';
import MapUnavailable from './MapUnavailable.vue';

// Map.vue statically imports the Google Maps JS API loader + marker clusterer
// (~840KB decoded). Load it lazily so that weight is only fetched when the map
// view actually renders, not prefetched with the event routes.
const EventMap = defineAsyncComponent(() => import('./Map.vue'));

const {
  capability: mapsCapability,
  available: mapsAvailable,
  loading: mapsCapabilityLoading,
  error: mapsCapabilityError,
} = useInstanceCapability('maps');
const mapsSetupUrl = computed(
  () => mapsCapability.value?.setupUrl || '/admin/setup#maps'
);

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
    default: '',
  },
  searchInput: {
    type: String,
    default: '',
  },
});

defineEmits([
  'filterByTag',
  'filterByChannel',
  'highlightEvent',
  'openPreview',
  'unhighlight',
]);

const { mdAndUp } = useDisplay();
const route = useRoute();
const router = useRouter();
const showOnlineOnly = isEventSearchRoute(route);
const showInPersonOnly =
  route.name === 'map-search-eventId' || route.name === 'map-search';
const isMapRoute = computed(() => route.path.startsWith('/map/search'));
const resultsHeading = computed(() => {
  const period =
    filterValues.value.timeShortcut === timeShortcutValues.PAST_EVENTS
      ? 'Past events'
      : 'In-person events';
  return filterValues.value.placeName
    ? `${period} near ${filterValues.value.placeName}`
    : period;
});

const filterValues: Ref<SearchEventValues> = ref(
  getEventFilterValuesFromParams({
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
    filterValues.value = getEventFilterValuesFromParams({
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
    where: eventWhere,
    options: computed<EventOptions>(() => ({ sort: [resultsOrder.value] })),
  },
  {
    fetchPolicy: 'cache-first',
  }
);

onGetEventResult((value) => {
  if (!value.data || value.data.events.length === 0) {
    return;
  }
  const defaultSelectedEventId = value.data.events[0].id;
  sendToPreview(defaultSelectedEventId, '');
});

const sendToPreview = async (eventId: string, eventLocationId: string) => {
  if (eventId) {
    const escapedEventLocationId = eventLocationId
      ? CSS.escape(eventLocationId)
      : '';
    await router.push({
      name: 'map-search-eventId',
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
const mobileMap = ref<google.maps.Map | null>(null);
const desktopMap = ref<google.maps.Map | null>(null);
const colorLocked = ref(false);
const eventPreviewIsOpen = ref(false);
const highlightedEventId = ref('');
const highlightedEventLocationId = ref('');
const multipleEventPreviewIsOpen = ref(false);
const selectedEvent = ref<EventData | null>(null);
const selectedEvents = ref<EventData[]>([]);

const updateFilters = (params: SearchEventValues) => {
  const existingQuery = route.query;
  const cleanedParams = cleanQueryParams(params);
  router.replace({
    query: {
      ...existingQuery,
      ...cleanedParams,
    },
  });
};

const goToOnlineList = () => {
  router.push({
    path: '/events/list/search',
    query: route.query,
  });
};

const filterByChannel = (channel: string) => {
  filterValues.value.channels = toggleArrayItem(
    filterValues.value.channels ?? [],
    channel
  );
  updateFilters({ channels: filterValues.value.channels });
};

const filterByTag = (tag: string) => {
  filterValues.value.tags = toggleArrayItem(filterValues.value.tags ?? [], tag);
  updateFilters({ tags: filterValues.value.tags });
};

type SetMarkerDataInput = {
  map: google.maps.Map | null;
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
  map: google.maps.Map | null;
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
      throw new Error('Could not find the event data.');
    }
  }

  if (markerMap.markers[eventLocationId]) {
    const openSpecificInfowindow = () => {
      const eventTitle =
        markerMap.markers[eventLocationId]?.events?.[highlightedEventId.value]
          ?.title;
      const eventLocation =
        markerMap.markers[eventLocationId]?.events?.[highlightedEventId.value]
          ?.locationName;

      const infowindowContent = buildInfowindowContent(
        eventTitle,
        eventLocation
      );
      markerMap.infowindow?.setContent(infowindowContent);
      markerMap.infowindow?.open({
        anchor: markerMap.markers[eventLocationId]?.marker,
        map,
        shouldFocus: false,
      });
    };

    const numberOfEvents = markerMap.markers[eventLocationId].numberOfEvents;

    const openGenericInfowindow = () => {
      markerMap.infowindow?.setContent(`${numberOfEvents} events`);
      markerMap.infowindow?.open({
        anchor: markerMap.markers[eventLocationId]?.marker,
        map,
        shouldFocus: false,
      });
    };

    const eventTitle =
      markerMap.markers[eventLocationId].events[highlightedEventId.value]
        ?.title;
    const eventLocation =
      markerMap.markers[eventLocationId].events[highlightedEventId.value]
        ?.locationName;

    if (clickedMapMarker && numberOfEvents > 1) {
      window.dispatchEvent(
        new CustomEvent('GenericInfoWindowOpen', {
          detail: {
            numberOfEvents,
          },
        })
      );
      openGenericInfowindow();
    } else if (clickedMapMarker && numberOfEvents === 1) {
      const defaultEventId = Object.keys(
        markerMap.markers[eventLocationId]?.events || {}
      )[0];
      highlightedEventId.value = defaultEventId || '';

      window.dispatchEvent(
        new CustomEvent('SpecificInfoWindowOpen', {
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
        new CustomEvent('SpecificInfoWindowOpen', {
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
      const getArrayFromObject = <T,>(obj: Record<string, T>): T[] => {
        return Object.values(obj);
      };
      selectedEvents.value = getArrayFromObject(selectedEventsObject);
    }
  }
};

const highlightEvent = (
  eventLocationId: string,
  eventId: string,
  eventData: EventData,
  clickedMapMarker = false,
  shouldNavigate = false
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

  if (shouldNavigate) {
    sendToPreview(eventId, eventLocationId);
  }
};

const unhighlightEventOnMap = (markerMap: MarkerMap) => {
  if (!colorLocked.value) {
    markerMap.infowindow?.close();
    const locationId = highlightedEventLocationId.value;
    const markerData = markerMap.markers[locationId];

    if (markerData) {
      // AdvancedMarkerElement doesn't support setIcon - unhighlighting handled via PinElement content
      // TODO: Implement custom unhighlighting for AdvancedMarkerElement if needed
    }
    highlightedEventId.value = '';
    highlightedEventLocationId.value = '';
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
      desktopMarkerMap.value.markers[highlightedEventLocationId.value]
        ?.numberOfEvents || 0;
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

const isClientSide = typeof window !== 'undefined';
</script>

<template>
  <div class="map-explorer flex min-w-0 flex-col bg-gray-50 dark:bg-gray-950">
    <client-only>
      <header
        class="shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <div
          v-if="isMapRoute"
          class="mb-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1
              class="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl dark:text-white"
            >
              Explore events
            </h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Find your people, around the corner.
            </p>
          </div>
          <button
            class="focus-visible:ring-brand-500 inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:ring-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            type="button"
            @click="goToOnlineList"
          >
            Online events →
          </button>
        </div>
        <div
          class="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950"
        >
          <EventFilterBar
            :show-map="true"
            :allow-hiding-main-filters="false"
            :show-main-filters-by-default="true"
          >
            <TimeShortcuts :map-style="true" />
          </EventFilterBar>
        </div>
      </header>

      <!-- Desktop View -->
      <div
        v-if="isClientSide && mdAndUp"
        class="grid min-h-0 flex-1 grid-cols-[minmax(20rem,42%)_minmax(0,1fr)]"
      >
        <section
          aria-labelledby="map-results-heading"
          class="min-h-0 overflow-y-auto border-r border-gray-200 dark:border-gray-800"
          tabindex="0"
        >
          <div
            class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-950"
          >
            <h2
              id="map-results-heading"
              class="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {{ resultsHeading }}
            </h2>
            <p
              class="mt-1 text-sm text-gray-600 dark:text-gray-300"
              role="status"
            >
              {{
                eventLoading
                  ? 'Loading events…'
                  : `${eventResult?.eventsAggregate?.count ?? 0} events`
              }}
              <span v-if="!eventLoading" class="float-right">{{
                filterValues.timeShortcut === timeShortcutValues.PAST_EVENTS
                  ? 'Newest first'
                  : 'Soonest first'
              }}</span>
            </p>
          </div>
          <div class="py-3">
            <LoadingSpinner v-if="eventLoading" class="mx-auto my-4" />
            <ErrorBanner
              v-else-if="eventError"
              class="block"
              :text="eventError.message"
            />
            <EventList
              v-else-if="eventResult && eventResult.events"
              class="pt-0"
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
        </section>

        <section
          aria-label="Event map"
          class="relative min-h-0 bg-gray-100 dark:bg-gray-900"
          data-testid="event-map-panel"
        >
          <LoadingSpinner v-if="eventLoading" class="mx-auto my-4" />
          <ErrorBanner
            v-else-if="eventError"
            class="block"
            :text="eventError.message"
          />
          <EventMap
            v-else-if="
              mapsAvailable &&
              eventResult &&
              eventResult.events &&
              eventResult.events.length > 0
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
          <MapUnavailable
            v-else-if="
              !mapsAvailable && (mapsCapability || mapsCapabilityError)
            "
            :setup-url="mapsSetupUrl"
            :status-unavailable="Boolean(mapsCapabilityError)"
          />
          <LoadingSpinner
            v-else-if="mapsCapabilityLoading"
            class="mx-auto my-4"
          />
          <p
            v-else
            class="flex h-full items-center justify-center p-8 text-center text-sm text-gray-600 dark:text-gray-300"
          >
            Try another date, location, or search to find events on the map.
          </p>
        </section>
      </div>

      <!-- Mobile View - Only render if NOT on desktop -->
      <template v-else>
        <LoadingSpinner v-if="eventLoading" class="mx-auto my-4" />
        <ErrorBanner
          v-else-if="eventError"
          class="block"
          :text="eventError.message"
        />
        <div
          v-else-if="eventResult && eventResult.events"
          id="mapViewMobileWidth"
        >
          <section
            aria-label="Event map"
            class="event-map-container h-[40dvh] min-h-64 w-full"
            data-testid="event-map-panel"
          >
            <EventMap
              v-if="mapsAvailable && eventResult.events.length > 0"
              :events="eventResult.events"
              :preview-is-open="
                eventPreviewIsOpen || multipleEventPreviewIsOpen
              "
              :color-locked="colorLocked"
              :use-mobile-styles="true"
              @highlight-event="highlightEvent"
              @open-preview="openPreview"
              @lock-colors="colorLocked = true"
              @set-marker-data="setMarkerData"
            />
            <MapUnavailable
              v-else-if="
                !mapsAvailable && (mapsCapability || mapsCapabilityError)
              "
              :setup-url="mapsSetupUrl"
              :status-unavailable="Boolean(mapsCapabilityError)"
            />
            <LoadingSpinner
              v-else-if="mapsCapabilityLoading"
              class="mx-auto my-4"
            />
          </section>
          <section aria-labelledby="mobile-results-heading" class="w-full py-4">
            <div class="mb-3 px-4">
              <h2
                id="mobile-results-heading"
                class="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {{ resultsHeading }}
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-300" role="status">
                {{ eventResult.eventsAggregate?.count ?? 0 }} events
              </p>
            </div>
            <div class="mx-auto">
              <EventList
                :events="eventResult.events"
                :show-map="true"
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
          </section>
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
        <div class="flex shrink-0 justify-end px-4 py-4">
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

<style scoped>
/* TopNav is fixed on map routes. The grid uses the remaining viewport;
   the map no longer guesses the height of the wrapping filter toolbar. */
.map-explorer {
  margin-top: 3.5rem;
  min-height: calc(100dvh - 3.5rem);
}

@media (min-width: 960px) {
  .map-explorer {
    height: calc(100dvh - 3.5rem);
  }
}
</style>
