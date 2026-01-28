<script setup lang="ts">
defineProps({
  text: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="my-2 flex-grow text-wrap rounded bg-red-100 p-3 pl-4 leading-normal text-red-500 dark:bg-red-900 dark:text-red-300"
  >
    {{ text }}
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
