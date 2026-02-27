<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import PluginDiscoverySection from '@/components/admin/plugins/PluginDiscoverySection.vue';
import { useToast } from '@/composables/useToast';
import {
  ALLOW_PLUGIN,
  DISALLOW_PLUGIN,
} from '@/graphQLData/admin/mutations';
import {
  GET_PLUGIN_MANAGEMENT_DATA,
  GET_INSTALLED_PLUGINS,
} from '@/graphQLData/admin/queries';
import { config } from '@/config';
import type { Plugin, PluginVersion } from '@/__generated__/graphql';

// Toast notifications
const toast = useToast();

// Per-plugin loading states
const allowingPluginIds = ref<Set<string>>(new Set());
const disallowingPluginIds = ref<Set<string>>(new Set());

// Search and filter state
const searchQuery = ref('');
const statusFilter = ref<'all' | 'available' | 'allowed' | 'installed' | 'enabled'>('all');
const sortBy = ref<'name' | 'status'>('name');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Plugin state interface
interface PluginState {
  id: string;
  name: string;
  description?: string;
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
  hasUpdate?: boolean;
  latestVersion?: string;
}

interface InstalledPlugin {
  plugin: {
    id: string;
    name: string;
    description?: string;
  };
  version: string;
  scope: string;
  enabled: boolean;
  settingsJson: any;
  hasUpdate?: boolean;
  latestVersion?: string;
  availableVersions?: string[];
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
      description: plugin.description || installedPlugin?.plugin?.description,
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
      hasUpdate: installedPlugin?.hasUpdate ?? false,
      latestVersion: installedPlugin?.latestVersion,
    };
  });
});

// Filtered and sorted plugins
const filteredAndSortedPlugins = computed((): PluginState[] => {
  let result = [...pluginStates.value];

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(query) ||
        plugin.description?.toLowerCase().includes(query) ||
        plugin.id.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter((plugin) => {
      switch (statusFilter.value) {
        case 'available':
          return plugin.status === 'available';
        case 'allowed':
          return plugin.status === 'allowed';
        case 'installed':
          return plugin.status === 'installed_disabled' || plugin.status === 'installed_enabled';
        case 'enabled':
          return plugin.status === 'installed_enabled';
        default:
          return true;
      }
    });
  }

  // Apply sorting
  result.sort((a, b) => {
    let comparison = 0;
    if (sortBy.value === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy.value === 'status') {
      // Order: enabled > installed > allowed > available
      const statusOrder: Record<PluginState['status'], number> = {
        installed_enabled: 0,
        installed_disabled: 1,
        installed: 2,
        allowed: 3,
        available: 4,
      };
      comparison = statusOrder[a.status] - statusOrder[b.status];
    }
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });

  return result;
});

// Toggle sort direction or change sort field
const toggleSort = (field: 'name' | 'status') => {
  if (sortBy.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortDirection.value = 'asc';
  }
};

// Plugin management mutations
const { mutate: allowPluginMutation } = useMutation(ALLOW_PLUGIN);
const { mutate: disallowPluginMutation } = useMutation(DISALLOW_PLUGIN);

const allowPlugin = async (pluginId: string) => {
  allowingPluginIds.value.add(pluginId);
  try {
    await allowPluginMutation({
      pluginId,
      serverName: config.serverName,
    });
    // Refetch to update UI
    await refetchPluginManagement();
    await refetchInstalledPlugins();
    toast.success('Plugin allowed successfully');
  } catch (err: any) {
    toast.error(`Error allowing plugin: ${err.message}`);
  } finally {
    allowingPluginIds.value.delete(pluginId);
  }
};

const disallowPlugin = async (pluginId: string) => {
  disallowingPluginIds.value.add(pluginId);
  try {
    await disallowPluginMutation({
      pluginId,
      serverName: config.serverName,
    });
    // Refetch to update UI
    await refetchPluginManagement();
    await refetchInstalledPlugins();
    toast.success('Plugin disallowed successfully');
  } catch (err: any) {
    toast.error(`Error disallowing plugin: ${err.message}`);
  } finally {
    disallowingPluginIds.value.delete(pluginId);
  }
};

// Helper functions to check loading state for a specific plugin
const isAllowingPlugin = (pluginId: string) => allowingPluginIds.value.has(pluginId);
const isDisallowingPlugin = (pluginId: string) => disallowingPluginIds.value.has(pluginId);

// Refresh data when component mounts to catch any changes from detail pages
onMounted(() => {
  refetchInstalledPlugins();
});

