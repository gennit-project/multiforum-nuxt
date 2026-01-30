<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery, useMutation } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import PluginSettingsForm from '@/components/plugins/PluginSettingsForm.vue';
import { useToast } from '@/composables/useToast';
import { compareVersionStrings } from '@/utils/versionUtils';
import type {
  PluginFormSection,
  PluginSecretStatus as PluginSecretStatusType,
} from '@/types/pluginForms';
import {
  GET_AVAILABLE_PLUGINS,
  GET_INSTALLED_PLUGINS,
  GET_SERVER_PLUGIN_SECRETS,
  GET_PLUGIN_DETAIL,
} from '@/graphQLData/admin/queries';
import {
  INSTALL_PLUGIN_VERSION,
  ENABLE_SERVER_PLUGIN,
  SET_SERVER_PLUGIN_SECRET,
} from '@/graphQLData/admin/mutations';

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  layout: 'default',
});

const route = useRoute();
const pluginId = route.params.pluginId as string;

// Toast notifications
const toast = useToast();

// State
const selectedVersion = ref<string>('');
const secretValues = ref<Record<string, string>>({});
const showSecretInputs = ref<Record<string, boolean>>({});
const settingsValues = ref<Record<string, any>>({});
const settingsErrors = ref<Record<string, string>>({});
const savingSettings = ref(false);
const installError = ref<string | null>(null);

// Types
interface PluginSecretStatus {
  key: string;
  status: 'NOT_SET' | 'SET_UNTESTED' | 'VALID' | 'INVALID';
  lastValidatedAt?: string;
  validationError?: string;
}

interface PluginMetadata {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  authorName?: string;
  authorUrl?: string;
  homepage?: string;
  license?: string;
  tags?: string[];
}

interface InstalledPlugin {
  plugin: PluginMetadata;
  version: string;
  scope: string;
  enabled: boolean;
  settingsJson: any;
  readmeMarkdown?: string;
  manifest?: any;
  hasUpdate?: boolean;
  latestVersion?: string;
  availableVersions?: string[];
}

// Queries
const {
  result: pluginsResult,
  error: pluginsError,
  loading: pluginsLoading,
} = useQuery(GET_AVAILABLE_PLUGINS);

const {
  result: installedResult,
  error: installedError,
  loading: installedLoading,
  refetch: refetchInstalled,
} = useQuery(GET_INSTALLED_PLUGINS, null, {
  fetchPolicy: 'cache-and-network',
});

const {
  result: secretsResult,
  loading: secretsLoading,
  refetch: refetchSecrets,
} = useQuery(GET_SERVER_PLUGIN_SECRETS, { pluginId });

// Query for plugin detail including version README (for non-installed plugins)
const { result: pluginDetailResult, loading: pluginDetailLoading } = useQuery(
  GET_PLUGIN_DETAIL,
  { pluginId }
);

// Mutations
const { mutate: installMutation, loading: installing } = useMutation(
  INSTALL_PLUGIN_VERSION
);
const { mutate: enableMutation, loading: enabling } =
  useMutation(ENABLE_SERVER_PLUGIN);
const { mutate: setSecretMutation } = useMutation(SET_SERVER_PLUGIN_SECRET);

// Computed
const plugin = computed(() => {
  const plugins = pluginsResult.value?.plugins || [];
  return plugins.find((p: any) => p.id === pluginId);
});

const installedPlugin = computed((): InstalledPlugin | null => {
  const installed = installedResult.value?.getInstalledPlugins || [];
  return (
    installed.find((p: InstalledPlugin) => p.plugin.id === pluginId) || null
  );
});

const secrets = computed((): PluginSecretStatus[] => {
  return secretsResult.value?.getServerPluginSecrets || [];
});

const isInstalled = computed(() => !!installedPlugin.value);
const isEnabled = computed(() => installedPlugin.value?.enabled ?? false);

// Plugin metadata computed properties
const pluginDisplayName = computed(() => {
  return (
    installedPlugin.value?.plugin?.displayName ||
    plugin.value?.displayName ||
    plugin.value?.name ||
    pluginId
  );
});

const pluginDescription = computed(() => {
  return (
    installedPlugin.value?.plugin?.description || plugin.value?.description
  );
});

