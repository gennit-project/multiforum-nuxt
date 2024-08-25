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
    :class="[disabled ? 'text-blue-200' : 'text-blue-600']"
    class="focus:ring-blue-500 h-4 w-4 border-gray-400 rounded"
    :checked="checked"
    :disabled="disabled"
  >
</template>