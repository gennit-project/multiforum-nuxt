<script setup lang="ts">
import { computed } from 'vue';
import type {
  PluginFormSection,
  PluginField,
  PluginSecretStatus,
  PluginConfigValue,
  PluginSettings,
} from '@/types/pluginForms';
import { getPluginConfigFieldId } from '@/utils/pluginConfigFieldIds';
import PluginTextField from './fields/PluginTextField.vue';
import PluginNumberField from './fields/PluginNumberField.vue';
import PluginBooleanField from './fields/PluginBooleanField.vue';
import PluginSelectField from './fields/PluginSelectField.vue';
import PluginSecretField from './fields/PluginSecretField.vue';
import PluginForumMultiSelectField from './fields/PluginForumMultiSelectField.vue';
import { isPluginFieldVisible } from '@/utils/pluginSettingsUtils';

const props = defineProps<{
  sections: PluginFormSection[];
  modelValue: PluginSettings;
  errors?: Record<string, string>;
  secretStatuses?: PluginSecretStatus[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PluginSettings];
}>();

function updateFieldValue(key: string, value: PluginConfigValue) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}

function getFieldValue(key: string): PluginConfigValue | undefined {
  const value = props.modelValue[key];
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (
    Array.isArray(value) &&
    value.every((item): item is string => typeof item === 'string')
  ) {
    return value;
  }
  return undefined;
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
    case 'forum-multiselect':
      return PluginForumMultiSelectField;
    default:
      return PluginTextField;
  }
}

const renderedSections = computed(() => {
  const occurrences = new Map<string, number>();

  return props.sections
    .map((section) => ({
      ...section,
      fields: section.fields
        .filter((field) => isPluginFieldVisible(field, props.modelValue))
        .map((field) => {
          const kind = field.type === 'secret' ? 'SECRET' : 'SETTING';
          const occurrenceKey = `${kind}:${field.key}`;
          const occurrence = occurrences.get(occurrenceKey) || 0;
          occurrences.set(occurrenceKey, occurrence + 1);

          return {
            field,
            inputId: getPluginConfigFieldId({
              kind,
              key: field.key,
              occurrence,
            }),
          };
        }),
    }))
    .filter((section) => section.fields.length > 0);
});
</script>

<template>
  <div class="space-y-6">
    <div
      v-for="section in renderedSections"
      :key="section.title"
      class="space-y-4"
    >
      <div class="border-b border-gray-200 pb-2 dark:border-gray-700">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ section.title }}
        </h2>
        <p
          v-if="section.description"
          class="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {{ section.description }}
        </p>
      </div>

      <div class="space-y-4">
        <template v-for="{ field, inputId } in section.fields" :key="inputId">
          <component
            :is="getFieldComponent(field)"
            :field="field"
            :input-id="inputId"
            :model-value="getFieldValue(field.key)"
            :error="getFieldError(field.key)"
            :secret-status="
              field.type === 'secret' ? getSecretStatus(field.key) : undefined
            "
            @update:model-value="updateFieldValue(field.key, $event)"
          />
        </template>
      </div>
    </div>

    <div
      v-if="renderedSections.length === 0"
      class="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      <p>No configuration options available for this plugin.</p>
    </div>
  </div>
</template>
