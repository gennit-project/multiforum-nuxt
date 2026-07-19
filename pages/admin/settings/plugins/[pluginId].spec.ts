import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import PluginDetailPage from './[pluginId].vue';

vi.stubGlobal('definePageMeta', vi.fn());

const PLUGIN_ID = 'my-plugin';

const routeState = vi.hoisted(() => ({
  query: {} as Record<string, string>,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { pluginId: PLUGIN_ID }, query: routeState.query }),
}));

vi.mock('@/graphQLData/admin/queries', () => ({
  GET_AVAILABLE_PLUGINS: 'AVAILABLE',
  GET_INSTALLED_PLUGINS: 'INSTALLED',
  GET_SERVER_PLUGIN_SECRETS: 'SECRETS',
  GET_PLUGIN_CONFIG_STATUS: 'CONFIG_STATUS',
  GET_PLUGIN_DETAIL: 'DETAIL',
}));
vi.mock('@/graphQLData/admin/mutations', () => ({
  INSTALL_PLUGIN_VERSION: 'INSTALL_M',
  ENABLE_SERVER_PLUGIN: 'ENABLE_M',
  SET_SERVER_PLUGIN_SECRET: 'SET_SECRET_M',
}));

const h = vi.hoisted(() => ({
  q: {} as Record<
    string,
    {
      result: { value: unknown };
      loading: { value: boolean };
      error: { value: unknown };
      refetch: ReturnType<typeof vi.fn>;
    }
  >,
  mutations: {} as Record<string, { mutate: ReturnType<typeof vi.fn>; loading: { value: boolean } }>,
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.q = {
    AVAILABLE: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
    INSTALLED: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
    DETAIL: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
    SECRETS: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
    CONFIG_STATUS: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
  };
  return {
    useQuery: (doc: keyof typeof h.q) => h.q[doc],
    useMutation: (doc: string) => {
      if (!h.mutations[doc]) {
        h.mutations[doc] = { mutate: vi.fn(), loading: ref(false) };
      }
      return h.mutations[doc];
    },
  };
});

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }));

const sectionStub = (name: string) => ({ name, template: `<div data-stub="${name}" />` });
const stubs = {
  PluginDetailHeader: { name: 'PluginDetailHeader', props: ['pluginDisplayName'], template: '<div class="header">{{ pluginDisplayName }}</div>' },
  PluginStatusCards: { name: 'PluginStatusCards', props: ['isEnabled', 'canEnable', 'enabling', 'blockingConfigFields'], emits: ['toggle-enabled'], template: '<button type="button" data-test="toggle-enabled" @click="$emit(\'toggle-enabled\', false)" />' },
  PluginUpdateBanner: sectionStub('PluginUpdateBanner'),
  PluginInstallSection: {
    name: 'PluginInstallSection',
    props: ['modelValue', 'canInstall', 'compatibilityByVersion'],
    emits: ['install', 'update:modelValue'],
    template: '<button type="button" data-test="install" @click="$emit(\'install\')">Install</button>',
  },
  PluginSecretsSection: {
    name: 'PluginSecretsSection',
    props: ['secrets', 'secretValues', 'showSecretInputs'],
    emits: ['set-secret', 'update:secretValues', 'update:showSecretInputs'],
    template: '<button type="button" data-test="set-secret" @click="$emit(\'set-secret\', \'API_KEY\', \'xyz\')">Set secret</button>',
  },
  PluginSettingsSection: {
    name: 'PluginSettingsSection',
    props: ['modelValue', 'errors', 'saving', 'sections', 'secretStatuses'],
    emits: ['save', 'update:modelValue'],
    template: '<button type="button" data-test="save-settings" @click="$emit(\'save\')">Save settings</button>',
  },
  PluginManifestSection: sectionStub('PluginManifestSection'),
  PluginReadmeSection: sectionStub('PluginReadmeSection'),
  ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="error-banner">{{ text }}</div>' },
};

const mountPage = () => mountWithDefaults(PluginDetailPage, { global: { stubs } });

const deferred = <T = unknown>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const setAvailablePlugin = (overrides: Record<string, unknown> = {}) => {
  h.q.AVAILABLE.result.value = {
    plugins: [
      {
        id: PLUGIN_ID,
        name: PLUGIN_ID,
        displayName: 'My Plugin',
        Versions: [{ version: '1.0.0' }],
        ...overrides,
      },
    ],
  };
};

