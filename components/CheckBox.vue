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
<<<<<<< HEAD
    :checked="checked"
    class="h-4 w-4 rounded border border-gray-300 focus:ring-orange-500 dark:border-gray-400 dark:bg-gray-800 dark:focus:ring-orange-500"
    :class="[disabled ? 'text-orange-200' : 'text-orange-600']"
    :disabled="disabled"
    type="checkbox"
  >
</template>
=======
    type="checkbox"
    :class="[disabled ? 'text-blue-200' : 'text-blue-600']"
    class="focus:ring-blue-500 h-4 w-4 border border-gray-500 rounded dark:bg-gray-800 dark:border-gray-400 dark:focus:ring-blue-500"
    :checked="checked"
    :disabled="disabled"
  >
</template>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
