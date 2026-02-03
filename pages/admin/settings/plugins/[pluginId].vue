<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery, useMutation } from '@vue/apollo-composable';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import PluginDetailHeader from '@/components/admin/plugins/PluginDetailHeader.vue';
import PluginStatusCards from '@/components/admin/plugins/PluginStatusCards.vue';
import PluginUpdateBanner from '@/components/admin/plugins/PluginUpdateBanner.vue';
import PluginInstallSection from '@/components/admin/plugins/PluginInstallSection.vue';
import PluginSecretsSection from '@/components/admin/plugins/PluginSecretsSection.vue';
import PluginSettingsSection from '@/components/admin/plugins/PluginSettingsSection.vue';
import PluginManifestSection from '@/components/admin/plugins/PluginManifestSection.vue';
import PluginReadmeSection from '@/components/admin/plugins/PluginReadmeSection.vue';
import { useToast } from '@/composables/useToast';
import { compareVersionStrings } from '@/utils/versionUtils';
import {
  extractSecretKeys,
  filterOutSecrets,
  getSecretsToSave,
} from '@/utils/pluginSettingsUtils';
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

// Core computed properties needed for secrets query
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

// Plugin slug (name) used for secrets - must be defined before secrets query
const pluginSlug = computed(() => {
  return installedPlugin.value?.plugin?.name || plugin.value?.name || '';
});

// Secrets query - uses pluginSlug (plugin name) not the route param (plugin id)
const secretsQueryVars = computed(() => ({
  pluginId: pluginSlug.value || pluginId,
}));

const {
  result: secretsResult,
  loading: secretsLoading,
  refetch: refetchSecrets,
} = useQuery(GET_SERVER_PLUGIN_SECRETS, secretsQueryVars, {
  // Only run when we have a pluginSlug
  enabled: computed(() => !!pluginSlug.value),
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
  return !isSelectedVersionInstalled.value && !!selectedVersion.value;
});

// Get full manifest JSON for display
const manifestJson = computed(() => {
  const manifest = installedPlugin.value?.manifest;
  if (!manifest) return null;
  return JSON.stringify(manifest, null, 2);
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


  try {
    const result = await installMutation({
      pluginId,
      version: versionToInstall,
    });


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

    // Identify secret fields from the form sections
    const secretKeys = extractSecretKeys(serverSettingsSections.value);

    // Save secrets separately via setServerPluginSecret
    const secretsToSave = getSecretsToSave(settingsValues.value, secretKeys);
    for (const { key, value } of secretsToSave) {
      await setSecretMutation({
        pluginId: pluginSlug.value,
        key,
        value,
      });
    }

    // Filter out secrets from settingsJson
    const nonSecretSettings = filterOutSecrets(
      settingsValues.value,
      secretKeys
    );

    await enableMutation({
      pluginId: pluginSlug.value,
      version: installedPlugin.value.version,
      enabled: installedPlugin.value.enabled,
      settingsJson: nonSecretSettings,
    });

    toast.success('Settings saved successfully');

    // Clear secret values from local state after successful save
    for (const key of secretKeys) {
      settingsValues.value[key] = '';
    }

    await refetchInstalled();
    await refetchSecrets();
  } catch (err: any) {
    toast.error(`Failed to save settings: ${err.message}`);
  } finally {
    savingSettings.value = false;
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
          <PluginDetailHeader
            :plugin-display-name="pluginDisplayName"
            :installed-version="installedVersion"
            :plugin-author-name="pluginAuthorName"
            :plugin-author-url="pluginAuthorUrl"
            :plugin-license="pluginLicense"
            :plugin-description="pluginDescription"
            :plugin-homepage="pluginHomepage"
            :plugin-repo-url="pluginRepoUrl"
            :plugin-tags="pluginTags"
          />

          <!-- Prominent Status Cards (only shown when installed) -->
          <PluginStatusCards
            v-if="isInstalled"
            :is-enabled="isEnabled"
            :installed-version="installedVersion"
            :can-enable="canEnable"
            :enabling="enabling"
            @toggle-enabled="handleToggleEnabled"
          />

          <!-- Update Available Banner -->
          <PluginUpdateBanner
            v-if="hasUpdate && latestVersion"
            :latest-version="latestVersion"
            :installed-version="installedVersion"
            :registry-versions="registryVersions"
            :installing="installing"
            @install-latest="handleInstall(latestVersion!)"
          />

          <!-- Installation Error Banner -->
          <ErrorBanner v-if="installError" :text="installError" />

          <!-- Installation Section -->
          <PluginInstallSection
            v-model="selectedVersion"
            :is-installed="isInstalled"
            :available-versions="availableVersions"
            :installed-version="installedVersion"
            :latest-version="latestVersion"
            :installing="installing"
            :can-install="canInstall"
            :is-selected-version-installed="isSelectedVersionInstalled"
            :has-newer-versions="hasNewerVersions"
            @install="handleInstall()"
          />

          <!-- Secrets Section -->
          <PluginSecretsSection
            v-if="isInstalled"
            v-model:secret-values="secretValues"
            v-model:show-secret-inputs="showSecretInputs"
            :secrets="secrets"
            @set-secret="handleSetSecret"
          />

          <!-- Loading State for Secrets -->
          <div v-if="secretsLoading" class="py-4 text-center">
            <div class="inline-flex items-center">
              <i class="fa-solid fa-spinner mr-2 animate-spin" />
              Loading secrets...
            </div>
          </div>

          <!-- Server Settings Section -->
          <PluginSettingsSection
            v-if="isInstalled"
            v-model="settingsValues"
            :sections="serverSettingsSections"
            :errors="settingsErrors"
            :secret-statuses="secretStatusesForForm"
            :saving="savingSettings"
            @save="handleSaveSettings"
          />

          <!-- Plugin Manifest JSON -->
          <PluginManifestSection :manifest-json="manifestJson" />

          <!-- README Section -->
          <PluginReadmeSection
            :plugin-readme="pluginReadme"
            :plugin-detail-loading="pluginDetailLoading"
          />
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
