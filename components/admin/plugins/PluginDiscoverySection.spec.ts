import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import PluginDiscoverySection from '@/components/admin/plugins/PluginDiscoverySection.vue';

const h = vi.hoisted(() => ({
  refresh: vi.fn(() => Promise.resolve()),
  loading: null as unknown,
  error: null as unknown,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: h.refresh, loading: h.loading, error: h.error }),
}));
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: h.toastSuccess, error: h.toastError }),
}));

const mountSection = () =>
  mount(PluginDiscoverySection, {
    global: { stubs: { FormRow: { props: ['sectionTitle'], template: '<div><slot name="content" /></div>' } } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.refresh = vi.fn(() => Promise.resolve());
  h.loading = ref(false);
  h.error = ref(null);
});

describe('PluginDiscoverySection', () => {
  it('shows the refresh button', () => {
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('Refresh Plugins');
  });

  it('refreshes plugins on click', async () => {
    const wrapper = mountSection();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(h.refresh).toHaveBeenCalled();
  });

  it('shows a success toast and emits refreshed', async () => {
    const wrapper = mountSection();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('refreshed')).toBeTruthy();
  });

  it('shows an error toast on failure', async () => {
    h.refresh = vi.fn(() => Promise.reject(new Error('nope')));
    const wrapper = mountSection();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(h.toastError).toHaveBeenCalled();
  });

  it('shows a refreshing state while loading', () => {
    h.loading = ref(true);
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('Refreshing...');
  });

  it('shows the mutation error message', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('Error refreshing plugins: boom');
  });
});
