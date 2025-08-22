<script setup lang="ts">
import { computed } from 'vue';

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
  testId: {
    type: String,
    default: undefined,
  },
});

const charactersRemaining = computed(() => props.max - props.current);
const showWarning = computed(
  () => props.current <= props.max && charactersRemaining.value < props.max / 2
);
const showMinWarning = computed(
  () => props.current > 0 && props.current < props.min
);
const showOverLimit = computed(() => charactersRemaining.value < 0);
</script>

<template>
  <div :data-testid="testId">
    <div
      v-show="showWarning"
      class="mb-4 mt-2 text-right text-sm font-medium text-gray-500 dark:text-gray-300"
    >
      {{ `${charactersRemaining}/${max}` }} characters remaining
    </div>
    <div
      v-show="showMinWarning"
      class="mb-4 mt-2 text-right text-sm font-medium text-gray-500 dark:text-gray-300"
    >
      Minimum of {{ min }} characters
    </div>
    <div
      v-show="showOverLimit && !showMinWarning"
      class="mb-4 mt-2 text-right text-sm font-medium text-red-400 dark:text-red-500"
    >
      {{ `${charactersRemaining}/${max}` }} characters remaining
    </div>
  </div>
</template>
