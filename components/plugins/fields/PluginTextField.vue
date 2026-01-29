<script setup lang="ts">
import { computed } from 'vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: string | undefined;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputValue = computed({
  get: () => props.modelValue ?? (props.field.default as string) ?? '',
  set: (value: string) => emit('update:modelValue', value),
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
  return attrs;
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
    <textarea
      v-if="isTextarea"
      :id="field.key"
      v-model="inputValue"
      :placeholder="field.placeholder"
      v-bind="validationAttrs"
      rows="3"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error }"
    />
    <input
      v-else
      :id="field.key"
      v-model="inputValue"
      type="text"
      :placeholder="field.placeholder"
      v-bind="validationAttrs"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      :class="{ 'border-red-500': error }"
    >
    <p
      v-if="error"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>
  </div>
</template>
