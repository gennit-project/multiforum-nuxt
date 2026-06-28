import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import ForumPluginDetailPage from './[pluginId].vue';

const h = vi.hoisted(() => ({
  channel: null as unknown as { result: { value: unknown }; loading: { value: boolean }; error: { value: unknown } },
  installed: null as unknown as { result: { value: unknown }; loading: { value: boolean }; error: { value: unknown } },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', pluginId: 'scanner' } }),
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.channel = { result: ref(null), loading: ref(false), error: ref(null) };
  h.installed = { result: ref(null), loading: ref(false), error: ref(null) };
  return {
    useApolloClient: () => ({ client: {} }),
    useMutation: () => ({
      mutate: vi.fn(),
      loading: ref(false),
      error: ref(null),
      onDone: vi.fn(),
      onError: vi.fn(),
    }),
    useQuery: (doc: string) =>
      doc === 'CHANNEL_SETTINGS'
        ? h.channel
        : doc === 'INSTALLED'
          ? h.installed
          : { result: ref(null), loading: ref(false), error: ref(null) },
  };
});

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/graphQLData/admin/queries', () => ({ GET_INSTALLED_PLUGINS: 'INSTALLED' }));
vi.mock('@/graphQLData/channel/queries', () => ({
  GET_CHANNEL: 'CHANNEL',
  GET_CHANNEL_PLUGIN_SETTINGS: 'CHANNEL_SETTINGS',
}));
vi.mock('@/graphQLData/channel/mutations', () => ({ UPDATE_CHANNEL_ENABLED_PLUGINS: 'UPDATE' }));

const stubs = {
  PluginSettingsForm: { name: 'PluginSettingsForm', template: '<div class="settings-form" />' },
  BotProfilesEditor: { name: 'BotProfilesEditor', template: '<div class="bot-editor" />' },
};

const mountPage = () => mountWithDefaults(ForumPluginDetailPage, { global: { stubs } });

const channelLoaded = () => {
  h.channel.result.value = {
    channels: [{ displayName: 'Cats', EnabledPluginsConnection: { edges: [] } }],
  };
};

const installEnabledScanner = () => {
  h.installed.result.value = {
    getInstalledPlugins: [
      {
        plugin: { id: 'scanner', name: 'scanner', displayName: 'Scanner' },
        version: '1.0.0',
        enabled: true,
        settings: '{}',
      },
    ],
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.channel.result.value = null;
  h.channel.loading.value = false;
  h.channel.error.value = null;
  h.installed.result.value = null;
  h.installed.loading.value = false;
  h.installed.error.value = null;
});

describe('Forum plugin detail page', () => {
  it('shows the loading state', () => {
    h.channel.loading.value = true;
    expect(mountPage().text()).toContain('Loading plugin details');
  });

  it('shows a not-found message when the plugin is not enabled for the forum', () => {
    channelLoaded();
    h.installed.result.value = { getInstalledPlugins: [] };
    expect(mountPage().text()).toContain('Plugin not found');
  });

  it('renders the plugin detail (not the loading/not-found states) when enabled', () => {
    channelLoaded();
    installEnabledScanner();
    const wrapper = mountPage();
    expect(wrapper.text()).not.toContain('Loading plugin details');
    expect(wrapper.text()).not.toContain('Plugin not found');
    // The header renders the plugin's display name.
    expect(wrapper.find('h1').text()).toContain('Scanner');
  });
});
