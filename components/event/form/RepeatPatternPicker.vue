<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  RepeatPattern,
  RepeatPatternType,
  RepeatEndType,
} from '@/types/Event';
import DatePicker from './DatePicker.vue';

const props = defineProps({
  pattern: {
    type: Object as () => RepeatPattern | undefined,
    default: undefined,
  },
});

const emit = defineEmits(['update']);

// Default pattern values
const defaultPattern: RepeatPattern = {
  type: 'WEEKLY',
  count: 1,
  daysOfWeek: [],
  endType: 'AFTER_COUNT',
  endCount: 10,
  endDate: undefined,
};

// Local state
const patternType = ref<RepeatPatternType>(
  props.pattern?.type || defaultPattern.type
);
const intervalCount = ref(props.pattern?.count || defaultPattern.count || 1);
const selectedDaysOfWeek = ref<number[]>(
  props.pattern?.daysOfWeek || defaultPattern.daysOfWeek || []
);
const endType = ref<RepeatEndType>(
  props.pattern?.endType || defaultPattern.endType
);
const endCount = ref(props.pattern?.endCount || defaultPattern.endCount || 10);
const endDate = ref(props.pattern?.endDate || '');

// Pattern type options
const patternTypeOptions = [
  { label: 'Daily', value: 'DAILY' as RepeatPatternType },
  { label: 'Weekly', value: 'WEEKLY' as RepeatPatternType },
  { label: 'Monthly', value: 'MONTHLY' as RepeatPatternType },
  { label: 'Yearly', value: 'YEARLY' as RepeatPatternType },
];

// Days of week for weekly patterns
const daysOfWeek = [
  { label: 'S', fullLabel: 'Sun', value: 0 },
  { label: 'M', fullLabel: 'Mon', value: 1 },
  { label: 'T', fullLabel: 'Tue', value: 2 },
  { label: 'W', fullLabel: 'Wed', value: 3 },
  { label: 'T', fullLabel: 'Thu', value: 4 },
  { label: 'F', fullLabel: 'Fri', value: 5 },
  { label: 'S', fullLabel: 'Sat', value: 6 },
];

// End type options
const endTypeOptions = [
  { label: 'Never', value: 'NEVER' as RepeatEndType },
  { label: 'After', value: 'AFTER_COUNT' as RepeatEndType },
  { label: 'On date', value: 'ON_DATE' as RepeatEndType },
];

// Computed interval label
const intervalLabel = computed(() => {
  switch (patternType.value) {
    case 'DAILY':
      return intervalCount.value === 1 ? 'day' : 'days';
    case 'WEEKLY':
      return intervalCount.value === 1 ? 'week' : 'weeks';
    case 'MONTHLY':
      return intervalCount.value === 1 ? 'month' : 'months';
    case 'YEARLY':
      return intervalCount.value === 1 ? 'year' : 'years';
    default:
      return '';
  }
});

// Toggle day of week selection
const toggleDayOfWeek = (day: number) => {
  const index = selectedDaysOfWeek.value.indexOf(day);
  if (index === -1) {
    selectedDaysOfWeek.value = [...selectedDaysOfWeek.value, day].sort(
      (a, b) => a - b
    );
  } else {
    selectedDaysOfWeek.value = selectedDaysOfWeek.value.filter((d) => d !== day);
  }
};

// Build and emit the current pattern
const emitPattern = () => {
  const pattern: RepeatPattern = {
    type: patternType.value,
    count: intervalCount.value,
    daysOfWeek:
      patternType.value === 'WEEKLY' ? selectedDaysOfWeek.value : undefined,
    endType: endType.value,
    endCount: endType.value === 'AFTER_COUNT' ? endCount.value : undefined,
    endDate: endType.value === 'ON_DATE' ? endDate.value : undefined,
  };
  emit('update', pattern);
};

// Watch for changes and emit updates
watch(
  [patternType, intervalCount, selectedDaysOfWeek, endType, endCount, endDate],
  () => {
    emitPattern();
  },
  { deep: true }
);

// Initialize with a default pattern if none provided
if (!props.pattern) {
  emitPattern();
}
</script>

