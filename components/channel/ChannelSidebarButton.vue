<script lang="ts">
import { defineComponent } from "vue";
import { router } from "@/router";

export default defineComponent({
  name: "ChannelSidebarButton",
  props: {
    to: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      required: true,
    },
  },
  setup() {
    return { router };
  },
});
</script>
<template>
  <button
    :disabled="disabled"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-600'
        : 'text-white-700 w-full dark:text-white rounded-md hover:bg-gray-200 dark:bg-blue-700 dark:hover:bg-blue-600',
      'dark:bg-opacity-60', // class for controlling the background opacity in dark mode
    ]"
    class="font-medium inline-flex items-center whitespace-nowrap px-4 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
    @click="router.push(to)"
  >
    <slot />{{ label }}
  </button>
</template>
