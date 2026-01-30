<script setup lang="ts">
import CheckBox from '@/components/CheckBox.vue';

defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['updateFormValues']);

const updateWikiEnabled = (enabled: boolean) => {
  emit('updateFormValues', { wikiEnabled: enabled });
};
</script>

<template>
  <div class="space-y-4">
    <CheckBox
      id="wiki-enabled"
      :checked="formValues.wikiEnabled"
      :label="'Enable wiki for this forum'"
      @update="updateWikiEnabled"
    />
  </div>
</template>
