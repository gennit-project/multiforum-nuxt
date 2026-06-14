<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import DatePicker from './DatePicker.vue';
import TimePicker from './TimePicker.vue';
import type { DateRangeGroup } from '@/types/Event';

const props = defineProps({
  groups: {
    type: Array as () => DateRangeGroup[],
    required: true,
  },
  isAllDay: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update', 'add', 'remove']);

// Update a group property
const updateGroup = (
  index: number,
  field: keyof DateRangeGroup,
  value: string
) => {
  const updatedGroup = { ...props.groups[index], [field]: value };
  emit('update', index, updatedGroup);
};

// Add a new date range group with default values
const addGroup = () => {
  const now = DateTime.now();
  const defaultDate = now.toFormat('yyyy-MM-dd');

  emit('add', {
    startDate: defaultDate,
    endDate: defaultDate,
    startTimeOfDay: '09:00',
    endTimeOfDay: '17:00',
  });
};

// Remove a group by index
const removeGroup = (index: number) => {
  emit('remove', index);
};

// Check if we can remove groups (need at least 1)
const canRemove = computed(() => props.groups.length > 1);

// Get readable label for the date range
const getGroupLabel = (group: DateRangeGroup): string => {
  const start = DateTime.fromISO(group.startDate);
  const end = DateTime.fromISO(group.endDate);

  if (!start.isValid || !end.isValid) return 'Invalid dates';

  if (start.hasSame(end, 'day')) {
    return start.toFormat('EEE, MMM d');
  }

  // Same month
  if (start.hasSame(end, 'month')) {
    return `${start.toFormat('MMM d')} - ${end.toFormat('d')}`;
  }

  // Different months
  return `${start.toFormat('MMM d')} - ${end.toFormat('MMM d')}`;
};

// Get count of days in range
const getDayCount = (group: DateRangeGroup): number => {
  const start = DateTime.fromISO(group.startDate);
  const end = DateTime.fromISO(group.endDate);

  if (!start.isValid || !end.isValid) return 0;

  return Math.floor(end.diff(start, 'days').days) + 1;
};
</script>

<template>
  <div class="space-y-3">
    <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
      Date Ranges
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400">
      Define date ranges with the same daily schedule (useful for expos, multi-day events with consistent hours).
    </p>

    <!-- List of date range groups -->
    <div
      v-for="(group, index) in groups"
      :key="index"
      class="rounded-md border border-gray-200 p-4 dark:border-gray-700"
    >
      <!-- Group header with label and remove button -->
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200"
          >
            {{ index + 1 }}
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ getGroupLabel(group) }}
          </span>
          <span
            v-if="getDayCount(group) > 1"
            class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          >
            {{ getDayCount(group) }} days
          </span>
        </div>
        <button
          v-if="canRemove"
          type="button"
          class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
          :aria-label="`Remove date range ${index + 1}`"
          :data-testid="`remove-group-${index}`"
          @click="removeGroup(index)"
        >
          <i class="fa fa-times text-sm" />
        </button>
      </div>

      <!-- Date range row -->
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <span class="w-16 text-sm text-gray-600 dark:text-gray-400">Dates:</span>
        <DatePicker
          :test-id="`group-${index}-start-date`"
          :value="group.startDate"
          :aria-label="`Start date for range ${index + 1}`"
          @update="updateGroup(index, 'startDate', $event)"
        />
        <span class="text-gray-400">to</span>
        <DatePicker
          :test-id="`group-${index}-end-date`"
          :value="group.endDate"
          :aria-label="`End date for range ${index + 1}`"
          @update="updateGroup(index, 'endDate', $event)"
        />
      </div>

      <!-- Time range row (hidden if all-day) -->
      <div v-if="!isAllDay" class="flex flex-wrap items-center gap-2">
        <span class="w-16 text-sm text-gray-600 dark:text-gray-400">Hours:</span>
        <TimePicker
          :test-id="`group-${index}-start-time`"
          :value="group.startTimeOfDay"
          :aria-label="`Daily start time for range ${index + 1}`"
          @update="updateGroup(index, 'startTimeOfDay', $event)"
        />
        <span class="text-gray-400">to</span>
        <TimePicker
          :test-id="`group-${index}-end-time`"
          :value="group.endTimeOfDay"
          :aria-label="`Daily end time for range ${index + 1}`"
          @update="updateGroup(index, 'endTimeOfDay', $event)"
        />
      </div>
    </div>

    <!-- Add group button -->
    <button
      type="button"
      class="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
      data-testid="add-date-range-button"
      @click="addGroup"
    >
      <i class="fa fa-plus" />
      <span>Add date range</span>
    </button>
  </div>
</template>
