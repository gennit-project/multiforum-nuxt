<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import type { LocationQuery } from 'vue-router';
import { timeFilterShortcuts, timeShortcutValues } from './eventSearchOptions';
import { getEventFilterValuesFromParams } from '@/utils/getEventFilterValuesFromParams';
import type { SearchEventValues } from '@/types/Event';
import Tag from '@/components/TagComponent.vue';

// Props
const props = defineProps({
  mapStyle: { type: Boolean, default: false },
  isListView: {
    type: Boolean,
    default: false,
  },
});

// Setup function
const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const filterValues = ref<SearchEventValues>(
  getEventFilterValuesFromParams({
    route,
    channelId: channelId.value,
    showOnlineOnly: props.isListView && !channelId.value,
  })
);

// Watcher to update filters on query change
watch(
  () => route.query,
  () => {
    filterValues.value = getEventFilterValuesFromParams({
      route,
      channelId: channelId.value,
      showOnlineOnly: props.isListView && !channelId.value,
    });
  },
  { immediate: true }
);

// Methods
const updateFilters = (params: Partial<SearchEventValues>) => {
  const existingQuery = route.query;
  // Updating the URL params causes the events
  // to be refetched by the EventListView
  // and MapView components
  router.replace({
    query: {
      ...existingQuery,
      ...params,
    } as LocationQuery,
  });
};

const handleTimeFilterShortcutClick = (shortcut: string) => {
  if (shortcut === filterValues.value.timeShortcut) {
    // If the filter is currently selected, clear it.
    updateFilters({
      timeShortcut: timeShortcutValues.NONE,
    });
  } else {
    // If the filter is not already selected, select it.
    updateFilters({
      timeShortcut: shortcut,
    });
  }
};
</script>

<template>
  <div
    v-if="mapStyle"
    class="flex flex-wrap gap-2"
    role="group"
    aria-label="Event dates"
  >
    <button
      v-for="shortcut in timeFilterShortcuts"
      :key="shortcut.value"
      type="button"
      :data-testid="`time-shortcut-${shortcut.label}`"
      :aria-pressed="shortcut.value === filterValues.timeShortcut"
      class="focus-visible:ring-brand-500 min-h-11 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:ring-2"
      :class="
        shortcut.value === filterValues.timeShortcut
          ? 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
      "
      @click="handleTimeFilterShortcutClick(shortcut.value)"
    >
      {{ shortcut.label }}
    </button>
  </div>
  <div v-else class="flex flex-wrap gap-1">
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
