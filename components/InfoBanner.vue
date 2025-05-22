<script lang="ts" setup>
  import InfoIcon from "@/components/icons/InfoIcon.vue";
  import MarkdownRenderer from "@/components/MarkdownRenderer.vue";

  defineProps({
    testId: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
    },
  });
</script>

<template>
  <div
    class="rounded-md bg-orange-100 p-4 dark:bg-orange-900 dark:text-white"
    :data-testid="testId"
  >
    <div class="flex">
      <div class="shrink-0">
        <slot>
          <InfoIcon class="h-5 w-5 flex-grow-0" />
        </slot>
      </div>
      <div class="ml-3 flex-1 md:flex md:justify-between">
        <MarkdownRenderer :text="text" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .text-wrap {
    overflow-wrap: break-word;
  }
</style>
