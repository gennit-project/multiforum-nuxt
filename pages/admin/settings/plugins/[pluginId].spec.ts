import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import PluginDetailPage from './[pluginId].vue';

vi.stubGlobal('definePageMeta', vi.fn());

const PLUGIN_ID = 'my-plugin';

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { pluginId: PLUGIN_ID }, query: {} }),
}));

vi.mock('@/graphQLData/admin/queries', () => ({
  GET_AVAILABLE_PLUGINS: 'AVAILABLE',
  GET_INSTALLED_PLUGINS: 'INSTALLED',
  GET_SERVER_PLUGIN_SECRETS: 'SECRETS',
  GET_PLUGIN_DETAIL: 'DETAIL',
}));
vi.mock('@/graphQLData/admin/mutations', () => ({
  INSTALL_PLUGIN_VERSION: 'INSTALL_M',
  ENABLE_SERVER_PLUGIN: 'ENABLE_M',
  SET_SERVER_PLUGIN_SECRET: 'SET_SECRET_M',
}));

const h = vi.hoisted(() => ({
  q: {} as Record<string, { result: { value: unknown }; loading: { value: boolean }; error: { value: unknown }; refetch: () => void }>,
  mutations: {} as Record<string, { mutate: ReturnType<typeof vi.fn>; loading: { value: boolean } }>,
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.q = {
    AVAILABLE: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
    INSTALLED: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
    DETAIL: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
    SECRETS: { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
  };
  return {
    useQuery: (doc: string) =>
      h.q[doc] ?? { result: ref(null), loading: ref(false), error: ref(null), refetch: vi.fn() },
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
  PluginStatusCards: { name: 'PluginStatusCards', props: ['isEnabled', 'canEnable', 'enabling'], emits: ['toggle-enabled'], template: '<div class="status-cards" />' },
  PluginUpdateBanner: sectionStub('PluginUpdateBanner'),
  PluginInstallSection: { name: 'PluginInstallSection', emits: ['install', 'update:modelValue'], template: '<div class="install-section" />' },
  PluginSecretsSection: { name: 'PluginSecretsSection', props: ['secrets'], emits: ['set-secret'], template: '<div class="secrets-section" />' },
  PluginSettingsSection: { name: 'PluginSettingsSection', emits: ['save'], template: '<div class="settings-section" />' },
  PluginManifestSection: sectionStub('PluginManifestSection'),
  PluginReadmeSection: sectionStub('PluginReadmeSection'),
  ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="error-banner">{{ text }}</div>' },
};

const mountPage = () => mountWithDefaults(PluginDetailPage, { global: { stubs } });

const setInstalled = (enabled: boolean) => {
  h.q.AVAILABLE.result.value = {
    plugins: [
      { id: PLUGIN_ID, name: PLUGIN_ID, displayName: 'My Plugin', Versions: [{ version: '1.0.0' }] },
    ],
  };
  h.q.INSTALLED.result.value = {
    getInstalledPlugins: [
      { plugin: { id: PLUGIN_ID, name: PLUGIN_ID }, enabled, installedVersion: '1.0.0' },
    ],
  };
  h.q.SECRETS.result.value = { getServerPluginSecrets: [] };
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(h.q)) {
    h.q[k].result.value = null;
    h.q[k].loading.value = false;
    h.q[k].error.value = null;
  }
  h.mutations = {};
});

describe('Plugin detail page', () => {
  it('shows the initial loading state', () => {
    h.q.AVAILABLE.loading.value = true; // and no result yet
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
    setInstalled(true);
    const wrapper = mountPage();
    expect(wrapper.findComponent({ name: 'PluginDetailHeader' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'PluginStatusCards' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'PluginStatusCards' }).props('isEnabled')).toBe(true);
    expect(wrapper.findComponent({ name: 'PluginSecretsSection' }).exists()).toBe(true);
  });

  it('hides the installed-only sections for an uninstalled plugin', () => {
    h.q.AVAILABLE.result.value = {
      plugins: [{ id: PLUGIN_ID, name: PLUGIN_ID, displayName: 'My Plugin' }],
    };
    h.q.INSTALLED.result.value = { getInstalledPlugins: [] };
    const wrapper = mountPage();
    expect(wrapper.findComponent({ name: 'PluginStatusCards' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'PluginInstallSection' }).exists()).toBe(true);
  });

  it('installs the plugin when the install section requests it', async () => {
    setInstalled(false);
    const wrapper = mountPage();
    await wrapper.findComponent({ name: 'PluginInstallSection' }).vm.$emit('install');
    await Promise.resolve();
    expect(h.mutations['INSTALL_M']?.mutate).toHaveBeenCalled();
  });

  it('toggles enabled state via the status cards', async () => {
    setInstalled(true);
    const wrapper = mountPage();
    await wrapper.findComponent({ name: 'PluginStatusCards' }).vm.$emit('toggle-enabled', false);
    await Promise.resolve();
    expect(h.mutations['ENABLE_M']?.mutate).toHaveBeenCalled();
  });

  it('sets a secret via the secrets section', async () => {
    setInstalled(true);
    const wrapper = mountPage();
    await wrapper.findComponent({ name: 'PluginSecretsSection' }).vm.$emit('set-secret', 'API_KEY', 'xyz');
    await Promise.resolve();
    expect(h.mutations['SET_SECRET_M']?.mutate).toHaveBeenCalled();
  });
});