const setInstalledPlugin = (overrides: Record<string, unknown> = {}) => {
  setAvailablePlugin();
  h.q.INSTALLED.result.value = {
    getInstalledPlugins: [
      {
        plugin: { id: PLUGIN_ID, name: PLUGIN_ID, displayName: 'My Plugin' },
        version: '1.0.0',
        scope: 'server',
        enabled: true,
        settingsJson: {},
        manifest: null,
        ...overrides,
      },
    ],
  };
  h.q.SECRETS.result.value = { getServerPluginSecrets: [] };
  h.q.CONFIG_STATUS.result.value = {
    getPluginConfigStatus: { isFullyConfigured: true, fields: [] },
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  routeState.query = {};
  for (const k of Object.keys(h.q) as Array<keyof typeof h.q>) {
    h.q[k].result.value = null;
    h.q[k].loading.value = false;
    h.q[k].error.value = null;
  }
  h.mutations = {};
});

describe('Plugin detail page', () => {
  it('shows the initial loading state', () => {
    h.q.AVAILABLE.loading.value = true;

    expect(mountPage().text()).toContain('Loading plugin details');
  });

  it('shows an error state', () => {
    h.q.AVAILABLE.error.value = { message: 'boom' };

    expect(mountPage().text()).toContain('Error loading plugin: boom');
  });

  it('shows "Plugin not found" when the plugin is absent from the registry', () => {
    h.q.AVAILABLE.result.value = { plugins: [] };
    h.q.INSTALLED.result.value = { getInstalledPlugins: [] };

    expect(mountPage().text()).toContain('Plugin not found');
  });

  it('renders the detail sections for an installed, enabled plugin', () => {
    setInstalledPlugin();
    const wrapper = mountPage();

    expect(wrapper.findComponent({ name: 'PluginStatusCards' }).exists()).toBe(true);
  });

  it('renders a declared missing secret once and removes its duplicate form field', () => {
    setInstalledPlugin({
      manifest: {
        secrets: [{ key: 'API_KEY', scope: 'server', required: true }],
        ui: {
          forms: {
            server: [{
              title: 'Settings',
              fields: [
                { key: 'API_KEY', label: 'API key', type: 'secret' },
                { key: 'serviceUrl', label: 'Service URL', type: 'text' },
              ],
            }],
          },
        },
      },
    });
    const wrapper = mountPage();

    expect({
      secrets: wrapper.findComponent({ name: 'PluginSecretsSection' }).props('secrets'),
      fields: wrapper.findComponent({ name: 'PluginSettingsSection' }).props('sections')[0].fields,
    }).toEqual({
      secrets: [{ key: 'API_KEY', status: 'NOT_SET' }],
      fields: [{ key: 'serviceUrl', label: 'Service URL', type: 'text' }],
    });
  });

  it('hides the installed-only sections for an uninstalled plugin', () => {
    setAvailablePlugin();
    h.q.INSTALLED.result.value = { getInstalledPlugins: [] };
    const wrapper = mountPage();

    expect(wrapper.findComponent({ name: 'PluginStatusCards' }).exists()).toBe(false);
  });

  it('shows a missing-version install error', async () => {
    setAvailablePlugin({ Versions: [] });
    h.q.DETAIL.result.value = { plugins: [{ id: PLUGIN_ID, Versions: [] }] };
    const wrapper = mountPage();

    await wrapper.get('[data-test="install"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('No version selected');
  });

  it('shows a compatibility install error', async () => {
    setAvailablePlugin({ Versions: [{ version: '2.0.0', minServerVersion: '2.0.0' }] });
    h.q.DETAIL.result.value = {
      plugins: [{ id: PLUGIN_ID, Versions: [{ version: '2.0.0', minServerVersion: '2.0.0' }] }],
    };
    const wrapper = mountPage();

    await wrapper.get('[data-test="install"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Requires server >= 2.0.0');
  });

  it('shows GraphQL install errors returned from the mutation', async () => {
    setAvailablePlugin();
    h.q.DETAIL.result.value = {
      plugins: [{ id: PLUGIN_ID, Versions: [{ version: '1.0.0', readmeMarkdown: '# Readme' }] }],
    };
    h.mutations.INSTALL_M = {
      mutate: vi.fn().mockResolvedValue({ errors: [{ message: 'boom' }] }),
      loading: { value: false },
    };
    const wrapper = mountPage();

    await wrapper.get('[data-test="install"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Installation failed: boom');
  });

  it('maps thrown install errors to user-facing text', async () => {
    setAvailablePlugin();
    h.q.DETAIL.result.value = {
      plugins: [{ id: PLUGIN_ID, Versions: [{ version: '1.0.0' }] }],
    };
    h.mutations.INSTALL_M = {
      mutate: vi.fn().mockRejectedValue(new Error('PLUGIN_VERSION_NOT_FOUND')),
      loading: { value: false },
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountPage();

    await wrapper.get('[data-test="install"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Plugin version not found in registry.');
  });

  it('toggles enabled state via the status cards', async () => {
    setInstalledPlugin();
    const wrapper = mountPage();

    await wrapper.get('[data-test="toggle-enabled"]').trigger('click');
    await flushPromises();

    expect(h.mutations.ENABLE_M?.mutate).toHaveBeenCalled();
  });

  it('shows a missing-secrets error when enable fails for that reason', async () => {
    setInstalledPlugin();
    h.mutations.ENABLE_M = {
      mutate: vi.fn().mockRejectedValue(new Error('Missing required secrets')),
      loading: { value: false },
    };
    const wrapper = mountPage();

    await wrapper.get('[data-test="toggle-enabled"]').trigger('click');
    await flushPromises();

    expect(toast.error).toHaveBeenCalledWith('Cannot enable: missing required secrets');
  });

  it('sets a secret via the secrets section', async () => {
    setInstalledPlugin();
    const wrapper = mountPage();

    await wrapper.get('[data-test="set-secret"]').trigger('click');
    await flushPromises();

    expect(h.mutations.SET_SECRET_M?.mutate).toHaveBeenCalledWith({
      pluginId: PLUGIN_ID,
      key: 'API_KEY',
      value: 'xyz',
    });
  });

  it('blocks saving when required settings are missing', async () => {
    setInstalledPlugin({
      manifest: {
        ui: {
          forms: {
            server: [
              {
                id: 'main',
                title: 'Main',
                fields: [{ key: 'endpoint', label: 'Endpoint', type: 'text', validation: { required: true } }],
              },
            ],
          },
        },
      },
    });
    const wrapper = mountPage();

    await wrapper.get('[data-test="save-settings"]').trigger('click');
    await flushPromises();

    expect(wrapper.findComponent({ name: 'PluginSettingsSection' }).props('errors')).toEqual({
      endpoint: 'Endpoint is required',
    });
  });

  it('saves non-secret settings separately from secrets', async () => {
    setInstalledPlugin({
      manifest: {
        ui: {
          forms: {
            server: [
              {
                id: 'main',
                title: 'Main',
                fields: [
                  { key: 'endpoint', label: 'Endpoint', type: 'text' },
                  { key: 'apiKey', label: 'API Key', type: 'secret' },
                ],
              },
            ],
          },
        },
      },
    });
    const wrapper = mountPage();

    await wrapper.findComponent({ name: 'PluginSettingsSection' }).vm.$emit('update:modelValue', {
      endpoint: 'https://example.com',
      apiKey: 'secret-value',
    });
    await wrapper.get('[data-test="save-settings"]').trigger('click');
    await flushPromises();

    expect(h.mutations.SET_SECRET_M?.mutate).toHaveBeenCalledWith({
      pluginId: PLUGIN_ID,
      key: 'apiKey',
      value: 'secret-value',
    });
  });

  it('saves non-secret settings through the enable mutation', async () => {
    setInstalledPlugin({
      manifest: {
        ui: {
          forms: {
            server: [
              {
                id: 'main',
                title: 'Main',
                fields: [
                  { key: 'endpoint', label: 'Endpoint', type: 'text' },
                  { key: 'apiKey', label: 'API Key', type: 'secret' },
                ],
              },
            ],
          },
        },
      },
    });
    const wrapper = mountPage();

    await wrapper.findComponent({ name: 'PluginSettingsSection' }).vm.$emit('update:modelValue', {
      endpoint: 'https://example.com',
      apiKey: 'secret-value',
    });
    await wrapper.get('[data-test="save-settings"]').trigger('click');
    await flushPromises();

    expect(h.mutations.ENABLE_M?.mutate).toHaveBeenCalledWith({
      pluginId: PLUGIN_ID,
      version: '1.0.0',
      enabled: true,
      settingsJson: {
        endpoint: 'https://example.com',
      },
    });
  });

  it('saves settings and secrets using the installed plugin slug, then refetches and clears secret values', async () => {
    setInstalledPlugin({
      plugin: {
        id: PLUGIN_ID,
        name: 'plugin-slug',
        displayName: 'My Plugin',
      },
      manifest: {
        ui: {
          forms: {
            server: [
              {
                id: 'main',
                title: 'Main',
                fields: [
                  { key: 'endpoint', label: 'Endpoint', type: 'text' },
                  { key: 'apiKey', label: 'API Key', type: 'secret' },
                ],
              },
            ],
          },
        },
      },
    });
    const wrapper = mountPage();

    await wrapper.findComponent({ name: 'PluginSettingsSection' }).vm.$emit(
      'update:modelValue',
      {
        endpoint: 'https://example.com',
        apiKey: 'secret-value',
      }
    );
    await wrapper.get('[data-test="save-settings"]').trigger('click');
    await flushPromises();

    expect(h.mutations.SET_SECRET_M?.mutate).toHaveBeenCalledWith({
      pluginId: 'plugin-slug',
      key: 'apiKey',
      value: 'secret-value',
    });
    expect(h.mutations.ENABLE_M?.mutate).toHaveBeenCalledWith({
      pluginId: 'plugin-slug',
      version: '1.0.0',
      enabled: true,
      settingsJson: {
        endpoint: 'https://example.com',
      },
    });
    expect(toast.success).toHaveBeenCalledWith('Settings saved successfully');
    expect(h.q.INSTALLED.refetch).toHaveBeenCalled();
    expect(h.q.SECRETS.refetch).toHaveBeenCalled();
    expect(
      wrapper.findComponent({ name: 'PluginSettingsSection' }).props(
        'modelValue'
      )
    ).toEqual({
      endpoint: 'https://example.com',
      apiKey: '',
    });
  });

  it('stops before saving non-secret settings when saving a secret fails', async () => {
    setInstalledPlugin({
      manifest: {
        ui: {
          forms: {
            server: [
              {
                id: 'main',
                title: 'Main',
                fields: [
                  { key: 'endpoint', label: 'Endpoint', type: 'text' },
                  { key: 'apiKey', label: 'API Key', type: 'secret' },
                ],
              },
            ],
          },
        },
      },
    });
    h.mutations.SET_SECRET_M = {
      mutate: vi.fn().mockRejectedValue(new Error('Secret rejected')),
      loading: { value: false },
    };
    const wrapper = mountPage();

    await wrapper.findComponent({ name: 'PluginSettingsSection' }).vm.$emit(
      'update:modelValue',
      {
        endpoint: 'https://example.com',
        apiKey: 'secret-value',
      }
    );
    await wrapper.get('[data-test="save-settings"]').trigger('click');
    await flushPromises();

    expect(h.mutations.ENABLE_M?.mutate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Failed to save settings: Secret rejected'
    );
    expect(
      wrapper.findComponent({ name: 'PluginSettingsSection' }).props(
        'modelValue'
      )
    ).toEqual({
      endpoint: 'https://example.com',
      apiKey: 'secret-value',
    });
  });

  it('keeps the settings section in a saving state while the save is in flight', async () => {
    setInstalledPlugin({
      manifest: {
        ui: {
          forms: {
            server: [
              {
                id: 'main',
                title: 'Main',
                fields: [{ key: 'endpoint', label: 'Endpoint', type: 'text' }],
              },
            ],
          },
        },
      },
    });
    const enableDeferred = deferred<Record<string, never>>();
    h.mutations.ENABLE_M = {
      mutate: vi.fn().mockReturnValue(enableDeferred.promise),
      loading: { value: false },
    };
    const wrapper = mountPage();

    await wrapper.findComponent({ name: 'PluginSettingsSection' }).vm.$emit(
      'update:modelValue',
      {
        endpoint: 'https://example.com',
      }
    );
    await wrapper.get('[data-test="save-settings"]').trigger('click');
    await flushPromises();

    expect(
      wrapper.findComponent({ name: 'PluginSettingsSection' }).props('saving')
    ).toBe(true);

    enableDeferred.resolve({});
    await flushPromises();

    expect(
      wrapper.findComponent({ name: 'PluginSettingsSection' }).props('saving')
    ).toBe(false);
  });
});
