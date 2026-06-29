<script setup lang="ts">
import { computed } from 'vue';
import { Clock3 } from 'lucide-vue-next';

type IssueAgingBucket = {
  label: string;
  minDays: number;
  maxDays?: number | null;
  count: number;
};

const props = defineProps<{
  issueAging: IssueAgingBucket[];
}>();

const maxIssueAgeBucket = computed(() => {
  const values = props.issueAging.map((bucket) => bucket.count);
  return Math.max(...values, 1);
});

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};

const barPercent = (value: number, max: number) => {
  if (value <= 0) return 0;
  return Math.max(4, percent(value, max));
};
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold !text-gray-900 dark:!text-gray-100">
          Issue Aging
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Open admin/server-scoped issues by age bucket.
        </p>
      </div>
      <Clock3 class="h-5 w-5 text-gray-400" />
    </div>

    <div class="space-y-3">
      <div
        v-for="bucket in issueAging"
        :key="bucket.label"
        class="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"
      >
        <span class="font-medium text-gray-700 dark:text-gray-200">
          {{ bucket.label }}
        </span>
        <div class="h-3 overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
          <div
            class="h-full rounded-sm bg-yellow-500"
            :style="{ width: `${barPercent(bucket.count, maxIssueAgeBucket)}%` }"
          />
        </div>
        <span class="text-right text-gray-600 dark:text-gray-300">
          {{ bucket.count }}
        </span>
      </div>
    </div>
  </div>
</template>
