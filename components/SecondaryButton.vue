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
    class="max-height-4 focus:ring-orange-500 inline-flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-offset-2 focus:ring-offset-gray-100"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-600'
        : 'text-gray-700 hover:bg-gray-400 dark:text-white dark:hover:bg-gray-600',
      'dark:bg-opacity-60', // class for controlling the background opacity in dark mode
    ]"
    :disabled="disabled"
  >
    <slot />{{ label }}
  </button>
</template>
