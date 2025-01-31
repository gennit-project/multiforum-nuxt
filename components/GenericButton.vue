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
  }
});
</script>

<template>
  <button
    :class="{
      'bg-blue-500 text-white dark:text-black hover:dark:bg-blue-600 hover:bg-gray-800': active,
      'text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600':
        !active,
    }"
    class="inline-flex py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
    @keydown.enter.prevent
  >
    <LoadingSpinner v-if="loading" />
    <slot />
    {{ text }}
  </button>
</template>
