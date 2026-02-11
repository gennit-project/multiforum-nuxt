<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import DatePicker from './DatePicker.vue';
import TimePicker from './TimePicker.vue';

// Props for controlling visibility of pickers and data
const props = defineProps({
  isAllDay: {
    type: Boolean,
    required: true,
  },
  isMultiDay: {
    type: Boolean,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
});

const emit = defineEmits([
  'updateStartDate',
  'updateStartTime',
  'updateEndDate',
  'updateEndTime',
]);

// Formatted dates for date pickers
const formattedStartTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(props.startTime);
  return dateTime.toFormat('yyyy-MM-dd');
});

const formattedEndTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(props.endTime);
  return dateTime.toFormat('yyyy-MM-dd');
});

// Handler functions
const handleStartTimeDateChange = (dateValue: string) => {
  emit('updateStartDate', dateValue);
};

const handleEndTimeDateChange = (dateValue: string) => {
  emit('updateEndDate', dateValue);
};

const handleStartTimeTimeChange = (timeValue: string) => {
  emit('updateStartTime', timeValue);
};

const handleEndTimeTimeChange = (timeValue: string) => {
  emit('updateEndTime', timeValue);
};
</script>

<template>
  <div class="flex flex-col dark:text-white">
    <!-- Time selection container with responsive layout that wraps on mobile -->
    <div class="flex flex-wrap items-center gap-1 sm:gap-2">
      <!-- Start Time Section -->
      <div class="flex flex-wrap items-center gap-1 dark:text-white sm:gap-2">
        <DatePicker
          test-id="start-time-date-input"
          :value="formattedStartTimeDate"
          aria-label="Start date"
          data-testid="start-date-picker"
          @update="handleStartTimeDateChange"
        />

        <!-- Time picker for start time -->
        <TimePicker
          v-if="!isAllDay"
          test-id="start-time-time-input"
          :value="DateTime.fromJSDate(startTime).toFormat('HH:mm')"
          aria-label="Start time"
          data-testid="start-time-picker"
          @update="handleStartTimeTimeChange"
        />
      </div>

      <!-- Arrow icon between start and end - hidden on very small screens -->
      <div
        v-if="!isAllDay || isMultiDay"
        class="mx-1 flex items-center sm:mx-2"
        data-testid="time-arrow"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-gray-400"
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

      <!-- End Time Section -->
      <div class="flex flex-wrap items-center gap-1 sm:gap-2">
        <!-- Only show end date input if multi-day event is checked -->
        <DatePicker
          v-if="isMultiDay"
          test-id="end-time-date-input"
          :value="formattedEndTimeDate"
          aria-label="End date"
          data-testid="end-date-picker"
          @update="handleEndTimeDateChange"
        />

        <!-- Time picker for end time -->
        <TimePicker
          v-if="!isAllDay"
          test-id="end-time-time-input"
          :value="DateTime.fromJSDate(endTime).toFormat('HH:mm')"
          aria-label="End time"
          data-testid="end-time-picker"
          @update="handleEndTimeTimeChange"
        />
      </div>
    </div>
  </div>
</template>
