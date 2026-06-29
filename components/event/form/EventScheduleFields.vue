<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { DateTime } from 'luxon';
import type {
  CreateEditEventFormValues,
  DateMode,
  DateOccurrence,
  DateRangeGroup as DateRangeGroupType,
  RepeatPattern,
} from '@/types/Event';
import { getDuration } from '@/utils';
import { generateOccurrences } from '@/utils/generateOccurrences';
import { expandDateRangeGroups } from '@/utils/expandDateRangeGroups';
import {
  applyTimeToTimestamp,
  computeStartDateChange,
  computeEndDateChange,
} from '@/utils/eventDateTimeEditing';
import DateTimePickersRow from './DateTimePickersRow.vue';
import OccurrencesList from './OccurrencesList.vue';
import RepeatPatternPicker from './RepeatPatternPicker.vue';
import DateRangeGroups from './DateRangeGroup.vue';
import CheckBox from '@/components/CheckBox.vue';
import ErrorMessage from '@/components/ErrorMessage.vue';

const props = defineProps({
  formValues: {
    type: Object as PropType<CreateEditEventFormValues>,
    required: true,
  },
});

const emit = defineEmits(['updateFormValues']);

// Date mode options for single, multiple, or recurring events
const dateModeOptions = [
  { label: 'Single', value: 'single' as DateMode, description: 'One date' },
  {
    label: 'Multiple',
    value: 'multiple' as DateMode,
    description: 'Multiple dates',
  },
  {
    label: 'Recurring',
    value: 'recurring' as DateMode,
    description: 'Repeat pattern',
  },
  {
    label: 'Date ranges',
    value: 'dateRange' as DateMode,
    description: 'Ranges with daily hours',
  },
];

// Current date mode from form values
const currentDateMode = computed(() => props.formValues.dateMode || 'single');

// Function to update date mode
const updateDateMode = (mode: DateMode) => {
  emit('updateFormValues', { dateMode: mode });

  // Initialize occurrences array if switching to multiple dates mode
  if (mode === 'multiple' && props.formValues.occurrences.length === 0) {
    const defaultOccurrence: DateOccurrence = {
      startTime: props.formValues.startTime,
      endTime: props.formValues.endTime,
    };
    emit('updateFormValues', { occurrences: [defaultOccurrence] });
  }

  // Initialize repeat pattern if switching to recurring mode
  if (mode === 'recurring' && !props.formValues.repeatPattern) {
    const defaultPattern: RepeatPattern = {
      type: 'WEEKLY',
      count: 1,
      daysOfWeek: [],
      endType: 'AFTER_COUNT',
      endCount: 10,
    };
    emit('updateFormValues', { repeatPattern: defaultPattern });
  }

  // Seed a first date-range group when switching to date-range mode.
  if (mode === 'dateRange' && props.formValues.dateRangeGroups.length === 0) {
    const today = DateTime.now().toFormat('yyyy-MM-dd');
    const defaultGroup: DateRangeGroupType = {
      startDate: today,
      endDate: today,
      startTimeOfDay: '09:00',
      endTimeOfDay: '17:00',
    };
    emit('updateFormValues', { dateRangeGroups: [defaultGroup] });
  }
};

// Handlers for the DateRangeGroups editor.
const handleDateRangeGroupUpdate = (
  index: number,
  group: DateRangeGroupType
) => {
  const newGroups = [...props.formValues.dateRangeGroups];
  newGroups[index] = group;
  emit('updateFormValues', { dateRangeGroups: newGroups });
};

const handleDateRangeGroupAdd = (group: DateRangeGroupType) => {
  emit('updateFormValues', {
    dateRangeGroups: [...props.formValues.dateRangeGroups, group],
  });
};

const handleDateRangeGroupRemove = (index: number) => {
  emit('updateFormValues', {
    dateRangeGroups: props.formValues.dateRangeGroups.filter(
      (_, i) => i !== index
    ),
  });
};

// How many individual occurrences the current date-range groups expand to.
const dateRangeOccurrenceCount = computed(
  () => expandDateRangeGroups(props.formValues.dateRangeGroups).length
);

// Handlers for OccurrencesList
const handleOccurrenceUpdate = (index: number, occurrence: DateOccurrence) => {
  const newOccurrences = [...props.formValues.occurrences];
  newOccurrences[index] = occurrence;
  emit('updateFormValues', { occurrences: newOccurrences });
};

const handleOccurrenceAdd = (occurrence: DateOccurrence) => {
  const newOccurrences = [...props.formValues.occurrences, occurrence];
  emit('updateFormValues', { occurrences: newOccurrences });
};

const handleOccurrenceRemove = (index: number) => {
  const newOccurrences = props.formValues.occurrences.filter(
    (_, i) => i !== index
  );
  emit('updateFormValues', { occurrences: newOccurrences });
};

// Handler for RepeatPatternPicker
const handleRepeatPatternUpdate = (pattern: RepeatPattern) => {
  emit('updateFormValues', { repeatPattern: pattern });
};

