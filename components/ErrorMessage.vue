<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    text: {
      type: String,
      required: true
    },
  },
  setup() {},
});
</script>

<template>
  <p class="h-4 mt-1 mb-1 text-red-500 dark:text-red-400 text-sm rounded">
    {{ text }}
  </p>
</template>