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
}>();

const maxActivity = computed(() => {
  const values = props.timeSeries.map(
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
  <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
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
        v-for="point in timeSeries"
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