const pluginAuthorName = computed(() => {
  return installedPlugin.value?.plugin?.authorName || plugin.value?.authorName;
});

const pluginAuthorUrl = computed(() => {
  return installedPlugin.value?.plugin?.authorUrl || plugin.value?.authorUrl;
});

const pluginHomepage = computed(() => {
  return installedPlugin.value?.plugin?.homepage || plugin.value?.homepage;
});

const pluginLicense = computed(() => {
  return installedPlugin.value?.plugin?.license || plugin.value?.license;
});

const pluginTags = computed(() => {
  return installedPlugin.value?.plugin?.tags || plugin.value?.tags || [];
});

// Get versions with full details from the plugin detail query
const pluginDetailVersions = computed(() => {
  const plugins = pluginDetailResult.value?.plugins || [];
  const pluginDetail = plugins.find((p: any) => p.id === pluginId);
  return pluginDetail?.Versions || [];
});

const pluginReadme = computed(() => {
  // First, try installed plugin's readme
  if (installedPlugin.value?.readmeMarkdown) {
    return installedPlugin.value.readmeMarkdown;
  }

  // If not installed or no readme, try to get from the selected version in detail query
  if (selectedVersion.value && pluginDetailVersions.value.length > 0) {
    const versionDetail = pluginDetailVersions.value.find(
      (v: any) => v.version === selectedVersion.value
    );
    if (versionDetail?.readmeMarkdown) {
      return versionDetail.readmeMarkdown;
    }
  }

  // Fallback: try first version with a readme
  for (const v of pluginDetailVersions.value) {
    if (v.readmeMarkdown) {
      return v.readmeMarkdown;
    }
  }

  return null;
});

// Extract server settings form sections from the plugin manifest
const serverSettingsSections = computed((): PluginFormSection[] => {
  const manifest = installedPlugin.value?.manifest;
  if (!manifest?.ui?.forms?.server) return [];
  return manifest.ui.forms.server;
});

// Convert secrets array to the format expected by PluginSecretField
const secretStatusesForForm = computed((): PluginSecretStatusType[] => {
  return secrets.value.map((s) => ({
    key: s.key,
    status: s.status,
    lastValidatedAt: s.lastValidatedAt,
    validationError: s.validationError,
  }));
});

const pluginRepoUrl = computed(() => {
  // Get repo URL from the installed version or manifest
  const versions = plugin.value?.Versions || [];
  const currentVersion = versions.find(
    (v: any) => v.version === installedVersion.value
  );
  return currentVersion?.repoUrl;
});

const canEnable = computed(() => {
  if (!isInstalled.value) return false;
  // Check if all secrets are valid or set (untested)
  return secrets.value.every(
    (s) => s.status === 'VALID' || s.status === 'SET_UNTESTED'
  );
});

const availableVersions = computed(() => {
  const versions = plugin.value?.Versions || [];
  return [...versions].sort((a: any, b: any) =>
    compareVersionStrings(b.version, a.version)
  );
});

const installedVersion = computed(() => {
  return installedPlugin.value?.version;
});

const pluginSlug = computed(() => {
  return (
    installedPlugin.value?.plugin?.name ||
    plugin.value?.name ||
    ''
  );
});

const isSelectedVersionInstalled = computed(() => {
  return installedVersion.value === selectedVersion.value;
});

const hasNewerVersions = computed(() => {
  if (!installedVersion.value) return true;
  return availableVersions.value.some(
    (v: any) => v.version !== installedVersion.value
  );
});

// Version update info from backend
const hasUpdate = computed(() => installedPlugin.value?.hasUpdate ?? false);
const latestVersion = computed(() => installedPlugin.value?.latestVersion);
const registryVersions = computed(
  () => installedPlugin.value?.availableVersions || []
);

// Check for ?update=true query param to auto-select latest version
const shouldAutoUpdate = computed(() => route.query.update === 'true');

const canInstall = computed(() => {
  return !isSelectedVersionInstalled.value && selectedVersion.value;
});

