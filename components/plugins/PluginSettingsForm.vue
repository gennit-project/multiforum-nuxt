<script setup lang="ts">
import type {
  PluginFormSection,
  PluginField,
  PluginSecretStatus,
} from '@/types/pluginForms';
import PluginTextField from './fields/PluginTextField.vue';
import PluginNumberField from './fields/PluginNumberField.vue';
import PluginBooleanField from './fields/PluginBooleanField.vue';
import PluginSelectField from './fields/PluginSelectField.vue';
import PluginSecretField from './fields/PluginSecretField.vue';

const props = defineProps<{
  sections: PluginFormSection[];
  modelValue: Record<string, any>;
  errors?: Record<string, string>;
  secretStatuses?: PluginSecretStatus[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>];
}>();

function updateFieldValue(key: string, value: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}

function getFieldValue(key: string): any {
  return props.modelValue[key];
}

function getFieldError(key: string): string | undefined {
  return props.errors?.[key];
}

function getSecretStatus(key: string): PluginSecretStatus | undefined {
  return props.secretStatuses?.find((s) => s.key === key);
}

function getFieldComponent(field: PluginField) {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return PluginTextField;
    case 'number':
      return PluginNumberField;
    case 'boolean':
    case 'toggle':
      return PluginBooleanField;
    case 'select':
      return PluginSelectField;
    case 'secret':
      return PluginSecretField;
    default:
      return PluginTextField;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-for="section in sections"
      :key="section.title"
      class="space-y-4"
    >
      <div class="border-b border-gray-200 dark:border-gray-700 pb-2">
        <h4 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ section.title }}
        </h4>
        <p
          v-if="section.description"
          class="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {{ section.description }}
        </p>
      </div>

      <div class="space-y-4">
        <template
          v-for="field in section.fields"
          :key="field.key"
        >
          <component
            :is="getFieldComponent(field)"
            :field="field"
            :model-value="getFieldValue(field.key)"
            :error="getFieldError(field.key)"
            :secret-status="field.type === 'secret' ? getSecretStatus(field.key) : undefined"
            @update:model-value="updateFieldValue(field.key, $event)"
          />
        </template>
      </div>
    </div>

    <div
      v-if="sections.length === 0"
      class="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      <p>No configuration options available for this plugin.</p>
    </div>
  </div>
</template>
