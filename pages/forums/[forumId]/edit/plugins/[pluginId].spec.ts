import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { nextTick, ref } from 'vue';
import ForumPluginDetailPage from './[pluginId].vue';

const h = vi.hoisted(() => ({
  channelResult: null as unknown as { value: any },
  channelLoading: null as unknown as { value: boolean },
  channelError: null as unknown as { value: any },
  installedResult: null as unknown as { value: any },
  installedLoading: null as unknown as { value: boolean },
  mutate: vi.fn(),
  mutationLoading: null as unknown as { value: boolean },
  mutationError: null as unknown as { value: any },
  refetchChannel: vi.fn(),
  refetchQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

h.channelResult = ref(null);
h.channelLoading = ref(false);
h.channelError = ref(null);
h.installedResult = ref(null);
h.installedLoading = ref(false);
h.mutationLoading = ref(false);
h.mutationError = ref(null);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', pluginId: 'scanner' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { refetchQueries: h.refetchQueries } }),
  useMutation: () => ({
    mutate: h.mutate,
    loading: h.mutationLoading,
    error: h.mutationError,
    onDone: vi.fn(),
  }),
  useQuery: (doc: string) =>
    doc === 'CHANNEL_SETTINGS'
      ? {
          result: h.channelResult,
          loading: h.channelLoading,
          error: h.channelError,
          refetch: h.refetchChannel,
        }
      : {
          result: h.installedResult,
          loading: h.installedLoading,
          error: ref(null),
        },
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: h.toastSuccess, error: h.toastError }),
}));
vi.mock('@/graphQLData/admin/queries', () => ({ GET_INSTALLED_PLUGINS: 'INSTALLED' }));
vi.mock('@/graphQLData/channel/queries', () => ({
  GET_CHANNEL: 'CHANNEL',
  GET_CHANNEL_PLUGIN_SETTINGS: 'CHANNEL_SETTINGS',
}));
vi.mock('@/graphQLData/channel/mutations', () => ({ UPDATE_CHANNEL_ENABLED_PLUGINS: 'UPDATE' }));

const stubs = {
  FormRow: {
    name: 'FormRow',
    props: ['sectionTitle'],
    template: '<section><h2>{{ sectionTitle }}</h2><slot name="content" /></section>',
  },
  PluginSettingsForm: {
    name: 'PluginSettingsForm',
    props: ['modelValue'],
    emits: ['update:model-value'],
    template: '<button class="settings-form" @click="$emit(\'update:model-value\', { strict: false })" />',
  },
  BotProfilesEditor: {
    name: 'BotProfilesEditor',
    props: ['profiles'],
    emits: ['update:profiles'],
    template: '<button class="bot-editor" @click="$emit(\'update:profiles\', [{ id: \'p1\', label: \'Bot\', prompt: \'Hi\' }])" />',
  },
};

const mountPage = () => mountWithDefaults(ForumPluginDetailPage, { global: { stubs } });

const setChannel = (edges: unknown[] = [], bots: unknown[] = []) => {
  h.channelResult.value = {
    channels: [
      {
        displayName: 'Cats',
        EnabledPluginsConnection: { edges },
        Bots: bots,
      },
    ],
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.channelResult.value = null;
  h.channelLoading.value = false;
  h.channelError.value = null;
  h.installedResult.value = null;
  h.installedLoading.value = false;
  h.mutationLoading.value = false;
  h.mutationError.value = null;
});

describe('Forum plugin detail page', () => {
  it('shows the loading state', () => {
    h.channelLoading.value = true;
    expect(mountPage().text()).toContain('Loading plugin details');
  });

  it('shows the not-found state when the server plugin is unavailable', () => {
    setChannel();
    h.installedResult.value = { getInstalledPlugins: [] };
    expect(mountPage().text()).toContain('Plugin not found');
  });

  it('enables a disabled plugin from the CTA card', async () => {
    setChannel();
    h.installedResult.value = {
      getInstalledPlugins: [
        {
          plugin: {
            id: 'scanner',
            name: 'scanner',
            displayName: 'Scanner',
            description: 'Scans content',
            tags: [],
          },
          version: '1.0.0',
          enabled: true,
          manifest: {
            settingsDefaults: {
              channel: { strict: true },
            },
          },
        },
      ],
    };

    const wrapper = mountPage();
    await wrapper.get('button.bg-green-700').trigger('click');
    await nextTick();

    expect({
      mutate: h.mutate.mock.calls[0]?.[0],
      success: h.toastSuccess.mock.calls[0]?.[0],
    }).toEqual({
      mutate: {
        channelUniqueName: 'cats',
        enabledPlugins: [
          {
            connect: [
              {
                where: {
                  node: {
                    Plugin: { id: 'scanner' },
                    version: '1.0.0',
                  },
                },
                edge: {
                  enabled: true,
                  settingsJson: JSON.stringify({ strict: true }),
                },
              },
            ],
          },
        ],
      },
      success: 'Plugin enabled for this forum.',
    });
  });

  it('saves channel settings after the settings form emits an update', async () => {
    setChannel([
      {
        node: {
          version: '1.0.0',
          Plugin: { id: 'scanner' },
        },
        properties: {
          settingsJson: '{"strict":true}',
        },
      },
    ]);
    h.installedResult.value = {
      getInstalledPlugins: [
        {
          plugin: {
            id: 'scanner',
            name: 'scanner',
            displayName: 'Scanner',
            tags: [],
          },
          version: '1.0.0',
          enabled: true,
          manifest: {
            ui: {
              forms: {
                channel: [
                  {
                    id: 'general',
                    title: 'General',
                    fields: [{ key: 'strict', type: 'boolean', label: 'Strict' }],
                  },
                ],
              },
            },
            settingsDefaults: {
              channel: { strict: true },
            },
          },
        },
      ],
    };

    const wrapper = mountPage();
    await wrapper.findComponent({ name: 'PluginSettingsForm' }).trigger('click');
    await wrapper.get('button.bg-orange-700').trigger('click');

    expect(h.mutate.mock.calls[0]?.[0]).toEqual({
      channelUniqueName: 'cats',
      enabledPlugins: [
        {
          where: {
            node: {
              Plugin: { id: 'scanner' },
              version: '1.0.0',
            },
          },
          update: {
            edge: {
              settingsJson: JSON.stringify({ strict: false }),
            },
          },
        },
      ],
    });
  });

  it('shows the bot-name warning when a bot plugin has no configured server bot name', () => {
    setChannel();
    h.installedResult.value = {
      getInstalledPlugins: [
        {
          plugin: {
            id: 'scanner',
            name: 'scanner',
            displayName: 'Scanner',
            tags: ['bot'],
          },
          version: '1.0.0',
          enabled: true,
          manifest: {
            ui: {
              forms: {
                channel: [],
              },
            },
          },
        },
      ],
    };

    expect(mountPage().text()).toContain('Bot name not configured');
  });
});
