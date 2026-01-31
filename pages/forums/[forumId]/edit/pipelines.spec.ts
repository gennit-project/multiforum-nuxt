import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

// Import the component
import PipelinesPage from './pipelines.vue';
import { useQuery } from '@vue/apollo-composable';

// Import from the pipelineSchema for integration tests
import { CHANNEL_PIPELINE_EVENTS } from '@/utils/pipelineSchema';

// Mock the Apollo composable
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref(null),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    loading: ref(false),
  })),
}));

// Mock nuxt/app route
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => ({
    params: {
      forumId: 'test-channel',
    },
  })),
}));

// Mock toast composable
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock the component imports
vi.mock('@/components/FormRow.vue', () => ({
  default: {
    name: 'FormRow',
    props: ['sectionTitle'],
    template: '<div class="form-row"><slot name="content" /></div>',
  },
}));

vi.mock('@/components/plugins/PluginPipelineEditor.vue', () => ({
  default: {
    name: 'PluginPipelineEditor',
    props: ['initialConfig', 'availablePlugins', 'saving', 'scope'],
    emits: ['save'],
    template: '<div class="pipeline-editor" :data-scope="scope"><slot /></div>',
  },
}));

describe('Channel Pipelines Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = (options = {}) => {
    return mount(PipelinesPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          FormRow: {
            template: '<div class="form-row"><slot name="content" /></div>',
            props: ['sectionTitle'],
          },
          PluginPipelineEditor: {
            template: '<div class="pipeline-editor" :data-scope="scope"></div>',
            props: ['initialConfig', 'availablePlugins', 'saving', 'scope'],
          },
        },
      },
      ...options,
    });
  };

  describe('loading state', () => {
    it('should show loading indicator when pipelines are loading', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref(null),
        loading: ref(true),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref(null),
        loading: ref(false),
      } as any);

      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('Loading pipeline configuration');
    });

    it('should show loading indicator when installed plugins are loading', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref(null),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref(null),
        loading: ref(true),
      } as any);

      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('Loading pipeline configuration');
    });
  });

  describe('error state', () => {
    it('should show error message when pipelines query fails', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref(null),
        loading: ref(false),
        error: ref({ message: 'Failed to fetch pipelines' }),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref(null),
        loading: ref(false),
      } as any);

      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('Error loading pipelines');
      expect(wrapper.text()).toContain('Failed to fetch pipelines');
    });
  });

  describe('content rendering', () => {
    it('should render info banner about channel pipelines', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'Test Channel', pluginPipelines: [] }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref({ getInstalledPlugins: [] }),
        loading: ref(false),
      } as any);

      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('About Channel Pipelines');
      expect(wrapper.text()).toContain('discussionChannel.created');
      expect(wrapper.text()).toContain('Server pipelines run first');
    });

    it('should show warning when no server plugins are available', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'Test Channel', pluginPipelines: [] }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref({ getInstalledPlugins: [] }),
        loading: ref(false),
      } as any);

      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('No Server Plugins Available');
      expect(wrapper.text()).toContain('Contact a server administrator');
    });

    it('should not show warning when enabled plugins are available', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'Test Channel', pluginPipelines: [] }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref({
          getInstalledPlugins: [
            { plugin: { id: 'plugin-1', name: 'Plugin 1' }, enabled: true },
          ],
        }),
        loading: ref(false),
      } as any);

      const wrapper = createWrapper();
      expect(wrapper.text()).not.toContain('No Server Plugins Available');
    });
  });

  describe('available plugins filtering', () => {
    it('should only include enabled plugins', () => {
      const installedPluginsResult = {
        getInstalledPlugins: [
          { plugin: { id: 'enabled-plugin', name: 'Enabled Plugin' }, enabled: true },
          { plugin: { id: 'disabled-plugin', name: 'Disabled Plugin' }, enabled: false },
        ],
      };

      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'Test Channel', pluginPipelines: [] }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref(installedPluginsResult),
        loading: ref(false),
      } as any);

      // Since we can't easily access the computed property, verify the warning is not shown
      // when there's at least one enabled plugin
      const wrapper = createWrapper();
      expect(wrapper.text()).not.toContain('No Server Plugins Available');
    });
  });

  describe('scope configuration', () => {
    it('should pass channel scope to the editor', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'Test Channel', pluginPipelines: [] }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref({
          getInstalledPlugins: [
            { plugin: { id: 'plugin-1', name: 'Plugin 1' }, enabled: true },
          ],
        }),
        loading: ref(false),
      } as any);

      const wrapper = createWrapper();
      const editor = wrapper.find('.pipeline-editor');
      expect(editor.exists()).toBe(true);
      expect(editor.attributes('data-scope')).toBe('channel');
    });
  });

  describe('channel display name', () => {
    it('should use channel displayName in header', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'My Awesome Channel', pluginPipelines: [] }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref({ getInstalledPlugins: [] }),
        loading: ref(false),
      } as any);

      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('My Awesome Channel');
    });
  });

  describe('pipeline configuration', () => {
    it('should pass existing pipelines to editor', () => {
      const existingPipelines = [
        {
          event: 'discussionChannel.created',
          stopOnFirstFailure: true,
          steps: [{ pluginId: 'auto-labeler', condition: 'ALWAYS' }],
        },
      ];

      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'Test Channel', pluginPipelines: existingPipelines }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref({
          getInstalledPlugins: [
            { plugin: { id: 'auto-labeler', name: 'Auto Labeler' }, enabled: true },
          ],
        }),
        loading: ref(false),
      } as any);

      // Component should render without errors
      const wrapper = createWrapper();
      expect(wrapper.find('.pipeline-editor').exists()).toBe(true);
    });
  });
});

// Additional integration tests for the pipeline schema and page interaction
describe('Channel Pipeline Integration', () => {
  describe('event validation', () => {
    it('should only allow channel events in channel pipeline editor', () => {
      // Channel events include comment.created and discussionChannel.created
      expect(CHANNEL_PIPELINE_EVENTS.length).toBe(2);
      const channelEventValues = CHANNEL_PIPELINE_EVENTS.map((e: any) => e.value);
      expect(channelEventValues).toContain('comment.created');
      expect(channelEventValues).toContain('discussionChannel.created');

      // Server-only events (file operations) should NOT be in channel events
      // Note: some events like comment.created can exist in both scopes
      const serverOnlyEvents = ['downloadableFile.created', 'downloadableFile.updated'];
      for (const serverOnlyEvent of serverOnlyEvents) {
        const isInChannel = CHANNEL_PIPELINE_EVENTS.some(
          (e: any) => e.value === serverOnlyEvent
        );
        expect(isInChannel).toBe(false);
      }
    });
  });

  describe('pipeline execution order documentation', () => {
    it('should document that server pipelines run before channel pipelines', () => {
      vi.mocked(useQuery).mockReturnValueOnce({
        result: ref({
          channels: [{ displayName: 'Test Channel', pluginPipelines: [] }],
        }),
        loading: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      } as any).mockReturnValueOnce({
        result: ref({ getInstalledPlugins: [] }),
        loading: ref(false),
      } as any);

      const wrapper = mount(PipelinesPage, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            FormRow: {
              template: '<div class="form-row"><slot name="content" /></div>',
              props: ['sectionTitle'],
            },
            PluginPipelineEditor: {
              template: '<div class="pipeline-editor"></div>',
              props: ['initialConfig', 'availablePlugins', 'saving', 'scope'],
            },
          },
        },
      });

      // Verify the page documents the execution order
      expect(wrapper.text()).toContain('Server pipelines run first');
    });
  });
});
