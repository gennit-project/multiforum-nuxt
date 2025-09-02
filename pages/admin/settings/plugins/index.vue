<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import { 
  REFRESH_PLUGINS,
  ALLOW_PLUGIN,
  DISALLOW_PLUGIN
} from '@/graphQLData/admin/mutations';
import { 
  GET_PLUGIN_MANAGEMENT_DATA,
  GET_INSTALLED_PLUGINS 
} from '@/graphQLData/admin/queries';
import { config } from '@/config';
import type { 
  ServerConfigUpdateInput, 
  Plugin, 
  PluginVersion
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
  status: 'available' | 'allowed' | 'installed' | 'installed_disabled' | 'installed_enabled';
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
const {
  result: installedPluginsResult,
  refetch: refetchInstalledPlugins,
} = useQuery(GET_INSTALLED_PLUGINS, null, {
  fetchPolicy: 'cache-and-network'
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
  const installedPlugins = installedPluginsResult.value?.getInstalledPlugins || [];

  return allPlugins.map((plugin: Plugin): PluginState => {
    const isAllowed = allowedPlugins.some((p: Plugin) => p.id === plugin.id);
    
    // Find installed plugin using the new backend API
    const installedPlugin = installedPlugins.find((installed: InstalledPlugin) => {
      return installed.plugin.id === plugin.id;
    });
    
    // Get available versions from the Plugin.Versions relationship
    const availableVersions = plugin.Versions || [];

    let status: 'available' | 'allowed' | 'installed' | 'installed_disabled' | 'installed_enabled';
    
    if (installedPlugin) {
      status = installedPlugin.enabled ? 'installed_enabled' : 'installed_disabled';
    } else if (isAllowed) {
      status = 'allowed';
    } else {
      status = 'available';
    }

    return {
      id: plugin.id,
      name: plugin.name,
      status,
      installedVersion: installedPlugin ? {
        id: installedPlugin.plugin.id, // Using plugin ID as fallback
        version: installedPlugin.version,
        enabled: installedPlugin.enabled,
        settings: installedPlugin.settingsJson || {},
      } : undefined,
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
const { mutate: allowPluginMutation, loading: allowPluginLoading } = useMutation(ALLOW_PLUGIN);
const { mutate: disallowPluginMutation, loading: disallowPluginLoading } = useMutation(DISALLOW_PLUGIN);

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
          <div v-if="pluginManagementLoading" class="text-center py-4">
            <div class="inline-flex items-center">
              <i class="fa-solid fa-spinner animate-spin mr-2" />
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

          <!-- Plugin Table -->
          <div v-else-if="pluginStates.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Plugin Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Installed Version
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Available Versions
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                <tr v-for="plugin in pluginStates" :key="plugin.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <NuxtLink
                      :to="`/admin/settings/plugins/${plugin.id}`"
                      class="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                    >
                      {{ plugin.name }}
                    </NuxtLink>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200': plugin.status === 'available',
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200': plugin.status === 'allowed',
                        'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200': plugin.status === 'installed_enabled',
                        'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200': plugin.status === 'installed_disabled',
                      }"
                    >
                      {{ plugin.status === 'installed_enabled' ? 'Enabled' : 
                          plugin.status === 'installed_disabled' ? 'Installed' : 
                          plugin.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {{ plugin.installedVersion?.version || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {{ plugin.availableVersions.length }} versions
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <!-- Available Plugin Actions -->
                      <button
                        v-if="plugin.status === 'available'"
                        type="button"
                        class="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                        :disabled="allowPluginLoading"
                        @click="allowPlugin(plugin.id)"
                      >
                        <i v-if="allowPluginLoading" class="fa-solid fa-spinner animate-spin mr-1" />
                        Allow
                      </button>

                      <!-- Allowed Plugin Actions -->
                      <template v-else-if="plugin.status === 'allowed'">
                        <NuxtLink
                          :to="`/admin/settings/plugins/${plugin.id}`"
                          class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Install
                        </NuxtLink>
                        <button
                          type="button"
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          :disabled="disallowPluginLoading"
                          @click="disallowPlugin(plugin.id)"
                        >
                          <i v-if="disallowPluginLoading" class="fa-solid fa-spinner animate-spin mr-1" />
                          Disallow
                        </button>
                      </template>

                      <!-- Installed Plugin Actions -->
                      <template v-else-if="plugin.status === 'installed_enabled' || plugin.status === 'installed_disabled'">
                        <NuxtLink
                          :to="`/admin/settings/plugins/${plugin.id}`"
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Manage
                        </NuxtLink>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- No Plugins State -->
          <div v-else class="text-center py-8">
            <div class="text-gray-500 dark:text-gray-400">
              <p>No plugins available yet.</p>
              <p class="text-sm mt-2">
                Add a plugin registry and refresh to discover plugins.
              </p>
            </div>
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>
