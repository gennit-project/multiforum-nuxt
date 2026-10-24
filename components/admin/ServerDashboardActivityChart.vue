<script setup lang="ts">
import { computed } from 'vue';
import type { ServerHealthTimeSeriesPoint as GeneratedTimeSeriesPoint } from '@/__generated__/graphql';

type ServerHealthTimeSeriesPoint = Pick<
  GeneratedTimeSeriesPoint,
  'date' | 'discussions' | 'comments' | 'events'
>;

const props = defineProps<{
  timeSeries: ServerHealthTimeSeriesPoint[];
  startDate?: string;
  endDate?: string;
}>();

// Guard against a pathological range dragging in thousands of empty bars.
const MAX_RANGE_DAYS = 366;
// Number of date labels under the plot; bars never scroll, so labels are
// sampled across the range instead of printed for every day.
const AXIS_LABEL_COUNT = 5;

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

const totals = computed(() =>
  chartPoints.value.reduce(
    (sum, point) => ({
      discussions: sum.discussions + point.discussions,
      comments: sum.comments + point.comments,
      events: sum.events + point.events,
    }),
    { discussions: 0, comments: 0, events: 0 }
  )
);

const formatDateLabel = (date: string) => {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const pluralize = (count: number, singular: string) =>
  `${count} ${singular}${count === 1 ? '' : 's'}`;

const describePoint = (point: ServerHealthTimeSeriesPoint) =>
  `${formatDateLabel(point.date)}: ${pluralize(point.discussions, 'discussion')}, ${pluralize(point.comments, 'comment')}, ${pluralize(point.events, 'event')}`;

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};

const bars = computed(() =>
  chartPoints.value.map((point) => ({
    date: point.date,
    title: describePoint(point),
    discussionsHeight: `${percent(point.discussions, maxActivity.value)}%`,
    commentsHeight: `${percent(point.comments, maxActivity.value)}%`,
    eventsHeight: `${percent(point.events, maxActivity.value)}%`,
  }))
);

const axisLabels = computed(() => {
  const points = chartPoints.value;
  if (points.length <= AXIS_LABEL_COUNT) {
    return points.map((point) => formatDateLabel(point.date));
  }
  const indexes = new Set<number>();
  for (let i = 0; i < AXIS_LABEL_COUNT; i += 1) {
    indexes.add(Math.round((i * (points.length - 1)) / (AXIS_LABEL_COUNT - 1)));
  }
  return [...indexes].map((index) => formatDateLabel(points[index]?.date || ''));
});

const peakLabel = computed(() => {
  const peak = chartPoints.value.reduce<ServerHealthTimeSeriesPoint | null>(
    (best, point) => {
      const total = point.discussions + point.comments + point.events;
      const bestTotal = best
        ? best.discussions + best.comments + best.events
        : 0;
      return total > bestTotal ? point : best;
    },
    null
  );
  return peak
    ? ` Busiest day was ${formatDateLabel(peak.date)} with ${maxActivity.value}.`
    : ' No activity in this range.';
});

const chartDescription = computed(() => {
  const first = chartPoints.value[0];
  const last = chartPoints.value[chartPoints.value.length - 1];
  const range =
    first && last
      ? ` from ${formatDateLabel(first.date)} to ${formatDateLabel(last.date)}`
      : '';
  return `Bar chart of daily contributions${range}.${peakLabel.value}`;
});

const midLabel = computed(() => Math.round(maxActivity.value / 2));
</script>

<template>
  <section
    aria-labelledby="activity-heading"
    class="min-w-0 rounded-xl border border-gray-200 bg-white p-5 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2
          id="activity-heading"
          class="text-base font-semibold !text-gray-900 dark:!text-gray-100"
        >
          Activity
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Contributions per day. The whole range fits without scrolling.
        </p>
      </div>
      <ul
        class="m-0 flex list-none flex-wrap gap-4 p-0 text-sm text-gray-700 dark:text-gray-300"
      >
        <li class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-blue-500" />Discussions
          <span data-testid="total-discussions">{{ totals.discussions }}</span>
        </li>
        <li class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-brand-500" />Comments
          <span data-testid="total-comments">{{ totals.comments }}</span>
        </li>
        <li class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-green-500" />Events
          <span data-testid="total-events">{{ totals.events }}</span>
        </li>
      </ul>
    </div>

    <div
      role="img"
      :aria-label="chartDescription"
      class="mt-5 flex gap-2.5"
    >
      <div
        aria-hidden="true"
        class="flex h-40 w-6 shrink-0 flex-col justify-between text-right text-xs leading-none text-gray-600 dark:text-gray-400"
      >
        <span>{{ maxActivity }}</span>
        <span v-if="maxActivity >= 2">{{ midLabel }}</span>
        <span>0</span>
      </div>
      <div class="min-w-0 flex-1">
        <div
          class="flex h-40 items-end gap-0.5 border-b border-gray-300 dark:border-gray-700"
        >
          <div
            v-for="bar in bars"
            :key="bar.date"
            data-testid="activity-bar"
            class="flex h-full min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-t-sm bg-gray-100 dark:bg-gray-800"
            :title="bar.title"
          >
            <div
              class="bg-green-500"
              :style="{ height: bar.eventsHeight }"
            />
            <div
              class="bg-brand-500"
              :style="{ height: bar.commentsHeight }"
            />
            <div
              class="bg-blue-500"
              :style="{ height: bar.discussionsHeight }"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          class="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400"
        >
          <span v-for="(label, index) in axisLabels" :key="`${label}-${index}`">
            {{ label }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
