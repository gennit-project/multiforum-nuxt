<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import EventList from "./EventList.vue";
import "md-editor-v3/lib/style.css";
import { GET_EVENTS } from "@/graphQLData/event/queries";
import getEventWhere from "@/components/event/list/filters/getEventWhere";
import type { SearchEventValues } from "@/types/Event";
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

const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const filterValues = ref(
  getFilterValuesFromParams({
    route,
    channelId: channelId.value,
    showOnlineOnly: channelId.value ? false : true,
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
    onlineOnly:
      !channelId.value ||
      filterValues.value.locationFilter === LocationFilterTypes.ONLY_VIRTUAL,
  });
});

const {
  error: eventError,
  result: eventResult,
  loading: eventLoading,
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
  }
);
const previewIsOpen = ref(false);

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

watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getFilterValuesFromParams({
        route,
        channelId: channelId.value,
        showOnlineOnly: false,
      });
    }
  },
  { immediate: true }
);

const openPreview = () => {
  previewIsOpen.value = true;
};

const updateFilters = (params: SearchEventValues) => {
  const existingQuery = route.query;
  router.replace({
    query: {
      ...existingQuery,
      ...params,
    },
  });
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


</script>

<template>
  <div class="flex flex-col justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 p-4 md:p-8">
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
      class="relative"
      :result-count="eventResult ? eventResult.eventsAggregate?.count : 0"
      :events="eventResult.events"
      :channel-id="channelId"
      :search-input="filterValues.searchInput"
      :selected-tags="filterValues.tags"
      :selected-channels="filterValues.channels"
      :show-map="false"
      @filter-by-tag="filterByTag"
      @filter-by-channel="filterByChannel"
      @load-more="loadMore"
      @open-preview="openPreview"
    />
  </div>
</template>
