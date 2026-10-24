<script setup lang="ts">
const props = defineProps<{
  itemLabel: string;
  index: number;
  total: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  move: [newPosition: number];
}>();
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 self-start rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900"
    role="group"
    :aria-label="`Reorder ${itemLabel}`"
  >
    <button
      type="button"
      class="focus-visible:ring-brand-500 inline-flex h-11 w-11 items-center justify-center rounded-lg text-lg font-semibold text-gray-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-35 dark:text-gray-100 dark:hover:bg-gray-800"
      :disabled="index === 0 || loading"
      :aria-label="`Move ${itemLabel} up`"
      :title="`Move ${itemLabel} up`"
      @click="emit('move', props.index - 1)"
    >
      <span aria-hidden="true">↑</span>
    </button>
    <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400">
      {{ index + 1 }}
    </span>
    <button
      type="button"
      class="focus-visible:ring-brand-500 inline-flex h-11 w-11 items-center justify-center rounded-lg text-lg font-semibold text-gray-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-35 dark:text-gray-100 dark:hover:bg-gray-800"
      :disabled="index === total - 1 || loading"
      :aria-label="`Move ${itemLabel} down`"
      :title="`Move ${itemLabel} down`"
      @click="emit('move', props.index + 1)"
    >
      <span aria-hidden="true">↓</span>
    </button>
  </div>
</template>
