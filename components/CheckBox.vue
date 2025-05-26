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
    :checked="checked"
    class="h-4 w-4 rounded border border-gray-300 focus:ring-orange-500 dark:border-gray-400 dark:bg-gray-800 dark:focus:ring-orange-500"
    :class="[disabled ? 'text-orange-200' : 'text-orange-600']"
    :disabled="disabled"
    type="checkbox"
  >
</template>
