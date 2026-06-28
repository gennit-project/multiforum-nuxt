import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import DownloadsSettings from './downloads.vue';

const h = vi.hoisted(() => ({
  resultRef: null as unknown as { value: unknown },
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.resultRef = ref(null);
  h.loadingRef = ref(false);
  h.errorRef = ref(null);
  return {
    useQuery: () => ({
      result: h.resultRef,
      loading: h.loadingRef,
      error: h.errorRef,
    }),
  };
});

vi.mock('@/config', () => ({ config: { serverName: 'test-server' } }));
vi.mock('@/graphQLData/admin/queries', () => ({ GET_SERVER_CONFIG: 'q' }));

const stubs = {
  CheckBox: {
    name: 'CheckBox',
    props: ['checked', 'disabled', 'label'],
    emits: ['update'],
    template: '<div class="checkbox" />',
  },
  FileTypePicker: {
    name: 'FileTypePicker',
    props: ['selectedFileTypes', 'disabled'],
    emits: ['set-selected-file-types'],
    template: '<div class="file-type-picker" />',
  },
  FilterGroupManager: { name: 'FilterGroupManager', emits: ['update'], template: '<div />' },
  ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="error-banner">{{ text }}</div>' },
};

const mountSettings = (formValues: Record<string, unknown> = {}) =>
  mountWithDefaults(DownloadsSettings, {
    props: { formValues: { downloadsEnabled: false, allowedFileTypes: [], ...formValues } },
    global: { stubs },
  });

const setServerConfig = (config: Record<string, unknown> | null) => {
  h.resultRef.value = { serverConfigs: config ? [config] : [] };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.resultRef.value = null;
  h.loadingRef.value = false;
  h.errorRef.value = null;
});

describe('Forum downloads settings', () => {
  it('shows the loading state', () => {
    h.loadingRef.value = true;
    expect(mountSettings().text()).toContain('Loading server configuration');
  });

  it('shows an error banner when the config fails to load', () => {
    h.errorRef.value = { message: 'boom' };
    expect(mountSettings().text()).toContain('Unable to load server configuration: boom');
  });

  it('shows the empty state when there is no server config', () => {
    setServerConfig(null);
    expect(mountSettings().text()).toContain('Could not find the server config data');
  });

  it('warns and disables the checkbox when server downloads are off', () => {
    setServerConfig({ enableDownloads: false });
    const wrapper = mountSettings();
    expect(wrapper.text()).toContain('Downloads are disabled at the server level');
    expect(wrapper.findComponent({ name: 'CheckBox' }).props('disabled')).toBe(true);
  });

  it('enables the checkbox and shows the file-type picker when server downloads are on', () => {
    setServerConfig({ enableDownloads: true, allowedFileTypes: ['pdf'] });
    const wrapper = mountSettings();
    expect(wrapper.findComponent({ name: 'CheckBox' }).props('disabled')).toBe(false);
    expect(wrapper.findComponent({ name: 'FileTypePicker' }).exists()).toBe(true);
  });

  it('does not enable downloads when the server has them disabled', async () => {
    setServerConfig({ enableDownloads: false });
    const wrapper = mountSettings();
    await wrapper.findComponent({ name: 'CheckBox' }).vm.$emit('update', true);
    expect(wrapper.emitted('updateFormValues')).toBeUndefined();
  });

  it('emits downloadsEnabled when toggled on and the server allows it', async () => {
    setServerConfig({ enableDownloads: true });
    const wrapper = mountSettings();
    await wrapper.findComponent({ name: 'CheckBox' }).vm.$emit('update', true);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { downloadsEnabled: true },
    ]);
  });

  it('emits the selected file types from the picker', async () => {
    setServerConfig({ enableDownloads: true });
    const wrapper = mountSettings({ downloadsEnabled: true });
    await wrapper
      .findComponent({ name: 'FileTypePicker' })
      .vm.$emit('set-selected-file-types', ['pdf', 'zip']);
    expect(wrapper.emitted('updateFormValues')?.at(-1)).toEqual([
      { allowedFileTypes: ['pdf', 'zip'] },
    ]);
  });
});
