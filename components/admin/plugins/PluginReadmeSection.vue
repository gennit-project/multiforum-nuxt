<script setup lang="ts">
import FormRow from '@/components/FormRow.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

defineProps<{
  pluginReadme: string | null;
  pluginDetailLoading: boolean;
}>();
</script>

<template>
  <FormRow
    v-if="pluginReadme || pluginDetailLoading"
    section-title="Documentation"
  >
    <template #content>
      <div v-if="pluginDetailLoading && !pluginReadme" class="py-4 text-center">
        <div class="inline-flex items-center text-gray-600 dark:text-gray-400">
          <i class="fa-solid fa-spinner mr-2 animate-spin" />
          Loading documentation...
        </div>
      </div>
      <div
        v-else
        class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      >
        <MarkdownRenderer :text="pluginReadme || ''" font-size="small" />
      </div>
    </template>
  </FormRow>
</template>
