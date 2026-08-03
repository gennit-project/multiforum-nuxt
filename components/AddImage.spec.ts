import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import AddImage from '@/components/AddImage.vue';

const h = vi.hoisted(() => ({
  available: null as unknown as { value: boolean },
  capability: null as unknown as { value: Record<string, unknown> },
  error: null as unknown as { value: Error | null },
  loading: null as unknown as { value: boolean },
}));

vi.mock('@/composables/useInstanceSetupStatus', () => ({
  useInstanceCapability: () => ({
    capability: h.capability,
    available: h.available,
    loading: h.loading,
    error: h.error,
  }),
}));

const mountAdd = (props: Record<string, unknown> = {}) =>
  mount(AddImage, {
    props,
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

describe('AddImage', () => {
  beforeEach(() => {
    h.available = ref(true);
    h.capability = ref({
      configured: true,
      enabled: true,
      requiredEnvVarsMissing: [],
      setupUrl: '/admin/setup#uploads',
      docsPath: '/self-hosting/uploads',
    });
    h.error = ref(null);
    h.loading = ref(false);
  });

  it('renders the default label', () => {
    const wrapper = mountAdd();

    expect(wrapper.text()).toContain('Add Image');
  });

  it('renders a custom label', () => {
    const wrapper = mountAdd({ label: 'Upload' });

    expect(wrapper.text()).toContain('Upload');
  });

  it('emits file-change with the field name on selection', async () => {
    const wrapper = mountAdd({ fieldName: 'avatar' });

    await wrapper.find('input[type="file"]').trigger('change');

    expect(wrapper.emitted('file-change')?.[0]?.[0]).toMatchObject({
      fieldName: 'avatar',
    });
  });

  it('does not emit when disabled', async () => {
    const wrapper = mountAdd({ disabled: true });

    await wrapper.find('input[type="file"]').trigger('change');

    expect(wrapper.emitted('file-change')).toBeUndefined();
  });

  it('disables the input when disabled', () => {
    const wrapper = mountAdd({ disabled: true });

    expect(
      wrapper.find('input[type="file"]').attributes('disabled')
    ).toBeDefined();
  });

  it('disables the input when uploads are unavailable', () => {
    h.available = ref(false);
    h.capability = ref({
      ...h.capability.value,
      configured: false,
      enabled: false,
    });

    const wrapper = mountAdd();

    expect(
      wrapper.find('input[type="file"]').attributes('disabled')
    ).toBeDefined();
  });

  it('links to instance setup when uploads are unavailable', () => {
    h.available = ref(false);
    h.capability = ref({
      ...h.capability.value,
      configured: false,
      enabled: false,
      setupUrl: '/admin/setup#custom-uploads',
    });

    const wrapper = mountAdd();

    expect(wrapper.get('a').attributes('href')).toBe(
      '/admin/setup#custom-uploads'
    );
  });
});
