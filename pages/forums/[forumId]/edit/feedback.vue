<script setup lang="ts">
import CheckBox from '@/components/CheckBox.vue';

defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['updateFormValues']);

const updateFeedbackEnabled = (enabled: boolean) => {
  emit('updateFormValues', { feedbackEnabled: enabled });
};
</script>

<template>
  <div class="space-y-4">
    <CheckBox
      id="feedback-enabled"
      :checked="formValues.feedbackEnabled !== false"
      :label="'Enable feedback for this forum'"
      @update="updateFeedbackEnabled"
    />
  </div>
</template>
