import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import RegistriesPage from './registries.vue';

vi.stubGlobal('definePageMeta', vi.fn());

// Controllable Apollo refs (real Vue refs so the immediate watch reacts).
const h = vi.hoisted(() => ({
  resultRef: null as unknown as { value: unknown },
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
  saveLoadingRef: null as unknown as { value: boolean },
  saveErrorRef: null as unknown as { value: unknown },
  mutate: vi.fn(),
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.resultRef = ref(null);
  h.loadingRef = ref(false);
  h.errorRef = ref(null);
  h.saveLoadingRef = ref(false);
  h.saveErrorRef = ref(null);
  return {
    useQuery: () => ({
      result: h.resultRef,
      loading: h.loadingRef,
      error: h.errorRef,
      onResult: vi.fn(),
      onError: vi.fn(),
      refetch: vi.fn(),
    }),
    useMutation: () => ({
      mutate: h.mutate,
      loading: h.saveLoadingRef,
      error: h.saveErrorRef,
      onDone: vi.fn(),
      onError: vi.fn(),
    }),
  };
});

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }));
vi.mock('@/config', () => ({ config: { serverName: 'test-server' } }));
vi.mock('@/graphQLData/admin/queries', () => ({ GET_SERVER_CONFIG: 'q' }));
vi.mock('@/graphQLData/admin/mutations', () => ({ UPDATE_SERVER_CONFIG: 'm' }));

const stubs = {
  FormRow: {
    name: 'FormRow',
    props: ['sectionTitle'],
    template: '<div>{{ sectionTitle }}<slot name="content" /></div>',
  },
  PluginDiscoverySection: { template: '<div />' },
};

const mountRegistries = () =>
  mountWithDefaults(RegistriesPage, { global: { stubs } });

const button = (
  wrapper: ReturnType<typeof mountRegistries>,
  label: string
) => wrapper.findAll('button').find((b) => b.text().includes(label));

beforeEach(() => {
  vi.clearAllMocks();
  h.resultRef.value = null;
  h.loadingRef.value = false;
  h.errorRef.value = null;
  h.saveLoadingRef.value = false;
  h.saveErrorRef.value = null;
});

const withRegistries = (registries: string[]) => {
  h.resultRef.value = { serverConfigs: [{ pluginRegistries: registries }] };
};

describe('Plugin registries page', () => {
  it('shows a loading state while the server config loads', () => {
    h.loadingRef.value = true;
    expect(mountRegistries().text()).toContain('Loading registries');
  });

  it('shows an error state when the query fails', () => {
    h.errorRef.value = { message: 'boom' };
    expect(mountRegistries().text()).toContain('Error loading registries: boom');
  });

  it('renders the registries returned by the query', () => {
    withRegistries(['https://a.example.com']);
    const wrapper = mountRegistries();
    expect(wrapper.text()).toContain('Current Registries (1)');
    expect(wrapper.text()).toContain('https://a.example.com');
  });

  it('shows the empty message when no registries are configured', () => {
    withRegistries([]);
    expect(mountRegistries().text()).toContain(
      'No plugin registries configured yet.'
    );
  });

  it('adds a registry from the input', async () => {
    withRegistries([]);
    const wrapper = mountRegistries();
    await wrapper.get('input[type="url"]').setValue('https://new.example.com');
    await button(wrapper, 'Add')!.trigger('click');
    expect(wrapper.text()).toContain('Current Registries (1)');
    expect(wrapper.text()).toContain('https://new.example.com');
  });

  it('removes a registry', async () => {
    withRegistries(['https://a.example.com']);
    const wrapper = mountRegistries();
    await button(wrapper, 'Remove')!.trigger('click');
    expect(wrapper.text()).toContain('Current Registries (0)');
  });

  it('saves the registries and toasts on success', async () => {
    h.mutate.mockResolvedValue({ data: {} });
    withRegistries([]);
    const wrapper = mountRegistries();
    await wrapper.get('input[type="url"]').setValue('https://new.example.com');
    await button(wrapper, 'Add')!.trigger('click');
    await button(wrapper, 'Save Registries')!.trigger('click');
    await Promise.resolve();
    expect(h.mutate).toHaveBeenCalledWith({
      serverName: 'test-server',
      input: { pluginRegistries: ['https://new.example.com'] },
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('toasts an error when saving fails', async () => {
    h.mutate.mockRejectedValue(new Error('server down'));
    withRegistries([]);
    const wrapper = mountRegistries();
    await wrapper.get('input[type="url"]').setValue('https://new.example.com');
    await button(wrapper, 'Add')!.trigger('click');
    await button(wrapper, 'Save Registries')!.trigger('click');
    await Promise.resolve();
    await Promise.resolve();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('server down')
    );
  });
});