// Set default version when plugin loads
watch(
  [availableVersions, () => latestVersion.value, () => shouldAutoUpdate.value],
  ([versions, latest, autoUpdate]) => {
    if (versions.length > 0 && !selectedVersion.value) {
      // If auto-update is requested and we have a latest version, select it
      if (autoUpdate && latest) {
        selectedVersion.value = latest;
      }
      // If installed, default to installed version, otherwise first available
      else if (installedVersion.value) {
        selectedVersion.value = installedVersion.value;
      } else {
        selectedVersion.value = versions[0].version;
      }
    }
    // If auto-update param is set and we have a newer version, switch to it
    else if (autoUpdate && latest && selectedVersion.value !== latest) {
      selectedVersion.value = latest;
    }
  },
  { immediate: true }
);

// Update selected version when installed version changes
watch(
  installedVersion,
  (newInstalledVersion) => {
    if (newInstalledVersion && !selectedVersion.value) {
      selectedVersion.value = newInstalledVersion;
    }
  },
  { immediate: true }
);

// Initialize settings values from installed plugin
watch(
  installedPlugin,
  (newInstalledPlugin) => {
    if (newInstalledPlugin?.settingsJson) {
      settingsValues.value = { ...newInstalledPlugin.settingsJson };
    }
  },
  { immediate: true }
);

// Methods
const handleInstall = async (versionOverride?: string) => {
  const versionToInstall = versionOverride || selectedVersion.value;
  if (!versionToInstall) {
    installError.value = 'No version selected';
    return;
  }

  // Clear any previous error
  installError.value = null;

  console.log('Installing plugin:', pluginId, 'version:', versionToInstall);

  try {
    const result = await installMutation({
      pluginId,
      version: versionToInstall,
    });

    console.log('Install result:', result);

    // Check for GraphQL errors in the result
    if (result?.errors?.length) {
      const errorMsg = result.errors.map((e: any) => e.message).join(', ');
      installError.value = `Installation failed: ${errorMsg}`;
      return;
    }

    toast.success(
      `Plugin ${plugin.value?.name} v${versionToInstall} installed successfully`
    );

    // Update selected version to match installed
    selectedVersion.value = versionToInstall;

    // Refetch data
    await refetchInstalled();
    await refetchSecrets();
  } catch (err: any) {
    console.error('Install error:', err);
    const errorMessage = err.message || '';

    if (
      errorMessage.includes('PLUGIN_VERSION_NOT_FOUND') ||
      errorMessage.includes('not found in registry')
    ) {
      installError.value =
        'Plugin version not found in registry. Please check that this version exists in the configured plugin registry.';
    } else if (
      errorMessage.includes('INTEGRITY_MISMATCH') ||
      errorMessage.includes('SHA-256 mismatch') ||
      errorMessage.includes('integrity verification failed')
    ) {
      installError.value =
        'Plugin tarball integrity check failed. The SHA-256 hash of the downloaded tarball does not match the hash in the registry. The registry may need to be updated with the correct hash.';
    } else if (errorMessage.includes('Failed to fetch plugin registry')) {
      installError.value =
        'Could not connect to the plugin registry. Please check that the registry URL is correct and accessible.';
    } else if (errorMessage.includes('Failed to download tarball')) {
      installError.value =
        'Could not download the plugin tarball. Please check that the tarball URL in the registry is correct and accessible.';
    } else {
      installError.value = `Installation failed: ${errorMessage || 'Unknown error'}`;
    }
  }
};

const handleToggleEnabled = async (enabled: boolean) => {
  if (!installedPlugin.value) return;
  if (!pluginSlug.value) return;

  try {
    await enableMutation({
      pluginId: pluginSlug.value,
      version: installedPlugin.value.version,
      enabled,
      settingsJson: installedPlugin.value.settingsJson || {},
    });

    toast.success(
      `Plugin ${plugin.value?.name} ${enabled ? 'enabled' : 'disabled'} successfully`
    );
    await refetchInstalled();
  } catch (err: any) {
    if (err.message.includes('Missing required secrets')) {
      toast.error('Cannot enable: missing required secrets');
    } else if (
      err.message.includes('PLUGIN_MISCONFIGURED_REQUIRED_SECRET_MISSING')
    ) {
      toast.error('Plugin misconfigured: required secrets missing');
    } else {
      toast.error(`${enabled ? 'Enable' : 'Disable'} failed: ${err.message}`);
    }
  }
};

