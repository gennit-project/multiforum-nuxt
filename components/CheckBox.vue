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
    class="h-4 w-4 rounded border border-gray-500 focus:ring-blue-500 dark:border-gray-400 dark:bg-gray-800 dark:focus:ring-blue-500"
    :class="[disabled ? 'text-blue-200' : 'text-blue-600']"
    :disabled="disabled"
    type="checkbox"
  />
</template>