// Handler for when plugins are refreshed from the discovery section
const handlePluginsRefreshed = async () => {
  await refetchPluginManagement();
  await refetchInstalledPlugins();
};
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Plugin Discovery Section -->
    <PluginDiscoverySection @refreshed="handlePluginsRefreshed" />

    <!-- Plugin Management Section -->
    <FormRow section-title="Plugin Management">
      <template #content>
        <div class="my-3 space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage plugins available on your server.
            </p>
            <div class="flex items-center space-x-2">
              <NuxtLink
                to="/admin/plugins/docs"
                class="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <i class="fa-solid fa-book mr-2" />
                Documentation
              </NuxtLink>
              <NuxtLink
                to="/admin/plugins/pipelines"
                class="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <i class="fa-solid fa-diagram-project mr-2" />
                Configure Pipelines
              </NuxtLink>
            </div>
          </div>

          <!-- Search and Filter Controls -->
          <div
            v-if="pluginStates.length > 0"
            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <!-- Search Input -->
            <div class="relative flex-1 sm:max-w-xs">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search plugins..."
                class="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
              <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <!-- Filter and Sort Controls -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Status Filter -->
              <select
                v-model="statusFilter"
                aria-label="Filter plugins by status"
                class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="allowed">Allowed</option>
                <option value="installed">Installed</option>
                <option value="enabled">Enabled</option>
              </select>

              <!-- Sort Buttons -->
              <div class="flex rounded-md border border-gray-300 dark:border-gray-600">
                <button
                  type="button"
                  class="px-3 py-2 text-sm"
                  :class="sortBy === 'name' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                  @click="toggleSort('name')"
                >
                  Name
                  <i
                    v-if="sortBy === 'name'"
                    :class="sortDirection === 'asc' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"
                    class="ml-1"
                  />
                </button>
                <button
                  type="button"
                  class="border-l border-gray-300 px-3 py-2 text-sm dark:border-gray-600"
                  :class="sortBy === 'status' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                  @click="toggleSort('status')"
                >
                  Status
                  <i
                    v-if="sortBy === 'status'"
                    :class="sortDirection === 'asc' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"
                    class="ml-1"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Results count -->
          <div
            v-if="pluginStates.length > 0 && (searchQuery || statusFilter !== 'all')"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            Showing {{ filteredAndSortedPlugins.length }} of {{ pluginStates.length }} plugins
          </div>

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

          <!-- No Results After Filter -->
          <div
            v-else-if="pluginStates.length > 0 && filteredAndSortedPlugins.length === 0"
            class="py-8 text-center"
          >
            <div class="text-gray-500 dark:text-gray-400">
              <i class="fa-solid fa-search mb-2 text-2xl" />
              <p>No plugins match your search criteria.</p>
              <button
                type="button"
                class="mt-2 text-sm text-orange-600 hover:underline dark:text-orange-400"
                @click="searchQuery = ''; statusFilter = 'all'"
              >
                Clear filters
              </button>
            </div>
          </div>

          <!-- Plugin Cards -->
          <div v-else-if="filteredAndSortedPlugins.length > 0" class="space-y-4">
            <div
              v-for="plugin in filteredAndSortedPlugins"
              :key="plugin.id"
              class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <div
                class="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
              >
                <div class="flex-1">
                  <h3
                    class="text-base font-medium text-gray-900 dark:text-white"
                  >
                    <NuxtLink
                      :to="`/admin/plugins/${plugin.id}`"
                      class="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {{ plugin.name }}
                    </NuxtLink>
                  </h3>
                  <!-- Plugin Description -->
                  <p
                    v-if="plugin.description"
                    class="mt-1 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {{ plugin.description }}
                  </p>
                  <div
                    class="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-300"
                  >
                    <div class="flex items-center">
                      <span class="mr-2 text-xs font-medium text-gray-400"
                        >Status:</span
                      >
                      <span
                        class="font-semibold inline-flex rounded-full px-2 text-xs leading-5"
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
                    <div v-if="plugin.installedVersion?.version" class="flex items-center gap-2">
                      <span>
                        <span class="text-xs font-medium text-gray-400">Version:</span>
                        {{ plugin.installedVersion.version }}
                      </span>
                      <!-- Update Available Badge -->
                      <span
                        v-if="plugin.hasUpdate && plugin.latestVersion"
                        class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        :title="`Update available: v${plugin.latestVersion}`"
                      >
                        <i class="fa-solid fa-arrow-up mr-1 text-[10px]" />
                        {{ plugin.latestVersion }}
                      </span>
                    </div>
                    <div>
                      <span class="text-xs font-medium text-gray-400"
                        >Available:</span
                      >
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
                    class="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                    :disabled="isAllowingPlugin(plugin.id)"
                    @click="allowPlugin(plugin.id)"
                  >
                    <i
                      v-if="isAllowingPlugin(plugin.id)"
                      class="fa-solid fa-spinner mr-1 animate-spin"
                    />
                    Allow
                  </button>

                  <!-- Allowed Plugin Actions -->
                  <template v-else-if="plugin.status === 'allowed'">
                    <NuxtLink
                      :to="`/admin/plugins/${plugin.id}`"
                      class="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Install
                    </NuxtLink>
                    <button
                      type="button"
                      class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                      :disabled="isDisallowingPlugin(plugin.id)"
                      @click="disallowPlugin(plugin.id)"
                    >
                      <i
                        v-if="isDisallowingPlugin(plugin.id)"
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
                      v-if="plugin.hasUpdate"
                      :to="`/admin/plugins/${plugin.id}?update=true`"
                      class="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      <i class="fa-solid fa-arrow-up mr-1" />
                      Update
                    </NuxtLink>
                    <NuxtLink
                      :to="`/admin/plugins/${plugin.id}`"
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
              <i class="fa-solid fa-puzzle-piece mb-3 text-4xl text-gray-300 dark:text-gray-600" />
              <p class="text-lg font-medium">No plugins available yet</p>
              <p class="mt-2 text-sm">
                Add a plugin registry in the Registries tab and refresh plugins.
              </p>
              <div class="mt-4 text-xs">
                <p class="font-medium">Getting started:</p>
                <ol class="mt-2 list-inside list-decimal text-left inline-block">
                  <li>Add a plugin registry URL in the Registries tab</li>
                  <li>Refresh plugins to fetch available entries</li>
                  <li>Allow plugins you want to use on your server</li>
                  <li>Install and configure each plugin</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>
