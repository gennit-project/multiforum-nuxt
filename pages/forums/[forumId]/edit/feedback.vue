<script setup lang="ts">
defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});
defineEmits(['updateFormValues']);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center">
      <input
        id="feedback-enabled"
        :checked="formValues.feedbackEnabled !== false"
        class="h-4 w-4 rounded border border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600"
        type="checkbox"
        @change="
          $emit('updateFormValues', {
            feedbackEnabled: ($event.target as HTMLInputElement).checked,
          })
        "
      >
      <label
        for="feedback-enabled"
        class="ml-2 block text-sm text-gray-900 dark:text-gray-100"
      >
        Enable feedback for this forum
      </label>
    </div>
  </div>
</template>
