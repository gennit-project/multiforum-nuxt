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
  <RulesEditor
    :form-values="formValues"
    @update-form-values="$emit('updateFormValues', $event)"
  />
</template>
