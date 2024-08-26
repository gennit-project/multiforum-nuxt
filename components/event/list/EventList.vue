<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import EventListItem from "./EventListItem.vue";
import { useRoute, useRouter } from "vue-router";
import { Event } from "@/src/__generated__/graphql"
import LoadMore from "../../LoadMore.vue";

export default defineComponent({
  components: {
    EventListItem,
    LoadMore,
  },
  props: {
    highlightedEventLocationId: {
      type: String,
      default: "",
    },
    highlightedEventId: {
      type: String,
      default: "",
    },
    events: {
      type: Array as PropType<Event[]>,
      default: () => {
        return [];
      },
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
      default: () => {
        return [];
      },
    },
    selectedChannels: {
      type: Array as PropType<string[]>,
      default: () => {
        return [];
      },
    },
    showMap: {
      type: Boolean,
      default: false,
    },
    searchInput: {
      type: String,
      default: "",
    },
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const createEventLink = computed(() => {
      if (channelId.value) {
        return `/channels/c/${channelId.value}/events/create`
      }
      return '/events/create'
    });
    return {
      channelId,
      createEventLink,
      router,
    };
  },
  methods: {
    filterByTag(tag: string) {
      this.$emit("filterByTag", tag);
    },
    filterByChannel(channel: string) {
      this.$emit("filterByChannel", channel);
    },
    getEventLocationId(event: Event) {
      if (event.location) {
        return (
          (event.location.latitude.toString() || "") +
          (event.location?.longitude.toString() || "")
        );
      }
      return "no_location";
    },
    handleClickEventListItem(event: Event) {
      if (this.showMap) {
        this.$emit("openPreview", event.id);
      } else {
        if (this.channelId) {
          return this.router.push({
            name: "EventDetail",
            params: {
              eventId: event.id,
              channelId: this.channelId,
            },
          });
        }
        return this.router.push({
          name: "EventDetail",
          params: {
            eventId: event.id,
            channelId: event.EventChannels[0].channelUniqueName,
          },
        });
      }
    },
    onMouseOvenEventListItem(event: Event) {
      if (this.showMap) {
        this.$emit(
          "highlightEvent",
          this.getEventLocationId(event),
          event.id,
          event,
        );
      }
    },
  },
});
</script>

<template>
  <div>
    <div v-if="events.length === 0">
      <p
        v-if="!showMap"
        class="mt-3 px-4 dark:text-gray-200"
      >
        Could not find any events.
        <router-link
          :to="createEventLink"
          class="text-blue-500 underline"
        >
          Create one?
        </router-link>
      </p>
      <p
        v-else
        class="p-8 dark:text-gray-200"
      >
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
            (!highlightedEventId &&
              highlightedEventLocationId === getEventLocationId(event))
            ? 'bg-gray-200 dark:bg-gray-700'
            : '',
        ]"
        :show-map="showMap"
        @mouseover="() => onMouseOvenEventListItem(event)"
        @mouseleave="
          () => {
            if (showMap) {
              $emit('unhighlight');
            }
          }
        "
        @clickedEventListItem="handleClickEventListItem(event)"
        @filterByTag="filterByTag"
        @filterByChannel="filterByChannel"
        @openPreview="$emit('openPreview')"
      />
    </ul>

    <LoadMore
      v-if="events.length > 0"
      data-testid="load-more-events"
      class="px-8"
      :reached-end-of-results="resultCount === events.length"
      @loadMore="$emit('loadMore')"
    />
  </div>
</template>
<style>
/* Hide the X on the info window */
.gm-ui-hover-effect {
  display: none !important;
}
</style>