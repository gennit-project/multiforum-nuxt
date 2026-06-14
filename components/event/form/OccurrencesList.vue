<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import DatePicker from './DatePicker.vue';
import TimePicker from './TimePicker.vue';
import type { DateOccurrence } from '@/types/Event';

const props = defineProps({
  occurrences: {
    type: Array as () => DateOccurrence[],
    required: true,
  },
  isAllDay: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update', 'add', 'remove']);

// Format date for DatePicker (yyyy-MM-dd)
const formatDateForPicker = (isoString: string): string => {
  const dt = DateTime.fromISO(isoString);
  return dt.isValid ? dt.toFormat('yyyy-MM-dd') : '';
};

// Format time for TimePicker (HH:mm)
const formatTimeForPicker = (isoString: string): string => {
  const dt = DateTime.fromISO(isoString);
  return dt.isValid ? dt.toFormat('HH:mm') : '';
};

// Update the start date of an occurrence (also syncs end date to same day)
const handleStartDateChange = (index: number, dateValue: string) => {
  const occurrence = props.occurrences[index];
  if (!occurrence) return;

  const currentStart = DateTime.fromISO(occurrence.startTime);
  const currentEnd = DateTime.fromISO(occurrence.endTime);
  const newDate = DateTime.fromISO(dateValue);

  if (!currentStart.isValid || !currentEnd.isValid || !newDate.isValid) return;

  const newStart = currentStart.set({
    year: newDate.year,
    month: newDate.month,
    day: newDate.day,
  });

  // Also update end date to match (keep same day)
  const newEnd = currentEnd.set({
    year: newDate.year,
    month: newDate.month,
    day: newDate.day,
  });

  emit('update', index, {
    ...occurrence,
    startTime: newStart.toISO() || '',
    endTime: newEnd.toISO() || '',
  });
};

// Update the start time of an occurrence
const handleStartTimeChange = (index: number, timeValue: string) => {
  const occurrence = props.occurrences[index];
  if (!occurrence) return;

  const currentStart = DateTime.fromISO(occurrence.startTime);
  const timeParts = timeValue.split(':');

  if (!currentStart.isValid || timeParts.length !== 2) return;

  const hourPart = timeParts[0] ?? '0';
  const minutePart = timeParts[1] ?? '0';

  const newStart = currentStart.set({
    hour: parseInt(hourPart, 10),
    minute: parseInt(minutePart, 10),
  });

  emit('update', index, {
    ...occurrence,
    startTime: newStart.toISO() || '',
  });
};

// Update the end time of an occurrence
const handleEndTimeChange = (index: number, timeValue: string) => {
  const occurrence = props.occurrences[index];
  if (!occurrence) return;

  const currentEnd = DateTime.fromISO(occurrence.endTime);
  const timeParts = timeValue.split(':');

  if (!currentEnd.isValid || timeParts.length !== 2) return;

  const hourPart = timeParts[0] ?? '0';
  const minutePart = timeParts[1] ?? '0';

  const newEnd = currentEnd.set({
    hour: parseInt(hourPart, 10),
    minute: parseInt(minutePart, 10),
  });

  emit('update', index, {
    ...occurrence,
    endTime: newEnd.toISO() || '',
  });
};

// Add a new occurrence with default times
const addOccurrence = () => {
  const now = DateTime.now();
  const defaultStart = now.startOf('hour').plus({ hours: 1 });
  const defaultEnd = defaultStart.plus({ hours: 2 });

  emit('add', {
    startTime: defaultStart.toISO(),
    endTime: defaultEnd.toISO(),
  });
};

// Remove an occurrence by index
const removeOccurrence = (index: number) => {
  emit('remove', index);
};

// Check if we can remove occurrences (need at least 1)
const canRemove = computed(() => props.occurrences.length > 1);

// Get readable date label for each occurrence
const getOccurrenceLabel = (index: number): string => {
  const occurrence = props.occurrences[index];
  if (!occurrence) return `Date ${index + 1}`;

  const dt = DateTime.fromISO(occurrence.startTime);
  return dt.isValid ? dt.toFormat('EEE, MMM d') : `Date ${index + 1}`;
};
</script>

<template>
  <div class="space-y-3">
    <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
      Event Dates
    </div>

    <!-- List of occurrences -->
    <div
      v-for="(occurrence, index) in occurrences"
      :key="index"
      class="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-3 dark:border-gray-700"
    >
      <!-- Date number indicator -->
      <div
        class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-200"
      >
        {{ index + 1 }}
      </div>

      <!-- Date label (e.g., "Mon, Dec 12") -->
      <div class="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ getOccurrenceLabel(index) }}
      </div>

      <!-- Start date picker -->
      <DatePicker
        :test-id="`occurrence-${index}-start-date`"
        :value="formatDateForPicker(occurrence.startTime)"
        :aria-label="`Start date for occurrence ${index + 1}`"
        @update="handleStartDateChange(index, $event)"
      />

      <!-- Start time picker (hidden if all-day) -->
      <TimePicker
        v-if="!isAllDay"
        :test-id="`occurrence-${index}-start-time`"
        :value="formatTimeForPicker(occurrence.startTime)"
        :aria-label="`Start time for occurrence ${index + 1}`"
        @update="handleStartTimeChange(index, $event)"
      />

      <!-- Arrow separator -->
      <div class="flex items-center text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <!-- End time picker (hidden if all-day) -->
      <TimePicker
        v-if="!isAllDay"
        :test-id="`occurrence-${index}-end-time`"
        :value="formatTimeForPicker(occurrence.endTime)"
        :aria-label="`End time for occurrence ${index + 1}`"
        @update="handleEndTimeChange(index, $event)"
      />

      <!-- Remove button -->
      <button
        v-if="canRemove"
        type="button"
        class="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
        :aria-label="`Remove occurrence ${index + 1}`"
        :data-testid="`remove-occurrence-${index}`"
        @click="removeOccurrence(index)"
      >
        <i class="fa fa-times" />
      </button>
    </div>

    <!-- Add occurrence button -->
    <button
      type="button"
      class="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
      data-testid="add-occurrence-button"
      @click="addOccurrence"
    >
      <i class="fa fa-plus" />
      <span>Add another date</span>
    </button>
  </div>
</template>