// Computed: Generate preview of occurrences from repeat pattern
const generatedOccurrencesPreview = computed(() => {
  if (currentDateMode.value !== 'recurring' || !props.formValues.repeatPattern) {
    return [];
  }

  const pattern = props.formValues.repeatPattern;
  if (pattern.type === 'MANUAL') {
    return [];
  }

  const occurrences = generateOccurrences({
    pattern,
    startTime: props.formValues.startTime,
    endTime: props.formValues.endTime,
    maxOccurrences: 10, // Limit preview to first 10
  });

  return occurrences;
});

// Format a date for display in the preview
const formatOccurrenceDate = (isoString: string): string => {
  const dt = DateTime.fromISO(isoString);
  return dt.toFormat('EEE, MMM d, yyyy h:mm a');
};

// Track if the event spans multiple days
const isMultiDayEvent = ref(false);

// Check if start and end dates are different
const initializeMultiDayState = () => {
  const startDateTime = DateTime.fromISO(props.formValues.startTime);
  const endDateTime = DateTime.fromISO(props.formValues.endTime);

  // If the dates are the same, it's a single-day event
  // If they're different, it's a multi-day event
  isMultiDayEvent.value = !startDateTime.hasSame(endDateTime, 'day');
};

// Initialize multi-day state when component mounts
initializeMultiDayState();

const startTime = computed(() => {
  return new Date(props.formValues.startTime);
});
const endTime = computed(() => {
  return new Date(props.formValues.endTime);
});

const datePickerErrorMessage = computed(() => {
  if (startTime.value < new Date()) {
    return 'Are you sure you want the start time to be in the past?';
  }
  if (startTime.value >= endTime.value) {
    return 'The start time must be before the end time.';
  }
  return '';
});

const duration = computed(() => {
  return getDuration(
    startTime.value.toISOString(),
    endTime.value.toISOString()
  );
});

// The pure date math lives in utils/eventDateTimeEditing.ts (unit-tested).
// Each picker edits one axis (time-of-day or calendar date) of the timestamp.
const handleStartTimeTimeChange = (timeValue: string) => {
  const startTime = applyTimeToTimestamp(props.formValues.startTime, timeValue);
  if (startTime) emit('updateFormValues', { startTime });
};

const handleEndTimeTimeChange = (timeValue: string) => {
  const endTime = applyTimeToTimestamp(props.formValues.endTime, timeValue);
  if (endTime) emit('updateFormValues', { endTime });
};

const handleStartTimeDateChange = (dateValue: string) => {
  const updates = computeStartDateChange({
    startISO: props.formValues.startTime,
    endISO: props.formValues.endTime,
    dateValue,
    isMultiDay: isMultiDayEvent.value,
  });
  if (updates) emit('updateFormValues', updates);
};

const handleEndTimeDateChange = (dateValue: string) => {
  const result = computeEndDateChange({
    startISO: props.formValues.startTime,
    endISO: props.formValues.endTime,
    dateValue,
  });
  if (result) {
    // End date differing from the start date flips the event to multi-day.
    isMultiDayEvent.value = result.isMultiDay;
    emit('updateFormValues', { endTime: result.endTime });
  }
};

const toggleIsAllDayField = () => {
  // Toggle the isAllDay flag
  const newAllDayValue = !props.formValues.isAllDay;
  emit('updateFormValues', { isAllDay: newAllDayValue });

  // If switching to All Day, set times to the full day
  if (newAllDayValue) {
    const startDate = DateTime.fromISO(props.formValues.startTime);
    const endDate = isMultiDayEvent.value
      ? DateTime.fromISO(props.formValues.endTime)
      : startDate; // Use same date if not multi-day

    const newStartTime = startDate.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    const newEndTime = endDate.set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });

    emit('updateFormValues', {
      startTime: newStartTime.toISO(),
      endTime: newEndTime.toISO(),
    });
  }
};

const toggleMultiDayEvent = () => {
  isMultiDayEvent.value = !isMultiDayEvent.value;

  // If switching to single-day event, update end date to match start date
  if (!isMultiDayEvent.value) {
    const startDateTime = DateTime.fromJSDate(startTime.value);
    const currentEndTime = DateTime.fromJSDate(endTime.value);

    // Keep the same time but set date to match start date
    const newEndTime = currentEndTime.set({
      year: startDateTime.year,
      month: startDateTime.month,
      day: startDateTime.day,
    });

    emit('updateFormValues', { endTime: newEndTime.toISO() });
  }
};
</script>

