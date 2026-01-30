<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import PluginSettingsForm from '@/components/plugins/PluginSettingsForm.vue';
import { useToast } from '@/composables/useToast';
import { GET_INSTALLED_PLUGINS } from '@/graphQLData/admin/queries';
import {
  GET_CHANNEL,
  GET_CHANNEL_PLUGIN_SETTINGS,
} from '@/graphQLData/channel/queries';
import { UPDATE_CHANNEL_ENABLED_PLUGINS } from '@/graphQLData/channel/mutations';
import type { PluginFormSection } from '@/types/pluginForms';

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
  // Clear mutation error so the banner hides after a successful save.
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

const enabledPluginsById = computed(() => {
  const map = new Map<string, any>();
  for (const edge of enabledPluginEdges.value) {
    const pluginId = edge?.node?.Plugin?.id;
    if (pluginId) {
      map.set(pluginId, edge);
    }
  }
  return map;
});

const serverEnabledPlugins = computed(() => {
  const installed = installedResult.value?.getInstalledPlugins || [];
  return installed.filter((plugin: any) => plugin.enabled);
});

const orphanedChannelPlugins = computed(() => {
  const serverIds = new Set(
    serverEnabledPlugins.value.map((plugin: any) => plugin.plugin.id)
  );
  return enabledPluginEdges.value.filter(
    (edge: any) => !serverIds.has(edge?.node?.Plugin?.id)
  );
});

const pluginStates = ref<Record<string, PluginState>>({});
const dirtyPluginIds = ref<Set<string>>(new Set());
const savingPluginIds = ref<Set<string>>(new Set());

const isLoading = computed(
  () => channelLoading.value || installedLoading.value
);

function getChannelDefaults(manifest: any): Record<string, any> {
  const defaults = manifest?.settingsDefaults?.channel;
  if (!defaults || typeof defaults !== 'object') {
    return {};
  }
  return { ...defaults };
}

function getChannelSections(manifest: any): PluginFormSection[] {
  if (!manifest?.ui?.forms?.channel) {
    return [];
  }
  return manifest.ui.forms.channel;
}

