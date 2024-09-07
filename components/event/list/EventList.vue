<script setup lang="ts">
import { computed } from 'vue';
import EventListItem from './EventListItem.vue';
import LoadMore from '../../LoadMore.vue';
import { useRoute, useRouter } from 'vue-router';
import type { Event } from '@/__generated__/graphql';

const props = defineProps({
  highlightedEventLocationId: {
    type: String,
    default: '',
  },
  highlightedEventId: {
    type: String,
    default: '',
  },
  events: {
    type: Array as PropType<Event[]>,
    default: () => [],
  },
  loadedEventCount: {
    type: Number,
    default: 0,
  },
  resultCount: {
    type: Number,
    default: 0,
  },
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  selectedChannels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  showMap: {
    type: Boolean,
    default: false,
  },
  searchInput: {
    type: String,
    default: '',
  },
});

const emit = defineEmits([
  'filterByTag',
  'filterByChannel',
  'highlightEvent',
  'unhighlight',
  'openPreview',
  'loadMore',
]);

const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const createEventLink = computed(() => {
  if (channelId.value) {
    return `/forums/f/${channelId.value}/events/create`;
  }
  return '/events/create';
});

const filterByTag = (tag: string) => {
  emit('filterByTag', tag);
};

const filterByChannel = (channel: string) => {
  emit('filterByChannel', channel);
};

const getEventLocationId = (event: Event) => {
  if (event.location) {
    return (
      (event.location.latitude.toString() || '') +
      (event.location?.longitude.toString() || '')
    );
  }
  return 'no_location';
};

const handleClickEventListItem = (event: Event) => {
  if (props.showMap) {
    emit('openPreview', event.id);
  } else {
    if (channelId.value) {
      return router.push({
        name: 'EventDetail',
        params: {
          eventId: event.id,
          channelId: channelId.value,
        },
      });
    }
    return router.push({
      name: 'EventDetail',
      params: {
        eventId: event.id,
        channelId: event.EventChannels[0].channelUniqueName,
      },
    });
  }
};

const onMouseOverEventListItem = (event: Event) => {
  if (props.showMap) {
    emit('highlightEvent', getEventLocationId(event), event.id, event);
  }
};

const onMouseLeaveEventListItem = () => {
  if (props.showMap) {
    emit('unhighlight');
  }
};
</script>

<template>
  <div>
    <div v-if="events.length === 0">
      <p v-if="!showMap" class="mt-3 px-4 dark:text-gray-200">
        Could not find any events.
        <router-link :to="createEventLink" class="text-blue-500 underline">
          Create one?
        </router-link>
      </p>
      <p v-else class="p-8 dark:text-gray-200">
        Could not find any events that can be shown on a map.
      </p>
    </div>

    <ul
      v-if="events.length > 0"
      role="list"
      class="mb-4 flex flex-col gap-2 divide-y divide-gray-200 dark:divide-gray-600"
      data-testid="event-list"
    >
      <EventListItem
        v-for="event in events"
        :ref="`#${event.id}`"
        :key="event.id"
        :event="event"
        :selected-tags="selectedTags"
        :selected-channels="selectedChannels"
        :search-input="searchInput"
        :current-channel-id="channelId"
        :show-detail-link="!showMap"
        :class="[
          event.id === highlightedEventId ||
          (!highlightedEventId && highlightedEventLocationId === getEventLocationId(event))
            ? 'bg-gray-200 dark:bg-gray-700'
            : '',
        ]"
        :show-map="showMap"
        @mouseover="onMouseOverEventListItem(event)"
        @mouseleave="onMouseLeaveEventListItem"
        @clicked-event-list-item="handleClickEventListItem(event)"
        @filter-by-tag="filterByTag"
        @filter-by-channel="filterByChannel"
        @open-preview="$emit('openPreview')"
      />
    </ul>

    <LoadMore
      v-if="events.length > 0"
      data-testid="load-more-events"
      class="px-8"
      :reached-end-of-results="resultCount === events.length"
      @load-more="$emit('loadMore')"
    />
  </div>
</template>

<style>
/* Hide the X on the info window */
.gm-ui-hover-effect {
  display: none !important;
}
</style>