<template>
  <div class="flex flex-col dark:text-white">
    <!-- Date Mode Selector -->
    <fieldset class="mb-4">
      <legend class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Event Schedule
      </legend>
      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Date mode">
        <label
          v-for="option in dateModeOptions"
          :key="option.value"
          :class="[
            'cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors',
            currentDateMode === option.value
              ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600',
          ]"
          :data-testid="`date-mode-${option.value}`"
        >
          <input
            type="radio"
            name="date-mode"
            :value="option.value"
            :checked="currentDateMode === option.value"
            class="sr-only"
            @change="updateDateMode(option.value)"
          >
          <span class="font-medium">{{ option.label }}</span>
          <span class="ml-1 text-xs text-gray-500 dark:text-gray-400">
            ({{ option.description }})
          </span>
        </label>
      </div>
    </fieldset>

    <!-- Single date mode: Original date/time pickers -->
    <div v-if="currentDateMode === 'single'">
      <DateTimePickersRow
        :is-all-day="formValues.isAllDay"
        :is-multi-day="isMultiDayEvent"
        :start-time="startTime"
        :end-time="endTime"
        @update-start-date="handleStartTimeDateChange"
        @update-start-time="handleStartTimeTimeChange"
        @update-end-date="handleEndTimeDateChange"
        @update-end-time="handleEndTimeTimeChange"
      />

      <!-- Duration Display -->
      <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Duration: {{ duration }}
      </div>

      <!-- Checkboxes for event options -->
      <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <!-- All-day checkbox -->
        <CheckBox
          test-id="all-day-input"
          :checked="formValues.isAllDay"
          label="All day"
          @update="toggleIsAllDayField"
        />

        <!-- Multi-day checkbox -->
        <CheckBox
          test-id="multi-day-input"
          :checked="isMultiDayEvent"
          label="Multi-day event"
          @update="toggleMultiDayEvent"
        />
      </div>

      <ErrorMessage :text="datePickerErrorMessage" class="mt-1" />
    </div>

    <!-- Multiple dates mode: OccurrencesList -->
    <div v-else-if="currentDateMode === 'multiple'">
      <OccurrencesList
        :occurrences="formValues.occurrences"
        :is-all-day="formValues.isAllDay"
        @update="handleOccurrenceUpdate"
        @add="handleOccurrenceAdd"
        @remove="handleOccurrenceRemove"
      />

      <!-- All-day checkbox for multiple dates -->
      <div class="mt-3">
        <CheckBox
          test-id="all-day-input-multiple"
          :checked="formValues.isAllDay"
          label="All day events"
          @update="toggleIsAllDayField"
        />
      </div>
    </div>

    <!-- Recurring mode: RepeatPatternPicker -->
    <div v-else-if="currentDateMode === 'recurring'">
      <!-- Base date/time for pattern -->
      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Starting from
        </label>
        <DateTimePickersRow
          :is-all-day="formValues.isAllDay"
          :is-multi-day="false"
          :start-time="startTime"
          :end-time="endTime"
          @update-start-date="handleStartTimeDateChange"
          @update-start-time="handleStartTimeTimeChange"
          @update-end-date="handleEndTimeDateChange"
          @update-end-time="handleEndTimeTimeChange"
        />
      </div>

      <!-- Repeat pattern picker -->
      <RepeatPatternPicker
        :pattern="formValues.repeatPattern"
        @update="handleRepeatPatternUpdate"
      />

      <!-- Preview of generated occurrences -->
      <div
        v-if="generatedOccurrencesPreview.length > 0"
        class="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Upcoming dates (first {{ generatedOccurrencesPreview.length }})
        </p>
        <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li
            v-for="(occurrence, index) in generatedOccurrencesPreview"
            :key="index"
            class="flex items-center gap-2"
          >
            <span class="text-orange-500">•</span>
            {{ formatOccurrenceDate(occurrence.startTime) }}
          </li>
        </ul>
      </div>

      <!-- All-day checkbox for recurring -->
      <div class="mt-3">
        <CheckBox
          test-id="all-day-input-recurring"
          :checked="formValues.isAllDay"
          label="All day events"
          @update="toggleIsAllDayField"
        />
      </div>
    </div>

    <!-- Date-range mode: one occurrence per day in each range, at that range's
         hours (supports "expo hours" via multiple ranges). -->
    <div v-else-if="currentDateMode === 'dateRange'">
      <DateRangeGroups
        :groups="formValues.dateRangeGroups"
        :is-all-day="formValues.isAllDay"
        @update="handleDateRangeGroupUpdate"
        @add="handleDateRangeGroupAdd"
        @remove="handleDateRangeGroupRemove"
      />

      <p
        v-if="dateRangeOccurrenceCount > 0"
        data-testid="date-range-occurrence-count"
        class="mt-3 text-sm text-gray-600 dark:text-gray-400"
      >
        Creates {{ dateRangeOccurrenceCount }}
        {{ dateRangeOccurrenceCount === 1 ? 'event' : 'events' }}.
      </p>

      <!-- All-day checkbox for date ranges -->
      <div class="mt-3">
        <CheckBox
          test-id="all-day-input-daterange"
          :checked="formValues.isAllDay"
          label="All day events"
          @update="toggleIsAllDayField"
        />
      </div>
    </div>
  </div>
</template>
