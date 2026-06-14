<script setup lang="ts">
import type { ModSuggestion } from '@/utils/modMentions';

const props = defineProps<{
  suggestions: ModSuggestion[];
  style: Record<string, string>;
  activeIndex?: number;
}>();

const emit = defineEmits<{
  select: [suggestion: ModSuggestion];
}>();
</script>

<template>
  <div
    class="absolute z-20 mt-1 rounded-md border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
    :style="{
      position: 'absolute',
      ...style,
    }"
  >
    <button
      v-for="(suggestion, index) in suggestions"
      :key="suggestion.value"
      type="button"
      :class="[
        'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition',
        'font-semibold text-sm',
        'border-transparent border-l-4',
        index === props.activeIndex
          ? 'bg-blue-50 border-blue-400 dark:border-blue-500 dark:bg-gray-900/40'
          : index === 0
            ? 'bg-blue-50 dark:bg-gray-900/40'
            : 'bg-white dark:bg-black',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
      ]"
      @click.prevent="emit('select', suggestion)"
    >
      <span class="flex-1 text-gray-900 dark:text-white">
        {{ suggestion.mention }}
      </span>
      <span
        v-if="suggestion.username"
        class="text-xs text-gray-500 dark:text-gray-300"
      >
        @{{ suggestion.username }}
      </span>
    </button>
  </div>
</template>
