<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import PluginDiscoverySection from '@/components/admin/plugins/PluginDiscoverySection.vue';
import { useToast } from '@/composables/useToast';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { UPDATE_SERVER_CONFIG } from '@/graphQLData/admin/mutations';
import { config } from '@/config';

const toast = useToast();
const pluginRegistries = ref<string[]>([]);
const originalRegistries = ref<string[]>([]);
const newRegistry = ref('');

const {
  result: serverResult,
  loading: serverLoading,
  error: serverError,
} = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const {
  mutate: updateServerConfig,
  loading: savingRegistries,
  error: saveError,
} = useMutation(UPDATE_SERVER_CONFIG);

const isDirty = computed(() => {
  return JSON.stringify(pluginRegistries.value) !== JSON.stringify(originalRegistries.value);
});

watch(
  serverResult,
  (result) => {
    const registries = result?.serverConfigs?.[0]?.pluginRegistries;
    if (Array.isArray(registries)) {
      pluginRegistries.value = [...registries];
      originalRegistries.value = [...registries];
    }
  },
  { immediate: true }
);

const addRegistry = () => {
  const trimmed = newRegistry.value.trim();
  if (!trimmed) return;
  if (!pluginRegistries.value.includes(trimmed)) {
    pluginRegistries.value = [...pluginRegistries.value, trimmed];
  }
  newRegistry.value = '';
};

const removeRegistry = (index: number) => {
  const current = [...pluginRegistries.value];
  current.splice(index, 1);
  pluginRegistries.value = current;
};

const saveRegistries = async () => {
  try {
    await updateServerConfig({
      serverName: config.serverName,
      input: { pluginRegistries: pluginRegistries.value },
    });
    originalRegistries.value = [...pluginRegistries.value];
    toast.success('Plugin registries updated.');
  } catch (err: any) {
    toast.error(`Failed to update registries: ${err.message}`);
  }
};
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <div v-if="serverLoading" class="py-8 text-center">
      <div class="inline-flex items-center">
        <i class="fa-solid fa-spinner mr-2 animate-spin" />
        Loading registries...
      </div>
    </div>

    <div v-else-if="serverError" class="py-8 text-center text-red-600 dark:text-red-400">
      Error loading registries: {{ serverError.message }}
    </div>

    <template v-else>
      <FormRow section-title="Plugin Registries">
        <template #content>
          <div class="my-3 space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Configure plugin registries to allow plugins to be installed on your
              server.
            </p>

            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                Current Registries ({{ pluginRegistries.length }})
              </h4>
              <div v-if="pluginRegistries.length > 0" class="space-y-2">
                <div
                  v-for="(registry, index) in pluginRegistries"
                  :key="registry"
                  class="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600"
                >
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ registry }}
                  </span>
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    @click="removeRegistry(index)"
                  >
                    <i class="fa-solid fa-times" /> Remove
                  </button>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                No plugin registries configured yet.
              </div>
            </div>

            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                Add New Registry
              </h4>
              <div class="flex space-x-2">
                <input
                  v-model="newRegistry"
                  type="url"
                  placeholder="https://registry.example.com"
                  class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  @keyup.enter="addRegistry"
                >
                <button
                  type="button"
                  class="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  :disabled="!newRegistry.trim()"
                  @click="addRegistry"
                >
                  Add
                </button>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                class="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!isDirty || savingRegistries"
                @click="saveRegistries"
              >
                <i
                  v-if="savingRegistries"
                  class="fa-solid fa-spinner mr-2 animate-spin"
                />
                Save Registries
              </button>
            </div>

            <div v-if="saveError" class="text-sm text-red-600 dark:text-red-400">
              Error saving registries: {{ saveError.message }}
            </div>
          </div>
        </template>
      </FormRow>

      <PluginDiscoverySection />
    </template>
  </div>
</template>
