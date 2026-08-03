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
  }
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
        ? 'cursor-default bg-gray-200 text-gray-600 dark:bg-gray-200/60'
        : 'text-gray-700 hover:bg-gray-400 dark:text-white dark:hover:bg-gray-600/60',
      sizeClasses,
    ]"
    class="max-height-4 inline-flex items-center rounded-md font-medium whitespace-nowrap focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100 focus:outline-none"
  >
    <slot />{{ label }}
  </button>
</template>
