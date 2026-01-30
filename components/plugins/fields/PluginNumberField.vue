<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: number | undefined;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const touched = ref(false);

const inputValue = computed({
  get: () => props.modelValue ?? (props.field.default as number),
  set: (value: number | string) => {
    if (!touched.value) {
      touched.value = true;
    }
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
  if (props.field.required) {
    attrs.required = true;
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

const validationError = computed(() => {
  if (!touched.value) return '';

  const value = props.modelValue;
  const validation = props.field.validation;
  const required = validation?.required || props.field.required;

  if (required && (value === undefined || value === null)) {
    return `${props.field.label} is required`;
  }
  if (value === undefined || value === null) {
    return '';
  }
  if (validation?.min !== undefined && value < validation.min) {
    return `${props.field.label} must be at least ${validation.min}`;
  }
  if (validation?.max !== undefined && value > validation.max) {
    return `${props.field.label} must be ${validation.max} or less`;
  }
  return '';
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
        v-if="field.validation?.required || field.required"
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
      :class="{ 'border-red-500': error || validationError }"
    >
    <p
      v-if="rangeHint && !error && !validationError"
      class="text-xs text-gray-400 dark:text-gray-500"
    >
      {{ rangeHint }}
    </p>
    <p
      v-if="error || validationError"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ error || validationError }}
    </p>
  </div>
</template>
