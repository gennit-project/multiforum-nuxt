<script setup lang="ts">
defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});
defineEmits(["updateFormValues"]);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center">
      <input
        id="wiki-enabled"
        type="checkbox"
        :checked="formValues.wikiEnabled"
        class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
        @change="$emit('updateFormValues', { wikiEnabled: ($event.target as HTMLInputElement).checked })"
      >
      <label for="wiki-enabled" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
        Enable wiki for this forum
      </label>
    </div>
  </div>
</template>
