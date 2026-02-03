<script setup lang="ts">
import FormRow from '@/components/FormRow.vue';

interface PluginSecretStatus {
  key: string;
  status: 'NOT_SET' | 'SET_UNTESTED' | 'VALID' | 'INVALID';
  lastValidatedAt?: string;
  validationError?: string;
}

const props = defineProps<{
  secrets: PluginSecretStatus[];
  secretValues: Record<string, string>;
  showSecretInputs: Record<string, boolean>;
}>();

const emit = defineEmits<{
  (e: 'update:secretValues', value: Record<string, string>): void;
  (e: 'update:showSecretInputs', value: Record<string, boolean>): void;
  (e: 'set-secret', key: string, value: string): void;
}>();

const updateSecretValue = (key: string, value: string) => {
  emit('update:secretValues', { ...props.secretValues, [key]: value });
};

const updateShowSecretInput = (key: string, value: boolean) => {
  emit('update:showSecretInputs', { ...props.showSecretInputs, [key]: value });
};

const getSecretStatusColor = (status: string) => {
  switch (status) {
    case 'VALID':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
    case 'INVALID':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
    case 'SET_UNTESTED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const getSecretStatusText = (status: string) => {
  switch (status) {
    case 'VALID':
      return 'Valid';
    case 'INVALID':
      return 'Invalid';
    case 'SET_UNTESTED':
      return 'Set (untested)';
    default:
      return 'Not set';
  }
};
</script>

<template>
  <FormRow v-if="secrets.length > 0" section-title="Required Secrets">
    <template #content>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Configure server-wide secrets required by this plugin.
        </p>

        <div
          v-for="secret in secrets"
          :key="secret.key"
          class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
        >
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ secret.key }}
              </span>
              <span
                class="font-semibold rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                Server
              </span>
              <span
                class="font-semibold rounded-full px-2 py-1 text-xs"
                :class="getSecretStatusColor(secret.status)"
              >
                {{ getSecretStatusText(secret.status) }}
              </span>
            </div>
          </div>

          <div v-if="showSecretInputs[secret.key]" class="space-y-2">
            <input
              :value="secretValues[secret.key] || ''"
              type="password"
              placeholder="Enter secret value"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              @input="updateSecretValue(secret.key, ($event.target as HTMLInputElement).value)"
            >
            <div class="flex space-x-2">
              <button
                type="button"
                class="rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
                :disabled="!secretValues[secret.key]"
                @click="emit('set-secret', secret.key, secretValues[secret.key] || '')"
              >
                Save
              </button>
              <button
                type="button"
                class="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
                @click="updateShowSecretInput(secret.key, false)"
              >
                Cancel
              </button>
            </div>
          </div>

          <div v-else class="flex space-x-2">
            <button
              type="button"
              class="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="updateShowSecretInput(secret.key, true)"
            >
              {{
                secret.status === 'NOT_SET'
                  ? 'Set Secret'
                  : 'Update Secret'
              }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </FormRow>
</template>