function initializePluginState(pluginId: string, manifest: any, edge?: any) {
  const settingsJson = edge?.properties?.settingsJson;
  const defaults = getChannelDefaults(manifest);
  pluginStates.value[pluginId] = {
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
  [serverEnabledPlugins, enabledPluginsById],
  ([serverPlugins, enabledMap]) => {
    for (const plugin of serverPlugins) {
      const pluginId = plugin.plugin.id;
      const manifest = plugin.manifest;
      const edge = enabledMap.get(pluginId);
      if (!pluginStates.value[pluginId]) {
        initializePluginState(pluginId, manifest, edge);
        continue;
      }
      if (!dirtyPluginIds.value.has(pluginId)) {
        initializePluginState(pluginId, manifest, edge);
      }
    }
  },
  { immediate: true }
);

function setPluginEnabled(pluginId: string, enabled: boolean) {
  if (!pluginStates.value[pluginId]) {
    pluginStates.value[pluginId] = { enabled, settings: {} };
  } else {
    pluginStates.value[pluginId].enabled = enabled;
  }
  dirtyPluginIds.value.add(pluginId);
}

function updatePluginSettings(pluginId: string, settings: Record<string, any>) {
  if (!pluginStates.value[pluginId]) {
    pluginStates.value[pluginId] = { enabled: true, settings };
  } else {
    pluginStates.value[pluginId].settings = settings;
  }
  dirtyPluginIds.value.add(pluginId);
}

function getPluginVersion(pluginId: string) {
  const edge = enabledPluginsById.value.get(pluginId);
  if (edge?.node?.version) {
    return edge.node.version;
  }
  const installed = serverEnabledPlugins.value.find(
    (plugin: any) => plugin.plugin.id === pluginId
  );
  return installed?.version;
}

function isDirty(pluginId: string) {
  return dirtyPluginIds.value.has(pluginId);
}

function isSaving(pluginId: string) {
  return savingPluginIds.value.has(pluginId);
}

async function handleSave(plugin: any) {
  const pluginId = plugin.plugin.id;
  const state = pluginStates.value[pluginId];
  if (!state) {
    return;
  }

  const edge = enabledPluginsById.value.get(pluginId);
  const version = getPluginVersion(pluginId);

  if (!version) {
    toast.error('Could not determine plugin version for this forum.');
    return;
  }

  const enabledPluginsInput: any[] = [];
  const settingsJson = serializeSettingsJson(state.settings);

  if (state.enabled) {
    if (edge) {
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

  savingPluginIds.value.add(pluginId);
  try {
    await updateChannelEnabledPlugins({
      channelUniqueName: channelUniqueName.value,
      enabledPlugins: enabledPluginsInput,
    });
    dirtyPluginIds.value.delete(pluginId);
    await refetchChannel();
    await client.refetchQueries({ include: [GET_CHANNEL] });
    toast.success('Plugin settings saved for this forum.');
  } catch (err: any) {
    const message =
      updateChannelEnabledPluginsError.value?.message ||
      err?.message ||
      'Failed to save plugin settings. Please try again.';
    toast.error(`Failed to save plugin settings: ${message}`);
  } finally {
    savingPluginIds.value.delete(pluginId);
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
      class="bg-red-50 rounded-lg border border-red-200 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
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
        Loading plugin settings...
      </div>
    </div>

    <div v-else-if="channelError" class="py-8 text-center">
      <div class="text-red-600 dark:text-red-400">
        Error loading plugin settings: {{ channelError.message }}
      </div>
    </div>

    <div v-else class="space-y-6">
      <div class="bg-blue-50 rounded-lg p-4 dark:bg-blue-900/20">
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
        class="bg-yellow-50 rounded-lg p-4 dark:bg-yellow-900/20"
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
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        v-if="serverEnabledPlugins.length === 0"
        class="bg-yellow-50 rounded-lg p-4 dark:bg-yellow-900/20"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fa-solid fa-exclamation-triangle text-yellow-400" />
          </div>
          <div class="ml-3">
            <h3
              class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
            >
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

      <div class="space-y-6">
        <div
          v-for="plugin in serverEnabledPlugins"
          :key="plugin.plugin.id"
          class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-1">
              <h3 class="font-semibold text-lg text-gray-900 dark:text-white">
                {{ plugin.plugin.displayName || plugin.plugin.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ plugin.plugin.description || 'No description provided.' }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-300">
                Version {{ plugin.version }}
              </p>
            </div>
            <label
              class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                :checked="pluginStates[plugin.plugin.id]?.enabled"
                @change="
                  setPluginEnabled(
                    plugin.plugin.id,
                    ($event.target as HTMLInputElement).checked
                  )
                "
              >
              Enable for this forum
            </label>
          </div>

          <div
            v-if="pluginStates[plugin.plugin.id]?.enabled"
            class="mt-4 space-y-4"
          >
            <FormRow
              section-title="Forum Settings"
              description="Configure forum-specific settings for this plugin."
            >
              <template #content>
                <PluginSettingsForm
                  :sections="getChannelSections(plugin.manifest)"
                  :model-value="pluginStates[plugin.plugin.id]?.settings || {}"
                  @update:model-value="
                    updatePluginSettings(plugin.plugin.id, $event)
                  "
                />
              </template>
            </FormRow>
          </div>

          <div class="mt-4 flex justify-end">
            <button
              type="button"
              class="rounded-md bg-orange-700 px-4 py-2 text-white hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="
                isSaving(plugin.plugin.id) || !isDirty(plugin.plugin.id)
              "
              @click="handleSave(plugin)"
            >
              <i
                v-if="isSaving(plugin.plugin.id)"
                class="fa-solid fa-spinner mr-2 animate-spin"
              />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
