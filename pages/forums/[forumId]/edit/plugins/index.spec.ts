import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { nextTick, ref } from 'vue';
import ForumPluginsPage from './index.vue';

const h = vi.hoisted(() => ({
  channelResult: null as unknown as { value: any },
  channelLoading: null as unknown as { value: boolean },
  channelError: null as unknown as { value: any },
  installedResult: null as unknown as { value: any },
  installedLoading: null as unknown as { value: boolean },
  mutate: vi.fn(),
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
h.mutationError = ref(null);

vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { refetchQueries: h.refetchQueries } }),
  useMutation: () => ({
    mutate: h.mutate,
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

const mountPage = () => mountWithDefaults(ForumPluginsPage);

const setChannel = (edges: unknown[] = []) => {
  h.channelResult.value = {
    channels: [
      {
        displayName: 'Cats',
        EnabledPluginsConnection: { edges },
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
  h.mutationError.value = null;
});

describe('Forum plugins page', () => {
  it('shows the loading state', () => {
    h.channelLoading.value = true;
    expect(mountPage().text()).toContain('Loading plugins');
  });

  it('shows the query error state', () => {
    h.channelError.value = { message: 'boom' };
    expect(mountPage().text()).toContain('boom');
  });

  it('shows the no-server-plugins state when none are installed server-wide', () => {
    setChannel();
    h.installedResult.value = { getInstalledPlugins: [] };
    expect(mountPage().text()).toContain('No Server Plugins Available');
  });

  it('shows orphaned channel plugins that are no longer installed on the server', () => {
    setChannel([
      {
        node: {
          id: 'edge-1',
          version: '1.0.0',
          Plugin: { id: 'scanner', name: 'scanner', displayName: 'Scanner' },
        },
      },
    ]);
    h.installedResult.value = { getInstalledPlugins: [] };
    expect(mountPage().text()).toContain('Some plugins are enabled for this forum');
  });

  it('lists a consolidated plugin card and enables the plugin when the checkbox is checked', async () => {
    setChannel();
    h.installedResult.value = {
      getInstalledPlugins: [
        {
          plugin: {
            id: 'scanner',
            name: 'scanner',
            displayName: 'Scanner',
            description: 'Scans content',
          },
          version: '1.0.0',
          enabled: true,
          latestVersion: '1.0.0',
          availableVersions: ['1.0.0'],
          manifest: { settingsDefaults: { channel: { strict: true } } },
        },
      ],
    };

    const wrapper = mountPage();
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await nextTick();

    expect({
      text: wrapper.text().includes('Scanner'),
      mutate: h.mutate.mock.calls[0]?.[0],
      success: h.toastSuccess.mock.calls[0]?.[0],
    }).toEqual({
      text: true,
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
});
