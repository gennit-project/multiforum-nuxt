<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable';
import { useToast } from '@/composables/useToast';
import { GET_INSTALLED_PLUGINS } from '@/graphQLData/admin/queries';
import {
  GET_CHANNEL,
  GET_CHANNEL_PLUGIN_SETTINGS,
} from '@/graphQLData/channel/queries';
import { UPDATE_CHANNEL_ENABLED_PLUGINS } from '@/graphQLData/channel/mutations';

type PluginState = {
  enabled: boolean;
  settings: Record<string, any>;
};

const route = useRoute();
const toast = useToast();
const { client } = useApolloClient();

const channelUniqueName = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const {
  result: channelResult,
  loading: channelLoading,
  error: channelError,
  refetch: refetchChannel,
} = useQuery(
  GET_CHANNEL_PLUGIN_SETTINGS,
  () => ({ channelUniqueName: channelUniqueName.value }),
  { enabled: computed(() => !!channelUniqueName.value) }
);

const { result: installedResult, loading: installedLoading } = useQuery(
  GET_INSTALLED_PLUGINS,
  null,
  {
    fetchPolicy: 'cache-and-network',
  }
);

const {
  mutate: updateChannelEnabledPlugins,
  error: updateChannelEnabledPluginsError,
  onDone: onUpdateChannelEnabledPluginsDone,
} = useMutation(UPDATE_CHANNEL_ENABLED_PLUGINS);

onUpdateChannelEnabledPluginsDone(() => {
  updateChannelEnabledPluginsError.value = null;
});

const channelDisplayName = computed(() => {
  return (
    channelResult.value?.channels?.[0]?.displayName || channelUniqueName.value
  );
});

const enabledPluginEdges = computed(() => {
  return (
    channelResult.value?.channels?.[0]?.EnabledPluginsConnection?.edges || []
  );
});

const enabledPluginsByKey = computed(() => {
  const map = new Map<string, any>();
  for (const edge of enabledPluginEdges.value) {
    const pluginId = edge?.node?.Plugin?.id;
    const version = edge?.node?.version;
    if (pluginId && version) {
      map.set(`${pluginId}:${version}`, edge);
    }
  }
  return map;
});

const serverEnabledPlugins = computed(() => {
  const installed = installedResult.value?.getInstalledPlugins || [];
  return installed.filter((plugin: any) => plugin.enabled);
});

type ConsolidatedPlugin = {
  plugin: any;
  versions: any[];
  latestVersion: string;
  availableVersions: string[];
};

const consolidatedPlugins = computed<ConsolidatedPlugin[]>(() => {
  const pluginMap = new Map<string, ConsolidatedPlugin>();

  for (const item of serverEnabledPlugins.value) {
    const pluginId = item.plugin.id;
    if (!pluginMap.has(pluginId)) {
      pluginMap.set(pluginId, {
        plugin: item.plugin,
        versions: [],
        latestVersion: item.latestVersion || item.version,
        availableVersions: item.availableVersions || [item.version],
      });
    }
    pluginMap.get(pluginId)!.versions.push(item);
  }

  // Sort versions within each plugin (newest first)
  for (const consolidated of pluginMap.values()) {
    consolidated.versions.sort((a, b) => {
      // Simple version comparison - could be improved with semver
      return b.version.localeCompare(a.version, undefined, { numeric: true });
    });
  }

  return Array.from(pluginMap.values());
});

const orphanedChannelPlugins = computed(() => {
  const serverKeys = new Set(
    serverEnabledPlugins.value.map(
      (plugin: any) => `${plugin.plugin.id}:${plugin.version}`
    )
  );
  return enabledPluginEdges.value.filter(
    (edge: any) =>
      !serverKeys.has(`${edge?.node?.Plugin?.id}:${edge?.node?.version}`)
  );
});

const pluginStates = ref<Record<string, PluginState>>({});
const togglingPluginIds = ref<Set<string>>(new Set());

const isLoading = computed(
  () =>
    (channelLoading.value && !channelResult.value) ||
    (installedLoading.value && !installedResult.value)
);

function getChannelDefaults(manifest: any): Record<string, any> {
  const defaults = manifest?.settingsDefaults?.channel;
  if (!defaults || typeof defaults !== 'object') {
    return {};
  }
  return { ...defaults };
}

function initializePluginState(
  pluginKey: string,
  manifest: any,
  edge?: any
) {
  const settingsJson = edge?.properties?.settingsJson;
  const defaults = getChannelDefaults(manifest);
  pluginStates.value[pluginKey] = {
    enabled: !!edge,
    settings: {
      ...defaults,
      ...parseSettingsJson(settingsJson),
    },
  };
}

