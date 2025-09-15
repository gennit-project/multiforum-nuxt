<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import {
  REFRESH_PLUGINS,
  ALLOW_PLUGIN,
  DISALLOW_PLUGIN,
} from '@/graphQLData/admin/mutations';
import {
  GET_PLUGIN_MANAGEMENT_DATA,
  GET_INSTALLED_PLUGINS,
} from '@/graphQLData/admin/queries';
import { config } from '@/config';
import type {
  ServerConfigUpdateInput,
  Plugin,
  PluginVersion,
} from '@/__generated__/graphql';

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

// Plugin state interface
interface PluginState {
  id: string;
  name: string;
  status:
    | 'available'
    | 'allowed'
    | 'installed'
    | 'installed_disabled'
    | 'installed_enabled';
  installedVersion?: {
    id: string;
    version: string;
    enabled: boolean;
    settings: any;
  };
  availableVersions: PluginVersion[];
}

interface InstalledPlugin {
  plugin: {
    id: string;
    name: string;
  };
  version: string;
  scope: string;
  enabled: boolean;
  settingsJson: any;
}

// Fetch plugin data
const {
  result: pluginManagementResult,
  error: pluginManagementError,
  loading: pluginManagementLoading,
  refetch: refetchPluginManagement,
} = useQuery(
  GET_PLUGIN_MANAGEMENT_DATA,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

// Also fetch installed plugins separately for real-time updates
const { result: installedPluginsResult, refetch: refetchInstalledPlugins } =
  useQuery(GET_INSTALLED_PLUGINS, null, {
    fetchPolicy: 'cache-and-network',
  });

// Computed property to process plugin data into PluginState[]
const pluginStates = computed((): PluginState[] => {
  if (!pluginManagementResult.value) return [];

  const data = pluginManagementResult.value;
  const serverConfig = data.serverConfigs?.[0];
  if (!serverConfig) return [];

  const allPlugins = data.plugins || [];
  const allowedPlugins = serverConfig.AllowedPlugins || [];
  // Use the separate installed plugins query for real-time updates
  const installedPlugins =
    installedPluginsResult.value?.getInstalledPlugins || [];

  return allPlugins.map((plugin: Plugin): PluginState => {
    const isAllowed = allowedPlugins.some((p: Plugin) => p.id === plugin.id);

    // Find installed plugin using the new backend API
    const installedPlugin = installedPlugins.find(
      (installed: InstalledPlugin) => {
        return installed.plugin.id === plugin.id;
      }
    );

    // Get available versions from the Plugin.Versions relationship
    const availableVersions = plugin.Versions || [];

    let status:
      | 'available'
      | 'allowed'
      | 'installed'
      | 'installed_disabled'
      | 'installed_enabled';

    if (installedPlugin) {
      status = installedPlugin.enabled
        ? 'installed_enabled'
        : 'installed_disabled';
    } else if (isAllowed) {
      status = 'allowed';
    } else {
      status = 'available';
    }

    return {
      id: plugin.id,
      name: plugin.name,
      status,
      installedVersion: installedPlugin
        ? {
            id: installedPlugin.plugin.id, // Using plugin ID as fallback
            version: installedPlugin.version,
            enabled: installedPlugin.enabled,
            settings: installedPlugin.settingsJson || {},
          }
        : undefined,
      availableVersions,
    };
  });
});

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

// Plugin management mutations
const { mutate: allowPluginMutation, loading: allowPluginLoading } =
  useMutation(ALLOW_PLUGIN);
const { mutate: disallowPluginMutation, loading: disallowPluginLoading } =
  useMutation(DISALLOW_PLUGIN);

const refreshPlugins = async () => {
  try {
    await refreshPluginsMutation();
    // Refetch plugin management data to get updated data
    await refetchPluginManagement();
    // Also refetch installed plugins
    await refetchInstalledPlugins();
  } catch (err) {
    console.error('Error refreshing plugins:', err);
  }
};

const allowPlugin = async (pluginId: string) => {
  try {
    await allowPluginMutation({
      pluginId,
      serverName: config.serverName,
    });
    // Refetch to update UI
    await refetchPluginManagement();
    await refetchInstalledPlugins();
  } catch (err) {
    console.error('Error allowing plugin:', err);
  }
};

const disallowPlugin = async (pluginId: string) => {
  try {
    await disallowPluginMutation({
      pluginId,
      serverName: config.serverName,
    });
    // Refetch to update UI
    await refetchPluginManagement();
    await refetchInstalledPlugins();
  } catch (err) {
    console.error('Error disallowing plugin:', err);
  }
};

// Refresh data when component mounts to catch any changes from detail pages
onMounted(() => {
  refetchInstalledPlugins();
});
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
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
              Current Registries ({{ pluginRegistries.length }})
            </h4>
            <div v-if="pluginRegistries.length > 0" class="space-y-2">
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
            <div v-else class="text-sm text-gray-500 dark:text-gray-400">
              No plugin registries configured yet.
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

    <!-- Plugin Management Section -->
    <FormRow section-title="Plugin Management">
      <template #content>
        <div class="my-3 space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Manage plugins available on your server.
          </p>

          <!-- Loading State -->
          <div v-if="pluginManagementLoading" class="py-4 text-center">
            <div class="inline-flex items-center">
              <i class="fa-solid fa-spinner mr-2 animate-spin" />
              Loading plugins...
            </div>
          </div>

          <!-- Error State -->
          <div
            v-else-if="pluginManagementError"
            class="text-sm text-red-600 dark:text-red-400"
          >
            Error loading plugins: {{ pluginManagementError.message }}
          </div>

          <!-- Plugin Cards -->
          <div v-else-if="pluginStates.length > 0" class="space-y-4">
            <div
              v-for="plugin in pluginStates"
              :key="plugin.id"
              class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <div class="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div class="flex-1">
                  <h3 class="text-base font-medium text-gray-900 dark:text-white">
                    <NuxtLink
                      :to="`/admin/settings/plugins/${plugin.id}`"
                      class="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {{ plugin.name }}
                    </NuxtLink>
                  </h3>
                  <div class="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-300">
                    <div class="flex items-center">
                      <span class="mr-2 text-xs font-medium text-gray-400">Status:</span>
                      <span
                        class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                        :class="{
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200':
                            plugin.status === 'available',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200':
                            plugin.status === 'allowed',
                          'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200':
                            plugin.status === 'installed_enabled',
                          'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200':
                            plugin.status === 'installed_disabled',
                        }"
                      >
                        {{
                          plugin.status === 'installed_enabled'
                            ? 'Enabled'
                            : plugin.status === 'installed_disabled'
                              ? 'Installed'
                              : plugin.status
                        }}
                      </span>
                    </div>
                    <div v-if="plugin.installedVersion?.version">
                      <span class="text-xs font-medium text-gray-400">Version:</span>
                      {{ plugin.installedVersion.version }}
                    </div>
                    <div>
                      <span class="text-xs font-medium text-gray-400">Available:</span>
                      {{ plugin.availableVersions.length }} versions
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-wrap gap-2 sm:ml-4">
                  <!-- Available Plugin Actions -->
                  <button
                    v-if="plugin.status === 'available'"
                    type="button"
                    class="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    :disabled="allowPluginLoading"
                    @click="allowPlugin(plugin.id)"
                  >
                    <i
                      v-if="allowPluginLoading"
                      class="fa-solid fa-spinner mr-1 animate-spin"
                    />
                    Allow
                  </button>

                  <!-- Allowed Plugin Actions -->
                  <template v-else-if="plugin.status === 'allowed'">
                    <NuxtLink
                      :to="`/admin/settings/plugins/${plugin.id}`"
                      class="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Install
                    </NuxtLink>
                    <button
                      type="button"
                      class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      :disabled="disallowPluginLoading"
                      @click="disallowPlugin(plugin.id)"
                    >
                      <i
                        v-if="disallowPluginLoading"
                        class="fa-solid fa-spinner mr-1 animate-spin"
                      />
                      Disallow
                    </button>
                  </template>

                  <!-- Installed Plugin Actions -->
                  <template
                    v-else-if="
                      plugin.status === 'installed_enabled' ||
                      plugin.status === 'installed_disabled'
                    "
                  >
                    <NuxtLink
                      :to="`/admin/settings/plugins/${plugin.id}`"
                      class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Manage
                    </NuxtLink>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- No Plugins State -->
          <div v-else class="py-8 text-center">
            <div class="text-gray-500 dark:text-gray-400">
              <p>No plugins available yet.</p>
              <p class="mt-2 text-sm">
                Add a plugin registry and refresh to discover plugins.
              </p>
            </div>
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>
