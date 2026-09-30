<script setup lang="ts">
import FormRow from '@/components/FormRow.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import PluginSettingsForm from '@/components/plugins/PluginSettingsForm.vue';
import type {
  PluginFormSection,
  PluginSecretStatus as PluginSecretStatusType,
  PluginSettings,
} from '@/types/pluginForms';

defineProps<{
  sections: PluginFormSection[];
  modelValue: PluginSettings;
  errors: Record<string, string>;
  secretStatuses: PluginSecretStatusType[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: PluginSettings): void;
  (e: 'save'): void;
}>();
</script>

<template>
  <FormRow v-if="sections.length > 0" section-title="">
    <template #content>
      <div class="space-y-6">
        <div class="border-b border-gray-200 pb-2 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Server-Scoped Plugin Settings
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure server-wide settings for this plugin.
          </p>
        </div>

        <PluginSettingsForm
          :model-value="modelValue"
          :sections="sections"
          :errors="errors"
          :secret-statuses="secretStatuses"
          @update:model-value="emit('update:modelValue', $event)"
        />

        <div
          class="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700"
        >
          <button
            type="button"
            class="bg-brand-700 hover:bg-brand-800 focus:ring-brand-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving"
            @click="emit('save')"
          >
            <LoadingSpinner v-if="saving" class="mr-2 inline-flex" />
            Save Settings
          </button>
        </div>
      </div>
    </template>
  </FormRow>
</template>