const handleSetSecret = async (key: string, value: string) => {
  if (!pluginSlug.value) return;

  try {
    await setSecretMutation({
      pluginId: pluginSlug.value,
      key,
      value,
    });

    toast.success(`Secret "${key}" set successfully`);

    // Clear the input and hide it
    secretValues.value[key] = '';
    showSecretInputs.value[key] = false;

    // Refetch secrets to update status
    await refetchSecrets();
  } catch (err: any) {
    toast.error(`Failed to set secret "${key}": ${err.message}`);
  }
};


const handleSaveSettings = async () => {
  if (!installedPlugin.value) return;
  if (!pluginSlug.value) return;

  savingSettings.value = true;
  settingsErrors.value = {};

  try {
    // Validate required fields
    for (const section of serverSettingsSections.value) {
      for (const field of section.fields) {
        if (field.validation?.required) {
          const value = settingsValues.value[field.key];
          if (value === undefined || value === null || value === '') {
            settingsErrors.value[field.key] = `${field.label} is required`;
          }
        }
      }
    }

    // If there are validation errors, don't save
    if (Object.keys(settingsErrors.value).length > 0) {
      toast.error('Please fix the validation errors');
      return;
    }

    await enableMutation({
      pluginId: pluginSlug.value,
      version: installedPlugin.value.version,
      enabled: installedPlugin.value.enabled,
      settingsJson: settingsValues.value,
    });

    toast.success('Settings saved successfully');
    await refetchInstalled();
  } catch (err: any) {
    toast.error(`Failed to save settings: ${err.message}`);
  } finally {
    savingSettings.value = false;
  }
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
  <div class="px-8">
    <RequireAuth>
      <template #has-auth>
        <!-- Loading State -->
        <div v-if="pluginsLoading || installedLoading" class="py-8 text-center">
          <div class="inline-flex items-center">
            <i class="fa-solid fa-spinner mr-2 animate-spin" />
            Loading plugin details...
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="pluginsError || installedError"
          class="py-8 text-center"
        >
          <div class="text-red-600 dark:text-red-400">
            Error loading plugin:
            {{ (pluginsError || installedError)?.message }}
          </div>
        </div>

        <!-- Plugin Not Found -->
        <div v-else-if="!plugin" class="py-8 text-center">
          <div class="text-gray-600 dark:text-gray-400">Plugin not found</div>
        </div>

        <!-- Plugin Detail -->
        <div v-else class="space-y-6">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- Plugin Name and Version -->
              <div class="flex items-center space-x-3">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ pluginDisplayName }}
                </h1>
                <span
                  v-if="installedVersion"
                  class="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  v{{ installedVersion }}
                </span>
              </div>

              <!-- Author and License -->
              <div
                class="mt-1 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span v-if="pluginAuthorName">
                  by
                  <a
                    v-if="pluginAuthorUrl"
                    :href="pluginAuthorUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-orange-600 hover:underline dark:text-orange-400"
                  >
                    {{ pluginAuthorName }}
                  </a>
                  <span v-else>{{ pluginAuthorName }}</span>
                </span>
                <span
                  v-if="pluginAuthorName && pluginLicense"
                  class="text-gray-400"
                  >•</span
                >
                <span
                  v-if="pluginLicense"
                  class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium dark:bg-gray-700"
                >
                  {{ pluginLicense }}
                </span>
              </div>

              <!-- Description -->
              <p
                v-if="pluginDescription"
                class="mt-2 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ pluginDescription }}
              </p>

              <!-- Links -->
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <a
                  v-if="pluginHomepage"
                  :href="pluginHomepage"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center text-orange-600 hover:underline dark:text-orange-400"
                >
                  <i class="fa-solid fa-home mr-1" />
                  Homepage
                </a>
                <a
                  v-if="pluginRepoUrl"
                  :href="pluginRepoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center text-orange-600 hover:underline dark:text-orange-400"
                >
                  <i class="fa-solid fa-code mr-1" />
                  View Source
                </a>
              </div>

              <!-- Tags -->
              <div
                v-if="pluginTags.length > 0"
                class="mt-3 flex flex-wrap gap-2"
              >
                <span
                  v-for="tag in pluginTags"
                  :key="tag"
                  class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- Status Badges -->
              <div class="mt-3 flex space-x-2">
                <span
                  v-if="isInstalled"
                  class="font-semibold rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-800 dark:text-green-200"
                >
                  Installed
                </span>
                <span
                  v-if="isEnabled"
                  class="font-semibold rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                >
                  Enabled
                </span>
              </div>
            </div>
            <NuxtLink
              to="/admin/plugins"
              class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <i class="fa-solid fa-arrow-left mr-2" />
              Back to Plugins
            </NuxtLink>
          </div>

          <!-- Update Available Banner -->
          <div
            v-if="hasUpdate && latestVersion"
            class="bg-blue-50 rounded-lg border border-blue-200 p-4 dark:border-blue-800 dark:bg-blue-900/20"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <i class="fa-solid fa-arrow-circle-up text-xl text-blue-500" />
              </div>
              <div class="ml-3 flex-1">
                <h3
                  class="text-sm font-medium text-blue-800 dark:text-blue-200"
                >
                  Update Available
                </h3>
                <div class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    A newer version is available:
                    <span class="font-semibold font-mono"
                      >v{{ latestVersion }}</span
                    >
                    (currently installed: v{{ installedVersion }})
                  </p>
                  <p v-if="registryVersions.length > 1" class="mt-1 text-xs">
                    {{ registryVersions.length }} versions available in registry
                  </p>
                </div>
              </div>
              <div class="ml-4">
                <button
                  type="button"
                  class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  :disabled="installing"
                  @click="handleInstall(latestVersion!)"
                >
                  <i
                    v-if="installing"
                    class="fa-solid fa-spinner mr-1 animate-spin"
                  />
                  <i v-else class="fa-solid fa-arrow-up mr-1" />
                  Update to v{{ latestVersion }}
                </button>
              </div>
            </div>
          </div>

          <!-- Installation Error Banner -->
          <ErrorBanner v-if="installError" :text="installError" />

          <!-- Installation Section -->
          <FormRow section-title="Installation">
            <template #content>
              <div class="space-y-4">
                <!-- Currently Installed Info -->
                <div
                  v-if="isInstalled"
                  class="bg-green-50 rounded-lg border border-green-200 p-4 dark:border-green-800 dark:bg-green-900/20"
                >
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <i
                        class="fa-solid fa-check-circle text-xl text-green-400"
                      />
                    </div>
                    <div class="ml-3">
                      <h3
                        class="text-sm font-medium text-green-800 dark:text-green-200"
                      >
                        Plugin Installed
                      </h3>
                      <div
                        class="mt-1 text-sm text-green-700 dark:text-green-300"
                      >
                        Currently installed:
                        <span class="font-semibold font-mono"
                          >v{{ installedVersion }}</span
                        >
                        <span
                          v-if="isEnabled"
                          class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                        >
                          Enabled
                        </span>
                        <span
                          v-else
                          class="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        >
                          Disabled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Version Selection -->
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
                      @click="handleInstall()"
                    >
                      <i
                        v-if="installing"
                        class="fa-solid fa-spinner mr-2 animate-spin"
                      />
                      Install
                    </button>

                    <button
                      v-else-if="canInstall"
                      type="button"
                      class="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="installing || !selectedVersion"
                      @click="handleInstall()"
                    >
                      <i
                        v-if="installing"
                        class="fa-solid fa-spinner mr-2 animate-spin"
                      />
                      Install v{{ selectedVersion }}
                    </button>

                    <div
                      v-else-if="isSelectedVersionInstalled"
                      class="flex items-center text-sm text-green-600 dark:text-green-400"
                    >
                      <i class="fa-solid fa-check mr-2" />
                      This version is already installed
                    </div>

                    <div
                      v-else-if="!hasNewerVersions"
                      class="text-sm text-gray-500 dark:text-gray-400"
                    >
                      No other versions available
                    </div>
                  </div>

                  <!-- Version Status Help -->
                  <div
                    v-if="isInstalled"
                    class="mt-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    <p v-if="hasNewerVersions">
                      Select a different version to install an update or
                      downgrade.
                    </p>
                    <p v-else>You have the only available version installed.</p>
                  </div>
                </div>
              </div>
            </template>
          </FormRow>

          <!-- Enable/Disable Section -->
          <FormRow v-if="isInstalled" section-title="">
            <template #content>
              <div class="space-y-4">
                <div class="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                    Plugin Status
                  </h2>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <label
                      class="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Enable server-wide
                    </label>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{
                        canEnable
                          ? 'Plugin is ready to be enabled'
                          : 'Required secrets are not configured'
                      }}
                    </p>
                  </div>
                  <label class="inline-flex items-center">
                    <input
                      type="checkbox"
                      :checked="isEnabled"
                      :disabled="!canEnable || enabling"
                      class="form-checkbox h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50"
                      @change="
                        (e) =>
                          handleToggleEnabled(
                            (e.target as HTMLInputElement).checked
                          )
                      "
                    >
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {{ isEnabled ? 'Enabled' : 'Enable' }}
                    </span>
                    <i
                      v-if="enabling"
                      class="fa-solid fa-spinner ml-2 animate-spin"
                    />
                  </label>
                </div>
                <ErrorBanner
                  v-if="!canEnable"
                  text="This plugin can’t be enabled until all required secrets are configured."
                />
              </div>
            </template>
          </FormRow>

          <!-- Secrets Section -->
          <FormRow
            v-if="isInstalled && secrets.length > 0"
            section-title="Required Secrets"
          >
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

                  <!-- Secret Input -->
                  <div v-if="showSecretInputs[secret.key]" class="space-y-2">
                    <input
                      v-model="secretValues[secret.key]"
                      type="password"
                      placeholder="Enter secret value"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                    <div class="flex space-x-2">
                      <button
                        type="button"
                        class="rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
                        :disabled="!secretValues[secret.key]"
                        @click="
                          handleSetSecret(
                            secret.key,
                            secretValues[secret.key] || ''
                          )
                        "
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        class="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
                        @click="showSecretInputs[secret.key] = false"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div v-else class="flex space-x-2">
                    <button
                      type="button"
                      class="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      @click="showSecretInputs[secret.key] = true"
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

          <!-- Loading State for Secrets -->
          <div v-if="secretsLoading" class="py-4 text-center">
            <div class="inline-flex items-center">
              <i class="fa-solid fa-spinner mr-2 animate-spin" />
              Loading secrets...
            </div>
          </div>

          <!-- Server Settings Section -->
          <FormRow
            v-if="isInstalled && serverSettingsSections.length > 0"
            section-title=""
          >
            <template #content>
              <div class="space-y-6">
                <div class="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                    Server-Scoped Plugin Settings
                  </h2>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Configure server-wide settings for this plugin.
                  </p>
                </div>

                <PluginSettingsForm
                  v-model="settingsValues"
                  :sections="serverSettingsSections"
                  :errors="settingsErrors"
                  :secret-statuses="secretStatusesForForm"
                />

                <div
                  class="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700"
                >
                  <button
                    type="button"
                    class="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="savingSettings"
                    @click="handleSaveSettings"
                  >
                    <i
                      v-if="savingSettings"
                      class="fa-solid fa-spinner mr-2 animate-spin"
                    />
                    Save Settings
                  </button>
                </div>
              </div>
            </template>
          </FormRow>

          <!-- README Section -->
          <FormRow
            v-if="pluginReadme || pluginDetailLoading"
            section-title="Documentation"
          >
            <template #content>
              <div
                v-if="pluginDetailLoading && !pluginReadme"
                class="py-4 text-center"
              >
                <div
                  class="inline-flex items-center text-gray-600 dark:text-gray-400"
                >
                  <i class="fa-solid fa-spinner mr-2 animate-spin" />
                  Loading documentation...
                </div>
              </div>
              <div
                v-else
                class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
              >
                <MarkdownRenderer :text="pluginReadme" font-size="small" />
              </div>
            </template>
          </FormRow>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="p-8 dark:text-white">
          You don't have permission to see this page.
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
