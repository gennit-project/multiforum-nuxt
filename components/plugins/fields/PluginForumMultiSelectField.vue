<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ForumPicker from '@/components/channel/ForumPicker.vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: string[] | undefined;
  error?: string;
  inputId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const touched = ref(false);
const pendingSelection = ref<string[] | null>(null);
const controlId = computed(() => props.inputId || props.field.key);
const selectedForums = computed(() => {
  if (pendingSelection.value) return pendingSelection.value;
  if (Array.isArray(props.modelValue)) return props.modelValue;
  return Array.isArray(props.field.default) ? props.field.default : [];
});
const validationError = computed(() => {
  if (!touched.value) return '';
  const required = props.field.required || props.field.validation?.required;
  return required && selectedForums.value.length === 0
    ? `${props.field.label} is required`
    : '';
});

const updateSelectedForums = (forums: string[]) => {
  touched.value = true;
  pendingSelection.value = forums;
  emit('update:modelValue', forums);
};

watch(
  () => props.modelValue,
  () => {
    pendingSelection.value = null;
  },
  { deep: true }
);
</script>

<template>
  <div class="space-y-1">
    <label
      :for="controlId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ field.label }}
      <span
        v-if="field.required || field.validation?.required"
        class="text-red-500"
        >*</span
      >
    </label>
    <ForumPicker
      :selected-channels="selectedForums"
      :description="field.description"
      :error="error || validationError"
      :input-id="controlId"
      :test-id="controlId"
      :placeholder="
        field.placeholder || `Select ${field.label.toLowerCase()}...`
      "
      @set-selected-channels="updateSelectedForums"
    />
  </div>
</template>
