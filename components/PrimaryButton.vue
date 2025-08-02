<script setup lang="ts">
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { computed } from "vue";

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    required: false,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  backgroundColor: {
    type: String,
    default: "orange",
  },
});

const colorClasses = computed(() => {
  if (props.disabled) {
    return 'cursor-default bg-gray-200 text-gray-300 dark:bg-gray-800 dark:text-gray-300';
  }
  
  switch (props.backgroundColor) {
    case 'red':
      return 'bg-red-500 hover:bg-red-600 dark:border dark:border-red-500 dark:bg-red-500 dark:text-white dark:hover:bg-red-600 focus:ring-red-500';
    case 'green':
      return 'bg-green-500 hover:bg-green-600 dark:border dark:border-green-500 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 focus:ring-green-500';
    case 'blue':
      return 'bg-blue-500 hover:bg-blue-600 dark:border dark:border-blue-500 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 focus:ring-blue-500';
    case 'gray':
      return 'bg-gray-500 hover:bg-gray-600 dark:border dark:border-gray-500 dark:bg-gray-500 dark:text-white dark:hover:bg-gray-600 focus:ring-gray-500';
    default: // orange
      return 'bg-orange-400 hover:bg-orange-400 dark:border dark:border-orange-500 dark:bg-orange-400 dark:text-black dark:hover:bg-orange-400 focus:ring-orange-500';
  }
});

</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      colorClasses,
      'max-height-4 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-offset-2 focus:ring-offset-gray-100'
    ]"
  >
    <LoadingSpinner
      v-if="loading"
      class="mx-2"
    /><slot />{{ label }}
  </button>
</template>
