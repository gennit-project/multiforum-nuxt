<script lang="ts">
import { defineComponent } from "vue";

// need to get channel id, render differently if clicked within channel

export default defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      required: true,
    },
  },
  setup() {},
});
</script>
<template>
  <button
<<<<<<< HEAD
    class="max-height-4 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100"
=======
    :disabled="disabled"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    :class="[
      disabled
        ? 'bg-gray-200 cursor-default text-gray-600'
        : 'text-gray-700 hover:bg-gray-400 dark:text-white dark:hover:bg-gray-600',
      'dark:bg-opacity-60', // class for controlling the background opacity in dark mode
    ]"
    class="inline-flex whitespace-nowrap items-center max-height-4 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
  >
    <slot />{{ label }}
  </button>
</template>
