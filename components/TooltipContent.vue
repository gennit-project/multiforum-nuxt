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
  <div
    v-if="tooltipUnicode"
    class="mb-6 flex h-16 justify-center text-6xl"
  >
    {{ tooltipUnicode }}
  </div>
  <p class="min-w-sm text-sm">
    {{ tooltipText }}
  </p>
</template>
