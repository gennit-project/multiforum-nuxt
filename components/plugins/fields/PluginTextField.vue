<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: string | undefined;
  error?: string;
  inputId?: string;
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
const controlId = computed(() => props.inputId || props.field.key);

const validationAttrs = computed(() => {
  const attrs: Record<string, string | number | boolean> = {};
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

const descriptionId = computed(() => `${controlId.value}-description`);
const errorId = computed(() => `${controlId.value}-error`);
const describedBy = computed(() => {
  const ids = [];
  if (props.field.description) ids.push(descriptionId.value);
  if (props.error || validationError.value) ids.push(errorId.value);
  return ids.join(' ') || undefined;
});
</script>

<template>
  <div class="space-y-1">
    <label
      :for="controlId"
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
      :id="descriptionId"
      class="text-xs text-gray-500 dark:text-gray-400"
    >
      {{ field.description }}
    </p>
    <textarea
      v-if="isTextarea"
      :id="controlId"
      v-model="inputValue"
      :placeholder="field.placeholder"
      v-bind="validationAttrs"
      :aria-describedby="describedBy"
      :aria-invalid="!!(error || validationError)"
      rows="3"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error || validationError }"
    />
    <input
      v-else
      :id="controlId"
      v-model="inputValue"
      type="text"
      :placeholder="field.placeholder"
      v-bind="validationAttrs"
      :aria-describedby="describedBy"
      :aria-invalid="!!(error || validationError)"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error || validationError }"
    >
    <p
      v-if="error || validationError"
      :id="errorId"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ error || validationError }}
    </p>
  </div>
</template>
