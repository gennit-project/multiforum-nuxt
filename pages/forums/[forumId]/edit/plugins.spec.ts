import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PluginsPage from './plugins/index.vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref(null),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  })),
  useApolloClient: vi.fn(() => ({
    client: {
      refetchQueries: vi.fn(),
    },
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    error: ref(null),
    onDone: vi.fn(),
  })),
}));

vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => ({
    params: {
      forumId: 'test-channel',
    },
  })),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/components/FormRow.vue', () => ({
  default: {
    name: 'FormRow',
    props: ['sectionTitle', 'description'],
    template: '<div class="form-row"><slot name="content" /></div>',
  },
}));

vi.mock('@/components/plugins/PluginSettingsForm.vue', () => ({
  default: {
    name: 'PluginSettingsForm',
    props: ['sections', 'modelValue'],
    template: '<div class="plugin-settings-form" />',
  },
}));

describe('Forum Plugins Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return mount(PluginsPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          FormRow: {
            name: 'FormRow',
            template: '<div class="form-row"><slot name="content" /></div>',
            props: ['sectionTitle', 'description'],
          },
          PluginSettingsForm: {
            name: 'PluginSettingsForm',
            template: '<div class="plugin-settings-form" />',
            props: ['sections', 'modelValue'],
          },
        },
      },
    });
  };

  it('shows loading when channel settings are loading', () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref(null),
        loading: ref(true),
        error: ref(null),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref({ getInstalledPlugins: [] }),
        loading: ref(false),
      } as any);

    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Loading plugins...');
  });

  it('shows loading when installed plugins are loading', () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref({ channels: [{ displayName: 'Test', EnabledPluginsConnection: { edges: [] } }] }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref(null),
        loading: ref(true),
      } as any);

    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Loading plugins...');
  });

  it('shows error when channel query fails', () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref(null),
        loading: ref(false),
        error: ref({ message: 'Failed to load' }),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref({ getInstalledPlugins: [] }),
        loading: ref(false),
      } as any);

    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Error loading plugins: Failed to load');
  });

  it('shows warning when no server plugins are enabled', () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref({ channels: [{ displayName: 'Test', EnabledPluginsConnection: { edges: [] } }] }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref({ getInstalledPlugins: [] }),
        loading: ref(false),
      } as any);

    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('No Server Plugins Available');
  });

  it('shows orphaned plugin warning when channel has disabled server plugin', () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref({
          channels: [
            {
              displayName: 'Test',
              EnabledPluginsConnection: {
                edges: [
                  {
                    node: {
                      id: 'pv-1',
                      version: '1.0.0',
                      Plugin: { id: 'orphaned', name: 'Orphaned', displayName: 'Orphaned' },
                    },
                    properties: { settingsJson: {} },
                  },
                ],
              },
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref({
          getInstalledPlugins: [
            { plugin: { id: 'other', name: 'Other' }, enabled: true, version: '1.0.0' },
          ],
        }),
        loading: ref(false),
      } as any);

    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('no longer enabled on the server');
  });

  it('renders enabled plugin cards', () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref({ channels: [{ displayName: 'Test', EnabledPluginsConnection: { edges: [] } }] }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref({
          getInstalledPlugins: [
            {
              plugin: { id: 'plugin-1', name: 'Plugin One', displayName: 'Plugin One' },
              enabled: true,
              version: '1.0.0',
              manifest: { ui: { forms: { channel: [] } } },
            },
          ],
        }),
        loading: ref(false),
      } as any);

    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Plugin One');
  });

  it('shows enabled badge when plugin is enabled for forum', () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref({
          channels: [
            {
              displayName: 'Test',
              EnabledPluginsConnection: {
                edges: [
                  {
                    node: {
                      id: 'pv-1',
                      version: '1.0.0',
                      Plugin: { id: 'plugin-1', name: 'Plugin One', displayName: 'Plugin One' },
                    },
                    properties: { settingsJson: { overrideProfiles: true } },
                  },
                ],
              },
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref({
          getInstalledPlugins: [
            {
              plugin: { id: 'plugin-1', name: 'Plugin One', displayName: 'Plugin One' },
              enabled: true,
              version: '1.0.0',
              manifest: {
                ui: { forms: { channel: [{ title: 'Channel Overrides', fields: [] }] } },
                settingsDefaults: { channel: {} },
              },
            },
          ],
        }),
        loading: ref(false),
    } as any);

    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Enabled');
    expect(wrapper.text()).not.toContain('Disabled');
  });

  it('renders plugin card when settingsJson is a string', async () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        result: ref({
          channels: [
            {
              displayName: 'Test',
              EnabledPluginsConnection: {
                edges: [
                  {
                    node: {
                      id: 'pv-1',
                      version: '1.0.0',
                      Plugin: { id: 'plugin-1', name: 'Plugin One', displayName: 'Plugin One' },
                    },
                    properties: {
                      settingsJson: '{"overrideProfiles":true,"botName":"Helper"}',
                    },
                  },
                ],
              },
            },
          ],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any)
      .mockReturnValueOnce({
        result: ref({
          getInstalledPlugins: [
            {
              plugin: { id: 'plugin-1', name: 'Plugin One', displayName: 'Plugin One' },
              enabled: true,
              version: '1.0.0',
              manifest: {
                ui: { forms: { channel: [{ title: 'Channel Overrides', fields: [] }] } },
                settingsDefaults: { channel: {} },
              },
            },
          ],
        }),
        loading: ref(false),
    } as any);

    const wrapper = createWrapper();
    await nextTick();
    expect(wrapper.text()).toContain('Plugin One');
    expect(wrapper.text()).toContain('Enabled');
  });
});
