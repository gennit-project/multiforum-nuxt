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

const pluginId = computed(() => {
  return typeof route.params.pluginId === 'string' ? route.params.pluginId : '';
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
  loading: updating,
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

const enabledPluginsById = computed(() => {
  const map = new Map<string, any>();
  for (const edge of enabledPluginEdges.value) {
    const pid = edge?.node?.Plugin?.id;
    if (pid) {
      map.set(pid, edge);
    }
  }
  return map;
});

const serverEnabledPlugins = computed(() => {
  const installed = installedResult.value?.getInstalledPlugins || [];
  return installed.filter((plugin: any) => plugin.enabled);
});

const plugin = computed(() => {
  return serverEnabledPlugins.value.find(
    (p: any) => p.plugin.id === pluginId.value
  );
});

const pluginState = ref<PluginState>({ enabled: false, settings: {} });
const isDirty = ref(false);
const saving = ref(false);

const isLoading = computed(
  () => channelLoading.value || installedLoading.value
);

const isEnabled = computed(() => pluginState.value.enabled);

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

function initializePluginState() {
  if (!plugin.value) return;
  const edge = enabledPluginsById.value.get(pluginId.value);
  const manifest = plugin.value.manifest;
  const settingsJson = edge?.properties?.settingsJson;
  const defaults = getChannelDefaults(manifest);
  pluginState.value = {
    enabled: !!edge,
    settings: {
      ...defaults,
      ...parseSettingsJson(settingsJson),
    },
  };
  isDirty.value = false;
}

watch(
  [plugin, enabledPluginsById],
  () => {
    if (plugin.value && !isDirty.value) {
      initializePluginState();
    }
  },
  { immediate: true }
);

function getPluginVersion() {
  const edge = enabledPluginsById.value.get(pluginId.value);
  if (edge?.node?.version) {
    return edge.node.version;
  }
  return plugin.value?.version;
}

function updateSettings(settings: Record<string, any>) {
  pluginState.value.settings = settings;
  isDirty.value = true;
}

async function handleToggleEnabled(enabled: boolean) {
  if (!plugin.value) return;

  const edge = enabledPluginsById.value.get(pluginId.value);
  const version = getPluginVersion();

  if (!version) {
    toast.error('Could not determine plugin version for this forum.');
    return;
  }

  const enabledPluginsInput: any[] = [];
  const settingsJson = serializeSettingsJson(pluginState.value.settings);

  if (enabled) {
    if (edge) {
      enabledPluginsInput.push({
        where: {
          node: {
            Plugin: { id: pluginId.value },
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
                Plugin: { id: pluginId.value },
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
              Plugin: { id: pluginId.value },
              version,
            },
          },
        },
      ],
    });
  } else {
    return;
  }

  try {
    await updateChannelEnabledPlugins({
      channelUniqueName: channelUniqueName.value,
      enabledPlugins: enabledPluginsInput,
    });
    pluginState.value.enabled = enabled;
    await refetchChannel();
    await client.refetchQueries({ include: [GET_CHANNEL] });
    toast.success(enabled ? 'Plugin enabled for this forum.' : 'Plugin disabled for this forum.');
  } catch (err: any) {
    const message =
      updateChannelEnabledPluginsError.value?.message ||
      err?.message ||
      'Failed to update plugin. Please try again.';
    toast.error(`Failed to update plugin: ${message}`);
  }
}

async function handleSave() {
  if (!plugin.value) return;

  const edge = enabledPluginsById.value.get(pluginId.value);
  const version = getPluginVersion();

  if (!version) {
    toast.error('Could not determine plugin version for this forum.');
    return;
  }

  const enabledPluginsInput: any[] = [];
  const settingsJson = serializeSettingsJson(pluginState.value.settings);

  if (pluginState.value.enabled) {
    if (edge) {
      enabledPluginsInput.push({
        where: {
          node: {
            Plugin: { id: pluginId.value },
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
                Plugin: { id: pluginId.value },
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
              Plugin: { id: pluginId.value },
              version,
            },
          },
        },
      ],
    });
  } else {
    return;
  }

  saving.value = true;
  try {
    await updateChannelEnabledPlugins({
      channelUniqueName: channelUniqueName.value,
      enabledPlugins: enabledPluginsInput,
    });
    isDirty.value = false;
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
    saving.value = false;
  }
}

const manifestJson = computed(() => {
  const manifest = plugin.value?.manifest;
  if (!manifest) return null;
  return JSON.stringify(manifest, null, 2);
});

