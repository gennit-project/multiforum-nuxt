<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: string | undefined;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const touched = ref(false);

const inputValue = computed({
  get: () => props.modelValue ?? (props.field.default as string) ?? '',
  set: (value: string) => {
    if (!touched.value) {
      touched.value = true;
    }
    emit('update:modelValue', value);
  },
});

const isTextarea = computed(() => props.field.type === 'textarea');

const validationAttrs = computed(() => {
  const attrs: Record<string, any> = {};
  if (props.field.validation) {
    if (props.field.validation.minLength !== undefined) {
      attrs.minlength = props.field.validation.minLength;
    }
    if (props.field.validation.maxLength !== undefined) {
      attrs.maxlength = props.field.validation.maxLength;
    }
    if (props.field.validation.pattern) {
      attrs.pattern = props.field.validation.pattern;
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

const validationError = computed(() => {
  if (!touched.value) return '';

  const value = props.modelValue ?? '';
  const validation = props.field.validation;
  const required = validation?.required || props.field.required;

  if (required && value.trim().length === 0) {
    return `${props.field.label} is required`;
  }
  if (validation?.minLength !== undefined && value.length < validation.minLength) {
    return `${props.field.label} must be at least ${validation.minLength} characters`;
  }
  if (validation?.maxLength !== undefined && value.length > validation.maxLength) {
    return `${props.field.label} must be ${validation.maxLength} characters or fewer`;
  }
  if (validation?.pattern) {
    try {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `${props.field.label} format is invalid`;
      }
    } catch {
      // Ignore invalid regex patterns
    }
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
    <textarea
      v-if="isTextarea"
      :id="field.key"
      v-model="inputValue"
      :placeholder="field.placeholder"
      v-bind="validationAttrs"
      rows="3"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error || validationError }"
    />
    <input
      v-else
      :id="field.key"
      v-model="inputValue"
      type="text"
      :placeholder="field.placeholder"
      v-bind="validationAttrs"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error || validationError }"
    >
    <p
      v-if="error || validationError"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ error || validationError }}
    </p>
  </div>
</template>
