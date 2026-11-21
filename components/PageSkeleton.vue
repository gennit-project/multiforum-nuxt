<script setup lang="ts">
// Generic content-block placeholder (title + paragraph lines) for page-level
// loading states where a spinner would otherwise sit in an empty page.
withDefaults(defineProps<{ label?: string; lines?: number }>(), {
  label: 'Loading…',
  lines: 4,
});
const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3', 'w-3/4'];
</script>

<template>
  <div role="status" :aria-label="label" data-testid="page-skeleton">
    <span class="sr-only">{{ label }}</span>
    <div aria-hidden="true" class="animate-pulse space-y-3">
      <div class="h-7 w-1/3 rounded bg-gray-300 dark:bg-gray-700" />
      <div
        v-for="index in lines"
        :key="index"
        class="h-4 rounded bg-gray-200 dark:bg-gray-800"
        :class="widths[(index - 1) % widths.length]"
      />
    </div>
  </div>
</template>
