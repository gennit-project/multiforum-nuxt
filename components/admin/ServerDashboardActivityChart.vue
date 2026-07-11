<script setup lang="ts">
import { computed } from 'vue';
import { CalendarDays } from 'lucide-vue-next';

type ServerHealthTimeSeriesPoint = {
  date: string;
  discussions: number;
  comments: number;
  events: number;
};

const props = defineProps<{
  timeSeries: ServerHealthTimeSeriesPoint[];
  startDate?: string;
  endDate?: string;
}>();

// Guard against a pathological range dragging in thousands of empty bars.
const MAX_RANGE_DAYS = 366;

const isDateInputValue = (value?: string): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

// Build every calendar day in [startDate, endDate] inclusive, using UTC so the
// arithmetic never drifts across daylight-saving boundaries.
const buildDateRange = (start: string, end: string): string[] => {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || startTime > endTime) {
    return [];
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const dates: string[] = [];
  for (let time = startTime; time <= endTime; time += dayMs) {
    const isoDate = new Date(time).toISOString().split('T')[0];
    if (isoDate) dates.push(isoDate);
    if (dates.length > MAX_RANGE_DAYS) return [];
  }
  return dates;
};

// The chart's x-axis should always mirror the selected date range so it matches
// the date pickers, even when the backend omits days or returns stale/partial
// data mid-refetch. When a valid range is supplied we render one bar per day and
// zero-fill any day the time series does not cover; otherwise we fall back to
// rendering the raw series as-is.
const chartPoints = computed<ServerHealthTimeSeriesPoint[]>(() => {
  if (!isDateInputValue(props.startDate) || !isDateInputValue(props.endDate)) {
    return props.timeSeries;
  }

  const dateRange = buildDateRange(props.startDate, props.endDate);
  if (dateRange.length === 0) {
    return props.timeSeries;
  }

  const pointsByDate = new Map(
    props.timeSeries.map((point) => [point.date, point])
  );

  return dateRange.map(
    (date) =>
      pointsByDate.get(date) || {
        date,
        discussions: 0,
        comments: 0,
        events: 0,
      }
  );
});

const maxActivity = computed(() => {
  const values = chartPoints.value.map(
    (point) => point.discussions + point.comments + point.events
  );
  return Math.max(...values, 1);
});

const formatDateLabel = (date: string) => {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};
</script>

<template>
  <div class="min-w-0 rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold !text-gray-900 dark:!text-gray-100">
          Activity
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Discussions, comments, and events by day.
        </p>
      </div>
      <CalendarDays class="h-5 w-5 text-gray-400" />
    </div>

    <div class="flex h-64 items-end gap-2 overflow-x-auto overflow-y-visible pb-12">
      <div
        v-for="point in chartPoints"
        :key="point.date"
        class="relative flex min-w-6 flex-1 flex-col items-center justify-end gap-1"
        :title="`${formatDateLabel(point.date)}: ${point.discussions + point.comments + point.events}`"
      >
        <div class="flex h-44 w-full max-w-7 flex-col justify-end overflow-hidden rounded-t bg-gray-100 dark:bg-gray-800">
          <div
            class="bg-blue-500"
            :style="{ height: `${percent(point.discussions, maxActivity)}%` }"
          />
          <div
            class="bg-orange-500"
            :style="{ height: `${percent(point.comments, maxActivity)}%` }"
          />
          <div
            class="bg-green-500"
            :style="{ height: `${percent(point.events, maxActivity)}%` }"
          />
        </div>
        <span class="absolute -bottom-9 left-1/2 hidden w-14 origin-top-left -translate-x-1 -rotate-45 whitespace-nowrap text-left text-[10px] leading-none text-gray-500 sm:block">
          {{ formatDateLabel(point.date) }}
        </span>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
      <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-blue-500" />Discussions</span>
      <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-orange-500" />Comments</span>
      <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-green-500" />Events</span>
    </div>
  </div>
</template>
