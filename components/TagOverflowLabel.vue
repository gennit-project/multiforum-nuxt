<script setup lang="ts">
defineProps({
  count: {
    type: Number,
    required: true,
  },
});
</script>

<template>
  <span
    v-if="count > 0"
    class="my-1 self-center text-xs whitespace-nowrap text-gray-600 dark:text-gray-300"
    data-testid="tag-overflow-label"
  >
    ... and {{ count }} {{ count === 1 ? 'other' : 'others' }}
  </span>
</template>
