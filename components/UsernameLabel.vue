<script setup lang="ts">
interface Props {
  text: string;
}

defineProps<Props>();
</script>
<template>
  <span
    class="border-brand-500 bg-brand-100 text-brand-600 mx-2 rounded-md border px-3 pt-1.5 pb-1 text-sm"
    >{{ text }}</span
  >
</template>
