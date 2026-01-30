<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PluginField, PluginSecretStatus } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: string | undefined;
  error?: string;
  secretStatus?: PluginSecretStatus;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const showValue = ref(false);
const touched = ref(false);

const inputValue = computed({
  get: () => props.modelValue ?? '',
  set: (value: string) => {
    if (!touched.value) {
      touched.value = true;
    }
    emit('update:modelValue', value);
  },
});

const hasValue = computed(() => {
  // If there's a secret status, check if it's set
  if (props.secretStatus) {
    return props.secretStatus.status !== 'NOT_SET';
  }
  // Otherwise check if we have a local value
  return !!props.modelValue;
});

const statusColor = computed(() => {
  if (!props.secretStatus) return '';
  switch (props.secretStatus.status) {
    case 'VALID':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
    case 'INVALID':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
    case 'SET_UNTESTED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
});

const statusText = computed(() => {
  if (!props.secretStatus) return '';
  switch (props.secretStatus.status) {
    case 'VALID':
      return 'Valid';
    case 'INVALID':
      return 'Invalid';
    case 'SET_UNTESTED':
      return 'Set (untested)';
    default:
      return 'Not set';
  }
});

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
    if (props.field.validation.required && !hasValue.value) {
      attrs.required = true;
    }
  }
  if (props.field.required && !hasValue.value) {
    attrs.required = true;
  }
  return attrs;
});

const validationError = computed(() => {
  if (!touched.value) return '';

  const value = props.modelValue ?? '';
  const validation = props.field.validation;
  const required = validation?.required || props.field.required;

  if (required && value.trim().length === 0 && !hasValue.value) {
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
    <div class="flex items-center justify-between">
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
      <span
        v-if="secretStatus"
        class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
        :class="statusColor"
      >
        {{ statusText }}
      </span>
    </div>
    <p
      v-if="field.description"
      class="text-xs text-gray-500 dark:text-gray-400"
    >
      {{ field.description }}
    </p>
    <div class="relative">
      <input
        :id="field.key"
        v-model="inputValue"
        :type="showValue ? 'text' : 'password'"
        :placeholder="hasValue ? '••••••••' : field.placeholder"
        v-bind="validationAttrs"
        class="w-full rounded-md border border-gray-300 px-3 py-2 pr-20 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        :class="{ 'border-red-500': error }"
      >
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
        <button
          type="button"
          class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          :title="showValue ? 'Hide' : 'Show'"
          @click="showValue = !showValue"
        >
          <svg
            v-if="showValue"
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      </div>
    </div>
    <p
      v-if="secretStatus?.validationError"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ secretStatus.validationError }}
    </p>
    <p
      v-else-if="error || validationError"
      class="text-xs text-red-600 dark:text-red-400"
    >
      {{ error || validationError }}
    </p>
    <p
      v-else-if="secretStatus?.lastValidatedAt"
      class="text-xs text-gray-400 dark:text-gray-500"
    >
      Last validated: {{ new Date(secretStatus.lastValidatedAt).toLocaleString() }}
    </p>
  </div>
</template>
