import { describe, it, expect } from 'vitest';

import {
  buildPluginStates,
  filterAndSortPluginStates,
  getLatestVersionCompatibilityForPlugin,
  type PluginState,
} from '@/utils/pluginManagement';

const basePlugins = [
  {
    id: 'alpha',
    name: 'Alpha',
    description: 'Alpha plugin',
    Versions: [{ version: '1.0.0' }, { version: '2.0.0' }],
  },
  {
    id: 'beta',
    name: 'Beta',
    Versions: [{ version: '1.0.0' }],
  },
  {
    id: 'gamma',
    name: 'Gamma',
    description: 'Searchable by description',
    Versions: [{ version: '1.0.0' }],
  },
];

const serverConfig = {
  AllowedPlugins: [{ id: 'beta' }],
};

describe('buildPluginStates', () => {
  it('returns an empty array when plugin data is missing', () => {
    expect(buildPluginStates({})).toEqual([]);
  });

  it('returns an empty array when the server config is missing', () => {
    expect(
      buildPluginStates({
        pluginManagementResult: { serverConfigs: [], plugins: basePlugins as never },
      })
    ).toEqual([]);
  });

  it('builds available, allowed, and installed plugin states', () => {
    const states = buildPluginStates({
      pluginManagementResult: {
        serverConfigs: [serverConfig],
        plugins: basePlugins as never,
      },
      installedPlugins: [
        {
          plugin: {
            id: 'alpha',
            name: 'Alpha',
            description: 'Installed alpha',
          },
          version: '2.0.0',
          scope: 'server',
          enabled: true,
          settingsJson: { theme: 'dark' },
          hasUpdate: true,
          latestVersion: '2.0.0',
        },
        {
          plugin: {
            id: 'gamma',
            name: 'Gamma',
          },
          version: '1.0.0',
          scope: 'server',
          enabled: false,
          settingsJson: {},
        },
      ] as never,
    });

    expect(
      states.map((state) => ({
        id: state.id,
        status: state.status,
        description: state.description,
        version: state.installedVersion?.version,
        enabled: state.installedVersion?.enabled,
        hasUpdate: state.hasUpdate,
        latestVersion: state.latestVersion,
      }))
    ).toEqual([
      {
        id: 'alpha',
        status: 'installed_enabled',
        description: 'Alpha plugin',
        version: '2.0.0',
        enabled: true,
        hasUpdate: true,
        latestVersion: '2.0.0',
      },
      {
        id: 'beta',
        status: 'allowed',
        description: undefined,
        version: undefined,
        enabled: undefined,
        hasUpdate: false,
        latestVersion: undefined,
      },
      {
        id: 'gamma',
        status: 'installed_disabled',
        description: 'Searchable by description',
        version: '1.0.0',
        enabled: false,
        hasUpdate: false,
        latestVersion: undefined,
      },
    ]);
  });
});

describe('filterAndSortPluginStates', () => {
  const pluginStates: PluginState[] = [
    {
      id: 'zeta',
      name: 'Zeta',
      status: 'available',
      availableVersions: [],
    },
    {
      id: 'alpha',
      name: 'Alpha',
      description: 'Alpha details',
      status: 'installed_enabled',
      availableVersions: [],
    },
    {
      id: 'beta',
      name: 'Beta',
      status: 'allowed',
      availableVersions: [],
    },
    {
      id: 'delta',
      name: 'Delta',
      status: 'installed_disabled',
      availableVersions: [],
    },
  ];

  it('filters by search text across name, description, and id', () => {
    expect(
      filterAndSortPluginStates({
        plugins: pluginStates,
        searchQuery: 'details',
        statusFilter: 'all',
        sortBy: 'name',
        sortDirection: 'asc',
      }).map((plugin) => plugin.id)
    ).toEqual(['alpha']);
  });

  it('filters by status', () => {
    expect(
      filterAndSortPluginStates({
        plugins: pluginStates,
        searchQuery: '',
        statusFilter: 'installed',
        sortBy: 'name',
        sortDirection: 'asc',
      }).map((plugin) => plugin.id)
    ).toEqual(['alpha', 'delta']);
  });

  it('filters by enabled status', () => {
    expect(
      filterAndSortPluginStates({
        plugins: pluginStates,
        searchQuery: '',
        statusFilter: 'enabled',
        sortBy: 'name',
        sortDirection: 'asc',
      }).map((plugin) => plugin.id)
    ).toEqual(['alpha']);
  });

  it('sorts by name in descending order', () => {
    expect(
      filterAndSortPluginStates({
        plugins: pluginStates,
        searchQuery: '',
        statusFilter: 'all',
        sortBy: 'name',
        sortDirection: 'desc',
      }).map((plugin) => plugin.id)
    ).toEqual(['zeta', 'delta', 'beta', 'alpha']);
  });

  it('sorts by status in the expected order', () => {
    expect(
      filterAndSortPluginStates({
        plugins: pluginStates,
        searchQuery: '',
        statusFilter: 'all',
        sortBy: 'status',
        sortDirection: 'asc',
      }).map((plugin) => plugin.id)
    ).toEqual(['alpha', 'delta', 'beta', 'zeta']);
  });
});

describe('getLatestVersionCompatibilityForPlugin', () => {
  it('treats missing latest versions as compatible', () => {
    expect(
      getLatestVersionCompatibilityForPlugin({
        availableVersions: [],
      })
    ).toEqual({ compatible: true });
  });

  it('allows compatible latest versions', () => {
    expect(
      getLatestVersionCompatibilityForPlugin({
        latestVersion: '2.0.0',
        availableVersions: [{ version: '2.0.0', minServerVersion: '1.0.0' }],
      })
    ).toEqual({ compatible: true });
  });

  it('rejects versions that need a newer server', () => {
    expect(
      getLatestVersionCompatibilityForPlugin({
        latestVersion: '2.0.0',
        availableVersions: [{ version: '2.0.0', minServerVersion: '2.0.0' }],
      })
    ).toEqual({ compatible: false, reason: 'Requires server >= 2.0.0' });
  });

  it('rejects versions with unsupported api versions', () => {
    expect(
      getLatestVersionCompatibilityForPlugin({
        latestVersion: '2.0.0',
        availableVersions: [{ version: '2.0.0', apiVersion: '2' }],
      })
    ).toEqual({ compatible: false, reason: 'Requires plugin API 2' });
  });
});
