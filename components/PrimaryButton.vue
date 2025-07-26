<script setup lang="ts">
import LoadingSpinner from "@/components/LoadingSpinner.vue";

defineProps({
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
});
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-300 dark:bg-gray-800 dark:text-gray-300'
        : ' bg-orange-400 hover:bg-orange-400 dark:border dark:border-orange-500 dark:bg-orange-400 dark:text-black dark:hover:bg-orange-400',
      '',
    ]"
    class="max-height-4 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100"
  >
    <LoadingSpinner
      v-if="loading"
      class="mx-2"
    /><slot />{{ label }}
  </button>
</template>
