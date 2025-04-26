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
    class="text-wrap w-full text-sm inline-flex border border-blue-600 text-blue-900 bg-white p-2 space-x-1 my-1 rounded pl-4 dark:bg-black dark:text-blue-500 gap-1"
  >
    <div>
      <slot>
        <InfoIcon class="h-5 w-5 flex-grow-0" />
      </slot>
    </div>
    <div class="flex-1">
      <MarkdownRenderer :text="text" />
    </div>
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
