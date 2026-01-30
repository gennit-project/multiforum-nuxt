<script setup lang="ts">
import type { BotSuggestion } from '@/utils/botMentions';

defineProps<{
  suggestions: BotSuggestion[];
  style: Record<string, string>;
}>();

const emit = defineEmits<{
  select: [suggestion: BotSuggestion];
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
        index === 0
          ? 'bg-orange-50 border-l-4 border-orange-400 dark:border-orange-500 dark:bg-gray-900/40'
          : 'bg-white dark:bg-gray-800',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
      ]"
      @click.prevent="emit('select', suggestion)"
    >
      <span class="flex-1 text-gray-900 dark:text-white">
        {{ suggestion.mention }}
      </span>
      <span
        v-if="suggestion.displayName"
        class="text-xs text-gray-500 dark:text-gray-300"
      >
        {{ suggestion.displayName }}
      </span>
    </button>
  </div>
</template>
