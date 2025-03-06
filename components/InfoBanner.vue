<script lang="ts" setup>
import InfoIcon from "@/components/icons/InfoIcon.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";

defineProps({
  text: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="text-wrap text-sm flex items-center text-blue-600 bg-blue-100 p-2 my-1 rounded pl-4 dark:bg-blue-900 dark:text-white gap-1"
  >
    <InfoIcon class="h-5 w-5" />
    <MarkdownRenderer :text="text" />
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
