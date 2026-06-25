import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.stubGlobal('definePageMeta', vi.fn());

describe('admin plugins pipelines page (alias)', () => {
  it('renders the canonical plugins pipelines page', async () => {
    const Page = (await import('./pipelines.vue')).default;
    const PluginsPipelinesPage = (
      await import('@/pages/admin/settings/plugins/pipelines.vue')
    ).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(PluginsPipelinesPage).exists()).toBe(true);
  });
});
