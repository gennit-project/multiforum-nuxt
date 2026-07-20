<script setup lang="ts">
defineOptions({
  name: 'TableComponent',
});

// Optional accessible name for the table. Rendered as a visually hidden
// <caption> so screen-reader users get table context without changing layout.
defineProps<{
  caption?: string;
}>();
</script>
<template>
  <table class="min-w-full table-auto divide-y divide-gray-200">
    <caption v-if="caption" class="sr-only">
      {{ caption }}
    </caption>
    <thead class="bg-gray-50">
      <slot name="head" />
    </thead>
    <tbody>
      <slot name="body" />
    </tbody>
  </table>
</template>
