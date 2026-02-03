<script setup lang="ts">
import FormRow from '@/components/FormRow.vue';

defineProps<{
  manifestJson: string | null;
}>();
</script>

<template>
  <FormRow v-if="manifestJson" section-title="Plugin Manifest">
    <template #content>
      <div
        tabindex="0"
        role="region"
        aria-label="Plugin manifest JSON"
        class="max-h-96 overflow-auto rounded-md border border-gray-300 bg-gray-900 p-3 dark:border-gray-600"
      >
        <pre class="whitespace-pre-wrap break-words text-sm text-gray-100">{{ manifestJson }}</pre>
      </div>
    </template>
  </FormRow>
</template>
