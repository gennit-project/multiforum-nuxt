<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import DatePicker from './DatePicker.vue';
import TimePicker from './TimePicker.vue';

// Props for controlling visibility of pickers and data
const props = defineProps({
  isAllDay: {
    type: Boolean,
    required: true
  },
  isMultiDay: {
    type: Boolean,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  }
});

const emit = defineEmits([
  'updateStartDate', 
  'updateStartTime', 
  'updateEndDate', 
  'updateEndTime'
]);

// Formatted dates for date pickers
const formattedStartTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(props.startTime);
  return dateTime.toFormat("yyyy-MM-dd");
});

const formattedEndTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(props.endTime);
  return dateTime.toFormat("yyyy-MM-dd");
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
    <!-- Time selection container with responsive layout -->
    <div class="flex flex-col md:flex-row md:gap-6">
      <!-- Start Time Section -->
      <div class="w-full md:w-1/2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
          Start Time
        </label>
        <div class="flex items-center gap-2 dark:text-white">
          <DatePicker
            test-id="start-time-date-input"
            :value="formattedStartTimeDate"
            data-testid="start-date-picker"
            @update="handleStartTimeDateChange"
          />
          
          <!-- Use reusable time picker component -->
          <TimePicker
            v-if="!isAllDay"
            test-id="start-time-time-input"
            :value="DateTime.fromJSDate(startTime).toFormat('HH:mm')"
            data-testid="start-time-picker"
            @update="handleStartTimeTimeChange"
          />
        </div>
      </div>
      
      <!-- End Time Section -->
      <div class="w-full md:w-1/2 mt-3 md:mt-0">
        <label v-if="!isAllDay" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block" data-testid="end-time-label">
          End Time
        </label>
        <div class="flex items-center gap-2">
          <!-- Only show end date input if multi-day event is checked -->
          <DatePicker
            v-if="isMultiDay"
            test-id="end-time-date-input"
            :value="formattedEndTimeDate"
            data-testid="end-date-picker"
            @update="handleEndTimeDateChange"
          />
          
          <!-- Use reusable time picker component -->
          <TimePicker
            v-if="!isAllDay"
            test-id="end-time-time-input"
            :value="DateTime.fromJSDate(endTime).toFormat('HH:mm')"
            data-testid="end-time-picker"
            @update="handleEndTimeTimeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>