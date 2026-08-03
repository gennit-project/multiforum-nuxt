<script setup lang="ts">
// need to get channel id, render differently if clicked within channel
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    label: string;
    // 'sm' matches compact toolbar controls (fixed h-9 height, smaller text)
    // so it lines up with filter-bar buttons.
    size?: 'md' | 'sm';
  }>(),
  {
    disabled: false,
    size: 'md',
  },
);

const sizeClasses = computed(() =>
  props.size === 'sm' ? 'h-9 px-4 text-xs' : 'px-4 py-2 text-sm'
);
</script>
<template>
  <button
    :disabled="disabled"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-600'
        : 'text-gray-700 hover:bg-gray-400 dark:text-white dark:hover:bg-gray-600',
      sizeClasses,
      'dark:bg-opacity-60', // class for controlling the background opacity in dark mode
    ]"
    class="max-height-4 inline-flex items-center whitespace-nowrap rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100"
  >
    <slot />{{ label }}
  </button>
</template>
