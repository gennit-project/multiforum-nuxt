<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "nuxt/app";
import { timeFilterShortcuts, timeShortcutValues } from "./eventSearchOptions";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getEventFilterValuesFromParams";
import type { SearchEventValues } from "@/types/Event";
import Tag from "@/components/TagComponent.vue";

// Props
const props = defineProps({
  isListView: {
    type: Boolean,
    default: false,
  },
});

// Setup function
const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const filterValues = ref<SearchEventValues>(
  getFilterValuesFromParams({
    route,
    channelId: channelId.value,
    showOnlineOnly: props.isListView && !channelId.value,
  })
);

const activeDateShortcut = ref(route.query.timeShortcut);

// Watcher to update filters on query change
watch(
  () => route.query,
  () => {
    filterValues.value = getFilterValuesFromParams({
      route,
      channelId: channelId.value,
      showOnlineOnly: props.isListView && !channelId.value,
    });
  },
  { immediate: true }
);

// Methods
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

const handleTimeFilterShortcutClick = (shortcut: string) => {
  if (shortcut === activeDateShortcut.value) {
    // If the filter is currently selected, clear it.
    activeDateShortcut.value = timeShortcutValues.NONE;
    updateFilters({
      timeShortcut: timeShortcutValues.NONE,
    });
  } else {
    // If the filter is not already selected, select it.
    activeDateShortcut.value = shortcut;
    updateFilters({
      timeShortcut: shortcut,
    });
  }
};
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <Tag
      v-for="shortcut in timeFilterShortcuts"
      :key="shortcut.label"
      class="align-middle"
      :data-testid="`time-shortcut-${shortcut.label}`"
      :tag="shortcut.label"
      :active="shortcut.value === filterValues.timeShortcut"
      :hide-icon="true"
      :large="false"
      @click="handleTimeFilterShortcutClick(shortcut.value)"
    />
  </div>
</template>
