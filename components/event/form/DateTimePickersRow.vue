<script setup lang="ts">
import { ref, computed } from 'vue';
import { DateTime } from 'luxon';
import DatePicker from '@/components/event/form/DatePicker.vue';
import TimePicker from '@/components/event/form/TimePicker.vue';

// Props for controlling visibility of pickers
defineProps({
  isAllDay: {
    type: Boolean,
    default: false
  },
  isMultiDay: {
    type: Boolean,
    default: false
  }
});

// Mock data for testing
const startTime = ref(DateTime.now().toJSDate());
const endTime = ref(DateTime.now().plus({ hours: 1 }).toJSDate());

// Formatted dates for display
const formattedStartTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(startTime.value);
  return dateTime.toFormat("yyyy-MM-dd");
});

const formattedEndTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(endTime.value);
  return dateTime.toFormat("yyyy-MM-dd");
});

// Define emits
const emit = defineEmits(['updateStartDate', 'updateEndDate', 'updateStartTime', 'updateEndTime']);

// Event handlers
const handleStartTimeDateChange = (value: string) => {
  emit('updateStartDate', value);
};

const handleEndTimeDateChange = (value: string) => {
  emit('updateEndDate', value);
};

const handleStartTimeTimeChange = (value: string) => {
  emit('updateStartTime', value);
};

const handleEndTimeTimeChange = (value: string) => {
  emit('updateEndTime', value);
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
          
          <!-- Arrow between start and end times - visible for non-all-day single-day events or multi-day events -->
          <div 
            v-if="!isAllDay || isMultiDay"
            class="text-gray-500 dark:text-gray-400 mx-2"
            data-testid="time-arrow"
          >
            →
          </div>
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