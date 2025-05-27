<script setup lang="ts">
defineProps({
  tooltipUnicode: {
    type: String,
    default: "",
  },
  tooltipText: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div v-if="tooltipUnicode" class="flex h-16 justify-center text-6xl mb-6">
    {{ tooltipUnicode }}
  </div>
  <p class="min-w-sm text-sm">
    {{ tooltipText }}
  </p>
</template>
