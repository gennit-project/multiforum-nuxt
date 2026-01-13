<script setup lang="ts">
import { computed } from 'vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: number | undefined;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const inputValue = computed({
  get: () => props.modelValue ?? (props.field.default as number),
  set: (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    emit('update:modelValue', isNaN(numValue) ? undefined : numValue);
  },
});

const validationAttrs = computed(() => {
  const attrs: Record<string, any> = {};
  if (props.field.validation) {
    if (props.field.validation.min !== undefined) {
      attrs.min = props.field.validation.min;
    }
    if (props.field.validation.max !== undefined) {
      attrs.max = props.field.validation.max;
    }
    if (props.field.validation.required) {
      attrs.required = true;
    }
  }
  return attrs;
});

const rangeHint = computed(() => {
  const { validation } = props.field;
  if (!validation) return null;
  if (validation.min !== undefined && validation.max !== undefined) {
    return `Range: ${validation.min} - ${validation.max}`;
  }
  if (validation.min !== undefined) {
    return `Minimum: ${validation.min}`;
  }
  if (validation.max !== undefined) {
    return `Maximum: ${validation.max}`;
  }
  return null;
});
</script>

<template>
  <div class="space-y-1">
    <label
      :for="field.key"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ field.label }}
      <span
        v-if="field.validation?.required"
        class="text-red-500"
      >*</span>
    </label>
    <p
      v-if="field.description"
      class="text-xs text-gray-500 dark:text-gray-400"
    >
      {{ field.description }}
    </p>
    <input
      :id="field.key"
      v-model.number="inputValue"
      type="number"
      :placeholder="field.placeholder"
      v-bind="validationAttrs"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error }"
    >
    <p
      v-if="rangeHint && !error"
      class="text-xs text-gray-400 dark:text-gray-500"
    >
      {{ rangeHint }}
    </p>
    <p
      v-if="error"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>
  </div>
</template>
