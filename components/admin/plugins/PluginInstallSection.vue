<script setup lang="ts">
import { computed } from 'vue';
import FormRow from '@/components/FormRow.vue';

const props = defineProps<{
  modelValue: string;
  isInstalled: boolean;
  availableVersions: Array<{ version: string }>;
  installedVersion?: string | null;
  latestVersion?: string | null;
  installing: boolean;
  canInstall: boolean;
  isSelectedVersionInstalled: boolean;
  hasNewerVersions: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'install'): void;
}>();

const selectedVersion = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});
</script>

<template>
  <FormRow section-title="Installation">
    <template #content>
      <div class="space-y-4">
        <div>
          <label
            for="plugin-version-select"
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ isInstalled ? 'Change Version' : 'Select Version' }}
          </label>
          <div class="flex items-center space-x-4">
            <select
              id="plugin-version-select"
              v-model="selectedVersion"
              class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option
                v-for="version in availableVersions"
                :key="version.version"
                :value="version.version"
              >
                v{{ version.version
                }}{{
                  version.version === installedVersion
                    ? ' (Installed)'
                    : ''
                }}{{
                  version.version === latestVersion &&
                  version.version !== installedVersion
                    ? ' (Latest)'
                    : ''
                }}
              </option>
            </select>

            <button
              v-if="!isInstalled"
              type="button"
              class="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="installing || !selectedVersion"
              @click="emit('install')"
            >
              <i v-if="installing" class="fa-solid fa-spinner mr-2 animate-spin" />
              Install
            </button>

            <button
              v-else-if="canInstall"
              type="button"
              class="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="installing || !selectedVersion"
              @click="emit('install')"
            >
              <i v-if="installing" class="fa-solid fa-spinner mr-2 animate-spin" />
              Install v{{ selectedVersion }}
            </button>

            <div
              v-else-if="isSelectedVersionInstalled"
              class="flex items-center text-sm text-green-600 dark:text-green-400"
            >
              <i class="fa-solid fa-check mr-2" />
              This version is already installed
            </div>

            <div v-else-if="!hasNewerVersions" class="text-sm text-gray-500 dark:text-gray-400">
              No other versions available
            </div>
          </div>

          <div v-if="isInstalled" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <p v-if="hasNewerVersions">
              Select a different version to install an update or downgrade.
            </p>
            <p v-else>You have the only available version installed.</p>
          </div>
        </div>
      </div>
    </template>
  </FormRow>
</template>
