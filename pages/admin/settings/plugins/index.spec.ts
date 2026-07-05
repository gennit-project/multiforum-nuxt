import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import PluginsIndexPage from './index.vue';

vi.mock('@/graphQLData/admin/queries', () => ({
  GET_PLUGIN_MANAGEMENT_DATA: 'GET_PLUGIN_MANAGEMENT_DATA',
  GET_INSTALLED_PLUGINS: 'GET_INSTALLED_PLUGINS',
}));

vi.mock('@/graphQLData/admin/mutations', () => ({
  ALLOW_PLUGIN: 'ALLOW_PLUGIN',
  DISALLOW_PLUGIN: 'DISALLOW_PLUGIN',
  INSTALL_PLUGIN_VERSION: 'INSTALL_PLUGIN_VERSION',
}));

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/config', () => ({
  config: {
    serverName: 'multiforum',
  },
}));

const apolloState = vi.hoisted(() => ({
  queries: {} as Record<
    string,
    {
      result: { value: unknown };
      loading: { value: boolean };
      error: { value: Error | null };
      refetch: ReturnType<typeof vi.fn>;
    }
  >,
  mutations: {
    ALLOW_PLUGIN: vi.fn(),
    DISALLOW_PLUGIN: vi.fn(),
    INSTALL_PLUGIN_VERSION: vi.fn(),
  },
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  apolloState.queries = {
    GET_PLUGIN_MANAGEMENT_DATA: {
      result: ref(null),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    },
    GET_INSTALLED_PLUGINS: {
      result: ref(null),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    },
  };
  return {
    useQuery: (doc: keyof typeof apolloState.queries) => apolloState.queries[doc],
    useMutation: (doc: keyof typeof apolloState.mutations) => ({
      mutate: apolloState.mutations[doc],
    }),
  };
});

const stubs = {
  FormRow: {
    name: 'FormRow',
    props: ['sectionTitle'],
    template: '<section><slot name="content" /></section>',
  },
  PluginDiscoverySection: {
    name: 'PluginDiscoverySection',
    emits: ['refreshed'],
    template:
      '<button type="button" data-test="refresh-discovery" @click="$emit(\'refreshed\')">Refresh discovery</button>',
  },
};

const setPluginData = () => {
  apolloState.queries.GET_PLUGIN_MANAGEMENT_DATA.result.value = {
    serverConfigs: [
      {
        AllowedPlugins: [{ id: 'allowed-plugin' }],
      },
    ],
    plugins: [
      {
        id: 'available-plugin',
        name: 'Available Plugin',
        description: 'Ready to be allowed',
        Versions: [{ version: '1.0.0' }],
      },
      {
        id: 'allowed-plugin',
        name: 'Allowed Plugin',
        description: 'Allowed but not installed',
        Versions: [{ version: '1.0.0' }],
      },
      {
        id: 'enabled-plugin',
        name: 'Enabled Plugin',
        description: 'Installed with an upgrade path',
        Versions: [{ version: '1.0.0' }, { version: '1.1.0' }],
      },
      {
        id: 'incompatible-plugin',
        name: 'Incompatible Plugin',
        description: 'Needs a newer server',
        Versions: [{ version: '1.0.0' }, { version: '2.0.0', minServerVersion: '2.0.0' }],
      },
    ],
  };

  apolloState.queries.GET_INSTALLED_PLUGINS.result.value = {
    getInstalledPlugins: [
      {
        plugin: {
          id: 'enabled-plugin',
          name: 'Enabled Plugin',
          description: 'Installed with an upgrade path',
        },
        version: '1.0.0',
        scope: 'server',
        enabled: true,
        settingsJson: {},
        hasUpdate: true,
        latestVersion: '1.1.0',
      },
      {
        plugin: {
          id: 'incompatible-plugin',
          name: 'Incompatible Plugin',
          description: 'Needs a newer server',
        },
        version: '1.0.0',
        scope: 'server',
        enabled: false,
        settingsJson: {},
        hasUpdate: true,
        latestVersion: '2.0.0',
      },
    ],
  };
};

const mountPage = () =>
  mountWithDefaults(PluginsIndexPage, {
    global: { stubs },
  });

beforeEach(() => {
  vi.clearAllMocks();
  apolloState.queries.GET_PLUGIN_MANAGEMENT_DATA.result.value = null;
  apolloState.queries.GET_PLUGIN_MANAGEMENT_DATA.loading.value = false;
  apolloState.queries.GET_PLUGIN_MANAGEMENT_DATA.error.value = null;
  apolloState.queries.GET_INSTALLED_PLUGINS.result.value = null;
  apolloState.queries.GET_INSTALLED_PLUGINS.loading.value = false;
  apolloState.queries.GET_INSTALLED_PLUGINS.error.value = null;
  apolloState.mutations.ALLOW_PLUGIN.mockResolvedValue({});
  apolloState.mutations.DISALLOW_PLUGIN.mockResolvedValue({});
  apolloState.mutations.INSTALL_PLUGIN_VERSION.mockResolvedValue({});
});

describe('Plugins settings page', () => {
  it('renders the loading state', () => {
    apolloState.queries.GET_PLUGIN_MANAGEMENT_DATA.loading.value = true;

    expect(mountPage().text()).toContain('Loading plugins...');
  });

  it('renders the error state', () => {
    apolloState.queries.GET_PLUGIN_MANAGEMENT_DATA.error.value = new Error('boom');

    expect(mountPage().text()).toContain('Error loading plugins: boom');
  });

  it('renders plugin cards from the query results', () => {
    setPluginData();

    expect(mountPage().text()).toContain('Enabled Plugin');
  });

  it('filters plugins by search query', async () => {
    setPluginData();
    const wrapper = mountPage();

    await wrapper
      .get('input[placeholder="Search plugins..."]')
      .setValue('upgrade path');

    expect(wrapper.text()).toContain('Showing 1 of 4 plugins');
  });

  it('clears filters after an empty search result', async () => {
    setPluginData();
    const wrapper = mountPage();

    await wrapper.get('input[placeholder="Search plugins..."]').setValue('missing');
    const clearButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Clear filters');

    await clearButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Available Plugin');
  });

  it('refetches both queries on mount', () => {
    setPluginData();
    mountPage();

    expect(apolloState.queries.GET_INSTALLED_PLUGINS.refetch).toHaveBeenCalled();
  });

  it('allows an available plugin', async () => {
    setPluginData();
    const wrapper = mountPage();

    await wrapper.get('button[class*="bg-orange-600"]').trigger('click');
    await flushPromises();

    expect(apolloState.mutations.ALLOW_PLUGIN).toHaveBeenCalledWith({
      pluginId: 'available-plugin',
      serverName: 'multiforum',
    });
  });

  it('disallows an allowed plugin', async () => {
    setPluginData();
    const wrapper = mountPage();

    const disallowButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Disallow');

    await disallowButton!.trigger('click');
    await flushPromises();

    expect(apolloState.mutations.DISALLOW_PLUGIN).toHaveBeenCalledWith({
      pluginId: 'allowed-plugin',
      serverName: 'multiforum',
    });
  });

  it('upgrades a compatible installed plugin', async () => {
    setPluginData();
    const wrapper = mountPage();

    const upgradeButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Upgrade') && button.attributes('disabled') === undefined);

    await upgradeButton!.trigger('click');
    await flushPromises();

    expect(apolloState.mutations.INSTALL_PLUGIN_VERSION).toHaveBeenCalledWith({
      pluginId: 'enabled-plugin',
      version: '1.1.0',
    });
  });

  it('disables upgrade when the latest version is incompatible', () => {
    setPluginData();
    const wrapper = mountPage();

    const upgradeButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Upgrade') && button.attributes('title') === 'Requires server >= 2.0.0');

    expect(upgradeButton?.attributes('disabled')).toBeDefined();
  });

  it('refetches plugin data when discovery refreshes', async () => {
    setPluginData();
    const wrapper = mountPage();

    await wrapper.get('[data-test="refresh-discovery"]').trigger('click');
    await flushPromises();

    expect(apolloState.queries.GET_PLUGIN_MANAGEMENT_DATA.refetch).toHaveBeenCalledTimes(1);
  });
});
