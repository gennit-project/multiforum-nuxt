<script setup lang="ts">
import LoadingSpinner from "@/components/LoadingSpinner.vue";

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <button
<<<<<<< HEAD
    class="max-height-4 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-300 dark:bg-gray-800 dark:text-gray-300'
        : 'bg-orange-500 text-black hover:bg-orange-700 dark:bg-orange-500 dark:text-black dark:hover:bg-orange-400',
=======
    type="button"
    :disabled="disabled"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-300 dark:bg-gray-800 dark:text-gray-300'
        : ' bg-blue-600 text-white hover:bg-blue-700 dark:border dark:border-blue-600 dark:bg-blue-500 dark:text-black dark:hover:bg-blue-400',
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      '',
    ]"
    class="max-height-4 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
  >
    <LoadingSpinner
      v-if="loading"
      class="mx-2"
    /><slot />{{ label }}
  </button>
</template>
