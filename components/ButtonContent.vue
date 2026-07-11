<script setup lang="ts">
defineProps({
  loading: Boolean,
  showCount: Boolean,
  count: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <span
    v-if="!loading"
    class="inline-flex flex-nowrap items-center justify-center whitespace-nowrap"
  >
    <slot />
  </span>
  <span
    v-if="loading"
    class="inline-flex flex-nowrap items-center justify-center whitespace-nowrap"
  >
    <LoadingSpinner />
  </span>
  <span
    v-if="showCount"
    class="mx-1 inline-flex flex-nowrap items-center justify-center whitespace-nowrap text-xs"
    aria-live="polite"
  >
    {{ count }}
  </span>
</template>
