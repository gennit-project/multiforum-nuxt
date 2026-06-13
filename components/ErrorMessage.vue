<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <p class="mb-1 mt-1 h-4 rounded text-sm text-red-500 dark:text-red-400">
    {{ text }}
  </p>
</template>
