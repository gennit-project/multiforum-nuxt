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
    class="rounded-md border-l bg-orange-100 px-4 pt-4 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-200"
  >
    <div class="flex">
      <div class="shrink-0">
        <slot>
          <InfoIcon class="h-5 w-5 flex-grow-0" />
        </slot>
      </div>
      <div class="ml-3 flex-1">
        <p v-if="headerText" class="font-bold">{{ headerText }}</p>
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
