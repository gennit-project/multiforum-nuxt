<script lang="ts">
import { defineComponent, computed, ref, Ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "vue-router";
import EventList from "./EventList.vue";
import "md-editor-v3/lib/style.css";
import { useDisplay } from "vuetify/lib/framework.mjs";
import { GET_EVENTS } from "@/graphQLData/event/queries";
import getEventWhere from "@/components/event/list/filters/getEventWhere";
import { SearchEventValues } from "@/types/Event";
import { getFilterValuesFromParams } from "./filters/getFilterValuesFromParams";
import ErrorBanner from "../../ErrorBanner.vue";
import { timeShortcutValues } from "./filters/eventSearchOptions";
import {
  chronologicalOrder,
  reverseChronologicalOrder,
} from "./filters/filterStrings";
import EventFilterBar from "./filters/EventFilterBar.vue";
import TimeShortcuts from "./filters/TimeShortcuts.vue";
import OnlineInPersonShortcuts from "./filters/OnlineInPersonShortcuts.vue";
import LocationFilterTypes from "./filters/locationFilterTypes";

export default defineComponent({
  name: "EventListView",
  // The EventFilterBar component writes to the query
  // params, while the MapView and EventListView
  // components consume the query params.
  components: {
    ErrorBanner,
    EventFilterBar,
    EventList,
    OnlineInPersonShortcuts,
    TimeShortcuts,
  },
  setup(props, { emit }) {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const filterValues: Ref<SearchEventValues> = ref(
      getFilterValuesFromParams({
        route,
        channelId: channelId.value,
        // in the channel view, we want to show all events.
        // in the sitewide online event list, only show online events.
        showOnlineOnly: channelId.value ? false : true,
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
        onlineOnly:
          !channelId.value ||
          filterValues.value.locationFilter ===
            LocationFilterTypes.ONLY_VIRTUAL,
      });
    });

    const {
      error: eventError,
      result: eventResult,
      loading: eventLoading,
      refetch: refetchEvents,
      onResult: onGetEventResult,
      fetchMore,
    } = useQuery(
      GET_EVENTS,
      {
        where: eventWhere,
        options: {
          limit: 25,
          offset: 0,
          sort: resultsOrder,
        },
      },
      {
        fetchPolicy: "network-only",
        // If it is not network only, the list
        // will not update when an event is updated or deleted in a way that affects
        // which search results it should be returned in.
      },
    );

    const reachedEndOfResults = ref(false);

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

    const selectedEventId = ref("");

    onGetEventResult((value) => {
      // If the preview pane is blank, fill it with the details
      // of the first result, if there is one.
      if (!value.data || value.data.events.length === 0) {
        return;
      }
      selectedEventId.value = value.data.events[0]?.id;

      emit("updateLoadedEventCount", value.data.events.length);
      emit("updateResultCount", value.data.eventsAggregate?.count);
    });

    const previewIsOpen = ref(false);

    const createEventPath = channelId.value
      ? `/channels/c/${channelId.value}/events/create`
      : "/events/create";

    const { mdAndDown } = useDisplay();

    return {
      channelId,
      createEventPath,
      eventId: selectedEventId,
      eventError,
      eventLoading,
      eventResult,
      eventWhere, // used for debugging with Vue developer tools
      filterValues,
      getFilterValuesFromParams,
      loadMore,
      mdAndDown,
      previewIsOpen,
      reachedEndOfResults,
      refetchEvents,
      route,
    };
  },
  created() {
    this.$watch("$route.query", () => {
      if (this.route.query) {
        this.filterValues = getFilterValuesFromParams({
          route: this.route,
          channelId: this.channelId,
          showOnlineOnly: false,
        });
      }
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
    openPreview() {
      if (this.mdAndDown) {
        this.previewIsOpen = true;
      }
    },
    closePreview() {
      this.previewIsOpen = false;
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
    toggleShowOnlineOnly() {
      if (
        this.filterValues.locationFilter === LocationFilterTypes.ONLY_VIRTUAL
      ) {
        this.updateFilters({
          locationFilter: LocationFilterTypes.NONE,
        });
      } else {
        this.updateFilters({
          locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
        });
      }
    },
  },
});
</script>

<template>
  <v-container
    class="flex flex-col justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 md:p-8"
  >
    <EventFilterBar 
      :show-distance-filters="false" 
      :allow-hiding-main-filters="true"
    >
      <TimeShortcuts :is-list-view="true" />
      <OnlineInPersonShortcuts v-if="channelId" />
    </EventFilterBar>
    
    <ErrorBanner
      v-if="eventError"
      class="mx-auto block"
      :text="eventError.message"
    />
    <EventList
      v-if="!eventLoading && !eventError && eventResult"
      id="listView"
      :class="[!channelId ? '' : '']"
      class="relative"
      :result-count="eventResult ? eventResult.eventsAggregate?.count : 0"
      :events="eventResult.events"
      :channel-id="channelId"
      :search-input="filterValues.searchInput"
      :selected-tags="filterValues.tags"
      :selected-channels="filterValues.channels"
      :show-map="false"
      @filterByTag="filterByTag"
      @filterByChannel="filterByChannel"
      @loadMore="loadMore"
      @openPreview="openPreview"
    />
  </v-container>
</template>
