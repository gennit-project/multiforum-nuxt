<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  text: {
    type: String,
    required: true
  },
});

</script>

<template>
  <p class="text-wrap text-red-500 bg-red-100 p-3 my-2 rounded pl-4 dark:bg-red-500 dark:text-white">
    {{ text }}
  </p>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