<template>
  <div class="space-y-4">
    <!-- Frequency Type -->
    <div>
      <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Repeat
      </label>
      <div
        class="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Repeat frequency"
      >
        <label
          v-for="option in patternTypeOptions"
          :key="option.value"
          :class="[
            'cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors',
            patternType === option.value
              ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600',
          ]"
          :data-testid="`repeat-type-${option.value.toLowerCase()}`"
        >
          <input
            type="radio"
            name="repeat-type"
            :value="option.value"
            :checked="patternType === option.value"
            class="sr-only"
            @change="patternType = option.value"
          >
          {{ option.label }}
        </label>
      </div>
    </div>

    <!-- Interval -->
    <div class="flex items-center gap-2">
      <label
        for="interval-count"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        Every
      </label>
      <input
        id="interval-count"
        v-model.number="intervalCount"
        type="number"
        min="1"
        max="99"
        class="w-16 rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        data-testid="interval-count"
      >
      <span class="text-sm text-gray-700 dark:text-gray-300">
        {{ intervalLabel }}
      </span>
    </div>

    <!-- Days of Week (for weekly patterns) -->
    <div v-if="patternType === 'WEEKLY'">
      <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        On these days
      </label>
      <div class="flex gap-1" role="group" aria-label="Days of week">
        <button
          v-for="day in daysOfWeek"
          :key="day.value"
          type="button"
          :class="[
            'flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors',
            selectedDaysOfWeek.includes(day.value)
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
          ]"
          :aria-pressed="selectedDaysOfWeek.includes(day.value)"
          :aria-label="day.fullLabel"
          :data-testid="`day-of-week-${day.value}`"
          @click="toggleDayOfWeek(day.value)"
        >
          {{ day.label }}
        </button>
      </div>
      <p
        v-if="selectedDaysOfWeek.length === 0"
        class="mt-1 text-xs text-amber-600 dark:text-amber-400"
      >
        Select at least one day
      </p>
    </div>

    <!-- End Condition -->
    <div>
      <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Ends
      </label>
      <div class="space-y-2">
        <div
          v-for="option in endTypeOptions"
          :key="option.value"
          class="flex items-center gap-2"
        >
          <label
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              endType === option.value
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
            ]"
            :data-testid="`end-type-${option.value.toLowerCase()}`"
          >
            <input
              type="radio"
              name="end-type"
              :value="option.value"
              :checked="endType === option.value"
              class="sr-only"
              @change="endType = option.value"
            >
            <span class="text-gray-700 dark:text-gray-300">
              {{ option.label }}
            </span>
          </label>

          <!-- After N occurrences -->
          <template v-if="option.value === 'AFTER_COUNT' && endType === 'AFTER_COUNT'">
            <input
              v-model.number="endCount"
              type="number"
              min="1"
              max="100"
              class="w-16 rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              data-testid="end-count"
            >
            <span class="text-sm text-gray-700 dark:text-gray-300">
              occurrences
            </span>
          </template>

          <!-- On date -->
          <template v-if="option.value === 'ON_DATE' && endType === 'ON_DATE'">
            <DatePicker
              test-id="end-date-picker"
              :value="endDate"
              aria-label="End date"
              @update="endDate = $event"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Preview info -->
    <div
      class="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
    >
      <p class="font-medium text-gray-700 dark:text-gray-300">Preview</p>
      <p class="mt-1">
        Repeats every {{ intervalCount }} {{ intervalLabel }}
        <template v-if="patternType === 'WEEKLY' && selectedDaysOfWeek.length > 0">
          on
          {{
            selectedDaysOfWeek
              .map((d) => daysOfWeek.find((day) => day.value === d)?.fullLabel)
              .join(', ')
          }}
        </template>
        <template v-if="endType === 'AFTER_COUNT'">
          for {{ endCount }} occurrences
        </template>
        <template v-else-if="endType === 'ON_DATE' && endDate">
          until {{ new Date(endDate).toLocaleDateString() }}
        </template>
        <template v-else-if="endType === 'NEVER'">
          (ongoing)
        </template>
      </p>
    </div>
  </div>
</template>
