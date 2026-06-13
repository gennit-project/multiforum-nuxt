<script setup lang="ts">
defineOptions({
  name: 'TableComponent',
});
</script>
<template>
  <table class="min-w-full table-auto divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <slot name="head" />
    </thead>
    <tbody>
      <slot name="body" />
    </tbody>
  </table>
</template>
