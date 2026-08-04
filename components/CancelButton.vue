<script setup lang="ts">
import GenericButton from '@/components/GenericButton.vue';
</script>

<template>
  <GenericButton
    text="Cancel"
    :class="[
      'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/60 dark:text-white dark:hover:bg-gray-600/60',
    ]"
    class="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
  />
</template>