const hasChannelSettings = computed(() => {
  if (!plugin.value?.manifest) return false;
  const sections = getChannelSections(plugin.value.manifest);
  return sections.length > 0;
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="py-8 text-center">
      <div class="inline-flex items-center">
        <i class="fa-solid fa-spinner mr-2 animate-spin" />
        Loading plugin details...
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="channelError" class="py-8 text-center">
      <div class="text-red-600 dark:text-red-400">
        Error loading plugin: {{ channelError.message }}
      </div>
    </div>

    <!-- Plugin Not Found -->
    <div v-else-if="!plugin" class="py-8 text-center">
      <div class="text-gray-600 dark:text-gray-400">
        Plugin not found or not available on this server.
      </div>
      <NuxtLink
        :to="`/forums/${channelUniqueName}/edit/plugins`"
        class="mt-4 inline-flex items-center text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
      >
        <i class="fa-solid fa-arrow-left mr-2" />
        Back to Plugins
      </NuxtLink>
    </div>

    <!-- Plugin Detail -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ plugin.plugin.displayName || plugin.plugin.name }}
            </h1>
            <span
              class="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              v{{ plugin.version }}
            </span>
          </div>
          <p
            v-if="plugin.plugin.description"
            class="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            {{ plugin.plugin.description }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Configuring for forum: {{ channelDisplayName }}
          </p>
        </div>
        <NuxtLink
          :to="`/forums/${channelUniqueName}/edit/plugins`"
          class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <i class="fa-solid fa-arrow-left mr-2" />
          Back to Plugins
        </NuxtLink>
      </div>

      <!-- Error Banner -->
      <div
        v-if="updateChannelEnabledPluginsError?.message"
        class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
        role="alert"
      >
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-triangle-exclamation mt-0.5" aria-hidden="true" />
          <span>{{ updateChannelEnabledPluginsError?.message }}</span>
        </div>
      </div>

      <!-- Enable/Disable Status Card (Prominent like server-scoped page) -->
      <div
        :class="[
          'rounded-xl border-2 p-6 transition-all',
          isEnabled
            ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
            : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
        ]"
      >
        <!-- Enabled State -->
        <div v-if="isEnabled" class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                <i class="fa-solid fa-power-off text-2xl text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Plugin Enabled
              </p>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Active for this forum
              </p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
            :disabled="updating"
            @click="handleToggleEnabled(false)"
          >
            <i v-if="updating" class="fa-solid fa-spinner mr-2 animate-spin" />
            Disable
          </button>
        </div>

        <!-- Disabled State - Large CTA -->
        <div v-else class="flex flex-col items-center text-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <i class="fa-solid fa-power-off text-2xl text-gray-500 dark:text-gray-400" />
          </div>
          <p class="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Plugin Disabled
          </p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Enable this plugin for {{ channelDisplayName }}
          </p>
          <button
            type="button"
            class="mt-4 w-full rounded-lg bg-green-700 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="updating"
            @click="handleToggleEnabled(true)"
          >
            <i v-if="updating" class="fa-solid fa-spinner mr-2 animate-spin" />
            <i v-else class="fa-solid fa-power-off mr-2" />
            Enable Plugin
          </button>
        </div>
      </div>

      <!-- Forum Settings Section -->
      <FormRow
        v-if="hasChannelSettings"
        section-title="Forum Settings"
        description="Configure forum-specific settings for this plugin."
      >
        <template #content>
          <div class="space-y-4">
            <PluginSettingsForm
              :sections="getChannelSections(plugin.manifest)"
              :model-value="pluginState.settings"
              @update:model-value="updateSettings"
            />

            <div class="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                class="rounded-md bg-orange-700 px-4 py-2 text-white hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="saving || !isDirty"
                @click="handleSave"
              >
                <i v-if="saving" class="fa-solid fa-spinner mr-2 animate-spin" />
                Save Settings
              </button>
            </div>
          </div>
        </template>
      </FormRow>

      <!-- Plugin Manifest Section -->
      <FormRow
        v-if="manifestJson"
        section-title="Plugin Manifest"
      >
        <template #content>
          <div
            tabindex="0"
            role="region"
            aria-label="Plugin manifest JSON"
            class="max-h-96 overflow-auto rounded-md border border-gray-300 bg-gray-900 p-3 dark:border-gray-600"
          >
            <pre class="whitespace-pre-wrap break-words text-sm text-gray-100">{{ manifestJson }}</pre>
          </div>
        </template>
      </FormRow>
    </div>
  </div>
</template>
