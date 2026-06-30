import type { Plugin, PluginVersion } from '@/__generated__/graphql';
import {
  getPluginVersionCompatibility,
  type PluginVersionCompatibility,
} from '@/utils/pluginCompatibility';

export type PluginVersionMetadata = Pick<PluginVersion, 'version'> & {
  apiVersion?: string | null;
  minServerVersion?: string | null;
};

export interface PluginState {
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
    settings: Record<string, unknown>;
  };
  availableVersions: PluginVersionMetadata[];
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
  settingsJson: Record<string, unknown>;
  hasUpdate?: boolean;
  latestVersion?: string;
  availableVersions?: string[];
}

type BuildPluginStatesParams = {
  pluginManagementResult?:
    | {
        serverConfigs?: Array<{
          AllowedPlugins?: Plugin[];
        }>;
        plugins?: Plugin[];
      }
    | null;
  installedPlugins?: InstalledPlugin[] | null;
};

export function buildPluginStates({
  pluginManagementResult,
  installedPlugins = [],
}: BuildPluginStatesParams): PluginState[] {
  if (!pluginManagementResult) return [];

  const serverConfig = pluginManagementResult.serverConfigs?.[0];
  if (!serverConfig) return [];

  const allPlugins = pluginManagementResult.plugins || [];
  const allowedPlugins = serverConfig.AllowedPlugins || [];
  const normalizedInstalledPlugins = installedPlugins ?? [];

  return allPlugins.map((plugin: Plugin): PluginState => {
    const isAllowed = allowedPlugins.some((allowed: Plugin) => allowed.id === plugin.id);
    const installedPlugin = normalizedInstalledPlugins.find(
      (installed: InstalledPlugin) => installed.plugin.id === plugin.id
    );
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
            id: installedPlugin.plugin.id,
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
}

type FilterAndSortPluginStatesParams = {
  plugins: PluginState[];
  searchQuery: string;
  statusFilter: 'all' | 'available' | 'allowed' | 'installed' | 'enabled';
  sortBy: 'name' | 'status';
  sortDirection: 'asc' | 'desc';
};

export function filterAndSortPluginStates({
  plugins,
  searchQuery,
  statusFilter,
  sortBy,
  sortDirection,
}: FilterAndSortPluginStatesParams): PluginState[] {
  let result = [...plugins];

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    result = result.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(query) ||
        plugin.description?.toLowerCase().includes(query) ||
        plugin.id.toLowerCase().includes(query)
    );
  }

  if (statusFilter !== 'all') {
    result = result.filter((plugin) => {
      switch (statusFilter) {
        case 'available':
          return plugin.status === 'available';
        case 'allowed':
          return plugin.status === 'allowed';
        case 'installed':
          return (
            plugin.status === 'installed_disabled' ||
            plugin.status === 'installed_enabled'
          );
        case 'enabled':
          return plugin.status === 'installed_enabled';
        default:
          return true;
      }
    });
  }

  result.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'status') {
      const statusOrder: Record<PluginState['status'], number> = {
        installed_enabled: 0,
        installed_disabled: 1,
        installed: 2,
        allowed: 3,
        available: 4,
      };
      comparison = statusOrder[a.status] - statusOrder[b.status];
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return result;
}

export function getLatestVersionCompatibilityForPlugin(
  plugin: Pick<PluginState, 'availableVersions' | 'latestVersion'>
): PluginVersionCompatibility {
  const latestVersion = plugin.latestVersion;
  if (!latestVersion) return { compatible: true };
  const versionMetadata = plugin.availableVersions.find(
    (version) => version.version === latestVersion
  );
  return getPluginVersionCompatibility(versionMetadata || {});
}