function parseSettingsJson(settingsJson: unknown): Record<string, any> {
  if (!settingsJson) {
    return {};
  }
  if (typeof settingsJson === 'string') {
    try {
      const parsed = JSON.parse(settingsJson);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof settingsJson === 'object') {
    return settingsJson as Record<string, any>;
  }
  return {};
}

function serializeSettingsJson(settings: unknown) {
  if (typeof settings === 'string') {
    return settings;
  }
  return JSON.stringify(settings ?? {});
}

watch(
  [serverEnabledPlugins, enabledPluginsByKey],
  ([serverPlugins, enabledMap]) => {
    for (const plugin of serverPlugins) {
      const pluginId = plugin.plugin.id;
      const version = plugin.version;
      const manifest = plugin.manifest;
      const pluginKey = `${pluginId}:${version}`;
      const edge = enabledMap.get(pluginKey);
      if (!pluginStates.value[pluginKey]) {
        initializePluginState(pluginKey, manifest, edge);
      }
    }
  },
  { immediate: true }
);

function getPluginKey(plugin: any) {
  return `${plugin.plugin.id}:${plugin.version ?? 'unknown'}`;
}

function getEnabledVersionForPlugin(consolidated: ConsolidatedPlugin): string | null {
  for (const versionItem of consolidated.versions) {
    const pluginKey = getPluginKey(versionItem);
    if (pluginStates.value[pluginKey]?.enabled) {
      return versionItem.version;
    }
  }
  return null;
}

function getVersionItem(consolidated: ConsolidatedPlugin, version: string) {
  return consolidated.versions.find((v) => v.version === version);
}

function isAnyVersionEnabled(consolidated: ConsolidatedPlugin): boolean {
  return getEnabledVersionForPlugin(consolidated) !== null;
}

function isConsolidatedToggling(consolidated: ConsolidatedPlugin): boolean {
  return consolidated.versions.some((v) => isToggling(v));
}

async function handleVersionChange(consolidated: ConsolidatedPlugin, newVersion: string) {
  const currentEnabledVersion = getEnabledVersionForPlugin(consolidated);
  const newVersionItem = getVersionItem(consolidated, newVersion);

  if (!newVersionItem) {
    toast.error('Could not find the selected version.');
    return;
  }

  // If a different version is currently enabled, disable it first
  if (currentEnabledVersion && currentEnabledVersion !== newVersion) {
    const currentVersionItem = getVersionItem(consolidated, currentEnabledVersion);
    if (currentVersionItem) {
      await handleToggleEnabled(currentVersionItem, false);
    }
  }

  // Enable the new version
  await handleToggleEnabled(newVersionItem, true);
}

async function handleConsolidatedToggle(consolidated: ConsolidatedPlugin, enabled: boolean) {
  const enabledVersion = getEnabledVersionForPlugin(consolidated);

  if (enabled) {
    // Enable the latest/first available version
    const versionToEnable = consolidated.versions[0];
    if (versionToEnable) {
      await handleToggleEnabled(versionToEnable, true);
    }
  } else if (enabledVersion) {
    // Disable the currently enabled version
    const versionItem = getVersionItem(consolidated, enabledVersion);
    if (versionItem) {
      await handleToggleEnabled(versionItem, false);
    }
  }
}

function isToggling(plugin: any) {
  return togglingPluginIds.value.has(getPluginKey(plugin));
}

async function handleToggleEnabled(plugin: any, enabled: boolean) {
  const pluginId = plugin.plugin.id;
  const pluginKey = getPluginKey(plugin);
  const state = pluginStates.value[pluginKey];
  const edge = enabledPluginsByKey.value.get(pluginKey);
  const version = plugin.version ?? edge?.node?.version;

  if (!version) {
    toast.error('Could not determine plugin version for this forum.');
    return;
  }

  const enabledPluginsInput: any[] = [];
  const settingsJson = serializeSettingsJson(state?.settings || {});

  if (enabled) {
    if (edge) {
      // Already connected, just update
      enabledPluginsInput.push({
        where: {
          node: {
            Plugin: { id: pluginId },
            version,
          },
        },
        update: {
          edge: {
            settingsJson,
          },
        },
      });
    } else {
      // Connect the plugin
      enabledPluginsInput.push({
        connect: [
          {
            where: {
              node: {
                Plugin: { id: pluginId },
                version,
              },
            },
            edge: {
              enabled: true,
              settingsJson,
            },
          },
        ],
      });
    }
  } else if (edge) {
    // Disconnect the plugin
    enabledPluginsInput.push({
      disconnect: [
        {
          where: {
            node: {
              Plugin: { id: pluginId },
              version,
            },
          },
        },
      ],
    });
  } else {
    return;
  }

  togglingPluginIds.value.add(pluginKey);
  try {
    await updateChannelEnabledPlugins({
      channelUniqueName: channelUniqueName.value,
      enabledPlugins: enabledPluginsInput,
    });
    // Update local state
    if (pluginStates.value[pluginKey]) {
      pluginStates.value[pluginKey].enabled = enabled;
    }
    await refetchChannel();
    await client.refetchQueries({ include: [GET_CHANNEL] });
    toast.success(enabled ? 'Plugin enabled for this forum.' : 'Plugin disabled for this forum.');
  } catch (err: any) {
    const message =
      updateChannelEnabledPluginsError.value?.message ||
      err?.message ||
      'Failed to update plugin. Please try again.';
    toast.error(`Failed to update plugin: ${message}`);
  } finally {
    togglingPluginIds.value.delete(pluginKey);
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Forum Plugins
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Enable and configure plugins for {{ channelDisplayName }}.
      </p>
    </div>

    <div
      v-if="updateChannelEnabledPluginsError?.message"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
      role="alert"
    >
      <div class="flex items-start gap-2">
        <i class="fa-solid fa-triangle-exclamation mt-0.5" aria-hidden="true" />
        <span>{{ updateChannelEnabledPluginsError?.message }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="py-8 text-center">
      <div class="inline-flex items-center">
        <i class="fa-solid fa-spinner mr-2 animate-spin" />
        Loading plugins...
      </div>
    </div>

    <div v-else-if="channelError" class="py-8 text-center">
      <div class="text-red-600 dark:text-red-400">
        Error loading plugins: {{ channelError.message }}
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fa-solid fa-info-circle text-blue-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
              About Forum Plugin Settings
            </h3>
            <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                These settings apply only to this forum. Server admins control
                which plugins are available.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="orphanedChannelPlugins.length > 0"
        class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fa-solid fa-exclamation-triangle text-yellow-400" />
          </div>
          <div class="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              Some plugins are enabled for this forum but are no longer enabled
              on the server:
            </p>
            <ul class="mt-2 list-inside list-disc space-y-1">
              <li v-for="edge in orphanedChannelPlugins" :key="edge.node.id">
                {{ edge.node.Plugin.displayName || edge.node.Plugin.name }}
                <span class="text-xs text-yellow-700/80 dark:text-yellow-300/80">
                  (v{{ edge.node.version }})
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        v-if="consolidatedPlugins.length === 0"
        class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fa-solid fa-exclamation-triangle text-yellow-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              No Server Plugins Available
            </h3>
            <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Ask a server admin to install and enable plugins before
                configuring them for this forum.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="consolidated in consolidatedPlugins"
          :key="consolidated.plugin.id"
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <NuxtLink
                  :to="`/forums/${channelUniqueName}/edit/plugins/${consolidated.plugin.id}`"
                  class="text-lg font-semibold text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  {{ consolidated.plugin.displayName || consolidated.plugin.name }}
                </NuxtLink>
                <span
                  v-if="isAnyVersionEnabled(consolidated)"
                  class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200"
                >
                  Enabled
                </span>
                <span
                  v-else
                  class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  Disabled
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ consolidated.plugin.description || 'No description provided.' }}
              </p>
            </div>

            <div class="flex flex-shrink-0 items-center gap-3">
              <!-- Version selector -->
              <div class="flex items-center gap-2">
                <label
                  :for="`version-${consolidated.plugin.id}`"
                  class="text-sm text-gray-600 dark:text-gray-400"
                >
                  Version:
                </label>
                <select
                  :id="`version-${consolidated.plugin.id}`"
                  class="rounded-md border border-gray-300 bg-white py-1 pl-2 pr-8 text-sm font-mono text-gray-700 focus:border-orange-500 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  :value="getEnabledVersionForPlugin(consolidated) || consolidated.versions[0]?.version"
                  :disabled="isConsolidatedToggling(consolidated) || !isAnyVersionEnabled(consolidated)"
                  @change="handleVersionChange(consolidated, ($event.target as HTMLSelectElement).value)"
                >
                  <option
                    v-for="versionItem in consolidated.versions"
                    :key="versionItem.version"
                    :value="versionItem.version"
                  >
                    v{{ versionItem.version }}{{ versionItem.version === consolidated.latestVersion ? ' (latest)' : '' }}
                  </option>
                </select>
              </div>

              <!-- Enable/Disable toggle -->
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  :checked="isAnyVersionEnabled(consolidated)"
                  :disabled="isConsolidatedToggling(consolidated)"
                  :aria-label="`Enable ${consolidated.plugin.displayName || consolidated.plugin.name}`"
                  @change="
                    handleConsolidatedToggle(
                      consolidated,
                      ($event.target as HTMLInputElement).checked
                    )
                  "
                >
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  <i
                    v-if="isConsolidatedToggling(consolidated)"
                    class="fa-solid fa-spinner animate-spin"
                  />
                  <span v-else>Enable</span>
                </span>
              </label>

              <!-- Configure button -->
              <NuxtLink
                :to="`/forums/${channelUniqueName}/edit/plugins/${consolidated.plugin.id}`"
                class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Configure
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
