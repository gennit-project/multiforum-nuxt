<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PluginField } from '@/types/pluginForms';

const props = defineProps<{
  field: PluginField;
  modelValue: boolean | undefined;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const touched = ref(false);

const inputValue = computed({
  get: () => props.modelValue ?? (props.field.default as boolean) ?? false,
  set: (value: boolean) => emit('update:modelValue', value),
});

const validationError = computed(() => {
  if (!touched.value) return '';
  const required = props.field.validation?.required || props.field.required;
  if (required && !inputValue.value) {
    return `${props.field.label} must be enabled`;
  }
  return '';
});

const toggleValue = () => {
  if (!touched.value) {
    touched.value = true;
  }
  inputValue.value = !inputValue.value;
};
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        :aria-checked="inputValue"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        :class="inputValue ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'"
        @click="toggleValue"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :class="inputValue ? 'translate-x-5' : 'translate-x-0'"
        />
      </button>
      <label
        :for="field.key"
        class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        @click="toggleValue"
      >
        {{ field.label }}
        <span
          v-if="field.validation?.required || field.required"
          class="text-red-500"
        >*</span>
      </label>
    </div>
    <p
      v-if="field.description"
      class="text-xs text-gray-500 dark:text-gray-400 ml-14"
    >
      {{ field.description }}
    </p>
    <p
      v-if="error || validationError"
      class="text-xs text-red-600 dark:text-red-400 ml-14"
    >
      {{ error || validationError }}
    </p>
  </div>
</template>
