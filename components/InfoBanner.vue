<script lang="ts" setup>
import InfoIcon from '@/components/icons/InfoIcon.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

defineProps({
  testId: {
    type: String,
    default: '',
  },
  headerText: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    :data-testid="testId"
    class="dark:border-blue-950 my-2 rounded-md border bg-blue-100 px-4 pt-4 dark:bg-blue-900 dark:text-blue-200"
  >
    <div class="flex">
      <div class="shrink-0">
        <slot>
          <InfoIcon class="h-5 w-5 flex-grow-0" />
        </slot>
      </div>
      <div class="ml-3 flex-1">
        <p v-if="headerText" class="text-sm font-bold">{{ headerText }}</p>
        <MarkdownRenderer :text="text" :font-size="'small'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
