<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import EventList from './EventList.vue';
import 'md-editor-v3/lib/style.css';
import { GET_EVENTS } from '@/graphQLData/event/queries';
import getEventWhere from '@/components/event/list/filters/getEventWhere';
import EventDetail from '@/components/event/detail/EventDetail.vue';
import type { SearchEventValues } from '@/types/Event';
import { getFilterValuesFromParams } from './filters/getEventFilterValuesFromParams';
import ErrorBanner from '../../ErrorBanner.vue';
import LoadingSpinner from '../../LoadingSpinner.vue';
import { timeShortcutValues } from './filters/eventSearchOptions';
import {
  chronologicalOrder,
  reverseChronologicalOrder,
} from './filters/filterStrings';
import EventFilterBar from './filters/EventFilterBar.vue';
import TimeShortcuts from './filters/TimeShortcuts.vue';
import OnlineInPersonShortcuts from './filters/OnlineInPersonShortcuts.vue';
import { LocationFilterTypes } from './filters/locationFilterTypes';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import type { Event } from '@/__generated__/graphql';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const { selectedChannelEventId } = storeToRefs(uiStore);
const selectedSearchEventId = ref('');

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const isSearchListRoute = computed(() => route.path === '/events/list/search');

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
    fetchPolicy: 'cache-first',
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
        eventsAggregate: fetchMoreResult.eventsAggregate, // Update the aggregate count
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

watch(channelId, (newChannelId, oldChannelId) => {
  if (newChannelId !== oldChannelId) {
    uiStore.clearSelectedChannelEventSelection();
  }
});

const openPreview = () => {
  previewIsOpen.value = true;
};

const selectedSearchEvent = computed(() => {
  if (!selectedSearchEventId.value) return null;
  return (
    eventResult.value?.events?.find(
      (event: Event) => event.id === selectedSearchEventId.value
    ) || null
  );
});

const selectedSearchEventChannelId = computed(() => {
  return selectedSearchEvent.value?.EventChannels?.[0]?.channelUniqueName || '';
});

const effectiveSelectedEventId = computed(() => {
  if (isSearchListRoute.value) {
    return selectedSearchEventId.value;
  }
  return selectedChannelEventId.value;
});

const updateFilters = (params: SearchEventValues) => {
  const existingQuery = route.query;
  const cleanedParams: Record<string, string> = {};

  Object.keys(params).forEach((key) => {
    const typedKey = key as keyof SearchEventValues;
    const value = params[typedKey];
    if (value !== undefined && typeof value !== 'string') {
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

const goToInPersonMap = () => {
  router.push({
    path: '/map/search',
    query: route.query,
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

// Filter visibility state for online events list (controlled externally)
const showMainFilters = ref(true);
const toggleShowMainFilters = () => {
  showMainFilters.value = !showMainFilters.value;
};

const handleSelectEvent = (payload: { eventId: string; title: string }) => {
  if (isSearchListRoute.value) {
    selectedSearchEventId.value = payload.eventId;
    return;
  }
  if (!channelId.value) return;
  uiStore.setSelectedChannelEventSelection({
    eventId: payload.eventId,
    title: payload.title,
  });
};

watch(
  [eventResult, selectedSearchEventId],
  () => {
    if (!isSearchListRoute.value) return;
    if (selectedSearchEventId.value && !selectedSearchEvent.value) {
      selectedSearchEventId.value = '';
    }
  },
  { immediate: true }
);

watch(isSearchListRoute, (isSearchRoute) => {
  if (!isSearchRoute && selectedSearchEventId.value) {
    selectedSearchEventId.value = '';
  }
});
</script>

<template>
  <div
    class="flex flex-col justify-center gap-2 rounded-lg bg-white dark:bg-black lg:px-4"
    :class="isSearchListRoute ? 'lg:flex-row lg:gap-6' : ''"
  >
    <div
      class="flex flex-col gap-2 lg:min-w-0 lg:flex-1"
      :class="
        isSearchListRoute ? 'lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto' : ''
      "
    >
      <div
        v-if="isSearchListRoute"
        class="flex items-center justify-between px-4 pt-1"
      >
        <h1
          class="font-semibold text-sm tracking-wide text-gray-900 dark:text-gray-100"
        >
          Online events
        </h1>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-700"
            :class="[showMainFilters ? 'bg-gray-200 dark:bg-gray-700' : '']"
            data-testid="toggle-main-filters-button"
            type="button"
            @click="toggleShowMainFilters"
          >
            {{ showMainFilters ? 'Hide filters' : 'Show filters' }}
          </button>
          <button
            class="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-700"
            type="button"
            @click="goToInPersonMap"
          >
            In-person map
          </button>
        </div>
      </div>
      <EventFilterBar
        :show-distance-filters="false"
        :allow-hiding-main-filters="true"
        :show-main-filters-by-default="!channelId"
        :toggle-show-archived-enabled="true"
        :hide-filters-button-externally="isSearchListRoute"
        :show-new-event-next-to-search-bar="isSearchListRoute"
        :external-show-main-filters="
          isSearchListRoute ? showMainFilters : undefined
        "
      >
        <TimeShortcuts :is-list-view="true" />
        <OnlineInPersonShortcuts v-if="channelId" />
      </EventFilterBar>

      <ErrorBanner
        v-if="eventError"
        class="mx-auto block"
        :text="eventError.message"
      />

      <LoadingSpinner v-if="!eventResult && !eventError" class="mx-auto my-4" />

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
        :is-selectable="!!channelId || isSearchListRoute"
        :selected-event-id="effectiveSelectedEventId"
        @filter-by-tag="filterByTag"
        @filter-by-channel="filterByChannel"
        @load-more="loadMore"
        @open-preview="openPreview"
        @select="handleSelectEvent"
      />
    </div>
    <aside
      v-if="isSearchListRoute"
      class="hidden lg:flex lg:h-[calc(100vh-3.5rem)] lg:w-1/2 lg:flex-col lg:overflow-y-auto lg:px-2 lg:py-4"
    >
      <div
        v-if="selectedSearchEventId"
        class="flex w-full flex-col justify-center rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      >
        <EventDetail
          :event-id="selectedSearchEventId"
          :channel-unique-name="selectedSearchEventChannelId"
          :show-comments="false"
          :show-title="true"
        />
      </div>
      <div
        v-else
        class="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        Select an event to view details.
      </div>
    </aside>
  </div>
</template>
