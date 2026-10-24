<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    variant?: 'rows' | 'cards' | 'images';
    count?: number;
  }>(),
  {
    variant: 'rows',
    count: 6,
  }
);
</script>

<template>
  <div role="status" :aria-label="label">
    <span class="sr-only">{{ label }}…</span>

    <div
      v-if="variant === 'rows'"
      class="space-y-4"
      data-testid="library-list-skeleton"
    >
      <div
        v-for="index in count"
        :key="index"
        class="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        aria-hidden="true"
      >
        <div class="flex items-center gap-4">
          <div
            class="h-14 w-14 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-800"
          />
          <div class="min-w-0 flex-1 space-y-3">
            <div class="h-4 w-2/5 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-800/70" />
            <div class="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800/70" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="library-list-skeleton"
    >
      <div
        v-for="index in count"
        :key="index"
        class="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        aria-hidden="true"
      >
        <div
          class="bg-gray-200 dark:bg-gray-800"
          :class="variant === 'images' ? 'aspect-square' : 'aspect-16/10'"
        />
        <div class="space-y-3 p-4">
          <div class="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div class="h-3 w-2/5 rounded bg-gray-100 dark:bg-gray-800/70" />
        </div>
      </div>
    </div>
  </div>
</template>
