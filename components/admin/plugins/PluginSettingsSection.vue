<script setup lang="ts">
import FormRow from '@/components/FormRow.vue';
import PluginSettingsForm from '@/components/plugins/PluginSettingsForm.vue';
import type { PluginFormSection, PluginSecretStatus as PluginSecretStatusType } from '@/types/pluginForms';

defineProps<{
  sections: PluginFormSection[];
  modelValue: Record<string, any>;
  errors: Record<string, string>;
  secretStatuses: PluginSecretStatusType[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void;
  (e: 'save'): void;
}>();
</script>

<template>
  <FormRow v-if="sections.length > 0" section-title="">
    <template #content>
      <div class="space-y-6">
        <div class="border-b border-gray-200 dark:border-gray-700 pb-2">
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

        <div class="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            type="button"
            class="rounded-md bg-orange-700 px-4 py-2 text-white hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving"
            @click="emit('save')"
          >
            <i v-if="saving" class="fa-solid fa-spinner mr-2 animate-spin" />
            Save Settings
          </button>
        </div>
      </div>
    </template>
  </FormRow>
</template>
