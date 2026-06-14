<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import type { PropType } from 'vue';

interface Occurrence {
  id: string;
  startTime: string;
}

const props = defineProps({
  occurrences: {
    type: Array as PropType<Occurrence[]>,
    required: true,
  },
  currentEventId: {
    type: String,
    required: true,
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
  maxVisible: {
    type: Number,
    default: 4,
  },
});

// Filter to upcoming occurrences and sort by date
const upcomingOccurrences = computed(() => {
  const now = DateTime.now();
  return props.occurrences
    .filter((occ) => {
      const occDate = DateTime.fromISO(occ.startTime);
      return occDate >= now && occ.id !== props.currentEventId;
    })
    .sort((a, b) => {
      return (
        DateTime.fromISO(a.startTime).toMillis() -
        DateTime.fromISO(b.startTime).toMillis()
      );
    });
});

// Visible occurrences (limited by maxVisible)
const visibleOccurrences = computed(() => {
  return upcomingOccurrences.value.slice(0, props.maxVisible);
});

// Count of remaining occurrences
const remainingCount = computed(() => {
  return Math.max(0, upcomingOccurrences.value.length - props.maxVisible);
});

// Format date for display (e.g., "Dec 12")
const formatDate = (isoString: string): string => {
  const dt = DateTime.fromISO(isoString);
  return dt.toFormat('MMM d');
};

// Generate link to occurrence
const getOccurrenceLink = (occurrenceId: string): string => {
  return `/forums/${props.channelUniqueName}/events/${occurrenceId}`;
};
</script>

<template>
  <div v-if="upcomingOccurrences.length > 0" class="flex flex-wrap items-center gap-1">
    <span class="mr-1 text-xs text-gray-500 dark:text-gray-400">Also on:</span>
    <nuxt-link
      v-for="occurrence in visibleOccurrences"
      :key="occurrence.id"
      :to="getOccurrenceLink(occurrence.id)"
      class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50"
      @click.stop
    >
      {{ formatDate(occurrence.startTime) }}
    </nuxt-link>
    <span
      v-if="remainingCount > 0"
      class="text-xs text-gray-500 dark:text-gray-400"
    >
      +{{ remainingCount }} more
    </span>
  </div>
</template>
