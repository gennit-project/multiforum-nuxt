<script setup lang="ts">
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import PluginSettingsForm from '@/components/plugins/PluginSettingsForm.vue';
import type { PluginFormSection, PluginSettings } from '@/types/pluginForms';
import type { PluginUpgradeReport } from '@/utils/pluginUpgradeUtils';

defineProps<{
  currentVersion: string;
  targetVersion: string;
  report: PluginUpgradeReport;
  sections: PluginFormSection[];
  settings: PluginSettings;
  errors: Record<string, string>;
  secrets: Array<{ key: string; isSet: boolean }>;
  installing: boolean;
}>();

const emit = defineEmits<{
  (e: 'carry-over' | 'start-fresh' | 'cancel'): void;
  (e: 'update:settings', value: PluginSettings): void;
}>();

const groups = [
  { key: 'carried', label: 'Carried over' },
  { key: 'newDefaults', label: 'New defaults' },
  { key: 'reset', label: 'Reset to default' },
  { key: 'dropped', label: 'Removed' },
] as const;
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="plugin-upgrade-preview-title"
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"
    >
      <h2 id="plugin-upgrade-preview-title" class="text-xl font-semibold text-gray-900 dark:text-white">
        Preview upgrade to v{{ targetVersion }}
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Review configuration changes from v{{ currentVersion }} before installing.
      </p>

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <div
          v-for="group in groups"
          :key="group.key"
          class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ group.label }} ({{ report[group.key].length }})
          </h3>
          <ul v-if="report[group.key].length" class="mt-2 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
            <li v-for="key in report[group.key]" :key="key" class="font-mono">{{ key }}</li>
          </ul>
          <p v-else class="mt-2 text-xs text-gray-500 dark:text-gray-400">None</p>
        </div>
      </div>

      <div v-if="sections.length" class="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Edit carried configuration
        </h3>
        <PluginSettingsForm
          :model-value="settings"
          :sections="sections"
          :errors="errors"
          @update:model-value="emit('update:settings', $event)"
        />
      </div>

      <div v-if="secrets.length" class="mt-5 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Required secrets</h3>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="secret in secrets" :key="secret.key" class="flex justify-between gap-4">
            <span class="font-mono text-gray-800 dark:text-gray-200">{{ secret.key }}</span>
            <span :class="secret.isSet ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'">
              {{ secret.isSet ? 'Already set ✓' : 'Needs setting' }}
            </span>
          </li>
        </ul>
      </div>

      <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800" :disabled="installing" @click="emit('cancel')">
          Cancel
        </button>
        <button type="button" class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800" :disabled="installing" @click="emit('start-fresh')">
          Start fresh
        </button>
        <button type="button" class="rounded-md bg-orange-700 px-4 py-2 font-medium text-white hover:bg-orange-800 disabled:opacity-50" :disabled="installing" @click="emit('carry-over')">
          <LoadingSpinner v-if="installing" class="mr-2 inline-flex" />
          Carry over and install
        </button>
      </div>
    </section>
  </div>
</template>
