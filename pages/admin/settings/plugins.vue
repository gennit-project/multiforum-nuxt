<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import { REFRESH_PLUGINS } from '@/graphQLData/admin/mutations';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';

const props = defineProps({
  editMode: {
    type: Boolean,
    required: false,
    default: true,
  },
  formValues: {
    type: Object as PropType<ServerConfigUpdateInput | null>,
    required: false,
    default: null,
  },
});

const emit = defineEmits(['updateFormValues']);

const newRegistry = ref('');

const {
  mutate: refreshPluginsMutation,
  loading: refreshPluginsLoading,
  error: refreshPluginsError,
} = useMutation(REFRESH_PLUGINS);

const pluginRegistries = computed({
  get: () => {
    if (!props.formValues) return [];
    return (props.formValues.pluginRegistries || []).filter(
      (r): r is string => r !== null
    );
  },
  set: (value: string[]) => {
    if (props.formValues) {
      emit('updateFormValues', { pluginRegistries: value });
    }
  },
});

const addRegistry = () => {
  if (newRegistry.value.trim()) {
    const currentRegistries = [...pluginRegistries.value];
    if (!currentRegistries.includes(newRegistry.value.trim())) {
      currentRegistries.push(newRegistry.value.trim());
      pluginRegistries.value = currentRegistries;
    }
    newRegistry.value = '';
  }
};

const removeRegistry = (index: number) => {
  const currentRegistries = [...pluginRegistries.value];
  currentRegistries.splice(index, 1);
  pluginRegistries.value = currentRegistries;
};

const refreshPlugins = async () => {
  try {
    await refreshPluginsMutation();
  } catch (err) {
    console.error('Error refreshing plugins:', err);
  }
};
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <FormRow section-title="Plugin Registries">
      <template #content>
        <div class="my-3 space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Configure plugin registries to allow plugins to be installed on your
            server.
          </p>

          <!-- Current Registries -->
          <div v-if="pluginRegistries.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
              Current Registries ({{ pluginRegistries.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="(registry, index) in pluginRegistries"
                :key="index"
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
          </div>

          <!-- Add New Registry -->
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

          <!-- Refresh Plugins -->
          <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Plugin Discovery
                </h4>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Refresh to discover new plugins from configured registries
                </p>
              </div>
              <button
                type="button"
                class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                :disabled="refreshPluginsLoading"
                @click="refreshPlugins"
              >
                <i
                  class="fa-solid fa-refresh mr-2"
                  :class="{ 'animate-spin': refreshPluginsLoading }"
                />
                {{
                  refreshPluginsLoading ? 'Refreshing...' : 'Refresh Plugins'
                }}
              </button>
            </div>

            <div
              v-if="refreshPluginsError"
              class="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              Error refreshing plugins: {{ refreshPluginsError.message }}
            </div>
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>
