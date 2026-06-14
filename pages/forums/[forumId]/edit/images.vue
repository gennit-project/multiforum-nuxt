<script setup lang="ts">
import CheckBox from '@/components/CheckBox.vue';

defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['updateFormValues']);

const updateImageUploadsEnabled = (enabled: boolean) => {
  emit('updateFormValues', { imageUploadsEnabled: enabled });
};

const updateMarkdownImagesEnabled = (enabled: boolean) => {
  emit('updateFormValues', { markdownImagesEnabled: enabled });
};
</script>

<template>
  <div class="space-y-4">
    <CheckBox
      id="image-uploads-enabled"
      :checked="formValues.imageUploadsEnabled !== false"
      :label="'Enable image uploads for this forum'"
      @update="updateImageUploadsEnabled"
    />
    <CheckBox
      id="markdown-images-enabled"
      :checked="formValues.markdownImagesEnabled !== false"
      :label="'Render images embedded in markdown'"
      @update="updateMarkdownImagesEnabled"
    />
  </div>
</template>
