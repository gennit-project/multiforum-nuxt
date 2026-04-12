<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean;
    text: string;
    loading?: boolean;
    disabled?: boolean;
    testId?: string;
  }>(),
  {
    active: false,
    loading: false,
    disabled: false,
    testId: '',
  },
);
</script>

<template>
  <button
    type="button"
    :data-testid="testId"
    :disabled="disabled"
    :class="{
      'bg-orange-500 text-white hover:bg-gray-800 dark:text-black hover:dark:bg-orange-600':
        active && !disabled,
      'bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600':
        !active && !disabled,
      'cursor-default bg-gray-200 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500':
        disabled,
    }"
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    @keydown.enter.prevent
  >
    <LoadingSpinner v-if="loading" />
    <slot />
    {{ text }}
  </button>
</template>
