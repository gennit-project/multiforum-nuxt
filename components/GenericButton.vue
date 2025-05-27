<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    testId: {
      type: String,
      default: "",
    },
  }
});
</script>

<template>
  <button
<<<<<<< HEAD
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    :class="{
      'bg-orange-500 text-white hover:bg-gray-800 dark:text-black hover:dark:bg-orange-600': active,
      'bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600':
=======
    :data-testid="testId"
    :class="{
      'bg-blue-500 text-white dark:text-black hover:dark:bg-blue-600 hover:bg-gray-800': active,
      'text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600':
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        !active,
    }"
    class="inline-flex items-center py-2 px-4 border border-gray-300 rounded-lg text-sm gap-1 font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
    @keydown.enter.prevent
  >
    <LoadingSpinner v-if="loading" />
    <slot />
    {{ text }}
  </button>
</template>