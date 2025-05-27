<script setup lang="ts">
import RefreshIcon from "@/components/icons/RefreshIcon.vue";
const emit = defineEmits(['reset']);
</script>

<template>
  <div class="h-14 p-2">
    <button
<<<<<<< HEAD
      class="hover:bg-gray-50 float-right inline-flex rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
=======
      class="bg-white dark:bg-gray-700 float-right inline-flex py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      @click.prevent="emit('reset')"
    >
      <RefreshIcon
        class="h-5"
      />
      Reset
    </button>
  </div>
</template>
