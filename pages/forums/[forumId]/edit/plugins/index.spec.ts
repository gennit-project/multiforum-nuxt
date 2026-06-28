import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import ForumPluginsPage from './index.vue';

const h = vi.hoisted(() => ({
  channel: null as unknown as { result: { value: unknown }; loading: { value: boolean }; error: { value: unknown } },
  installed: null as unknown as { result: { value: unknown }; loading: { value: boolean }; error: { value: unknown } },
}));

vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

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

const mountPage = () => mountWithDefaults(ForumPluginsPage);

const channelLoaded = () => {
  h.channel.result.value = {
    channels: [{ displayName: 'Cats', EnabledPluginsConnection: { edges: [] } }],
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

describe('Forum plugins page', () => {
  it('shows the loading state', () => {
    h.channel.loading.value = true;
    expect(mountPage().text()).toContain('Loading plugins');
  });

  it('shows the error state when the channel query fails', () => {
    h.channel.error.value = { message: 'boom' };
    expect(mountPage().text()).toContain('boom');
  });

  it('shows the empty state when no plugins are enabled', () => {
    channelLoaded();
    h.installed.result.value = { getInstalledPlugins: [] };
    const wrapper = mountPage();
    expect(wrapper.text()).not.toContain('Scanner');
  });

  it('lists an enabled plugin for the forum', () => {
    channelLoaded();
    h.installed.result.value = {
      getInstalledPlugins: [
        {
          plugin: { id: 'p1', name: 'scanner', displayName: 'Scanner' },
          version: '1.0.0',
          enabled: true,
          latestVersion: '1.0.0',
          availableVersions: ['1.0.0'],
        },
      ],
    };
    expect(mountPage().text()).toContain('Scanner');
  });
});
