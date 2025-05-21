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
    class="mb-4 mt-2 text-right text-sm font-medium text-gray-500 dark:text-gray-300"
  >
    {{ `${charactersRemaining}/${max}` }} characters remaining
  </div>
  <div
    v-if="current > 0 && current < min"
    class="mb-4 mt-2 text-right text-sm font-medium text-gray-500 dark:text-gray-300"
  >
    Minimum of {{ min }} characters
  </div>
  <div
    v-else-if="charactersRemaining < 0"
    class="mb-4 mt-2 text-right text-sm font-medium text-red-400 dark:text-red-500"
  >
    {{ `${charactersRemaining}/${max}` }} characters remaining
  </div>
</template>
