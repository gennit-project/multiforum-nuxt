<script setup lang="ts">
// need to get channel id, render differently if clicked within channel

withDefaults(
  defineProps<{
    disabled?: boolean;
    label: string;
  }>(),
  {
    disabled: false,
  },
);
</script>
<template>
  <button
    :disabled="disabled"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-600'
        : 'text-gray-700 hover:bg-gray-400 dark:text-white dark:hover:bg-gray-600',
      'dark:bg-opacity-60', // class for controlling the background opacity in dark mode
    ]"
    class="max-height-4 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100"
  >
    <slot />{{ label }}
  </button>
</template>
