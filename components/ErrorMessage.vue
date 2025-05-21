<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    props: {
      text: {
        type: String,
        required: true,
      },
    },
    setup() {},
  });
</script>

<template>
  <p class="mb-1 mt-1 h-4 rounded text-sm text-red-500 dark:text-red-400">
    {{ text }}
  </p>
</template>
