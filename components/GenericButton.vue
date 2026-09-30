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
  }
);
</script>

<template>
  <button
    type="button"
    :data-testid="testId"
    :disabled="disabled"
    :class="{
      'bg-brand-500 hover:dark:bg-brand-600 text-white hover:bg-gray-800 dark:text-black':
        active && !disabled,
      'bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600':
        !active && !disabled,
      'cursor-default bg-gray-200 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500':
        disabled,
    }"
    class="focus:ring-brand-500 inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
  >
    <LoadingSpinner v-if="loading" />
    <slot />
    {{ text }}
  </button>
</template>
