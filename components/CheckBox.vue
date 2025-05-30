<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    checked: {
      type: Boolean,
      default: false,
    },
  },
  setup() {},
});
</script>

<template>
  <input
    type="checkbox"
    :class="[disabled ? 'text-orange-200' : 'text-orange-600']"
    class="focus:ring-orange-500 h-4 w-4 border border-gray-500 rounded dark:bg-gray-800 dark:border-gray-400 dark:focus:ring-orange-500"
    :checked="checked"
    :disabled="disabled"
  >
</template>