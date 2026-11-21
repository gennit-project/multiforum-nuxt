<script setup lang="ts">
withDefaults(defineProps<{ count?: number; label?: string }>(), {
  count: 6,
  label: 'Loading issues',
});
</script>

<template>
  <ul
    role="status"
    :aria-label="label"
    class="divide-y"
    data-testid="issue-list-skeleton"
  >
    <li class="sr-only">{{ label }}…</li>
    <li
      v-for="index in count"
      :key="index"
      aria-hidden="true"
      class="flex animate-pulse items-start space-x-2 p-3 pl-4"
    >
      <div
        class="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-gray-300 dark:bg-gray-700"
      />
      <div class="min-w-0 flex-1 space-y-2">
        <div class="h-4 w-3/5 rounded bg-gray-300 dark:bg-gray-700" />
        <div class="h-3 w-2/5 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </li>
  </ul>
</template>
