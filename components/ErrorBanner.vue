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
  <div class="text-wrap text-red-500 bg-red-100 p-3 my-2 pl-4 rounded dark:bg-red-500 dark:text-white flex-grow leading-normal">
    {{ text }}
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
