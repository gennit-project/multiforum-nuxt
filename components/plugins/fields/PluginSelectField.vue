<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: string | number | boolean | undefined;
  error?: string;
  inputId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean];
}>();

const touched = ref(false);
const controlId = computed(() => props.inputId || props.field.key);

const inputValue = computed({
  get: () => props.modelValue ?? props.field.default ?? '',
  set: (value: string | number | boolean) => {
    if (!touched.value) {
      touched.value = true;
    }
    emit('update:modelValue', value);
  },
});

const validationAttrs = computed(() => {
  const attrs: Record<string, string | number | boolean> = {};
  if (props.field.validation?.required || props.field.required) {
    attrs.required = true;
  }
  return attrs;
});

const validationError = computed(() => {
  if (!touched.value) return '';
  const required = props.field.validation?.required || props.field.required;
  const value = props.modelValue ?? '';
  if (required && (value === '' || value === undefined || value === null)) {
    return `${props.field.label} is required`;
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
    <select
      :id="controlId"
      v-model="inputValue"
      v-bind="validationAttrs"
      :aria-describedby="describedBy"
      :aria-invalid="!!(error || validationError)"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error || validationError }"
    >
      <option
        v-if="field.placeholder"
        value=""
        disabled
      >
        {{ field.placeholder }}
      </option>
      <option
        v-for="option in field.options"
        :key="String(option.value)"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <p
      v-if="error || validationError"
      :id="errorId"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ error || validationError }}
    </p>
  </div>
</template>
