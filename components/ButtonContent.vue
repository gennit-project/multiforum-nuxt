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
  <span v-if="!loading" class="justify-center dark:text-white">
    <slot />
  </span>
  <span v-if="loading" class="justify-center dark:text-white">
    <LoadingSpinner />
  </span>
  <span v-if="showCount" id="count" class="mx-1 justify-center text-xs dark:text-white">
    {{ count }}
  </span>
</template>