<script setup lang="ts">
import CheckBox from '@/components/CheckBox.vue';

defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['updateFormValues']);

const updateEmojiEnabled = (enabled: boolean) => {
  emit('updateFormValues', { emojiEnabled: enabled });
};
</script>

<template>
  <div class="space-y-4">
    <CheckBox
      id="emoji-enabled"
      :checked="formValues.emojiEnabled !== false"
      :label="'Enable emoji reactions for this forum'"
      @update="updateEmojiEnabled"
    />
  </div>
</template>
