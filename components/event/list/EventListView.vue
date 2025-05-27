<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import EventList from "./EventList.vue";
import "md-editor-v3/lib/style.css";
import { GET_EVENTS } from "@/graphQLData/event/queries";
import getEventWhere from "@/components/event/list/filters/getEventWhere";
import type { SearchEventValues } from "@/types/Event";
import { getFilterValuesFromParams } from "./filters/getEventFilterValuesFromParams";
import ErrorBanner from "../../ErrorBanner.vue";
import LoadingSpinner from "../../LoadingSpinner.vue";
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
    fetchPolicy: "cache-first",
  }
);
const previewIsOpen = ref(false);

const loadMore = () => {
  fetchMore({
    variables: {
      // @ts-ignore
      offset: eventResult.value?.events.length || 0,
    },
    // Prevent cache clearing which causes content shift
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      
      // Merge the results while preserving existing data
      return {
        ...previousResult,
        events: [...(previousResult?.events || []), ...fetchMoreResult.events],
        eventsAggregate: fetchMoreResult.eventsAggregate // Update the aggregate count
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
  const cleanedParams: Record<string, string> = {};
  
  Object.keys(params).forEach((key) => {
    const typedKey = key as keyof SearchEventValues;
    const value = params[typedKey];
    if (value !== undefined && typeof value !== "string") {
      cleanedParams[key] = String(value);
    } else if (value !== undefined) {
      cleanedParams[key] = value;
    }
  });

  router.replace({
    query: {
      ...existingQuery,
      ...cleanedParams,
    },
  });
};
const filterByTag = (tag: string) => {
  const alreadySelected = filterValues.value.tags?.includes(tag);

  if (alreadySelected) {
    filterValues.value.tags = filterValues.value.tags?.filter(
      (t: string) => t !== tag
    );
  } else {
    filterValues.value?.tags?.push(tag);
  }
  updateFilters({ tags: [tag] });
};

const filterByChannel = (channel: string) => {
  const alreadySelected = filterValues.value.channels?.includes(channel);

  if (alreadySelected) {
    filterValues.value.channels = filterValues.value.channels?.filter(
      (c: string) => c !== channel
    );
  } else {
    filterValues.value.channels?.push(channel);
  }
  updateFilters({ channels: [channel] });
};

</script>

<template>
  <div class="flex flex-col justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 lg:px-4">
    <EventFilterBar
      :show-distance-filters="false"
      :allow-hiding-main-filters="true"
      :show-main-filters-by-default="!channelId"
      :toggle-show-archived-enabled="true"
    >
      <TimeShortcuts :is-list-view="true" />
      <OnlineInPersonShortcuts v-if="channelId" />
    </EventFilterBar>

    <ErrorBanner
      v-if="eventError"
      class="mx-auto block"
      :text="eventError.message"
    />
    
    <LoadingSpinner v-if="!eventResult && !eventError" class="my-4 mx-auto" />

    <EventList
      v-if="eventResult?.events"
      id="listView"
      class="relative"
      :result-count="eventResult.eventsAggregate?.count || 0"
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
