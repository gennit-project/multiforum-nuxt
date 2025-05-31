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
        id="events-enabled"
        :checked="formValues.eventsEnabled !== false"
        class="h-4 w-4 rounded border border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600"
        type="checkbox"
        @change="$emit('updateFormValues', { eventsEnabled: ($event.target as HTMLInputElement).checked })"
      >
      <label for="events-enabled" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
        Enable events for this forum
      </label>
    </div>
  </div>
</template>