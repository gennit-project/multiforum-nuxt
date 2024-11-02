<script setup lang="ts">
const props = defineProps({
  current: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    required: true,
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
    v-else-if="charactersRemaining < 0"
    class="text-right text-red-500 text-sm font-medium mt-2 mb-4"
  >
    {{ `${charactersRemaining}/${max}` }} characters remaining
  </div>
</template>
