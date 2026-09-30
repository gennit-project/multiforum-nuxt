<script setup lang="ts">
import RefreshIcon from '@/components/icons/RefreshIcon.vue';
const emit = defineEmits(['reset']);
</script>

<template>
  <div class="h-14 p-2">
    <button
      class="focus:ring-brand-500 float-right inline-flex rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
      @click.prevent="emit('reset')"
    >
      <RefreshIcon class="h-5" />
      Reset
    </button>
  </div>
</template>
