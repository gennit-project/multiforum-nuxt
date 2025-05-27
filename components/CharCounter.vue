<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  current: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    required: true,
  },
  min: {
    type: Number,
    default: 0,
  },
});

const charactersRemaining = computed(() => props.max - props.current);
</script>

<template>
  <div
    v-if="current <= max && charactersRemaining < max / 2"
    class="text-right text-gray-500 dark:text-gray-300 text-sm font-medium mt-2 mb-4"
  >
    {{ `${charactersRemaining}/${max}` }} characters remaining
  </div>
  <div
    v-if="current > 0 && current < min"
    class="text-right text-gray-500 dark:text-gray-300 text-sm font-medium mt-2 mb-4"
  >
    Minimum of {{ min }} characters
  </div>
  <div
    v-else-if="charactersRemaining < 0"
    class="text-right text-red-400 dark:text-red-500 text-sm font-medium mt-2 mb-4"
  >
    {{ `${charactersRemaining}/${max}` }} characters remaining
  </div>
</template>
