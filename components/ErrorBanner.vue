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
  <p class="text-wrap text-red-500 bg-red-100 p-2 my-2 rounded pl-4 dark:bg-red-500 dark:text-white">
    {{ text }}
  </p>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
