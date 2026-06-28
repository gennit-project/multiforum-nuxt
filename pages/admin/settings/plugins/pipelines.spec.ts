import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import PipelinesPage from './pipelines.vue';

vi.stubGlobal('definePageMeta', vi.fn());

const h = vi.hoisted(() => ({
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
  resultRef: null as unknown as { value: unknown },
  refetch: null as unknown as ReturnType<typeof vi.fn>,
  mutate: null as unknown as ReturnType<typeof vi.fn>,
  available: [] as unknown[],
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.loadingRef = ref(false);
  h.errorRef = ref(null);
  h.resultRef = ref(null);
  h.refetch = vi.fn();
  h.mutate = vi.fn();
  return {
    useQuery: () => ({
      result: h.resultRef,
      loading: h.loadingRef,
      error: h.errorRef,
      refetch: h.refetch,
    }),
    useMutation: () => ({ mutate: h.mutate, loading: ref(false) }),
  };
});

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }));

vi.mock('@/utils/pipelineUtils', () => ({
  parsePipelinesFromBackend: () => undefined,
  transformPipelinesForMutation: (c: unknown) => c,
  getAvailablePluginsFromInstalled: () => h.available,
}));
vi.mock('@/graphQLData/admin/queries', () => ({
  GET_PLUGIN_PIPELINES: 'q1',
  GET_INSTALLED_PLUGINS: 'q2',
}));
vi.mock('@/graphQLData/admin/mutations', () => ({ UPDATE_PLUGIN_PIPELINES: 'm' }));

const stubs = {
  FormRow: { name: 'FormRow', template: '<div><slot name="content" /><slot /></div>' },
  PluginPipelineEditor: {
    name: 'PluginPipelineEditor',
    props: ['initialConfig', 'availablePlugins', 'saving'],
    emits: ['save'],
    template: '<div class="pipeline-editor" />',
  },
};

const mountPage = () => mountWithDefaults(PipelinesPage, { global: { stubs } });

beforeEach(() => {
  vi.clearAllMocks();
  h.loadingRef.value = false;
  h.errorRef.value = null;
  h.resultRef.value = null;
  h.available = [];
});

describe('Plugin pipelines page', () => {
  it('shows the loading state', () => {
    h.loadingRef.value = true;
    expect(mountPage().text()).toContain('Loading pipeline configuration');
  });

  it('shows the error state', () => {
    h.errorRef.value = { message: 'boom' };
    expect(mountPage().text()).toContain('Error loading pipelines: boom');
  });

  it('warns when there are no enabled plugins', () => {
    h.available = [];
    const wrapper = mountPage();
    expect(wrapper.text()).toContain('No Enabled Plugins');
  });

  it('renders the pipeline editor when plugins are available', () => {
    h.available = [{ id: 'p1', name: 'Scanner' }];
    const wrapper = mountPage();
    expect(wrapper.text()).not.toContain('No Enabled Plugins');
    expect(wrapper.findComponent({ name: 'PluginPipelineEditor' }).exists()).toBe(
      true
    );
  });

  it('saves the pipeline config and toasts on success', async () => {
    h.available = [{ id: 'p1' }];
    h.mutate.mockResolvedValue({ data: {} });
    const wrapper = mountPage();
    await wrapper
      .findComponent({ name: 'PluginPipelineEditor' })
      .vm.$emit('save', { steps: [] });
    await Promise.resolve();
    expect(h.mutate).toHaveBeenCalledWith({ pipelines: { steps: [] } });
    expect(toast.success).toHaveBeenCalled();
    expect(h.refetch).toHaveBeenCalled();
  });

  it('toasts an error when saving fails', async () => {
    h.available = [{ id: 'p1' }];
    h.mutate.mockRejectedValue(new Error('nope'));
    const wrapper = mountPage();
    await wrapper
      .findComponent({ name: 'PluginPipelineEditor' })
      .vm.$emit('save', { steps: [] });
    await Promise.resolve();
    await Promise.resolve();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('nope'));
  });
});
